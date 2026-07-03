import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const installDir = path.join(root, '.stellar-cli');
const libDir = path.join(installDir, 'lib');

const candidates = [path.join(installDir, 'stellar'), path.join(installDir, 'bin', 'stellar')];

function existingBinary() {
  return candidates.find((candidate) => fs.existsSync(candidate));
}

function copySharedLibraries(binaryPath) {
  if (process.platform !== 'linux') {
    return;
  }

  fs.mkdirSync(libDir, { recursive: true });

  let output = '';

  try {
    output = execFileSync('ldd', [binaryPath], {
      cwd: root,
      encoding: 'utf8',
      env: process.env,
    });
  } catch (error) {
    console.warn('[zetapay] Could not inspect Stellar CLI shared libraries');
    console.warn(error);
    return;
  }

  const libraryPaths = new Set();

  for (const line of output.split('\n')) {
    const trimmed = line.trim();

    const arrowMatch = trimmed.match(/=>\s+(\/[^\s]+)\s+\(/);
    if (arrowMatch?.[1]) {
      libraryPaths.add(arrowMatch[1]);
      continue;
    }

    const directMatch = trimmed.match(/^(\/[^\s]+)\s+\(/);
    if (directMatch?.[1]) {
      libraryPaths.add(directMatch[1]);
    }
  }

  for (const libraryPath of libraryPaths) {
    const fileName = path.basename(libraryPath);

    if (
      fileName.startsWith('ld-linux') ||
      fileName.startsWith('linux-vdso') ||
      fileName.startsWith('libc.so') ||
      fileName.startsWith('libpthread.so') ||
      fileName.startsWith('libdl.so') ||
      fileName.startsWith('libm.so') ||
      fileName.startsWith('librt.so')
    ) {
      continue;
    }

    const destinationPath = path.join(libDir, fileName);

    try {
      fs.copyFileSync(libraryPath, destinationPath);
      fs.chmodSync(destinationPath, 0o755);
      console.log('[zetapay] Copied shared library', fileName);
    } catch (error) {
      console.warn('[zetapay] Could not copy shared library', libraryPath);
      console.warn(error);
    }
  }
}

if (process.platform === 'win32') {
  console.log('[zetapay] Skipping Stellar CLI install on Windows');
  process.exit(0);
}

fs.mkdirSync(installDir, { recursive: true });

let binary = existingBinary();

if (!binary) {
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

  binary = existingBinary();
}

if (!binary) {
  throw new Error(`Stellar CLI install finished but no binary was found in ${installDir}`);
}

fs.chmodSync(binary, 0o755);
copySharedLibraries(binary);

console.log('[zetapay] Stellar CLI ready at', binary);
