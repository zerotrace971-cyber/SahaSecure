import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export enum PoolStatus { OPEN = 0, SETTLING = 1, CLOSED = 2 }

export type Witnesses<PS> = {
  localMemberSecret(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  eligibilitySecret(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  privateContributionAmount(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  privateContributionBlinding(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  privateClaimAmount(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  privateClaimBlinding(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  settlementAuthoritySecret(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  reportedContributionAggregate(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  reportedClaimAggregate(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
}

export type ImpureCircuits<PS> = {
  joinPool(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  contributeConfidentially(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  claimConfidentially(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  beginSettlement(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  publishRoundAggregates(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  openNextRound(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  closePool(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  joinPool(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  contributeConfidentially(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  claimConfidentially(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  beginSettlement(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  publishRoundAggregates(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  openNextRound(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  closePool(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
  memberCommitment(secret_0: Uint8Array, sequence_0: Uint8Array): Uint8Array;
  eligibilityCommitment(secret_0: Uint8Array): Uint8Array;
  settlementAuthorityCommitment(secret_0: Uint8Array): Uint8Array;
  contributionRecordCommitment(secret_0: Uint8Array,
                               amount_0: Uint8Array,
                               blinding_0: Uint8Array,
                               sequence_0: Uint8Array): Uint8Array;
  claimRecordCommitment(secret_0: Uint8Array,
                        amount_0: Uint8Array,
                        blinding_0: Uint8Array,
                        sequence_0: Uint8Array): Uint8Array;
}

export type Circuits<PS> = {
  joinPool(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  contributeConfidentially(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  claimConfidentially(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  beginSettlement(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  publishRoundAggregates(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  openNextRound(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  closePool(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  memberCommitment(context: __compactRuntime.CircuitContext<PS>,
                   secret_0: Uint8Array,
                   sequence_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  eligibilityCommitment(context: __compactRuntime.CircuitContext<PS>,
                        secret_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  settlementAuthorityCommitment(context: __compactRuntime.CircuitContext<PS>,
                                secret_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  contributionRecordCommitment(context: __compactRuntime.CircuitContext<PS>,
                               secret_0: Uint8Array,
                               amount_0: Uint8Array,
                               blinding_0: Uint8Array,
                               sequence_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  claimRecordCommitment(context: __compactRuntime.CircuitContext<PS>,
                        secret_0: Uint8Array,
                        amount_0: Uint8Array,
                        blinding_0: Uint8Array,
                        sequence_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
}

export type Ledger = {
  readonly status: PoolStatus;
  readonly rulesDigest: Uint8Array;
  readonly eligibilityDigest: Uint8Array;
  readonly settlementAuthorityDigest: Uint8Array;
  readonly aggregateContributions: bigint;
  readonly aggregateClaims: bigint;
  readonly memberCount: bigint;
  readonly contributionCount: bigint;
  readonly claimCount: bigint;
  readonly round: bigint;
  readonly membershipCommitment: Uint8Array;
  readonly contributionCommitment: Uint8Array;
  readonly claimCommitment: Uint8Array;
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>,
               publicRulesDigest_0: Uint8Array,
               publicEligibilityDigest_0: Uint8Array,
               publicSettlementAuthorityDigest_0: Uint8Array): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
