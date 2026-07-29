import { spawnSync } from 'node:child_process';
import { platform } from 'node:os';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const source = resolve(root, 'contracts', 'SahaPool.compact');
const asWslPath = (path) => {
  const match = path.replaceAll('\\', '/').match(/^([A-Za-z]):(\/.*)$/);
  if (!match) throw new Error(`Cannot map Windows path to WSL: ${path}`);
  return `/mnt/${match[1].toLowerCase()}${match[2]}`;
};
const shellQuote = (value) => `'${value.replaceAll("'", "'\\''")}'`;
const command = platform() === 'win32' ? 'wsl' : 'compact';
const args = platform() === 'win32'
  ? [
      '-d',
      process.env.MIDNIGHT_WSL_DISTRO ?? 'Ubuntu-20.04',
      '--',
      'bash',
      '-lc',
      `export PATH="$HOME/.local/bin:$HOME/.compact/bin:$PATH"; compact format --check ${shellQuote(asWslPath(source))}`,
    ]
  : ['format', '--check', source];

const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' });
process.exit(result.status ?? 1);
