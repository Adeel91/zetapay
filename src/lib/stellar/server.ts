import { cookies } from 'next/headers';
import { EMPLOYER } from '@/config';
import { stellarServer } from './horizon';

/**
 * Validates a wallet address serverside and issues persistent session cookie states
 */
export async function initializeEmployerSession(publicKey: string): Promise<boolean> {
  try {
    // Double-check wallet existence via on-chain Horizon query
    await stellarServer.loadAccount(publicKey);

    const cookieStore = await cookies();
    
    // Save authentication details in matching layout infrastructure fields
    cookieStore.set('zetaWallet', publicKey, { expires: 7, path: '/', httpOnly: true, secure: true });
    cookieStore.set('zetaRole', EMPLOYER, { expires: 7, path: '/', httpOnly: true, secure: true });

    return true;
  } catch (error) {
    console.error('Server session authorization rejected:', error);
    return false;
  }
}
