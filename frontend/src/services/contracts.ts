/**
 * Contract Service Layer
 * Handles all interactions with SegrePay smart contracts using Ethers.js v6
 * 
 * API Endpoints (Contract Methods):
 * - segreToken.balanceOf(address) -> GET /token/balance/:address
 * - segreToken.decimals() -> GET /token/decimals
 * - segreToken.symbol() -> GET /token/symbol
 * 
 * - segRewards.rewardDeposit(citizen, barangayId, category, kg) -> POST /deposits
 * - segRewards.getBarangayTotals(ids) -> GET /barangay/totals
 * - segRewards.barangayTotal(id) -> GET /barangay/:id/total
 * - segRewards.totalKgDeposited(address) -> GET /citizen/:address/kg
 * - segRewards.isVerifier(address) -> GET /verifier/:address/status
 * - segRewards.tokensPerKg() -> GET /config/tokens-per-kg
 * 
 * Events:
 * - DepositLogged -> WebSocket/Real-time feed
 * - VerifierUpdated -> Admin notifications
 */

import { ethers, BrowserProvider, Contract, JsonRpcSigner } from 'ethers';
import {
  SEGRE_TOKEN_ABI,
  SEG_REWARDS_ABI,
  CONTRACT_ADDRESSES,
  USE_MOCK_DATA,
} from '@/contracts/abis';
import type {
  SegreTokenContract,
  SegRewardsContract,
  WasteDeposit,
  BarangayRanking,
  WasteCategory,
  ContractConfig,
  TransactionResult,
} from '@/types';

// ============================================================================
// MOCK DATA FOR DEVELOPMENT/DEMO
// ============================================================================

const MOCK_BARANGAYS: BarangayRanking[] = [
  { id: 1, name: 'Barangay 1', totalEco: BigInt(15000) * BigInt(10 ** 18), totalKg: 1500, rank: 2 },
  { id: 2, name: 'Barangay 2', totalEco: BigInt(22000) * BigInt(10 ** 18), totalKg: 2200, rank: 1 },
  { id: 3, name: 'Barangay 3', totalEco: BigInt(8000) * BigInt(10 ** 18), totalKg: 800, rank: 3 },
];

const MOCK_DEPOSITS: WasteDeposit[] = [
  {
    id: '1',
    citizen: '0x1234567890123456789012345678901234567890',
    barangayId: 1,
    barangayName: 'Barangay 1',
    wasteCategory: 'recyclable',
    kg: 5,
    ecoMinted: BigInt(50) * BigInt(10 ** 18),
    timestamp: Date.now() - 3600000,
    txHash: '0xabc123...',
  },
  {
    id: '2',
    citizen: '0x2345678901234567890123456789012345678901',
    barangayId: 2,
    barangayName: 'Barangay 2',
    wasteCategory: 'biodegradable',
    kg: 10,
    ecoMinted: BigInt(100) * BigInt(10 ** 18),
    timestamp: Date.now() - 7200000,
    txHash: '0xdef456...',
  },
];

// ============================================================================
// CONTRACT INSTANCES
// ============================================================================

let segreTokenContract: Contract | null = null;
let segRewardsContract: Contract | null = null;
let provider: BrowserProvider | null = null;
let signer: JsonRpcSigner | null = null;

/**
 * Initialize contract instances with a signer
 * Call this after wallet connection
 */
export function initializeContracts(browserProvider: BrowserProvider, userSigner: JsonRpcSigner): void {
  provider = browserProvider;
  signer = userSigner;

  segreTokenContract = new Contract(
    CONTRACT_ADDRESSES.SEGRE_TOKEN,
    SEGRE_TOKEN_ABI,
    signer
  );

  segRewardsContract = new Contract(
    CONTRACT_ADDRESSES.SEG_REWARDS,
    SEG_REWARDS_ABI,
    signer
  );
}

/**
 * Get contract instances (throws if not initialized)
 */
function getContracts(): { segreToken: Contract; segRewards: Contract } {
  if (USE_MOCK_DATA) {
    throw new Error('Using mock data mode - no contract interactions needed');
  }
  if (!segreTokenContract || !segRewardsContract) {
    throw new Error('Contracts not initialized. Call initializeContracts first.');
  }
  return { segreToken: segreTokenContract, segRewards: segRewardsContract };
}

// ============================================================================
// TOKEN API METHODS
// ============================================================================

/**
 * GET /token/balance/:address
 * Get ECO token balance for a specific address
 */
export async function getTokenBalance(address: string): Promise<bigint> {
  if (USE_MOCK_DATA) {
    return BigInt(500) * BigInt(10 ** 18); // 500 ECO
  }
  const { segreToken } = getContracts();
  const balance = await segreToken.balanceOf(address);
  return BigInt(balance.toString());
}

/**
 * GET /token/decimals
 * Get token decimals (for formatting)
 */
export async function getTokenDecimals(): Promise<number> {
  if (USE_MOCK_DATA) return 18;
  const { segreToken } = getContracts();
  return await segreToken.decimals();
}

/**
 * GET /token/symbol
 * Get token symbol (ECO)
 */
export async function getTokenSymbol(): Promise<string> {
  if (USE_MOCK_DATA) return 'ECO';
  const { segreToken } = getContracts();
  return await segreToken.symbol();
}

/**
 * GET /token/info
 * Get full token information
 */
export async function getTokenInfo(): Promise<{ symbol: string; decimals: number; name: string }> {
  if (USE_MOCK_DATA) {
    return { symbol: 'ECO', decimals: 18, name: 'SegrePay Token' };
  }
  const { segreToken } = getContracts();
  const [symbol, decimals, name] = await Promise.all([
    segreToken.symbol(),
    segreToken.decimals(),
    segreToken.name(),
  ]);
  return { symbol, decimals, name };
}

// ============================================================================
// DEPOSIT API METHODS
// ============================================================================

/**
 * POST /deposits
 * Submit a waste deposit (verifier only)
 * 
 * Request body:
 * {
 *   citizen: string (address),
 *   barangayId: number (1-17),
 *   wasteCategory: 'biodegradable' | 'recyclable' | 'residual',
 *   kg: number
 * }
 */
export async function submitDeposit(
  citizen: string,
  barangayId: number,
  wasteCategory: WasteCategory,
  kg: number
): Promise<TransactionResult> {
  if (USE_MOCK_DATA) {
    // Simulate successful transaction
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return {
      success: true,
      hash: '0x' + Math.random().toString(16).slice(2, 14) + '...',
    };
  }

  try {
    const { segRewards } = getContracts();
    
    // Validate inputs
    if (!ethers.isAddress(citizen)) {
      return { success: false, error: 'Invalid citizen wallet address' };
    }
    if (barangayId < 1 || barangayId > 17) {
      return { success: false, error: 'Barangay ID must be between 1 and 17' };
    }
    if (kg <= 0) {
      return { success: false, error: 'Weight must be greater than 0 kg' };
    }

    // Submit transaction
    const tx = await segRewards.rewardDeposit(
      citizen,
      barangayId,
      wasteCategory,
      kg
    );

    // Wait for confirmation
    const receipt = await tx.wait();

    return {
      success: true,
      hash: tx.hash,
      receipt,
    };
  } catch (error: any) {
    console.error('Deposit submission error:', error);
    
    // Parse common error messages
    let errorMessage = error.message || 'Transaction failed';
    if (errorMessage.includes('Not an authorized verifier')) {
      errorMessage = 'Wallet not authorized as verifier';
    } else if (errorMessage.includes('Weight must be')) {
      errorMessage = 'Invalid weight value';
    } else if (errorMessage.includes('user rejected')) {
      errorMessage = 'Transaction rejected by user';
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * GET /citizen/:address/deposits
 * Get all deposits for a citizen (from event logs)
 */
export async function getCitizenDeposits(
  citizenAddress: string,
  fromBlock: number = -1000
): Promise<WasteDeposit[]> {
  if (USE_MOCK_DATA) {
    return MOCK_DEPOSITS.filter((d) => d.citizen.toLowerCase() === citizenAddress.toLowerCase());
  }

  try {
    const { segRewards } = getContracts();
    const provider = segRewards.runner?.provider;
    
    if (!provider) {
      throw new Error('No provider available');
    }

    const currentBlock = await provider.getBlockNumber();
    const startBlock = fromBlock > 0 ? fromBlock : currentBlock + fromBlock;

    // Query DepositLogged events
    const filter = segRewards.filters.DepositLogged(citizenAddress);
    const events = await segRewards.queryFilter(filter, startBlock, 'latest');

    return events.map((event: any, index: number) => ({
      id: `${event.blockNumber}-${event.logIndex}`,
      citizen: event.args.citizen,
      barangayId: event.args.barangayId,
      barangayName: `Barangay ${event.args.barangayId}`,
      wasteCategory: event.args.wasteCategory as WasteCategory,
      kg: Number(event.args.kg),
      ecoMinted: BigInt(event.args.ecoMinted.toString()),
      timestamp: Number(event.args.timestamp) * 1000, // Convert to milliseconds
      txHash: event.transactionHash,
    }));
  } catch (error) {
    console.error('Failed to fetch citizen deposits:', error);
    return [];
  }
}

/**
 * GET /citizen/:address/kg
 * Get total kg deposited by a citizen
 */
export async function getTotalKgDeposited(address: string): Promise<bigint> {
  if (USE_MOCK_DATA) {
    return BigInt(25); // 25 kg mock
  }
  const { segRewards } = getContracts();
  const total = await segRewards.totalKgDeposited(address);
  return BigInt(total.toString());
}

// ============================================================================
// LEADERBOARD API METHODS
// ============================================================================

/**
 * GET /barangay/totals
 * Get ECO totals for multiple barangays
 * 
 * Query params:
 * - ids: number[] (array of barangay IDs)
 */
export async function getBarangayTotals(ids: number[]): Promise<BarangayRanking[]> {
  if (USE_MOCK_DATA) {
    return MOCK_BARANGAYS.filter((b) => ids.includes(b.id));
  }

  try {
    const { segRewards } = getContracts();
    const totals = await segRewards.getBarangayTotals(ids);

    const rankings: BarangayRanking[] = ids.map((id, index) => ({
      id,
      name: `Barangay ${id}`,
      totalEco: BigInt(totals[index].toString()),
      // Estimate total kg from tokens (tokensPerKg = 10)
      totalKg: Number(totals[index]) / (10 * 10 ** 18),
      rank: 0, // Will be calculated after sorting
    }));

    // Sort and assign ranks
    rankings.sort((a, b) => (b.totalEco > a.totalEco ? 1 : -1));
    rankings.forEach((r, i) => (r.rank = i + 1));

    return rankings;
  } catch (error) {
    console.error('Failed to fetch barangay totals:', error);
    return [];
  }
}

/**
 * GET /barangay/:id/total
 * Get ECO total for a single barangay
 */
export async function getBarangayTotal(id: number): Promise<bigint> {
  if (USE_MOCK_DATA) {
    const barangay = MOCK_BARANGAYS.find((b) => b.id === id);
    return barangay?.totalEco || BigInt(0);
  }
  const { segRewards } = getContracts();
  const total = await segRewards.barangayTotal(id);
  return BigInt(total.toString());
}

/**
 * GET /leaderboard
 * Get full leaderboard (all barangays)
 */
export async function getFullLeaderboard(): Promise<BarangayRanking[]> {
  // Get all 17 barangays (Olongapo has 17 barangays)
  const allIds = Array.from({ length: 17 }, (_, i) => i + 1);
  return getBarangayTotals(allIds);
}

// ============================================================================
// REAL-TIME EVENTS API
// ============================================================================

/**
 * WebSocket/Real-time: Subscribe to new deposits
 * Returns a function to unsubscribe
 */
export function subscribeToDeposits(
  callback: (deposit: WasteDeposit) => void,
  fromBlock: number = -100
): () => void {
  if (USE_MOCK_DATA) {
    // Simulate events every 30 seconds
    const interval = setInterval(() => {
      const mockDeposit: WasteDeposit = {
        id: `mock-${Date.now()}`,
        citizen: '0x1234567890123456789012345678901234567890',
        barangayId: Math.floor(Math.random() * 3) + 1,
        barangayName: `Barangay ${Math.floor(Math.random() * 3) + 1}`,
        wasteCategory: ['recyclable', 'biodegradable', 'residual'][Math.floor(Math.random() * 3)] as WasteCategory,
        kg: Math.floor(Math.random() * 10) + 1,
        ecoMinted: BigInt(Math.floor(Math.random() * 100) + 10) * BigInt(10 ** 18),
        timestamp: Date.now(),
        txHash: '0x' + Math.random().toString(16).slice(2, 14),
      };
      callback(mockDeposit);
    }, 30000);

    return () => clearInterval(interval);
  }

  try {
    const { segRewards } = getContracts();
    const provider = segRewards.runner?.provider;
    
    if (!provider) {
      console.warn('No provider for real-time events');
      return () => {};
    }

    // Set up event listener
    const handleDeposit = (citizen: string, barangayId: number, wasteCategory: string, kg: bigint, ecoMinted: bigint, timestamp: bigint, event: any) => {
      callback({
        id: `${event.log.blockNumber}-${event.log.index}`,
        citizen,
        barangayId,
        barangayName: `Barangay ${barangayId}`,
        wasteCategory: wasteCategory as WasteCategory,
        kg: Number(kg),
        ecoMinted: BigInt(ecoMinted.toString()),
        timestamp: Number(timestamp) * 1000,
        txHash: event.log.transactionHash,
      });
    };

    segRewards.on('DepositLogged', handleDeposit);

    // Return unsubscribe function
    return () => {
      segRewards.off('DepositLogged', handleDeposit);
    };
  } catch (error) {
    console.error('Failed to subscribe to deposits:', error);
    return () => {};
  }
}

/**
 * GET /recent-deposits
 * Get recent deposits (last 50 blocks or 24 hours)
 */
export async function getRecentDeposits(blockCount: number = 50): Promise<WasteDeposit[]> {
  if (USE_MOCK_DATA) {
    return MOCK_DEPOSITS;
  }

  try {
    const { segRewards } = getContracts();
    const provider = segRewards.runner?.provider;
    
    if (!provider) {
      throw new Error('No provider available');
    }

    const currentBlock = await provider.getBlockNumber();
    const fromBlock = Math.max(0, currentBlock - blockCount);

    const filter = segRewards.filters.DepositLogged();
    const events = await segRewards.queryFilter(filter, fromBlock, 'latest');

    return events.slice(-10).reverse().map((event: any) => ({
      id: `${event.blockNumber}-${event.logIndex}`,
      citizen: event.args.citizen,
      barangayId: event.args.barangayId,
      barangayName: `Barangay ${event.args.barangayId}`,
      wasteCategory: event.args.wasteCategory as WasteCategory,
      kg: Number(event.args.kg),
      ecoMinted: BigInt(event.args.ecoMinted.toString()),
      timestamp: Number(event.args.timestamp) * 1000,
      txHash: event.transactionHash,
    }));
  } catch (error) {
    console.error('Failed to fetch recent deposits:', error);
    return [];
  }
}

// ============================================================================
// VERIFIER API METHODS
// ============================================================================

/**
 * GET /verifier/:address/status
 * Check if an address is an authorized verifier
 */
export async function isVerifier(address: string): Promise<boolean> {
  if (USE_MOCK_DATA) {
    // For demo, first address is verifier
    return address.toLowerCase().endsWith('1') || address.toLowerCase().endsWith('a');
  }
  const { segRewards } = getContracts();
  return await segRewards.isVerifier(address);
}

/**
 * GET /config/tokens-per-kg
 * Get current reward rate
 */
export async function getTokensPerKg(): Promise<bigint> {
  if (USE_MOCK_DATA) {
    return BigInt(10) * BigInt(10 ** 18); // 10 ECO per kg
  }
  const { segRewards } = getContracts();
  const rate = await segRewards.tokensPerKg();
  return BigInt(rate.toString());
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format token amount for display (handles decimals)
 */
export function formatTokenAmount(amount: bigint, decimals: number = 18): string {
  const divisor = BigInt(10 ** decimals);
  const integerPart = amount / divisor;
  const fractionalPart = amount % divisor;
  
  // Pad fractional part with leading zeros
  const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
  
  // Trim trailing zeros and limit to 2 decimal places
  const trimmedFractional = fractionalStr.replace(/0+$/, '').slice(0, 2);
  
  if (trimmedFractional) {
    return `${integerPart}.${trimmedFractional}`;
  }
  return integerPart.toString();
}

/**
 * Format token amount with symbol
 */
export function formatTokenWithSymbol(amount: bigint, symbol: string = 'ECO', decimals: number = 18): string {
  return `${formatTokenAmount(amount, decimals)} ${symbol}`;
}

/**
 * Shorten wallet address for display
 */
export function shortenAddress(address: string, chars: number = 4): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Get Snowtrace URL for transaction
 */
export function getSnowtraceTxUrl(txHash: string): string {
  return `https://testnet.snowtrace.io/tx/${txHash}`;
}

/**
 * Get Snowtrace URL for address
 */
export function getSnowtraceAddressUrl(address: string): string {
  return `https://testnet.snowtrace.io/address/${address}`;
}
