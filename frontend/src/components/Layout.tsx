/**
 * Main Layout Component
 * Provides the shell for the application with header, navigation, and content area
 */

import React from 'react';
import { WalletButton } from './WalletButton';
import { TabNavigation } from './TabNavigation';
import { NotificationContainer } from './NotificationContainer';
import { useAppStore } from '@/stores/appStore';
import { useWallet } from '@/hooks/useWallet';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { activeTab, setActiveTab } = useAppStore();
  const { isConnected, isVerifier } = useWallet();

  // Determine available tabs based on user role
  const tabs = [
    { id: 'citizen' as const, label: 'Citizen View', icon: '👤' },
    { id: 'leaderboard' as const, label: 'Leaderboard', icon: '🏆' },
    ...(isVerifier ? [{ id: 'verifier' as const, label: 'Verifier Panel', icon: '✓' }] : []),
  ];

  return (
    <div className="min-h-screen flex flex-col bg-segre-bg">
      {/* Header */}
      <header className="bg-segre-green text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                <span className="text-2xl">♻️</span>
              </div>
              <div>
                <h1 className="font-serif text-xl md:text-2xl italic">SegrePay</h1>
                <p className="font-mono text-[10px] uppercase tracking-wider text-white/60 hidden sm:block">
                  Tokenized Waste Rewards
                </p>
              </div>
            </div>

            {/* Right side: Wallet & Network */}
            <div className="flex items-center gap-3">
              <WalletButton />
            </div>
          </div>
        </div>

        {/* Tab Navigation (only when connected) */}
        {isConnected && (
          <div className="bg-segre-green/95 border-t border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <TabNavigation
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={(tab) => setActiveTab(tab)}
              />
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {!isConnected ? (
            <WelcomeSection />
          ) : (
            children
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-segre-ink text-segre-bg/60 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="font-serif italic text-segre-green-lt">SegrePay</div>
            <div className="font-mono text-xs text-segre-ink-3">
              Powered by Avalanche Fuji Testnet • TECHFEST Hackathon
            </div>
            <div className="flex items-center gap-4 text-xs">
              <a
                href="https://testnet.snowtrace.io"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                Snowtrace Explorer ↗
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Notifications */}
      <NotificationContainer />
    </div>
  );
}

/**
 * Welcome section shown when wallet is not connected
 */
function WelcomeSection() {
  const { connect, isConnecting } = useWallet();

  return (
    <div className="max-w-2xl mx-auto text-center py-16 md:py-24">
      <div className="mb-8">
        <span className="text-6xl md:text-8xl">♻️</span>
      </div>
      <h2 className="font-serif text-3xl md:text-4xl text-segre-ink mb-4">
        Earn <span className="text-segre-green italic">ECO Tokens</span> for Recycling
      </h2>
      <p className="text-segre-ink-2 text-lg mb-8 max-w-lg mx-auto leading-relaxed">
        SegrePay rewards you for properly segregated waste. Connect your wallet to view your 
        ECO balance, submit deposits as a verifier, or check the barangay leaderboard.
      </p>
      
      <button
        onClick={connect}
        disabled={isConnecting}
        className="btn-primary text-lg px-8 py-4"
      >
        {isConnecting ? (
          <span className="flex items-center gap-2">
            <LoadingSpinner size="sm" />
            Connecting...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <span>🔗</span>
            Connect Wallet
          </span>
        )}
      </button>

      <p className="mt-6 text-sm text-segre-ink-3">
        Supports Core Wallet and MetaMask on Avalanche Fuji Testnet
      </p>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-16">
        <FeatureCard
          icon="🪙"
          title="Earn ECO"
          description="Get 10 ECO tokens for every kilogram of properly segregated waste"
        />
        <FeatureCard
          icon="📊"
          title="Track Progress"
          description="View your balance, deposit history, and barangay rankings in real-time"
        />
        <FeatureCard
          icon="⛓️"
          title="On-Chain"
          description="All transactions recorded on Avalanche blockchain for transparency"
        />
      </div>
    </div>
  );
}

/**
 * Feature card for welcome section
 */
function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="card p-6 text-left hover:shadow-lg transition-shadow">
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-serif text-lg text-segre-ink mb-2">{title}</h3>
      <p className="text-sm text-segre-ink-2 leading-relaxed">{description}</p>
    </div>
  );
}

/**
 * Loading spinner component
 */
export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className={`${sizeClasses[size]} animate-spin`}>
      <svg
        className="text-current"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
}
