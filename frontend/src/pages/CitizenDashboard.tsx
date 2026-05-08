/**
 * Citizen Dashboard Page
 * Shows wallet balance, deposit history, and personal stats
 * 
 * API Integration:
 * - GET /token/balance/:address -> segreToken.balanceOf()
 * - GET /citizen/:address/deposits -> segRewards DepositLogged events
 * - GET /citizen/:address/kg -> segRewards.totalKgDeposited()
 */

import React, { useEffect, useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useAppStore } from '@/stores/appStore';
import { 
  getTokenBalance, 
  getTotalKgDeposited, 
  getCitizenDeposits,
  formatTokenAmount,
  getSnowtraceAddressUrl,
  isMockMode,
} from '@/services/contracts';
import type { WasteDeposit } from '@/types';
import { LoadingSpinner } from '@/components/Layout';

interface CitizenStats {
  ecoBalance: bigint;
  totalKg: bigint;
  deposits: WasteDeposit[];
  isLoading: boolean;
}

export function CitizenDashboard() {
  const { address, isConnected } = useWallet();
  const { showError } = useAppStore();
  
  const [stats, setStats] = useState<CitizenStats>({
    ecoBalance: BigInt(0),
    totalKg: BigInt(0),
    deposits: [],
    isLoading: true,
  });

  // Fetch citizen data
  useEffect(() => {
    if (!isConnected || !address) return;

    const fetchData = async () => {
      try {
        const [balance, totalKg, deposits] = await Promise.all([
          getTokenBalance(address),
          getTotalKgDeposited(address),
          getCitizenDeposits(address, -100), // Last 100 blocks
        ]);

        setStats({
          ecoBalance: balance,
          totalKg,
          deposits,
          isLoading: false,
        });
      } catch (error) {
        console.error('Failed to fetch citizen stats:', error);
        // Only show error if not in mock mode (mock mode always works)
        if (!isMockMode()) {
          showError('Data Load Failed', 'Could not fetch your balance from blockchain. Switching to demo mode...');
          // Auto-enable mock mode on failure
          setTimeout(() => window.location.reload(), 2000);
        }
        setStats((prev) => ({ ...prev, isLoading: false }));
      }
    };

    fetchData();

    // Auto-refresh every 15 seconds
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [address, isConnected, showError]);

  // Not connected
  if (!isConnected) {
    return (
      <div className="card text-center py-16">
        <p className="text-segre-ink-3">Connect your wallet to view your dashboard</p>
      </div>
    );
  }

  if (stats.isLoading) {
    return (
      <div className="card text-center py-16">
        <LoadingSpinner size="lg" />
        <p className="text-segre-ink-3 mt-4">Loading your data...</p>
      </div>
    );
  }

  const ecoBalanceFormatted = formatTokenAmount(stats.ecoBalance);
  const totalKgFormatted = stats.totalKg.toString();

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="eyebrow">Citizen View</p>
            <h2 className="section-title">Your Dashboard</h2>
          </div>
          {isMockMode() && (
            <span className="badge-yellow text-xs">
              🧪 Demo Mode
            </span>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* ECO Balance */}
        <div className="card bg-segre-green text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/70 text-sm font-mono uppercase tracking-wider">ECO Balance</p>
              <p className="font-serif text-3xl mt-1">{ecoBalanceFormatted}</p>
            </div>
            <span className="text-3xl">🪙</span>
          </div>
          <p className="text-white/60 text-sm mt-4">
            Earn 10 ECO per kg of sorted waste
          </p>
        </div>

        {/* Total Deposited */}
        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="eyebrow">Total Waste Deposited</p>
              <p className="font-serif text-3xl text-segre-ink mt-1">{totalKgFormatted}</p>
              <p className="text-segre-ink-3 text-sm">kilograms</p>
            </div>
            <span className="text-3xl">♻️</span>
          </div>
        </div>

        {/* Deposits Count */}
        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="eyebrow">Total Deposits</p>
              <p className="font-serif text-3xl text-segre-ink mt-1">{stats.deposits.length}</p>
              <p className="text-segre-ink-3 text-sm">transactions</p>
            </div>
            <span className="text-3xl">📦</span>
          </div>
        </div>
      </div>

      {/* Wallet Info */}
      <div className="card mb-8">
        <h3 className="font-serif text-lg text-segre-ink mb-4">Wallet Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-segre-ink-3 mb-1">Address</p>
            <a
              href={getSnowtraceAddressUrl(address || '')}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-sm text-segre-green hover:underline break-all"
            >
              {address}
            </a>
          </div>
          <div>
            <p className="text-sm text-segre-ink-3 mb-1">Network</p>
            <span className="badge-green">Avalanche Fuji Testnet</span>
          </div>
        </div>
      </div>

      {/* Deposit History */}
      <div className="card">
        <h3 className="font-serif text-lg text-segre-ink mb-4">Deposit History</h3>
        
        {stats.deposits.length === 0 ? (
          <div className="text-center py-8 text-segre-ink-3">
            <p className="text-4xl mb-3">📭</p>
            <p>No deposits yet</p>
            <p className="text-sm mt-2">Visit your local MRF to start earning ECO tokens!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-segre-rule">
                  <th className="text-left py-3 px-4 font-mono text-xs uppercase tracking-wider text-segre-ink-3">
                    Date
                  </th>
                  <th className="text-left py-3 px-4 font-mono text-xs uppercase tracking-wider text-segre-ink-3">
                    Barangay
                  </th>
                  <th className="text-left py-3 px-4 font-mono text-xs uppercase tracking-wider text-segre-ink-3">
                    Category
                  </th>
                  <th className="text-left py-3 px-4 font-mono text-xs uppercase tracking-wider text-segre-ink-3">
                    Weight
                  </th>
                  <th className="text-right py-3 px-4 font-mono text-xs uppercase tracking-wider text-segre-ink-3">
                    ECO Earned
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.deposits.map((deposit) => (
                  <tr key={deposit.id} className="border-b border-segre-rule/50 hover:bg-segre-bg/50">
                    <td className="py-3 px-4 text-sm">
                      {new Date(deposit.timestamp).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-segre-ink-2">
                      {deposit.barangayName}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span className="capitalize">{deposit.wasteCategory}</span>
                    </td>
                    <td className="py-3 px-4 text-sm font-mono">
                      {deposit.kg} kg
                    </td>
                    <td className="py-3 px-4 text-sm text-right font-mono text-segre-green">
                      +{formatTokenAmount(deposit.ecoMinted)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
