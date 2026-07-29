import { describe, expect, it } from 'vitest';
import { bytesToHex, hexToBytes } from './format';

describe('32-byte secret parsing', () => {
  it('round-trips a valid 32-byte value', () => {
    const source = 'ab'.repeat(32);
    expect(bytesToHex(hexToBytes(source, 'Secret'))).toBe(source);
  });

  it('rejects incomplete or non-hexadecimal secrets', () => {
    expect(() => hexToBytes('aa'.repeat(31), 'Secret')).toThrow('exactly 32 bytes');
    expect(() => hexToBytes('zz'.repeat(32), 'Secret')).toThrow('exactly 32 bytes');
  });
});
