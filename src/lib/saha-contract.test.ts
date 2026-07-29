import { describe, expect, it } from 'vitest';
import * as Saha from '../../contracts/managed/saha/contract/index.js';
import { bytesToHex, hexToBytes } from './format';

describe('compiled Saha Compact pure circuits', () => {
  it('creates domain-separated private credential commitments', () => {
    const secret = hexToBytes('11'.repeat(32), 'Secret');
    const eligibility = bytesToHex(Saha.pureCircuits.eligibilityCommitment(secret));
    const authority = bytesToHex(Saha.pureCircuits.settlementAuthorityCommitment(secret));

    expect(eligibility).toMatch(/^[0-9a-f]{64}$/);
    expect(authority).toMatch(/^[0-9a-f]{64}$/);
    expect(eligibility).not.toBe(authority);
  });

  it('binds a confidential contribution commitment to its amount and blinding', () => {
    const secret = hexToBytes('22'.repeat(32), 'Secret');
    const amountOne = new Uint8Array(32);
    amountOne[31] = 1;
    const amountTwo = new Uint8Array(32);
    amountTwo[31] = 2;
    const blinding = hexToBytes('33'.repeat(32), 'Blinding');
    const sequence = new Uint8Array(32);

    const first = bytesToHex(Saha.pureCircuits.contributionRecordCommitment(secret, amountOne, blinding, sequence));
    const second = bytesToHex(Saha.pureCircuits.contributionRecordCommitment(secret, amountTwo, blinding, sequence));
    expect(first).not.toBe(second);
  });
});
