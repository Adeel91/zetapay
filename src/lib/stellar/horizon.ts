import { Horizon, Networks } from '@stellar/stellar-sdk';

// Initialize Testnet connection parameters
export const stellarServer = new Horizon.Server(
  process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org'
);

export const NETWORK_PASSPHRASE = Networks.TESTNET;

// Enterprise Testnet USDC Configuration Issuer Asset address
export const USDC_ASSET = {
  code: 'USDC',
  issuer: 'GBBD47IF6LWKWS35GVDMU76G3D6APXE7PTW2DYOZQW4HCEZ5V3QXUN2J',
};

// Fix 1: Extract the explicit array element type directly from the AccountResponse balances definition
type HorizonBalanceItem = Horizon.AccountResponse['balances'][number];

/**
 * Cleanly reads the native or USDC balance from a loaded Horizon AccountResponse structure
 */
export function extractBalance(account: Horizon.AccountResponse, assetType: 'native' | 'USDC'): string {
  // Fix 2: Provide the inferred layout type to the find loop item to safely support type checks
  const target = account.balances.find((b: HorizonBalanceItem) => {
    if (assetType === 'native') return b.asset_type === 'native';
    return 'asset_code' in b && b.asset_code === USDC_ASSET.code && b.asset_issuer === USDC_ASSET.issuer;
  });
  return target ? target.balance : '0';
}
