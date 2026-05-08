/**
 * Demo Data for Hackathon Presentation
 * Pre-configured wallets and households for live demo
 */

import type { DemoHousehold } from '@/types';

/**
 * Demo households with their wallet addresses and barangay assignments
 * Used for QR code generation and quick selection in verifier panel
 */
export const DEMO_HOUSEHOLDS: DemoHousehold[] = [
  {
    id: 'household-a',
    name: 'Household A (Dela Cruz Family)',
    address: '0x742d35Cc6634C0532925a3bD844Bc9e9e39C5eA1',
    barangayId: 1,
    barangayName: 'Barangay 1 (East Bajac-bajac)',
  },
  {
    id: 'household-b',
    name: 'Household B (Reyes Family)',
    address: '0x8ba1f109551bD432803012645Hac136c82C3eA2',
    barangayId: 2,
    barangayName: 'Barangay 2 (West Bajac-bajac)',
  },
  {
    id: 'household-c',
    name: 'Household C (Santos Family)',
    address: '0x9ca2f209552cD543914078756Hbd247d93D4eB3',
    barangayId: 3,
    barangayName: 'Barangay 3 (New Kababae)',
  },
  {
    id: 'household-d',
    name: 'Household D (Garcia Family)',
    address: '0xaDb3g310663dE654025167867Hce358e94F5c4',
    barangayId: 1,
    barangayName: 'Barangay 1 (East Bajac-bajac)',
  },
  {
    id: 'household-e',
    name: 'Household E (Mendoza Family)',
    address: '0xbEc4h421774eF765136278978Hdf469f05G6d5',
    barangayId: 2,
    barangayName: 'Barangay 2 (West Bajac-bajac)',
  },
];

/**
 * Demo verifier wallet addresses
 * In mock mode, any address ending in '1' or 'a' is considered a verifier
 */
export const DEMO_VERIFIER_ADDRESSES = [
  '0xVerifierDemoAddress1', // Demo: ends with '1' - will be auto-recognized as verifier
  '0xEcoVerifierOlongapoA', // Demo: ends with 'A' - will be auto-recognized as verifier
];

/**
 * Pre-seeded deposit history for demo
 * Shows realistic data before any real transactions
 */
export const DEMO_DEPOSIT_HISTORY = [
  {
    id: 'demo-1',
    citizen: DEMO_HOUSEHOLDS[0].address,
    barangayId: 1,
    barangayName: 'Barangay 1',
    wasteCategory: 'recyclable' as const,
    kg: 5,
    ecoMinted: BigInt(50) * BigInt(10 ** 18),
    timestamp: Date.now() - 86400000, // 1 day ago
    txHash: '0xDemoTxHash1',
  },
  {
    id: 'demo-2',
    citizen: DEMO_HOUSEHOLDS[1].address,
    barangayId: 2,
    barangayName: 'Barangay 2',
    wasteCategory: 'biodegradable' as const,
    kg: 8,
    ecoMinted: BigInt(80) * BigInt(10 ** 18),
    timestamp: Date.now() - 172800000, // 2 days ago
    txHash: '0xDemoTxHash2',
  },
  {
    id: 'demo-3',
    citizen: DEMO_HOUSEHOLDS[2].address,
    barangayId: 3,
    barangayName: 'Barangay 3',
    wasteCategory: 'recyclable' as const,
    kg: 12,
    ecoMinted: BigInt(120) * BigInt(10 ** 18),
    timestamp: Date.now() - 259200000, // 3 days ago
    txHash: '0xDemoTxHash3',
  },
  {
    id: 'demo-4',
    citizen: DEMO_HOUSEHOLDS[0].address,
    barangayId: 1,
    barangayName: 'Barangay 1',
    wasteCategory: 'residual' as const,
    kg: 3,
    ecoMinted: BigInt(30) * BigInt(10 ** 18),
    timestamp: Date.now() - 43200000, // 12 hours ago
    txHash: '0xDemoTxHash4',
  },
];

/**
 * Demo barangay leaderboard seed data
 * Shows initial rankings before live deposits
 */
export const DEMO_LEADERBOARD_SEED = [
  { id: 1, name: 'Barangay 1', totalEco: BigInt(800) * BigInt(10 ** 18), totalKg: 80, rank: 1 },
  { id: 2, name: 'Barangay 2', totalEco: BigInt(650) * BigInt(10 ** 18), totalKg: 65, rank: 2 },
  { id: 3, name: 'Barangay 3', totalEco: BigInt(520) * BigInt(10 ** 18), totalKg: 52, rank: 3 },
  { id: 4, name: 'Barangay 4', totalEco: BigInt(400) * BigInt(10 ** 18), totalKg: 40, rank: 4 },
  { id: 5, name: 'Barangay 5', totalEco: BigInt(350) * BigInt(10 ** 18), totalKg: 35, rank: 5 },
  { id: 6, name: 'Barangay 6', totalEco: BigInt(300) * BigInt(10 ** 18), totalKg: 30, rank: 6 },
  { id: 7, name: 'Barangay 7', totalEco: BigInt(280) * BigInt(10 ** 18), totalKg: 28, rank: 7 },
  { id: 8, name: 'Barangay 8', totalEco: BigInt(250) * BigInt(10 ** 18), totalKg: 25, rank: 8 },
  { id: 9, name: 'Barangay 9', totalEco: BigInt(220) * BigInt(10 ** 18), totalKg: 22, rank: 9 },
  { id: 10, name: 'Barangay 10', totalEco: BigInt(180) * BigInt(10 ** 18), totalKg: 18, rank: 10 },
];

/**
 * Helper to get household by address
 */
export function getHouseholdByAddress(address: string): DemoHousehold | undefined {
  return DEMO_HOUSEHOLDS.find(
    (h) => h.address.toLowerCase() === address.toLowerCase()
  );
}

/**
 * Helper to get household by ID
 */
export function getHouseholdById(id: string): DemoHousehold | undefined {
  return DEMO_HOUSEHOLDS.find((h) => h.id === id);
}
