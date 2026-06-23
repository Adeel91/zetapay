'use client';

import { isConnected, requestAccess, getAddress, signTransaction } from '@stellar/freighter-api';
import { NETWORK_PASSPHRASE } from './horizon';

export async function isFreighterAvailable(): Promise<boolean> {
  try {
    const result = await isConnected();
    return !!result?.isConnected;
  } catch {
    return false;
  }
}

export async function getFreighterPublicKey(): Promise<string> {
  try {
    const accessResult = await requestAccess();

    if (accessResult.error) {
      throw new Error(accessResult.error);
    }

    const result = await getAddress();

    if (result.error) {
      throw new Error(result.error);
    }

    if (!result.address) {
      throw new Error('User rejected wallet access connection request.');
    }

    return result.address;
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to connect with Freighter';
    throw new Error(errorMessage || 'Failed connecting to Freighter wallet.');
  }
}

export async function signWithFreighter(xdr: string, userAddress: string): Promise<string> {
  try {
    const result = await signTransaction(xdr, {
      networkPassphrase: NETWORK_PASSPHRASE,
      address: userAddress,
    });

    if (result.error) {
      throw new Error(result.error);
    }

    if (!result.signedTxXdr) {
      throw new Error('Transaction signing rejected by wallet owner.');
    }

    return result.signedTxXdr;
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Transaction authorization failed';
    throw new Error(errorMessage || 'Transaction authorization failed.');
  }
}
