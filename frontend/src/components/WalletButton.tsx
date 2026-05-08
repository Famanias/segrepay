/**
 * Wallet Connection Button Component
 * Shows connect button when disconnected, wallet info when connected
 */

import React from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useAppStore } from '@/stores/appStore';
import { LoadingSpinner } from './Layout';

export function WalletButton() {
  const { 
    isConnected, 
    isConnecting, 
    hasError, 
    address, 
    shortAddress, 
    balance, 
    isCorrectNetwork, 
    connect, 
    disconnect, 
    switchToFuji 
  } = useWallet();

  const showError = useAppStore((state) => state.showError);

  // Handle network switch
  const handleSwitchNetwork = async () => {
    const success = await switchToFuji();
    if (!success) {
      showError('Network Switch Failed', 'Could not switch to Fuji testnet. Please add it manually.');
    }
  };

  // Not connected - show connect button
  if (!isConnected) {
    return (
      <button
        onClick={connect}
        disabled={isConnecting}
        className="btn-primary text-sm"
      >
        {isConnecting ? (
          <span className="flex items-center gap-2">
            <LoadingSpinner size="sm" />
            Connecting...
          </span>
        ) : (
          'Connect Wallet'
        )}
      </button>
    );
  }

  // Connected - show wallet info dropdown style
  return (
    <div className="flex items-center gap-3">
      {/* Network Warning */}
      {!isCorrectNetwork && (
        <button
          onClick={handleSwitchNetwork}
          className="badge-amber cursor-pointer hover:opacity-80 transition-opacity"
          title="Click to switch to Fuji Testnet"
        >
          Wrong Network
        </button>
      )}

      {/* Wallet Info Card */}
      <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
        {/* User Avatar / Indicator */}
        <div className="w-8 h-8 bg-segre-green-lt/20 rounded-full flex items-center justify-center">
          <span className="text-segre-green-lt text-sm">👛</span>
        </div>

        {/* Address & Balance */}
        <div className="hidden sm:block text-left">
          <div className="font-mono text-xs text-white/80">
            {shortAddress}
          </div>
          {balance && (
            <div className="text-xs text-white/60">
              {parseFloat(balance).toFixed(4)} AVAX
            </div>
          )}
        </div>

        {/* Disconnect Button */}
        <button
          onClick={disconnect}
          className="ml-2 p-1.5 hover:bg-white/10 rounded-md transition-colors"
          title="Disconnect"
        >
          <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/**
 * Network Badge Component
 */
export function NetworkBadge({ chainId }: { chainId: number | null }) {
  if (!chainId) return null;

  const isFuji = chainId === 43113;
  const isAvalanche = chainId === 43114;

  if (isFuji) {
    return (
      <span className="badge-green">
        Fuji Testnet
      </span>
    );
  }

  if (isAvalanche) {
    return (
      <span className="badge-amber">
        Avalanche Mainnet
      </span>
    );
  }

  return (
    <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-segre-red-bg text-segre-red">
      Unknown ({chainId})
    </span>
  );
}
