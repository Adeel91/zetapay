import 'server-only';

export const zetapayConfig = {
  network: process.env.NEXT_PUBLIC_STELLAR_NETWORK || 'testnet',
  rpcUrl: process.env.NEXT_PUBLIC_SOROBAN_RPC || 'https://soroban-testnet.stellar.org',

  verifierContractId: process.env.ZETAPAY_VERIFIER_CONTRACT_ID!,
  payrollContractId: process.env.ZETAPAY_PAYROLL_CONTRACT_ID!,

  serverPublic: process.env.STELLAR_SERVER_PUBLIC!,
  serverSecret: process.env.STELLAR_SERVER_SECRET!,

  tokenContract: process.env.NEXT_PUBLIC_TOKEN_CONTRACT!,
};

export function validateConfig() {
  const required = [
    'ZETAPAY_VERIFIER_CONTRACT_ID',
    'ZETAPAY_PAYROLL_CONTRACT_ID',
    'STELLAR_SERVER_PUBLIC',
    'STELLAR_SERVER_SECRET',
    'NEXT_PUBLIC_TOKEN_CONTRACT',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length) {
    throw new Error(`Missing environment variables:\n${missing.join('\n')}`);
  }
}
