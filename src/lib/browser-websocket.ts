// `isomorphic-ws` exposes a default browser WebSocket but Midnight's indexer
// provider imports its named Node-style `WebSocket` export. Supplying both
// shapes keeps the provider fully browser-native without a Node WebSocket shim.
const BrowserWebSocket = globalThis.WebSocket;

export { BrowserWebSocket as WebSocket };
export default BrowserWebSocket;
