/**
 * TypeScript type definitions for SegrePay frontend
 * Matches the smart contract structures and app requirements
 */

// ============================================================================
// WALLET & BLOCKCHAIN TYPES
// ============================================================================

export type WalletState = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface WalletInfo {
  address: string | null;
  provider: any | null;
  signer: any | null;
  chainId: number | null;
  balance: string | null;
  state: WalletState;
  error: string | null;
}

// Avalanche Fuji Testnet
export const AVALANCHE_FUJI_CONFIG = {
  chainId: 43113,
  chainName: 'Avalanche Fuji Testnet',
  nativeCurrency: {
    name: 'Avalanche',
    symbol: 'AVAX',
    decimals: 18,
  },
  rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc'],
  blockExplorerUrls: ['https://testnet.snowtrace.io'],
};

// ============================================================================
// CONTRACT TYPES
// ============================================================================

// SegreToken.sol - ERC-20 Token
export interface SegreTokenContract {
  balanceOf(address: string): Promise<bigint>;
  decimals(): Promise<number>;
  symbol(): Promise<string>;
  name(): Promise<string>;
  totalSupply(): Promise<bigint>;
}

// SegRewards.sol - Core rewards contract
export interface SegRewardsContract {
  // State variables
  segreToken(): Promise<string>;
  tokensPerKg(): Promise<bigint>;
  isVerifier(address: string): Promise<boolean>;
  barangayTotal(barangayId: number): Promise<bigint>;
  totalKgDeposited(address: string): Promise<bigint>;

  // Core function - verifier submits deposit
  rewardDeposit(
    citizen: string,
    barangayId: number,
    wasteCategory: string,
    kg: number
  ): Promise<any>; // Returns TransactionResponse

  // View function - get multiple barangay totals
  getBarangayTotals(ids: number[]): Promise<bigint[]>;

  // Admin functions
  setVerifier(address: string, status: boolean): Promise<any>;
  setTokensPerKg(amount: bigint): Promise<any>;
}

// ============================================================================
// APPLICATION DATA TYPES
// ============================================================================

export type WasteCategory = 'biodegradable' | 'recyclable' | 'residual';

export interface WasteDeposit {
  id: string;
  citizen: string;
  barangayId: number;
  barangayName: string;
  wasteCategory: WasteCategory;
  kg: number;
  ecoMinted: bigint;
  timestamp: number;
  txHash: string;
}

export interface BarangayRanking {
  id: number;
  name: string;
  totalEco: bigint;
  totalKg: number;
  rank: number;
}

export interface CitizenStats {
  address: string;
  ecoBalance: bigint;
  totalKgDeposited: bigint;
  deposits: WasteDeposit[];
}

// ============================================================================
// UI COMPONENT TYPES
// ============================================================================

export type UserRole = 'citizen' | 'verifier' | 'admin' | null;

export interface DemoHousehold {
  id: string;
  name: string;
  address: string;
  barangayId: number;
  barangayName: string;
}

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
}

// ============================================================================
// API & SERVICE TYPES
// ============================================================================

export interface ContractConfig {
  segreTokenAddress: string;
  segRewardsAddress: string;
  segreTokenABI: any[];
  segRewardsABI: any[];
}

export interface TransactionResult {
  success: boolean;
  hash?: string;
  error?: string;
  receipt?: any;
  ecoEarned?: bigint;
}
