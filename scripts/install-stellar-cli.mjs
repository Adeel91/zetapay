import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const installDir = path.join(root, '.stellar-cli');

const candidates = [path.join(installDir, 'stellar'), path.join(installDir, 'bin', 'stellar')];

function existingBinary() {
  return candidates.find((candidate) => fs.existsSync(candidate));
}

if (existingBinary()) {
  console.log('[zetapay] Stellar CLI already installed');
  process.exit(0);
}

if (process.platform === 'win32') {
  console.log('[zetapay] Skipping Stellar CLI install on Windows');
  process.exit(0);
}

fs.mkdirSync(installDir, { recursive: true });

console.log('[zetapay] Installing Stellar CLI into', installDir);

execFileSync(
  'sh',
  [
    '-c',
    `curl -fsSL https://github.com/stellar/stellar-cli/raw/main/install.sh | sh -s -- --dir="${installDir}"`,
  ],
  {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  }
);

const binary = existingBinary();

if (!binary) {
  throw new Error(`Stellar CLI install finished but no binary was found in ${installDir}`);
}

fs.chmodSync(binary, 0o755);

console.log('[zetapay] Stellar CLI installed at', binary);
