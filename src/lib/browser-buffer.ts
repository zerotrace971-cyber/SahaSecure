import { Buffer } from 'buffer';

// Midnight's browser packages and a few of their transitive dependencies use
// the Node-compatible Buffer API while serialising ledger data. Vite does not
// provide it as a global, so expose the browser implementation before wallet
// interaction code runs. No Node runtime or server is involved.
if (!globalThis.Buffer) {
  Object.defineProperty(globalThis, 'Buffer', {
    configurable: true,
    value: Buffer,
    writable: true,
  });
}
