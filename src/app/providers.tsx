'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AUDITOR, EMPLOYER } from '@/config';
import Cookies from 'js-cookie';

interface WalletContextType {
  walletAddress: string | null;
  isConnecting: boolean;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshUser: (email?: string) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

const getInitialWalletAddress = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  const savedRole = Cookies.get('zetaRole');
  const savedWallet = Cookies.get('zetaWallet');
  const savedAuditorSession = Cookies.get('auditorSession');
  
  if (savedWallet && savedRole === EMPLOYER) {
    return savedWallet;
  } else if (savedAuditorSession && savedRole === AUDITOR) {
    try {
      const session = JSON.parse(decodeURIComponent(savedAuditorSession));
      return session.email || 'auditor@company.com';
    } catch {
      return 'auditor@company.com';
    }
  }
  return null;
};

export function Providers({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [walletAddress, setWalletAddress] = useState<string | null>(() => getInitialWalletAddress());
  const [isConnecting, setIsConnecting] = useState(false);

  const setRoleCookie = (role: string) => {
    Cookies.set('zetaRole', role, { expires: 7, path: '/' });
  };

  const connect = async () => {
    setIsConnecting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const mockAddress = 'G...abcd1234';
      setWalletAddress(mockAddress);
      Cookies.set('zetaWallet', mockAddress, { expires: 7, path: '/' });
      setRoleCookie(EMPLOYER);
      
      // Refresh navbar after login
      if (typeof window !== 'undefined' && (window as any).refreshNavbar) {
        (window as any).refreshNavbar();
      }
    } catch (error) {
      console.error('Connection failed:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setWalletAddress(null);
    Cookies.remove('zetaRole', { path: '/' });
    Cookies.remove('zetaWallet', { path: '/' });
    Cookies.remove('auditorSession', { path: '/' });
    router.push('/');
  };

  const refreshUser = (email?: string) => {
    const savedRole = Cookies.get('zetaRole');
    const savedAuditorSession = Cookies.get('auditorSession');
    
    if (savedRole === 'auditor' && savedAuditorSession) {
      try {
        const session = JSON.parse(decodeURIComponent(savedAuditorSession));
        setWalletAddress(email || session.email || 'auditor@company.com');
      } catch {
        setWalletAddress(email || 'auditor@company.com');
      }
      setRoleCookie(AUDITOR);
      
      // Refresh navbar after login
      if (typeof window !== 'undefined' && (window as any).refreshNavbar) {
        (window as any).refreshNavbar();
      }
    }
  };

  return (
    <WalletContext.Provider
      value={{
        walletAddress,
        isConnecting,
        isConnected: !!walletAddress,
        connect,
        disconnect,
        refreshUser,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}