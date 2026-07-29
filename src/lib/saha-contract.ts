import * as GeneratedSaha from '../../contracts/managed/saha/contract/index.js';
import { CompiledContract } from '@midnight-ntwrk/compact-js';
import type { ContractAddress } from '@midnight-ntwrk/compact-runtime';
import { signingKeyFromBip340 } from '@midnight-ntwrk/compact-runtime';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import {
  LedgerParameters,
  Transaction,
  type CostModel,
  type UnprovenTransaction,
} from '@midnight-ntwrk/ledger-v8';
import {
  createUnprovenCallTxFromInitialStates,
  createUnprovenDeployTxFromVerifierKeys,
} from '@midnight-ntwrk/midnight-js-contracts';
import {
  parseCoinPublicKeyToHex,
  parseEncPublicKeyToHex,
  fromHex,
  toHex,
} from '@midnight-ntwrk/midnight-js-utils';
import type { ConnectedWallet } from './wallet';
import { errorMessage, randomBytes } from './format';

export type SahaPrivateState = {
  memberSecret: Uint8Array;
  eligibilitySecret: Uint8Array;
  contributionAmount: bigint;
  contributionBlinding: Uint8Array;
  claimAmount: bigint;
  claimBlinding: Uint8Array;
  settlementAuthoritySecret: Uint8Array;
  reportedContributionAggregate: bigint;
  reportedClaimAggregate: bigint;
};

export type DeployPoolInput = {
  rulesDigest: Uint8Array;
  eligibilityDigest: Uint8Array;
  settlementAuthorityDigest: Uint8Array;
  settlementAuthoritySecret: Uint8Array;
};

export type ConfidentialContributionInput = {
  contractAddress: string;
  eligibilitySecret: Uint8Array;
  amount: bigint;
};

export type SubmittedPreviewTransaction = {
  transactionHash: string;
};

export type DeployedSahaPool = SubmittedPreviewTransaction & {
  contractAddress: string;
};

export type PoolSnapshot = {
  status: 'Open' | 'Settling' | 'Closed';
  round: bigint;
  memberCount: bigint;
  contributionCount: bigint;
  claimCount: bigint;
  aggregateContributions: bigint;
  aggregateClaims: bigint;
  rulesDigest: string;
  eligibilityDigest: string;
  commitment: string;
};

const assetBaseUrl = () => new URL('/zk/saha/', window.location.origin).toString();

const sahaCircuitIds = [
  'joinPool',
  'contributeConfidentially',
  'claimConfidentially',
  'beginSettlement',
  'publishRoundAggregates',
  'openNextRound',
  'closePool',
] as const;

let verifierKeyCheck: Promise<void> | undefined;

// Give people a usable deployment error before the connector wraps the failed
// file fetch in a generic ZKConfigurationReadError. Verifier files are tiny,
// so this avoids pre-downloading the much larger proving keys.
const verifyPublishedVerifierKeys = () => {
  verifierKeyCheck ??= (async () => {
    const baseUrl = assetBaseUrl();
    const results = await Promise.all(sahaCircuitIds.map(async (circuitId) => {
      const url = new URL(`keys/${circuitId}.verifier`, baseUrl).toString();
      try {
        const response = await fetch(url, { method: 'GET' });
        const contentType = response.headers.get('content-type') ?? 'unknown content type';
        const bytes = response.ok ? (await response.arrayBuffer()).byteLength : 0;
        return { circuitId, url, status: response.status, contentType, bytes };
      } catch (error) {
        return { circuitId, url, status: 0, contentType: errorMessage(error), bytes: 0 };
      }
    }));
    const unavailable = results.filter(({ status, contentType, bytes }) =>
      status !== 200 || bytes === 0 || contentType.includes('text/html'),
    );
    if (unavailable.length > 0) {
      const first = unavailable[0];
      throw new Error(
        `This Saha deployment cannot load its ZK verifier keys. ${first.url} returned ${first.status || 'a network error'} (${first.contentType}, ${first.bytes} bytes). Redeploy the Vercel project after its build completes.`,
      );
    }
  })();
  return verifierKeyCheck;
};

const buildPrivateState = (input: {
  eligibilitySecret: Uint8Array;
  contributionAmount?: bigint;
  settlementAuthoritySecret?: Uint8Array;
}): SahaPrivateState => ({
  memberSecret: randomBytes(),
  eligibilitySecret: input.eligibilitySecret,
  contributionAmount: input.contributionAmount ?? 0n,
  contributionBlinding: randomBytes(),
  claimAmount: 0n,
  claimBlinding: randomBytes(),
  settlementAuthoritySecret: input.settlementAuthoritySecret ?? randomBytes(),
  reportedContributionAggregate: 0n,
  reportedClaimAggregate: 0n,
});

const witnesses: GeneratedSaha.Witnesses<SahaPrivateState> = {
  localMemberSecret: ({ privateState }) => [privateState, privateState.memberSecret],
  eligibilitySecret: ({ privateState }) => [privateState, privateState.eligibilitySecret],
  privateContributionAmount: ({ privateState }) => [privateState, privateState.contributionAmount],
  privateContributionBlinding: ({ privateState }) => [privateState, privateState.contributionBlinding],
  privateClaimAmount: ({ privateState }) => [privateState, privateState.claimAmount],
  privateClaimBlinding: ({ privateState }) => [privateState, privateState.claimBlinding],
  settlementAuthoritySecret: ({ privateState }) => [privateState, privateState.settlementAuthoritySecret],
  reportedContributionAggregate: ({ privateState }) => [privateState, privateState.reportedContributionAggregate],
  reportedClaimAggregate: ({ privateState }) => [privateState, privateState.reportedClaimAggregate],
};

const compiledContract = () =>
  CompiledContract.make('SahaPool', GeneratedSaha.Contract).pipe(
    CompiledContract.withWitnesses(witnesses),
    CompiledContract.withCompiledFileAssets(assetBaseUrl()),
  );

const submitProvenTransaction = async (
  wallet: ConnectedWallet,
  unprovenTx: UnprovenTransaction,
  costModel: CostModel,
): Promise<SubmittedPreviewTransaction> => {
  await verifyPublishedVerifierKeys();
  const keys = new FetchZkConfigProvider<string>(assetBaseUrl());
  const provingProvider = await wallet.api.getProvingProvider(keys.asKeyMaterialProvider());
  const provenTransaction = await unprovenTx.prove(provingProvider, costModel);
  const balanced = await wallet.api.balanceUnsealedTransaction(toHex(provenTransaction.serialize()));
  // `balanced.tx` is the exact sealed transaction the wallet will submit. Its
  // hash is derived locally from those bytes, never fabricated or requested
  // from a backend.
  const transactionHash = Transaction.deserialize(
    'signature',
    'proof',
    'binding',
    fromHex(balanced.tx),
  ).transactionHash();
  await wallet.api.submitTransaction(balanced.tx);
  return { transactionHash };
};

const prepareWalletKeys = (wallet: ConnectedWallet) => {
  setNetworkId('preview');
  return {
    coinPublicKey: parseCoinPublicKeyToHex(wallet.shieldedCoinPublicKey, 'preview'),
    encryptionPublicKey: parseEncPublicKeyToHex(wallet.shieldedEncryptionPublicKey, 'preview'),
  };
};

const currentPreviewCostModel = async (wallet: ConnectedWallet) => {
  const response = await fetch(wallet.configuration.indexerUri, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query: 'query SahaLedgerParameters { block { ledgerParameters } }' }),
  });
  if (!response.ok) throw new Error(`Preview indexer rejected the ledger-parameter query (${response.status}).`);
  const payload = (await response.json()) as {
    data?: { block?: { ledgerParameters?: string } | null };
    errors?: Array<{ message?: string }>;
  };
  const encoded = payload.data?.block?.ledgerParameters;
  if (!encoded) {
    throw new Error(payload.errors?.[0]?.message ?? 'Preview indexer did not return ledger parameters.');
  }
  return LedgerParameters.deserialize(fromHex(encoded)).transactionCostModel.runtimeCostModel;
};

const maintenanceSigningKeyFromAuthoritySecret = async (authoritySecret: Uint8Array) => {
  const domain = new TextEncoder().encode('saha:maintenance-signing-key:v1:');
  const material = new Uint8Array(domain.length + authoritySecret.length);
  material.set(domain);
  material.set(authoritySecret, domain.length);
  const seed = new Uint8Array(await crypto.subtle.digest('SHA-256', material));
  return signingKeyFromBip340(seed);
};

export const deploySahaPool = async (
  wallet: ConnectedWallet,
  input: DeployPoolInput,
): Promise<DeployedSahaPool> => {
  const { coinPublicKey, encryptionPublicKey } = prepareWalletKeys(wallet);
  const privateState = buildPrivateState({
    eligibilitySecret: randomBytes(),
    settlementAuthoritySecret: input.settlementAuthoritySecret,
  });
  const keys = new FetchZkConfigProvider<string>(assetBaseUrl());
  const deployment = await createUnprovenDeployTxFromVerifierKeys(
    keys,
    coinPublicKey,
    {
      compiledContract: compiledContract(),
      args: [input.rulesDigest, input.eligibilityDigest, input.settlementAuthorityDigest],
      // A deterministic domain-separated key means the deployment does not
      // silently create and discard a contract maintenance authority. The user
      // must protect the settlement authority secret used to derive it.
      signingKey: await maintenanceSigningKeyFromAuthoritySecret(input.settlementAuthoritySecret),
      initialPrivateState: privateState,
    },
    encryptionPublicKey,
  );

  // Deploy transactions need the current network cost model. It is read from
  // the indexer selected by the connected wallet, never from a hard-coded host.
  const submission = await submitProvenTransaction(
    wallet,
    deployment.private.unprovenTx,
    await currentPreviewCostModel(wallet),
  );

  return {
    contractAddress: deployment.public.contractAddress,
    transactionHash: submission.transactionHash,
  };
};

export const deriveEligibilityDigest = (secret: Uint8Array) =>
  GeneratedSaha.pureCircuits.eligibilityCommitment(secret);

export const deriveSettlementAuthorityDigest = (secret: Uint8Array) =>
  GeneratedSaha.pureCircuits.settlementAuthorityCommitment(secret);

export const joinSahaPool = async (
  wallet: ConnectedWallet,
  input: Pick<ConfidentialContributionInput, 'contractAddress' | 'eligibilitySecret'>,
): Promise<SubmittedPreviewTransaction> => {
  const { coinPublicKey, encryptionPublicKey } = prepareWalletKeys(wallet);
  const contractAddress = input.contractAddress.trim() as ContractAddress;
  const provider = indexerPublicDataProvider(
    wallet.configuration.indexerUri,
    wallet.configuration.indexerWsUri,
  );
  const publicState = await provider.queryZSwapAndContractState(contractAddress);
  if (!publicState) throw new Error('Pool not found on the wallet-selected Preview indexer.');

  const keys = new FetchZkConfigProvider<string>(assetBaseUrl());
  const call = await createUnprovenCallTxFromInitialStates(
    keys,
    {
      compiledContract: compiledContract(),
      contractAddress,
      circuitId: 'joinPool',
      coinPublicKey,
      initialContractState: publicState[1],
      initialZswapChainState: publicState[0],
      ledgerParameters: publicState[2],
      initialPrivateState: buildPrivateState({ eligibilitySecret: input.eligibilitySecret }),
    },
    encryptionPublicKey,
  );

  return submitProvenTransaction(
    wallet,
    call.private.unprovenTx,
    publicState[2].transactionCostModel.runtimeCostModel,
  );
};

export const contributeConfidentially = async (
  wallet: ConnectedWallet,
  input: ConfidentialContributionInput,
): Promise<SubmittedPreviewTransaction> => {
  if (input.amount <= 0n) throw new Error('Contribution amount must be greater than zero.');
  const { coinPublicKey, encryptionPublicKey } = prepareWalletKeys(wallet);
  const contractAddress = input.contractAddress.trim() as ContractAddress;
  const provider = indexerPublicDataProvider(
    wallet.configuration.indexerUri,
    wallet.configuration.indexerWsUri,
  );
  const publicState = await provider.queryZSwapAndContractState(contractAddress);
  if (!publicState) throw new Error('Pool not found on the wallet-selected Preview indexer.');

  const privateState = buildPrivateState({
    eligibilitySecret: input.eligibilitySecret,
    contributionAmount: input.amount,
  });
  const keys = new FetchZkConfigProvider<string>(assetBaseUrl());
  const call = await createUnprovenCallTxFromInitialStates(
    keys,
    {
      compiledContract: compiledContract(),
      contractAddress,
      circuitId: 'contributeConfidentially',
      coinPublicKey,
      initialContractState: publicState[1],
      initialZswapChainState: publicState[0],
      ledgerParameters: publicState[2],
      initialPrivateState: privateState,
    },
    encryptionPublicKey,
  );

  return submitProvenTransaction(
    wallet,
    call.private.unprovenTx,
    publicState[2].transactionCostModel.runtimeCostModel,
  );
};

export const inspectSahaPool = async (wallet: ConnectedWallet, address: string): Promise<PoolSnapshot> => {
  const provider = indexerPublicDataProvider(
    wallet.configuration.indexerUri,
    wallet.configuration.indexerWsUri,
  );
  const state = await provider.queryContractState(address.trim() as ContractAddress);
  if (!state) throw new Error('Pool not found on the wallet-selected Preview indexer.');
  const ledger = GeneratedSaha.ledger(state.data);
  const statuses = ['Open', 'Settling', 'Closed'] as const;
  return {
    status: statuses[ledger.status],
    round: ledger.round,
    memberCount: ledger.memberCount,
    contributionCount: ledger.contributionCount,
    claimCount: ledger.claimCount,
    aggregateContributions: ledger.aggregateContributions,
    aggregateClaims: ledger.aggregateClaims,
    rulesDigest: toHex(ledger.rulesDigest),
    eligibilityDigest: toHex(ledger.eligibilityDigest),
    commitment: toHex(ledger.contributionCommitment),
  };
};

export const humaniseMidnightError = (error: unknown) => {
  const message = errorMessage(error);
  if (message.includes('Pool not found') || message.includes('This Saha deployment cannot load')) return message;
  return `${message} Saha only shows a transaction hash after the wallet returns the exact balanced transaction bytes.`;
};
