import type { ConnectedAPI, InitialAPI } from '@midnight-ntwrk/dapp-connector-api';

export type WalletOption = {
  id: string;
  wallet: InitialAPI;
};

export type ConnectedWallet = {
  api: ConnectedAPI;
  id: string;
  name: string;
  icon: string;
  unshieldedAddress: string;
  shieldedAddress: string;
  shieldedCoinPublicKey: string;
  shieldedEncryptionPublicKey: string;
  configuration: Awaited<ReturnType<ConnectedAPI['getConfiguration']>>;
};

export const listPreviewWallets = (): WalletOption[] =>
  Object.entries(window.midnight ?? {})
    .filter(([, wallet]) => wallet.apiVersion.startsWith('4.'))
    .map(([id, wallet]) => ({ id, wallet }));

export const connectPreviewWallet = async (option: WalletOption): Promise<ConnectedWallet> => {
  const api = await option.wallet.connect('preview');
  await api.hintUsage([
    'getShieldedAddresses',
    'getUnshieldedAddress',
    'getConfiguration',
    'getConnectionStatus',
    'getProvingProvider',
    'balanceUnsealedTransaction',
    'submitTransaction',
  ]);

  const [connection, configuration, shielded, unshielded] = await Promise.all([
    api.getConnectionStatus(),
    api.getConfiguration(),
    api.getShieldedAddresses(),
    api.getUnshieldedAddress(),
  ]);

  if (connection.status !== 'connected' || configuration.networkId !== 'preview') {
    throw new Error('The selected wallet is not connected to Midnight Preview.');
  }

  return {
    api,
    id: option.id,
    name: option.wallet.name,
    icon: option.wallet.icon,
    unshieldedAddress: unshielded.unshieldedAddress,
    shieldedAddress: shielded.shieldedAddress,
    shieldedCoinPublicKey: shielded.shieldedCoinPublicKey,
    shieldedEncryptionPublicKey: shielded.shieldedEncryptionPublicKey,
    configuration,
  };
};
