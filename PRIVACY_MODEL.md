# Saha privacy model

## Purpose and scope

Saha is a Compact prototype for confidential pool participation records. It protects the inputs of its circuits, not the whole economic system around them. This document states exactly what is private, what is deliberately public, and what a production implementation still needs.

## Public ledger state

The contract persistently exposes:

- pool lifecycle status (`OPEN`, `SETTLING`, `CLOSED`);
- a public rules digest;
- opaque eligibility and settlement-authority commitments;
- pool round and action counters;
- the latest membership, contribution, and claim commitments;
- explicitly reported pool-wide contribution and claim aggregates.

An opaque commitment is public but does not reveal its preimage under normal cryptographic assumptions. Counters still reveal event volume; they are not private metadata.

## Private witnesses

The following values are witnesses and are not stored or returned by the contract:

- member secret;
- eligibility credential secret;
- settlement authority secret;
- individual contribution and claim amounts;
- contribution and claim blindings;
- aggregate values before the authorized settlement circuit deliberately releases them.

## Eligibility proof

At deployment, the creator publishes `persistentHash(["saha:eligible:", eligibilitySecret])`. To join, contribute, or claim, the caller supplies `eligibilitySecret` as a private witness. The circuit recomputes the commitment and asserts equality with public ledger state.

This is a proof of knowledge of an issued secret, without identity disclosure. It is **not** a per-user anonymous credential system: any party with the same shared secret can produce a valid proof. A production replacement should bind one credential per participant, verify an issuer/Merkle root, and consume a nullifier without revealing the participant.

## Authority proof

Settlement control uses a distinct domain-separated commitment: `persistentHash(["saha:authority:", authoritySecret])`. It replaces the unsafe pattern of accepting an arbitrary witness boolean as authority. The authority secret must be protected outside the dApp; Saha does not persist it.

For deployment maintenance, the browser derives the Compact maintenance signing key from the authority secret through a separate SHA-256 domain label. No random maintenance key is created and discarded. This does not make the authority secret public; it does mean losing that secret also loses the deterministic maintenance-key recovery path.

## Deliberate `disclose()` sites

Compact witnesses remain private by default. Saha uses `disclose()` only at these boundaries:

1. Constructor inputs: public rules, eligibility digest, and authority digest are intentionally public deployment configuration.
2. Membership / contribution / claim commitments: a one-way record is written publicly, while secret, amount, blinding, and identity stay private.
3. Settlement aggregates: an authorized circuit explicitly reports aggregate totals.

No individual amount, identity, or raw credential is passed to `disclose()`.

## What privacy does not hide

- action timing and public counters;
- the existence of a pool and its lifecycle transitions;
- a reported aggregate after `publishRoundAggregates`;
- network-level metadata outside the Compact circuit;
- information participants disclose off-chain themselves.

## Safety limitations

Saha is not audited. It does not escrow a shielded asset, validate an input payment, prevent duplicate membership, prevent duplicate contribution, support credential revocation, or provide fairness/solvency guarantees. It is unsuitable for real funds. Treat it as a transparent starting point for a reviewed protocol, not an investment or savings product.
