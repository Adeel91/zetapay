import path from 'node:path';

import {
  Address,
  Contract,
  Networks,
  Transaction,
  TransactionBuilder,
  nativeToScVal,
  scValToNative,
  xdr,
} from '@stellar/stellar-sdk';
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
  encryptedPayroll: string;
  encryptedNotes: string[];
};

export type NormalizedChainPayrollRecord = {
  batch: {
    payrollRunHash: string;
    proofHash: string;
    commitmentRoot: string;
    encryptedPayroll: string;
    encryptedNotes: string[];
    period_id: number | bigint;
    batch_index: number;
    batch_count: number;
    payment_count: number;
    total_amount: number | bigint;
    total_xlm: number | bigint;
    total_usdc: number | bigint;
    is_executed: boolean;
  };
};

function network() {
  return process.env.NEXT_PUBLIC_STELLAR_NETWORK || 'testnet';
}

function networkPassphrase() {
  return network() === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseTransactionXdr(xdrValue: string) {
  const parsed = TransactionBuilder.fromXDR(xdrValue.trim(), networkPassphrase());

  if (!(parsed instanceof Transaction)) {
    throw new Error('Fee bump transaction XDR is not supported in this payroll flow.');
  }

  return parsed;
}

function addressScVal(value: string) {
  return new Address(value).toScVal();
}

function symbolScVal(value: string) {
  return xdr.ScVal.scvSymbol(value);
}

function bytesScVal(value: string) {
  return xdr.ScVal.scvBytes(Buffer.from(value, 'utf8'));
}

function hexBytesScVal(value: string) {
  return xdr.ScVal.scvBytes(Buffer.from(value, 'hex'));
}

function decimalScVal(value: string | number | bigint) {
  return nativeToScVal(BigInt(value), { type: 'u256' });
}

function u32ScVal(value: string | number | bigint) {
  return nativeToScVal(Number(value), { type: 'u32' });
}

function u64ScVal(value: string | number | bigint) {
  return nativeToScVal(BigInt(value), { type: 'u64' });
}

function vecScVal(values: xdr.ScVal[]) {
  return xdr.ScVal.scvVec(values);
}

function mapScVal(entries: Record<string, xdr.ScVal>) {
  return xdr.ScVal.scvMap(
    Object.entries(entries).map(([key, value]) => {
      return new xdr.ScMapEntry({
        key: symbolScVal(key),
        val: value,
      });
    })
  );
}

function stringToBytesHex(value: string) {
  return Buffer.from(value, 'utf8').toString('hex');
}

function bytesToUtf8(value: unknown) {
  if (typeof value === 'string') return value;
  if (value instanceof Uint8Array) return Buffer.from(value).toString('utf8');
  if (Buffer.isBuffer(value)) return value.toString('utf8');

  return Buffer.from(String(value), 'hex').toString('utf8');
}

function bytesToHex(value: unknown) {
  if (typeof value === 'string') return value;
  if (value instanceof Uint8Array) return Buffer.from(value).toString('hex');
  if (Buffer.isBuffer(value)) return value.toString('hex');

  return String(value);
}

function normalizeReturnValue(value: unknown) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value);
  return null;
}

function normalizeChainRecord(value: unknown): NormalizedChainPayrollRecord {
  const record = value as {
    batch: {
      payroll_run_hash: unknown;
      period_id: number | bigint;
      batch_index: number;
      batch_count: number;
      proof_hash: unknown;
      commitment_root: number | bigint | string;
      payment_count: number;
      total_amount: number | bigint;
      total_xlm: number | bigint;
      total_usdc: number | bigint;
      encrypted_payroll: unknown;
      encrypted_notes: unknown[];
      is_executed: boolean;
    };
  };

  if (!record?.batch) {
    throw new Error('Invalid Soroban payroll record shape.');
  }

  return {
    batch: {
      period_id: record.batch.period_id,
      batch_index: record.batch.batch_index,
      batch_count: record.batch.batch_count,
      payment_count: record.batch.payment_count,
      total_amount: record.batch.total_amount,
      total_xlm: record.batch.total_xlm,
      total_usdc: record.batch.total_usdc,
      is_executed: record.batch.is_executed,
      payrollRunHash: bytesToHex(record.batch.payroll_run_hash),
      proofHash: bytesToHex(record.batch.proof_hash),
      commitmentRoot: String(record.batch.commitment_root),
      encryptedPayroll: bytesToUtf8(record.batch.encrypted_payroll),
      encryptedNotes: record.batch.encrypted_notes.map(bytesToUtf8),
    },
  };
}

async function buildPreparedContractXdr(input: {
  source: string;
  method: string;
  args: xdr.ScVal[];
}) {
  validateConfig();

  const server = new StellarRpcServer(zetapayConfig.rpcUrl);
  const account = await server.getAccount(input.source);
  const contract = new Contract(zetapayConfig.payrollContractId);

  const transaction = new TransactionBuilder(account, {
    fee: CONTRACT_FEE,
    networkPassphrase: networkPassphrase(),
  })
    .addOperation(contract.call(input.method, ...input.args))
    .setTimeout(TX_TIMEOUT_SECONDS)
    .build();

  const prepared = await server.prepareTransaction(transaction);

  return prepared.toXDR();
}

function verificationKeyScVal(value: unknown) {
  return nativeToScVal(value);
}

function proofScVal(proof: SubmitPayrollBatchInput['proof']) {
  return mapScVal({
    a: hexBytesScVal(proof.a),
    b: hexBytesScVal(proof.b),
    c: hexBytesScVal(proof.c),
  });
}

function paymentScVal(payment: SorobanPayrollPayment) {
  return mapScVal({
    payee_id: u64ScVal(payment.payee_id),
    recipient: addressScVal(payment.recipient),
    amount: decimalScVal(payment.amount),
    token: symbolScVal(payment.token),
    payee_type: symbolScVal(payment.payee_type),
  });
}

export async function isPayrollContractInitialized(input: { source: string }) {
  try {
    validateConfig();

    const server = new StellarRpcServer(zetapayConfig.rpcUrl);
    const account = await server.getAccount(input.source);
    const contract = new Contract(zetapayConfig.payrollContractId);

    const transaction = new TransactionBuilder(account, {
      fee: CONTRACT_FEE,
      networkPassphrase: networkPassphrase(),
    })
      .addOperation(contract.call('is_initialized'))
      .setTimeout(TX_TIMEOUT_SECONDS)
      .build();

    const simulated = await server.simulateTransaction(transaction);

    if (!('result' in simulated) || !simulated.result?.retval) {
      return false;
    }

    return Boolean(scValToNative(simulated.result.retval));
  } catch {
    return false;
  }
}

export async function buildInitializePayrollXdr(input: BuildInitializePayrollInput) {
  validateConfig();

  const verificationKeyPath =
    input.verificationKeyPath ||
    path.join(process.cwd(), 'circuits/payroll/build/verification_key.json');

  const verificationKey = loadSorobanVerificationKey(verificationKeyPath);

  return buildPreparedContractXdr({
    source: input.employer,
    method: 'initialize',
    args: [
      addressScVal(input.employer),
      addressScVal(zetapayConfig.verifierContractId),
      addressScVal(zetapayConfig.xlmTokenContract),
      addressScVal(zetapayConfig.usdcTokenContract),
      verificationKeyScVal(verificationKey),
    ],
  });
}

export async function buildSubmitAndExecutePayrollBatchXdr(input: SubmitPayrollBatchInput) {
  validateConfig();

  if (!input.encryptedPayroll) {
    throw new Error('encryptedPayroll is required');
  }

  if (!Array.isArray(input.encryptedNotes) || input.encryptedNotes.length === 0) {
    throw new Error('encryptedNotes are required');
  }

  return buildPreparedContractXdr({
    source: input.employer,
    method: 'submit_and_execute_batch',
    args: [
      addressScVal(input.employer),
      vecScVal(input.payments.map(paymentScVal)),
      proofScVal(input.proof),
      vecScVal(input.publicInputs.map(decimalScVal)),
      hexBytesScVal(input.payrollRunHashHex),
      decimalScVal(input.payrollRunHashField),
      u32ScVal(input.periodId),
      u32ScVal(input.batchIndex),
      u32ScVal(input.batchCount),
      decimalScVal(input.commitmentRootHex),
      hexBytesScVal(stringToBytesHex(input.encryptedPayroll)),
      vecScVal(input.encryptedNotes.map((note) => hexBytesScVal(stringToBytesHex(note)))),
    ],
  });
}

export async function getPayrollRecordFromChain(input: { employer: string; batchId: number }) {
  validateConfig();

  const server = new StellarRpcServer(zetapayConfig.rpcUrl);
  const account = await server.getAccount(input.employer);
  const contract = new Contract(zetapayConfig.payrollContractId);

  const operation = contract.call(
    'get_payroll_record',
    addressScVal(input.employer),
    nativeToScVal(input.batchId, { type: 'u64' })
  );

  const transaction = new TransactionBuilder(account, {
    fee: CONTRACT_FEE,
    networkPassphrase: networkPassphrase(),
  })
    .addOperation(operation)
    .setTimeout(TX_TIMEOUT_SECONDS)
    .build();

  const simulated = await server.simulateTransaction(transaction);

  if (!('result' in simulated) || !simulated.result?.retval) {
    throw new Error('Could not read payroll record from Soroban.');
  }

  return normalizeChainRecord(scValToNative(simulated.result.retval));
}

export async function sendSignedXdr(signedXdr: string) {
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
