import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

import { Networks, scValToNative, Transaction, TransactionBuilder } from '@stellar/stellar-sdk';
import { Server as StellarRpcServer } from '@stellar/stellar-sdk/rpc';

import { zetapayConfig, validateConfig } from './config';
import { loadSorobanVerificationKey } from './verification-key';

const CONTRACT_FEE = '100000';
const TX_TIMEOUT_SECONDS = 300;

export type SorobanPayrollPayment = {
  payee_id: number;
  recipient: string;
  amount: string;
  token: 'XLM' | 'USDC';
  payee_type: 'Employee' | 'Contractor' | 'Freelancer' | 'Vendor' | 'Consultant' | 'Contributor';
};

export type BuildInitializePayrollInput = {
  employer: string;
  verificationKeyPath?: string;
};

export type SubmitPayrollBatchInput = {
  employer: string;
  payments: SorobanPayrollPayment[];
  proof: {
    a: string;
    b: string;
    c: string;
  };
  publicInputs: string[];
  payrollRunHashHex: string;
  payrollRunHashField: string;
  periodId: string;
  batchIndex: number;
  batchCount: number;
  commitmentRootHex: string;
};

function log(label: string, value?: unknown) {
  if (value === undefined) {
    console.log(`[zetapay] ${label}`);
    return;
  }

  console.log(`[zetapay] ${label}`, value);
}

function network() {
  return process.env.NEXT_PUBLIC_STELLAR_NETWORK || 'testnet';
}

function networkPassphrase() {
  return network() === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseTransactionXdr(xdr: string) {
  const parsed = TransactionBuilder.fromXDR(xdr.trim(), networkPassphrase());

  if (!(parsed instanceof Transaction)) {
    throw new Error('Fee bump transaction XDR is not supported in this payroll flow.');
  }

  return parsed;
}

function runStellar(args: string[]) {
  log('stellar command', `stellar ${args.join(' ')}`);

  const result = spawnSync('stellar', args, {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  const output = `${result.stdout || ''}\n${result.stderr || ''}`.trim();

  if (result.status !== 0) {
    log('stellar command failed', output);
    throw new Error(output || 'Stellar command failed');
  }

  return output;
}

function extractTransactionXdr(output: string) {
  const lines = output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const candidates = lines.filter((line) => /^[A-Za-z0-9+/=]+$/.test(line) && line.length > 100);

  for (let index = candidates.length - 1; index >= 0; index -= 1) {
    const candidate = candidates[index];

    try {
      const transaction = parseTransactionXdr(candidate);

      log('raw xdr found', {
        source: transaction.source,
        sequence: transaction.sequence,
        fee: transaction.fee,
        operations: transaction.operations.length,
      });

      return candidate;
    } catch {
      continue;
    }
  }

  throw new Error(`Could not find valid transaction XDR in Stellar CLI output:\n${output}`);
}

function addTimeoutToBuiltTransaction(rawXdr: string) {
  const transaction = parseTransactionXdr(rawXdr);

  log('raw xdr before timeout', {
    source: transaction.source,
    sequence: transaction.sequence,
    fee: transaction.fee,
    operations: transaction.operations.length,
  });

  const maxTime = Math.floor(Date.now() / 1000) + TX_TIMEOUT_SECONDS;

  const builder = TransactionBuilder.cloneFrom(transaction, {
    fee: CONTRACT_FEE,
    networkPassphrase: networkPassphrase(),
    timebounds: {
      minTime: 0,
      maxTime,
    },
  });

  const rebuilt = builder.build();

  log('rebuilt xdr with timeout', {
    source: rebuilt.source,
    sequence: rebuilt.sequence,
    fee: rebuilt.fee,
    operations: rebuilt.operations.length,
    maxTime,
  });

  return rebuilt;
}

async function prepareBuiltXdr(rawXdr: string) {
  validateConfig();

  const server = new StellarRpcServer(zetapayConfig.rpcUrl);
  const transactionWithTimeout = addTimeoutToBuiltTransaction(rawXdr);

  log('preparing soroban transaction');

  const prepared = await server.prepareTransaction(transactionWithTimeout);
  const preparedXdr = prepared.toXDR();
  const parsedPrepared = parseTransactionXdr(preparedXdr);

  log('prepared soroban transaction', {
    source: parsedPrepared.source,
    sequence: parsedPrepared.sequence,
    fee: parsedPrepared.fee,
    operations: parsedPrepared.operations.length,
  });

  return preparedXdr;
}

async function runStellarBuildOnly(args: string[]) {
  const rawXdr = extractTransactionXdr(runStellar(args));
  return await prepareBuiltXdr(rawXdr);
}

function writeJsonTempFile(tempDir: string, name: string, value: unknown) {
  const filePath = path.join(tempDir, name);
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
  return filePath;
}

function normalizeReturnValue(value: unknown) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value);
  return null;
}

export async function buildInitializePayrollXdr(input: BuildInitializePayrollInput) {
  validateConfig();

  const verificationKeyPath =
    input.verificationKeyPath ||
    path.join(process.cwd(), 'circuits/payroll/build/verification_key.json');

  const verificationKey = loadSorobanVerificationKey(verificationKeyPath);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zetapay-init-xdr-'));

  try {
    const vkFilePath = writeJsonTempFile(tempDir, 'verification-key.json', verificationKey);

    return await runStellarBuildOnly([
      'contract',
      'invoke',
      '--build-only',
      '--id',
      zetapayConfig.payrollContractId,
      '--source-account',
      input.employer,
      '--network',
      network(),
      '--fee',
      CONTRACT_FEE,
      '--',
      'initialize',
      '--employer',
      input.employer,
      '--verifier',
      zetapayConfig.verifierContractId,
      '--xlm_token',
      zetapayConfig.xlmTokenContract,
      '--usdc_token',
      zetapayConfig.usdcTokenContract,
      '--vk-file-path',
      vkFilePath,
    ]);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

export async function buildSubmitAndExecutePayrollBatchXdr(input: SubmitPayrollBatchInput) {
  validateConfig();

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zetapay-submit-execute-xdr-'));

  try {
    const paymentsPath = writeJsonTempFile(tempDir, 'payments.json', input.payments);
    const proofPath = writeJsonTempFile(tempDir, 'proof.json', input.proof);
    const publicInputsPath = writeJsonTempFile(tempDir, 'public-inputs.json', input.publicInputs);

    return await runStellarBuildOnly([
      'contract',
      'invoke',
      '--build-only',
      '--id',
      zetapayConfig.payrollContractId,
      '--source-account',
      input.employer,
      '--network',
      network(),
      '--fee',
      CONTRACT_FEE,
      '--',
      'submit_and_execute_batch',
      '--employer',
      input.employer,
      '--payments-file-path',
      paymentsPath,
      '--proof-file-path',
      proofPath,
      '--public_inputs-file-path',
      publicInputsPath,
      '--payroll_run_hash',
      input.payrollRunHashHex,
      '--payroll_run_hash_field',
      input.payrollRunHashField,
      '--period_id',
      input.periodId,
      '--batch_index',
      String(input.batchIndex),
      '--batch_count',
      String(input.batchCount),
      '--commitment_root',
      input.commitmentRootHex,
    ]);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

export async function sendSignedXdr(signedXdr: string) {
  validateConfig();

  const cleanSignedXdr = signedXdr.trim();
  const transaction = parseTransactionXdr(cleanSignedXdr);
  const server = new StellarRpcServer(zetapayConfig.rpcUrl);

  log('sending signed transaction', {
    source: transaction.source,
    sequence: transaction.sequence,
    fee: transaction.fee,
    operations: transaction.operations.length,
  });

  const sendResponse = await server.sendTransaction(transaction);

  log('send response', sendResponse);

  if (sendResponse.status === 'ERROR') {
    throw new Error(JSON.stringify(sendResponse));
  }

  const txHash = sendResponse.hash;

  for (let attempt = 0; attempt < 30; attempt += 1) {
    const result = await server.getTransaction(txHash);

    log('transaction status', {
      attempt: attempt + 1,
      status: result.status,
      txHash,
    });

    if (result.status === 'SUCCESS') {
      const nativeReturnValue = result.returnValue ? scValToNative(result.returnValue) : null;

      return {
        txHash,
        rawOutput: JSON.stringify(result),
        returnValue: normalizeReturnValue(nativeReturnValue),
      };
    }

    if (result.status === 'FAILED') {
      throw new Error(JSON.stringify(result));
    }

    await sleep(1000);
  }

  throw new Error(`Transaction was not confirmed: ${txHash}`);
}

export function toSorobanPayrollPayment(input: {
  payeeId: number;
  recipient: string;
  amount: string;
  currency: 'XLM' | 'USDC';
  payeeType?: string | null;
}): SorobanPayrollPayment {
  const normalized = (input.payeeType || 'employee').toLowerCase();

  const payeeType: SorobanPayrollPayment['payee_type'] =
    normalized === 'contractor'
      ? 'Contractor'
      : normalized === 'freelancer'
        ? 'Freelancer'
        : normalized === 'vendor'
          ? 'Vendor'
          : normalized === 'consultant'
            ? 'Consultant'
            : normalized === 'contributor'
              ? 'Contributor'
              : 'Employee';

  return {
    payee_id: input.payeeId,
    recipient: input.recipient,
    amount: input.amount,
    token: input.currency,
    payee_type: payeeType,
  };
}
