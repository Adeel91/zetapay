import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

import { Networks, scValToNative, Transaction, TransactionBuilder } from '@stellar/stellar-sdk';
import { Server as StellarRpcServer } from '@stellar/stellar-sdk/rpc';

import { zetapayConfig, validateConfig } from './config';
import { loadSorobanVerificationKey, SorobanVerificationKey } from './verification-key';
import {
  BuildInitializeShieldedPoolInput,
  DepositNoteInput,
  PostRootInput,
  RegisterTokenInput,
  ShieldedNote,
  ShieldedPoolStats,
  ShieldedWithdrawal,
  WithdrawWithProofInput,
} from './types';

const CONTRACT_FEE = '100000';
const TX_TIMEOUT_SECONDS = 300;

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

function parseTransactionXdr(xdrString: string) {
  const parsed = TransactionBuilder.fromXDR(xdrString.trim(), networkPassphrase());

  if (!(parsed instanceof Transaction)) {
    throw new Error('Fee bump transaction XDR is not supported in this pool flow.');
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
      parseTransactionXdr(candidate);
      return candidate;
    } catch {
      continue;
    }
  }

  throw new Error(`Could not find valid transaction XDR in Stellar CLI output:\n${output}`);
}

function addTimeoutToBuiltTransaction(rawXdr: string) {
  const transaction = parseTransactionXdr(rawXdr);
  const maxTime = Math.floor(Date.now() / 1000) + TX_TIMEOUT_SECONDS;

  return TransactionBuilder.cloneFrom(transaction, {
    fee: CONTRACT_FEE,
    networkPassphrase: networkPassphrase(),
    timebounds: {
      minTime: 0,
      maxTime,
    },
  }).build();
}

async function prepareBuiltXdr(rawXdr: string) {
  validateConfig();

  const server = new StellarRpcServer(zetapayConfig.rpcUrl);
  const transactionWithTimeout = addTimeoutToBuiltTransaction(rawXdr);
  const prepared = await server.prepareTransaction(transactionWithTimeout);

  return prepared.toXDR();
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

function parseCliJson(output: string) {
  const trimmed = output.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    const jsonStart = trimmed.indexOf('{');
    const jsonEnd = trimmed.lastIndexOf('}');

    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      return JSON.parse(trimmed.slice(jsonStart, jsonEnd + 1));
    }

    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;

    throw new Error(`Could not parse Stellar CLI JSON output:\n${output}`);
  }
}

function runStellarRead(args: string[]) {
  return parseCliJson(
    runStellar([
      'contract',
      'invoke',
      '--id',
      zetapayConfig.poolContractId,
      '--source-account',
      args[0],
      '--network',
      network(),
      '--',
      ...args.slice(1),
    ])
  );
}

function normalizeReturnValue(value: unknown) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value);
  return null;
}

function normalizeScalar(value: unknown) {
  return String(value);
}

function normalizeNote(value: unknown): ShieldedNote {
  const record = value as {
    depositor: string;
    token: string;
    amount: number | bigint;
    commitment: unknown;
    created_at_ledger: number | bigint;
    withdrawn: boolean;
  };

  if (!record) {
    throw new Error('Invalid shielded note shape.');
  }

  return {
    depositor: record.depositor,
    token: record.token,
    amount: record.amount,
    commitment: normalizeScalar(record.commitment),
    createdAtLedger: record.created_at_ledger,
    withdrawn: record.withdrawn,
  };
}

function normalizeWithdrawal(value: unknown): ShieldedWithdrawal {
  const record = value as {
    token: string;
    amount: number | bigint;
    recipient: string;
    commitment: unknown;
    root: unknown;
    nullifier_hash: unknown;
    withdrawal_hash: unknown;
    withdrawn_at_ledger: number | bigint;
  };

  if (!record) {
    throw new Error('Invalid withdrawal shape.');
  }

  return {
    token: record.token,
    amount: record.amount,
    recipient: record.recipient,
    commitment: normalizeScalar(record.commitment),
    root: normalizeScalar(record.root),
    nullifierHash: normalizeScalar(record.nullifier_hash),
    withdrawalHash: normalizeScalar(record.withdrawal_hash),
    withdrawnAtLedger: record.withdrawn_at_ledger,
  };
}

function normalizeStats(value: unknown): ShieldedPoolStats {
  const stats = value as {
    deposit_count: number | bigint;
    withdrawal_count: number | bigint;
  };

  if (!stats) {
    throw new Error('Invalid pool stats shape.');
  }

  return {
    depositCount: stats.deposit_count,
    withdrawalCount: stats.withdrawal_count,
  };
}

export async function buildInitializeShieldedPoolXdr(input: BuildInitializeShieldedPoolInput) {
  validateConfig();

  const verificationKeyPath =
    input.verificationKeyPath ||
    path.join(process.cwd(), 'circuits/pool/build/withdraw_verification_key.json');

  const verificationKey: SorobanVerificationKey = loadSorobanVerificationKey(verificationKeyPath);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zetapay_pool_init_xdr_'));

  try {
    const verificationKeyFilePath = writeJsonTempFile(
      tempDir,
      'verification_key.json',
      verificationKey
    );

    return await runStellarBuildOnly([
      'contract',
      'invoke',
      '--build-only',
      '--id',
      zetapayConfig.poolContractId,
      '--source-account',
      input.admin,
      '--network',
      network(),
      '--fee',
      CONTRACT_FEE,
      '--',
      'initialize',
      '--admin',
      input.admin,
      '--verifier',
      zetapayConfig.verifierContractId,
      '--verification_key-file-path',
      verificationKeyFilePath,
    ]);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

export async function buildRegisterTokenXdr(input: RegisterTokenInput) {
  validateConfig();

  return await runStellarBuildOnly([
    'contract',
    'invoke',
    '--build-only',
    '--id',
    zetapayConfig.poolContractId,
    '--source-account',
    input.admin,
    '--network',
    network(),
    '--fee',
    CONTRACT_FEE,
    '--',
    'register_token',
    '--admin',
    input.admin,
    '--token',
    input.token,
  ]);
}

export async function buildPostRootXdr(input: PostRootInput) {
  validateConfig();

  return await runStellarBuildOnly([
    'contract',
    'invoke',
    '--build-only',
    '--id',
    zetapayConfig.poolContractId,
    '--source-account',
    input.admin,
    '--network',
    network(),
    '--fee',
    CONTRACT_FEE,
    '--',
    'post_root',
    '--admin',
    input.admin,
    '--root',
    input.root,
  ]);
}

export async function buildDepositNoteXdr(input: DepositNoteInput) {
  validateConfig();

  return await runStellarBuildOnly([
    'contract',
    'invoke',
    '--build-only',
    '--id',
    zetapayConfig.poolContractId,
    '--source-account',
    input.depositor,
    '--network',
    network(),
    '--fee',
    CONTRACT_FEE,
    '--',
    'deposit_note',
    '--depositor',
    input.depositor,
    '--token',
    input.token,
    '--amount',
    input.amount,
    '--commitment',
    input.commitment,
  ]);
}

export async function buildWithdrawWithProofXdr(input: WithdrawWithProofInput) {
  validateConfig();

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zetapay_pool_withdraw_xdr_'));

  try {
    const proofPath = writeJsonTempFile(tempDir, 'proof.json', input.proof);
    const publicInputsPath = writeJsonTempFile(tempDir, 'public_inputs.json', input.publicInputs);

    return await runStellarBuildOnly([
      'contract',
      'invoke',
      '--build-only',
      '--id',
      zetapayConfig.poolContractId,
      '--source-account',
      input.recipient,
      '--network',
      network(),
      '--fee',
      CONTRACT_FEE,
      '--',
      'withdraw_with_proof',
      '--recipient',
      input.recipient,
      '--token',
      input.token,
      '--amount',
      input.amount,
      '--commitment',
      input.commitment,
      '--root',
      input.root,
      '--nullifier_hash',
      input.nullifierHash,
      '--recipient_hash',
      input.recipientHash,
      '--token_hash',
      input.tokenHash,
      '--withdrawal_hash',
      input.withdrawalHash,
      '--proof-file-path',
      proofPath,
      '--public_inputs-file-path',
      publicInputsPath,
    ]);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

export async function getNote(input: { source: string; commitment: string }) {
  const value = runStellarRead([input.source, 'get_note', '--commitment', input.commitment]);

  return normalizeNote(value);
}

export async function getWithdrawal(input: { source: string; nullifierHash: string }) {
  const value = runStellarRead([
    input.source,
    'get_withdrawal',
    '--nullifier_hash',
    input.nullifierHash,
  ]);

  return normalizeWithdrawal(value);
}

export async function isNullifierSpent(input: { source: string; nullifierHash: string }) {
  const value = runStellarRead([
    input.source,
    'is_nullifier_spent',
    '--nullifier_hash',
    input.nullifierHash,
  ]);

  return Boolean(value);
}

export async function getStats(input: { source: string }) {
  const value = runStellarRead([input.source, 'get_stats']);

  return normalizeStats(value);
}

export async function sendSignedPoolXdr(signedXdr: string) {
  validateConfig();

  const cleanSignedXdr = signedXdr.trim();
  const transaction = parseTransactionXdr(cleanSignedXdr);
  const server = new StellarRpcServer(zetapayConfig.rpcUrl);

  const sendResponse = await server.sendTransaction(transaction);

  if (sendResponse.status === 'ERROR') {
    throw new Error(JSON.stringify(sendResponse));
  }

  const txHash = sendResponse.hash;

  for (let attempt = 0; attempt < 30; attempt += 1) {
    const result = await server.getTransaction(txHash);

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
