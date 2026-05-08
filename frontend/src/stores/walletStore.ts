/**
 * Wallet State Management with Zustand
 * Handles wallet connection, network switching, and user state
 */

import { create } from 'zustand';
import { BrowserProvider, JsonRpcSigner, ethers } from 'ethers';
import type { WalletInfo, WalletState, UserRole, AVALANCHE_FUJI_CONFIG } from '@/types';
import { initializeContracts, isVerifier } from '@/services/contracts';
import { AVALANCHE_FUJI_CONFIG as FUJI_CONFIG } from '@/types';

// Re-export for convenience
export const AVALANCHE_FUJI_CONFIG = FUJI_CONFIG;

interface WalletStore extends WalletInfo {
  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  checkVerifierStatus: () => Promise<void>;
  switchToFuji: () => Promise<boolean>;
  
  // Derived state
  isVerifier: boolean;
  userRole: UserRole;
  isCorrectNetwork: boolean;
}

// Helper to detect wallet provider
function getEthereumProvider(): any | null {
  if (typeof window === 'undefined') return null;
  
  // Core Wallet (Avalanche native)
  if ((window as any).avalanche) {
    return (window as any).avalanche;
  }
  
  // MetaMask or other injected wallet
  if ((window as any).ethereum) {
    return (window as any).ethereum;
  }
  
  return null;
}

export const useWalletStore = create<WalletStore>((set, get) => ({
  // Initial state
  address: null,
  provider: null,
  signer: null,
  chainId: null,
  balance: null,
  state: 'disconnected',
  error: null,
  isVerifier: false,
  userRole: null,
  isCorrectNetwork: false,

  connect: async () => {
    const provider = getEthereumProvider();
    
    if (!provider) {
      set({
        state: 'error',
        error: 'No wallet detected. Please install Core Wallet or MetaMask.',
      });
      return;
    }

    set({ state: 'connecting', error: null });

    try {
      // Request account access
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      
      if (!accounts || accounts.length === 0) {
        set({
          state: 'error',
          error: 'No accounts found. Please unlock your wallet.',
        });
        return;
      }

      const address = accounts[0];
      
      // Create ethers provider and signer
      const browserProvider = new BrowserProvider(provider);
      const signer = await browserProvider.getSigner();
      const network = await browserProvider.getNetwork();
      const chainId = Number(network.chainId);
      
      // Get AVAX balance
      const balanceWei = await browserProvider.getBalance(address);
      const balance = ethers.formatEther(balanceWei);

      // Check if on correct network
      const isCorrectNetwork = chainId === FUJI_CONFIG.chainId;

      // Initialize contract service
      initializeContracts(browserProvider, signer);

      // Check verifier status
      let isVerifierStatus = false;
      try {
        isVerifierStatus = await isVerifier(address);
      } catch (e) {
        // In mock mode, this might fail - that's ok
        console.log('Could not check verifier status, using mock mode');
        // Demo: addresses ending in '1' or 'a' are verifiers
        isVerifierStatus = address.toLowerCase().endsWith('1') || address.toLowerCase().endsWith('a');
      }

      // Determine user role
      const userRole: UserRole = isVerifierStatus ? 'verifier' : 'citizen';

      set({
        address,
        provider: browserProvider,
        signer,
        chainId,
        balance,
        state: 'connected',
        error: null,
        isVerifier: isVerifierStatus,
        userRole,
        isCorrectNetwork,
      });

      // Set up event listeners
      provider.on('accountsChanged', (newAccounts: string[]) => {
        if (newAccounts.length === 0) {
          // User disconnected
          get().disconnect();
        } else {
          // Account switched - reconnect
          get().connect();
        }
      });

      provider.on('chainChanged', () => {
        // Chain changed - refresh connection
        get().connect();
      });

    } catch (error: any) {
      console.error('Wallet connection error:', error);
      set({
        state: 'error',
        error: error.message || 'Failed to connect wallet',
      });
    }
  },

  disconnect: () => {
    const provider = getEthereumProvider();
    if (provider) {
      // Remove listeners
      provider.removeAllListeners('accountsChanged');
      provider.removeAllListeners('chainChanged');
    }

    set({
      address: null,
      provider: null,
      signer: null,
      chainId: null,
      balance: null,
      state: 'disconnected',
      error: null,
      isVerifier: false,
      userRole: null,
      isCorrectNetwork: false,
    });
  },

  checkVerifierStatus: async () => {
    const { address } = get();
    if (!address) return;

    try {
      const verifierStatus = await isVerifier(address);
      const userRole: UserRole = verifierStatus ? 'verifier' : 'citizen';
      set({ isVerifier: verifierStatus, userRole });
    } catch (error) {
      console.error('Failed to check verifier status:', error);
    }
  },

  switchToFuji: async () => {
    const provider = getEthereumProvider();
    if (!provider) return false;

    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${FUJI_CONFIG.chainId.toString(16)}` }],
      });
      return true;
    } catch (switchError: any) {
      // Chain not added yet
      if (switchError.code === 4902) {
        try {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${FUJI_CONFIG.chainId.toString(16)}`,
                chainName: FUJI_CONFIG.chainName,
                nativeCurrency: FUJI_CONFIG.nativeCurrency,
                rpcUrls: FUJI_CONFIG.rpcUrls,
                blockExplorerUrls: FUJI_CONFIG.blockExplorerUrls,
              },
            ],
          });
          return true;
        } catch (addError) {
          console.error('Failed to add Fuji network:', addError);
          return false;
        }
      }
      console.error('Failed to switch network:', switchError);
      return false;
    }
  },
}));
