'use client';

import { 
  isConnected, 
  requestAccess, // NEW: Mandatory method required to trigger the user interface popup
  getAddress, 
  signTransaction 
} from '@stellar/freighter-api';
import { NETWORK_PASSPHRASE } from './horizon';

/**
 * Checks if the Freighter browser extension is installed and active
 */
export async function isFreighterAvailable(): Promise<boolean> {
  try {
    const result = await isConnected();
    return !!result?.isConnected;
  } catch {
    return false;
  }
}

/**
 * Requests the active public key address from the user's Freighter extension wallet
 */
export async function getFreighterPublicKey(): Promise<string> {
  try {
    // 1. Force the UI authorization popup window to display on screen
    const accessResult = await requestAccess();
    
    if (accessResult.error) {
      throw new Error(accessResult.error);
    }

    // 2. Read the confirmed identity string cleanly post-approval
    const result = await getAddress();
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    if (!result.address) {
      throw new Error('User rejected wallet access connection request.');
    }
    
    return result.address;
  } catch (error: any) {
    // Gracefully normalize explicit context error readouts
    throw new Error(error?.message || 'Failed connecting to Freighter wallet.');
  }
}

/**
 * Passes an un-signed XDR string token directly into Freighter for authorization
 */
export async function signWithFreighter(xdr: string, userAddress: string): Promise<string> {
  try {
    const result = await signTransaction(xdr, { 
      networkPassphrase: NETWORK_PASSPHRASE,
      address: userAddress
    });

    if (result.error) {
      throw new Error(result.error);
    }

    if (!result.signedTxXdr) {
      throw new Error('Transaction signing rejected by wallet owner.');
    }

    return result.signedTxXdr;
  } catch (error: any) {
    throw new Error(error?.message || 'Transaction authorization failed.');
  }
}
