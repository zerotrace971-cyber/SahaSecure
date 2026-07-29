import { cp, mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const source = resolve(root, 'contracts', 'managed', 'saha');
const destination = resolve(root, 'public', 'zk', 'saha');

try {
  await stat(source);
} catch {
  throw new Error('Missing compiled contract artifacts. Run `npm run contract:compile` before building.');
}

await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });

for (const directory of ['keys', 'zkir']) {
  const from = resolve(source, directory);
  const to = resolve(destination, directory);
  try {
    await stat(from);
    await cp(from, to, { recursive: true });
  } catch {
    throw new Error(`Expected Compact artifact directory is missing: ${directory}`);
  }
}

const circuitFiles = await readdir(resolve(source, 'zkir'));
await writeFile(
  resolve(destination, 'manifest.json'),
  `${JSON.stringify({ circuits: circuitFiles }, null, 2)}\n`,
);
