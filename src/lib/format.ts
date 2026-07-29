export const shortValue = (value: string, head = 10, tail = 8) => {
  if (value.length <= head + tail + 1) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
};

export const bytesToHex = (bytes: Uint8Array) =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');

export const hexToBytes = (value: string, label: string): Uint8Array => {
  const normalised = value.trim().replace(/^0x/i, '');
  if (!/^[0-9a-f]{64}$/i.test(normalised)) {
    throw new Error(`${label} must be exactly 32 bytes of hexadecimal data.`);
  }

  return Uint8Array.from(
    normalised.match(/.{1,2}/g)!.map((pair) => Number.parseInt(pair, 16)),
  );
};

export const randomBytes = (length = 32): Uint8Array => {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
};

export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'An unexpected wallet or network error occurred.';
