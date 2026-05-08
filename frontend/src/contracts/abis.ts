/**
 * Smart Contract ABIs for SegrePay
 * These match the Solidity contracts defined in the roadmap
 * 
 * Contracts:
 * - SegreToken.sol (ERC-20)
 * - SegRewards.sol (Core rewards logic)
 */

/// <reference types="vite/client" />

import { ethers, BrowserProvider, Contract, JsonRpcSigner } from 'ethers';

// ============================================================================
// SEGRE TOKEN ABI (ERC-20)
// ============================================================================

export const SEGRE_TOKEN_ABI = [
  // Constructor
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "owner", type: "address" },
      { indexed: true, internalType: "address", name: "spender", type: "address" },
      { indexed: false, internalType: "uint256", name: "value", type: "uint256" },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "previousOwner", type: "address" },
      { indexed: true, internalType: "address", name: "newOwner", type: "address" },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "from", type: "address" },
      { indexed: true, internalType: "address", name: "to", type: "address" },
      { indexed: false, internalType: "uint256", name: "value", type: "uint256" },
    ],
    name: "Transfer",
    type: "event",
  },
  // View Functions
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "value", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "value", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "from", type: "address" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "value", type: "uint256" },
    ],
    name: "transferFrom",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Mint function - only owner (SegRewards contract)
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

// ============================================================================
// SEG REWARDS ABI
// ============================================================================

export const SEG_REWARDS_ABI = [
  // Constructor
  {
    inputs: [{ internalType: "address", name: "_segreToken", type: "address" }],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "citizen", type: "address" },
      { indexed: false, internalType: "uint8", name: "barangayId", type: "uint8" },
      { indexed: false, internalType: "string", name: "wasteCategory", type: "string" },
      { indexed: false, internalType: "uint256", name: "kg", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "ecoMinted", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" },
    ],
    name: "DepositLogged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "previousOwner", type: "address" },
      { indexed: true, internalType: "address", name: "newOwner", type: "address" },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "address", name: "verifier", type: "address" },
      { indexed: false, internalType: "bool", name: "status", type: "bool" },
    ],
    name: "VerifierUpdated",
    type: "event",
  },
  // View Functions
  {
    inputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    name: "barangayTotal",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint8[]", name: "ids", type: "uint8[]" }],
    name: "getBarangayTotals",
    outputs: [{ internalType: "uint256[]", name: "totals", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "isVerifier",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "segreToken",
    outputs: [{ internalType: "contract SegreToken", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "tokensPerKg",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "totalKgDeposited",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // Core Function - Submit deposit
  {
    inputs: [
      { internalType: "address", name: "citizen", type: "address" },
      { internalType: "uint8", name: "barangayId", type: "uint8" },
      { internalType: "string", name: "wasteCategory", type: "string" },
      { internalType: "uint256", name: "kg", type: "uint256" },
    ],
    name: "rewardDeposit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Admin Functions
  {
    inputs: [{ internalType: "address", name: "v", type: "address" },
    { internalType: "bool", name: "status", type: "bool" }],
    name: "setVerifier",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
    name: "setTokensPerKg",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

// ============================================================================
// CONTRACT ADDRESSES (UPDATE AFTER DEPLOYMENT)
// ============================================================================

// These are placeholder addresses - replace with actual deployed addresses
export const CONTRACT_ADDRESSES = {
  // Fuji Testnet deployment addresses
  SEGRE_TOKEN: import.meta.env.VITE_SEGRE_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000',
  SEG_REWARDS: import.meta.env.VITE_SEG_REWARDS_ADDRESS || '0x0000000000000000000000000000000000000000',
};

// For demo/development - mock data flag
export const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true';
