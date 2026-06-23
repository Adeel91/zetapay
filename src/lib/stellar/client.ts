'use client';

import { getFreighterPublicKey, isFreighterAvailable } from './freighter';
import { stellarServer, extractBalance } from './horizon';

export interface ConnectedEmployerWallet {
  publicKey: string;
  xlmBalance: string;
  usdcBalance: string;
}

/**
 * Handles the full client-side interface workflow for fetching a wallet connection profile
 */
export async function connectEmployerWallet(): Promise<ConnectedEmployerWallet> {
  const walletConnected = await isFreighterAvailable();
  if (!walletConnected) {
    throw new Error('Freighter extension missing. Please install the wallet extension to continue.');
  }

  // Request public ledger key from Freighter extension
  const publicKey = await getFreighterPublicKey();

  try {
    // Synchronously pull current wallet ledger status parameters via Horizon network
    const accountDetails = await stellarServer.loadAccount(publicKey);
    
    return {
      publicKey,
      xlmBalance: extractBalance(accountDetails, 'native'),
      usdcBalance: extractBalance(accountDetails, 'USDC'),
    };
  } catch (error) {
    // If the account does not exist on-chain yet, return a clean un-funded profile template
    return {
      publicKey,
      xlmBalance: '0',
      usdcBalance: '0',
    };
  }
}
