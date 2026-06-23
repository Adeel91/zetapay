'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ROLE, ROUTES } from '@/config';

interface WalletContextType {
  walletAddress: string | null;
  isConnecting: boolean;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

export function Providers({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const connect = async () => {
    setIsConnecting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const mockAddress = 'G...abcd1234';
      setWalletAddress(mockAddress);

      const savedRole = localStorage.getItem('zetaRole');

      if (savedRole === 'employer') {
        router.push(ROUTES.employer.root);
      } else if (savedRole === 'auditor') {
        router.push(ROUTES.auditor.root);
      } else {
        router.push(ROLE);
      }
    } catch (error) {
      console.error('Connection failed:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setWalletAddress(null);
    localStorage.removeItem('zetaRole');
    router.push('/');
  };

  return (
    <WalletContext.Provider
      value={{
        walletAddress,
        isConnecting,
        isConnected: !!walletAddress,
        connect,
        disconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}
