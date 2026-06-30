import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { loadEnvConfig } from '@next/env';

import { loadSorobanVerificationKey } from '../../src/lib/zetapay/contracts/verification-key';

loadEnvConfig(process.cwd());

function required(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name}`);
  }

  return value;
}

function main() {
  const payrollContractId = required('ZETAPAY_PAYROLL_CONTRACT_ID');
  const verifierContractId = required('ZETAPAY_VERIFIER_CONTRACT_ID');
  const employerAddress = required('STELLAR_SERVER_PUBLIC');
  const tokenContractId = required('NEXT_PUBLIC_TOKEN_CONTRACT');

  const sourceAccount = process.env.STELLAR_SOURCE_ACCOUNT || 'zetapay-deployer';
  const network = process.env.NEXT_PUBLIC_STELLAR_NETWORK || 'testnet';

  const verificationKeyPath = path.join(
    process.cwd(),
    'circuits/payroll/build/verification_key.json'
  );

  const verificationKey = loadSorobanVerificationKey(verificationKeyPath);

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zetapay-vk-'));
  const vkFilePath = path.join(tempDir, 'verification-key.json');

  fs.writeFileSync(vkFilePath, JSON.stringify(verificationKey, null, 2));

  console.log('Initializing ZetaPay Payroll contract');
  console.log(`Payroll contract: ${payrollContractId}`);
  console.log(`Verifier contract: ${verifierContractId}`);
  console.log(`Server signer: ${employerAddress}`);
  console.log(`Token contract: ${tokenContractId}`);

  execFileSync(
    'stellar',
    [
      'contract',
      'invoke',
      '--id',
      payrollContractId,
      '--source-account',
      sourceAccount,
      '--network',
      network,
      '--',
      'initialize',
      '--employer',
      employerAddress,
      '--verifier',
      verifierContractId,
      '--xlm_token',
      tokenContractId,
      '--usdc_token',
      tokenContractId,
      '--vk-file-path',
      vkFilePath,
    ],
    { stdio: 'inherit' }
  );

  fs.rmSync(tempDir, { recursive: true, force: true });

  console.log('Payroll contract initialized');
}

main();
