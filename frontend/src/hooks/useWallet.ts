/**
 * useWallet Hook
 * Simplified interface to wallet store with additional React-specific functionality
 */

import { useEffect, useCallback } from 'react';
import { useWalletStore, AVALANCHE_FUJI_CONFIG } from '@/stores/walletStore';
import type { UserRole } from '@/types';

export interface UseWalletReturn {
  // State
  address: string | null;
  balance: string | null;
  chainId: number | null;
  state: 'disconnected' | 'connecting' | 'connected' | 'error';
  error: string | null;
  isVerifier: boolean;
  userRole: UserRole;
  isCorrectNetwork: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  hasError: boolean;
  
  // Shortened address for display
  shortAddress: string;
  
  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  switchToFuji: () => Promise<boolean>;
}

/**
 * Hook for wallet connection management
 * Wraps the Zustand store for React-specific functionality
 */
export function useWallet(): UseWalletReturn {
  const store = useWalletStore();

  // Auto-shorten address
  const shortAddress = store.address 
    ? `${store.address.slice(0, 6)}...${store.address.slice(-4)}`
    : '';

  // Computed states
  const isConnected = store.state === 'connected';
  const isConnecting = store.state === 'connecting';
  const hasError = store.state === 'error';

  return {
    address: store.address,
    balance: store.balance,
    chainId: store.chainId,
    state: store.state,
    error: store.error,
    isVerifier: store.isVerifier,
    userRole: store.userRole,
    isCorrectNetwork: store.isCorrectNetwork,
    isConnected,
    isConnecting,
    hasError,
    shortAddress,
    connect: store.connect,
    disconnect: store.disconnect,
    switchToFuji: store.switchToFuji,
  };
}

/**
 * Hook to auto-refresh balance periodically
 */
export function useBalanceRefresh(intervalMs: number = 15000): void {
  const { address, state, connect } = useWallet();

  useEffect(() => {
    if (state !== 'connected' || !address) return;

    // Refresh balance every interval
    const interval = setInterval(() => {
      connect(); // Re-connecting will refresh all state
    }, intervalMs);

    return () => clearInterval(interval);
  }, [address, state, connect, intervalMs]);
}

/**
 * Hook to listen for network changes
 */
export function useNetworkChange(callback?: (chainId: number) => void): void {
  const { chainId, isCorrectNetwork } = useWallet();

  useEffect(() => {
    if (chainId && callback) {
      callback(chainId);
    }
  }, [chainId, callback]);
}

// Re-export config for convenience
export { AVALANCHE_FUJI_CONFIG };
