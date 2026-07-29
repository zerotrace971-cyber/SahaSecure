// The indexer codec only consumes Node's `assert` as a default assertion
// function. This small browser equivalent avoids shipping Node's `util` and
// `process` shims into a wallet-facing bundle.
const browserAssert = (condition: unknown, message = 'Assertion failed'): asserts condition => {
  if (!condition) throw new Error(message);
};

export default browserAssert;
