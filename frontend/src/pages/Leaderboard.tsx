/**
 * Leaderboard Page
 * Shows barangay rankings based on total ECO tokens earned
 * 
 * API Integration:
 * - GET /leaderboard -> segRewards.getBarangayTotals()
 * - WebSocket: DepositLogged events for real-time updates
 */

import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import { getFullLeaderboard, formatTokenAmount, subscribeToDeposits } from '@/services/contracts';
import type { BarangayRanking, WasteDeposit } from '@/types';
import { LoadingSpinner } from '@/components/Layout';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell 
} from 'recharts';

export function Leaderboard() {
  const { leaderboard, setLeaderboard, addDeposit, recentDeposits, setRecentDeposits } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');

  // Initial load
  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        const data = await getFullLeaderboard();
        setLeaderboard(data);
        
        // Also load recent deposits for the feed
        const deposits = await import('@/services/contracts').then((m) => m.getRecentDeposits(50));
        setRecentDeposits(deposits);
      } catch (error) {
        console.error('Failed to load leaderboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLeaderboard();

    // Refresh every 15 seconds
    const interval = setInterval(loadLeaderboard, 15000);
    return () => clearInterval(interval);
  }, [setLeaderboard, setRecentDeposits]);

  // Subscribe to real-time events
  useEffect(() => {
    const unsubscribe = subscribeToDeposits((deposit: WasteDeposit) => {
      // Add to recent deposits
      addDeposit(deposit);
      
      // Refresh leaderboard
      getFullLeaderboard().then((data) => setLeaderboard(data));
    });

    return () => unsubscribe();
  }, [addDeposit, setLeaderboard]);

  // Prepare chart data
  const chartData = leaderboard
    .slice(0, 10) // Top 10
    .map((b) => ({
      name: `Brgy ${b.id}`,
      fullName: b.name,
      eco: Number(formatTokenAmount(b.totalEco)),
      rank: b.rank,
    }))
    .reverse(); // Bar chart shows lowest at bottom

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    if (rank === 2) return 'bg-gray-100 text-gray-700 border-gray-300';
    if (rank === 3) return 'bg-orange-100 text-orange-700 border-orange-300';
    return 'bg-segre-bg text-segre-ink-2 border-segre-rule';
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="eyebrow">Community Leaderboard</p>
        <h2 className="section-title">Barangay Rankings</h2>
        <p className="text-segre-ink-2 mt-2">
          Real-time rankings of all 17 Olongapo barangays based on total ECO tokens earned.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Leaderboard */}
        <div className="lg:col-span-2">
          <div className="card">
            {/* View Toggle */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-lg text-segre-ink">Rankings</h3>
              <div className="flex bg-segre-bg rounded-lg p-1">
                <button
                  onClick={() => setViewMode('table')}
                  className={`
                    px-3 py-1.5 rounded-md text-sm font-medium transition-all
                    ${viewMode === 'table' ? 'bg-white shadow-sm text-segre-green' : 'text-segre-ink-3'}
                  `}
                >
                  Table
                </button>
                <button
                  onClick={() => setViewMode('chart')}
                  className={`
                    px-3 py-1.5 rounded-md text-sm font-medium transition-all
                    ${viewMode === 'chart' ? 'bg-white shadow-sm text-segre-green' : 'text-segre-ink-3'}
                  `}
                >
                  Chart
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-16">
                <LoadingSpinner size="lg" />
                <p className="text-segre-ink-3 mt-4">Loading rankings...</p>
              </div>
            ) : viewMode === 'table' ? (
              // Table View
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-segre-ink">
                      <th className="text-left py-3 px-4 font-mono text-xs uppercase tracking-wider text-segre-ink-3">
                        Rank
                      </th>
                      <th className="text-left py-3 px-4 font-mono text-xs uppercase tracking-wider text-segre-ink-3">
                        Barangay
                      </th>
                      <th className="text-right py-3 px-4 font-mono text-xs uppercase tracking-wider text-segre-ink-3">
                        Total Kg
                      </th>
                      <th className="text-right py-3 px-4 font-mono text-xs uppercase tracking-wider text-segre-ink-3">
                        ECO Tokens
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((barangay) => (
                      <tr 
                        key={barangay.id} 
                        className={`
                          border-b border-segre-rule/50 
                          ${barangay.rank <= 3 ? 'bg-segre-green-bg/30' : 'hover:bg-segre-bg/50'}
                        `}
                      >
                        <td className="py-4 px-4">
                          <span className={`
                            inline-flex items-center justify-center w-10 h-10 rounded-full 
                            border-2 font-mono font-bold text-sm
                            ${getRankStyle(barangay.rank)}
                          `}>
                            {getRankIcon(barangay.rank)}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-medium text-segre-ink">{barangay.name}</div>
                          <div className="text-xs text-segre-ink-3">ID: {barangay.id}</div>
                        </td>
                        <td className="py-4 px-4 text-right font-mono text-segre-ink-2">
                          {barangay.totalKg.toLocaleString()} kg
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="font-mono font-bold text-segre-green">
                            {formatTokenAmount(barangay.totalEco)}
                          </span>
                          <span className="text-xs text-segre-ink-3 ml-1">ECO</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              // Chart View
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ left: 60, right: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ede9df" />
                    <XAxis type="number" stroke="#7a7a60" fontSize={12} />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      stroke="#4a4a38" 
                      fontSize={12}
                      width={50}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#fff9ef',
                        border: '1px solid rgba(26,26,18,0.12)',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`${value} ECO`, 'Total Tokens']}
                    />
                    <Bar dataKey="eco" radius={[0, 4, 4, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.rank <= 3 ? '#2d6a4f' : '#52b788'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Top 3 Podium */}
          <div className="card">
            <h3 className="font-serif text-lg text-segre-ink mb-4">🏆 Top Performers</h3>
            <div className="space-y-3">
              {leaderboard.slice(0, 3).map((barangay) => (
                <div 
                  key={barangay.id}
                  className={`
                    p-4 rounded-lg border-2
                    ${barangay.rank === 1 ? 'bg-yellow-50 border-yellow-300' : ''}
                    ${barangay.rank === 2 ? 'bg-gray-50 border-gray-300' : ''}
                    ${barangay.rank === 3 ? 'bg-orange-50 border-orange-300' : ''}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getRankIcon(barangay.rank)}</span>
                    <div>
                      <div className="font-medium text-segre-ink">{barangay.name}</div>
                      <div className="font-mono text-sm text-segre-green">
                        {formatTokenAmount(barangay.totalEco)} ECO
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Activity Feed */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg text-segre-ink">Live Activity</h3>
              <span className="flex items-center gap-1.5 text-xs text-segre-green">
                <span className="w-2 h-2 bg-segre-green rounded-full animate-pulse" />
                Live
              </span>
            </div>
            
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {recentDeposits.length === 0 ? (
                <p className="text-sm text-segre-ink-3 text-center py-4">No recent activity</p>
              ) : (
                recentDeposits.slice(0, 10).map((deposit) => (
                  <div 
                    key={deposit.id}
                    className="p-3 bg-segre-bg rounded-lg text-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-medium text-segre-ink capitalize">
                          {deposit.wasteCategory}
                        </span>
                        <span className="text-segre-ink-3"> • {deposit.kg} kg</span>
                      </div>
                      <span className="text-segre-green font-mono font-medium">
                        +{formatTokenAmount(deposit.ecoMinted)}
                      </span>
                    </div>
                    <div className="text-xs text-segre-ink-3 mt-1">
                      {deposit.barangayName} • {new Date(deposit.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Stats Summary */}
          <div className="card">
            <h3 className="font-serif text-lg text-segre-ink mb-4">Network Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-segre-ink-3">Total Barangays</span>
                <span className="font-mono font-medium">{leaderboard.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-segre-ink-3">Active Barangays</span>
                <span className="font-mono font-medium">
                  {leaderboard.filter((b) => b.totalEco > 0).length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-segre-ink-3">Network ECO</span>
                <span className="font-mono font-medium text-segre-green">
                  {formatTokenAmount(
                    leaderboard.reduce((sum, b) => sum + b.totalEco, BigInt(0))
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
