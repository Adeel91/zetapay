import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/**': [
      './.stellar-cli/**',

      './circuits/payroll/build/payroll_js/**',
      './circuits/payroll/build/payroll_final.zkey',
      './circuits/payroll/build/verification_key.json',

      './circuits/pool/build/withdraw_js/**',
      './circuits/pool/build/deposit_js/**',
      './circuits/pool/build/withdraw_final.zkey',
      './circuits/pool/build/deposit_final.zkey',
      './circuits/pool/build/withdraw_verification_key.json',
      './circuits/pool/build/deposit_verification_key.json',
    ],
  },
};

export default nextConfig;
