import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/**': [
      './circuits/payroll/build/payroll_js/**',
      './circuits/payroll/build/payroll_final.zkey',
      './circuits/pool/build/withdraw_js/**',
      './circuits/pool/build/deposit_js/**',
      './circuits/pool/build/withdraw_final.zkey',
      './circuits/pool/build/deposit_final.zkey',
    ],
  },
};

export default nextConfig;
