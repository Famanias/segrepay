/**
 * Supabase Client Service
 * Handles database operations and real-time subscriptions
 * 
 * Features:
 * - Save deposits to database
 * - Real-time leaderboard updates
 * - Citizen stats queries
 * - Recent deposits feed
 */

import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import type { WasteDeposit, BarangayRanking, WasteCategory } from '@/types';

// Supabase configuration from environment
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
  return Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
};

// Initialize Supabase client
let supabase: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    if (!isSupabaseConfigured()) {
      throw new Error(
        'Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env'
      );
    }
    
    supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    
    console.log('[Supabase] Client initialized');
  }
  
  return supabase;
}

// ============================================================================
// DEPOSIT OPERATIONS
// ============================================================================

/**
 * Save a deposit to the database
 * Called after successful blockchain transaction
 */
export async function saveDeposit(params: {
  citizenAddress: string;
  barangayId: number;
  wasteCategory: WasteCategory;
  weightKg: number;
  ecoMinted: bigint;
  txHash: string;
  depositType: 'mrf' | 'ecosnap';
  imageUrl?: string;
  aiConfidence?: number;
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  blockNumber?: number;
}): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from('deposits')
      .insert({
        citizen_address: params.citizenAddress.toLowerCase(),
        barangay_id: params.barangayId > 0 ? params.barangayId : null, // 0 = EcoSnap without barangay
        waste_category: params.wasteCategory,
        weight_kg: params.weightKg,
        eco_minted: params.ecoMinted.toString(),
        tx_hash: params.txHash,
        deposit_type: params.depositType,
        image_url: params.imageUrl || null,
        ai_confidence: params.aiConfidence || null,
        verification_status: params.verificationStatus || 'verified',
        block_number: params.blockNumber || null,
        network: 'fuji',
      })
      .select()
      .single();
    
    if (error) {
      console.error('[Supabase] Failed to save deposit:', error);
      return { success: false, error: error.message };
    }
    
    console.log('[Supabase] Deposit saved:', data.id);
    return { success: true, data };
  } catch (error: any) {
    console.error('[Supabase] Error saving deposit:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get deposits for a specific citizen
 */
export async function getCitizenDepositsFromDB(
  citizenAddress: string,
  limit: number = 50
): Promise<WasteDeposit[]> {
  try {
    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from('deposits')
      .select('*')
      .eq('citizen_address', citizenAddress.toLowerCase())
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('[Supabase] Failed to fetch deposits:', error);
      return [];
    }
    
    return data.map((row) => ({
      id: row.id,
      citizen: row.citizen_address,
      barangayId: row.barangay_id || 0,
      barangayName: row.barangay_id ? `Barangay ${row.barangay_id}` : 'EcoSnap',
      wasteCategory: row.waste_category as WasteCategory,
      kg: parseFloat(row.weight_kg),
      ecoMinted: BigInt(row.eco_minted),
      timestamp: new Date(row.created_at).getTime(),
      txHash: row.tx_hash,
    }));
  } catch (error) {
    console.error('[Supabase] Error fetching deposits:', error);
    return [];
  }
}

/**
 * Get recent deposits for the activity feed
 */
export async function getRecentDepositsFromDB(limit: number = 20): Promise<WasteDeposit[]> {
  try {
    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from('deposits')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('[Supabase] Failed to fetch recent deposits:', error);
      return [];
    }
    
    return data.map((row) => ({
      id: row.id,
      citizen: row.citizen_address,
      barangayId: row.barangay_id || 0,
      barangayName: row.barangay_id ? `Barangay ${row.barangay_id}` : 'EcoSnap',
      wasteCategory: row.waste_category as WasteCategory,
      kg: parseFloat(row.weight_kg),
      ecoMinted: BigInt(row.eco_minted),
      timestamp: new Date(row.created_at).getTime(),
      txHash: row.tx_hash,
    }));
  } catch (error) {
    console.error('[Supabase] Error fetching recent deposits:', error);
    return [];
  }
}

// ============================================================================
// LEADERBOARD OPERATIONS
// ============================================================================

/**
 * Get current leaderboard from database
 */
export async function getLeaderboardFromDB(): Promise<BarangayRanking[]> {
  try {
    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from('barangay_stats')
      .select('*')
      .order('rank', { ascending: true });
    
    if (error) {
      console.error('[Supabase] Failed to fetch leaderboard:', error);
      return [];
    }
    
    return data.map((row) => ({
      id: row.id,
      name: row.name,
      totalEco: BigInt(row.total_eco),
      totalKg: parseFloat(row.total_kg),
      rank: row.rank,
    }));
  } catch (error) {
    console.error('[Supabase] Error fetching leaderboard:', error);
    return [];
  }
}

/**
 * Get stats for a specific barangay
 */
export async function getBarangayStatsFromDB(barangayId: number): Promise<{
  totalKg: number;
  totalEco: bigint;
  totalDeposits: number;
  rank: number;
} | null> {
  try {
    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from('barangay_stats')
      .select('*')
      .eq('id', barangayId)
      .single();
    
    if (error || !data) {
      console.error('[Supabase] Failed to fetch barangay stats:', error);
      return null;
    }
    
    return {
      totalKg: parseFloat(data.total_kg),
      totalEco: BigInt(data.total_eco),
      totalDeposits: data.total_deposits,
      rank: data.rank,
    };
  } catch (error) {
    console.error('[Supabase] Error fetching barangay stats:', error);
    return null;
  }
}

// ============================================================================
// CITIZEN STATS
// ============================================================================

/**
 * Get citizen stats from database
 */
export async function getCitizenStatsFromDB(citizenAddress: string): Promise<{
  totalDeposits: number;
  totalKg: number;
  totalEcoEarned: bigint;
  lastDepositAt: Date | null;
} | null> {
  try {
    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from('citizens')
      .select('*')
      .eq('wallet_address', citizenAddress.toLowerCase())
      .single();
    
    if (error) {
      // No rows returned is OK for new users
      if (error.code === 'PGRST116') {
        return {
          totalDeposits: 0,
          totalKg: 0,
          totalEcoEarned: BigInt(0),
          lastDepositAt: null,
        };
      }
      console.error('[Supabase] Failed to fetch citizen stats:', error);
      return null;
    }
    
    return {
      totalDeposits: data.total_deposits,
      totalKg: parseFloat(data.total_kg),
      totalEcoEarned: BigInt(data.total_eco_earned),
      lastDepositAt: data.last_deposit_at ? new Date(data.last_deposit_at) : null,
    };
  } catch (error) {
    console.error('[Supabase] Error fetching citizen stats:', error);
    return null;
  }
}

// ============================================================================
// REAL-TIME SUBSCRIPTIONS
// ============================================================================

// Store active channels for cleanup
const activeChannels: Map<string, RealtimeChannel> = new Map();

/**
 * Subscribe to leaderboard changes
 * Returns unsubscribe function
 */
export function subscribeToLeaderboardChanges(
  callback: (leaderboard: BarangayRanking[]) => void
): () => void {
  if (!isSupabaseConfigured()) {
    console.warn('[Supabase] Not configured, skipping leaderboard subscription');
    return () => {};
  }
  
  try {
    const client = getSupabaseClient();
    
    // Unsubscribe existing channel if any
    if (activeChannels.has('leaderboard')) {
      activeChannels.get('leaderboard')?.unsubscribe();
      activeChannels.delete('leaderboard');
    }
    
    const channel = client
      .channel('leaderboard_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events
          schema: 'public',
          table: 'barangay_stats',
        },
        async () => {
          // Fetch fresh data when changes occur
          const leaderboard = await getLeaderboardFromDB();
          callback(leaderboard);
        }
      )
      .subscribe((status) => {
        console.log('[Supabase] Leaderboard subscription status:', status);
      });
    
    activeChannels.set('leaderboard', channel);
    
    // Return unsubscribe function
    return () => {
      channel.unsubscribe();
      activeChannels.delete('leaderboard');
    };
  } catch (error) {
    console.error('[Supabase] Failed to subscribe to leaderboard:', error);
    return () => {};
  }
}

/**
 * Subscribe to new deposits
 * Returns unsubscribe function
 */
export function subscribeToNewDeposits(
  callback: (deposit: WasteDeposit) => void
): () => void {
  if (!isSupabaseConfigured()) {
    console.warn('[Supabase] Not configured, skipping deposits subscription');
    return () => {};
  }
  
  try {
    const client = getSupabaseClient();
    
    // Unsubscribe existing channel if any
    if (activeChannels.has('deposits')) {
      activeChannels.get('deposits')?.unsubscribe();
      activeChannels.delete('deposits');
    }
    
    const channel = client
      .channel('new_deposits')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'deposits',
        },
        (payload: { new: any }) => {
          const row = payload.new;
          const deposit: WasteDeposit = {
            id: row.id,
            citizen: row.citizen_address,
            barangayId: row.barangay_id || 0,
            barangayName: row.barangay_id ? `Barangay ${row.barangay_id}` : 'EcoSnap',
            wasteCategory: row.waste_category as WasteCategory,
            kg: parseFloat(row.weight_kg),
            ecoMinted: BigInt(row.eco_minted),
            timestamp: new Date(row.created_at).getTime(),
            txHash: row.tx_hash,
          };
          callback(deposit);
        }
      )
      .subscribe((status: string) => {
        console.log('[Supabase] Deposits subscription status:', status);
      });
    
    activeChannels.set('deposits', channel);
    
    return () => {
      channel.unsubscribe();
      activeChannels.delete('deposits');
    };
  } catch (error) {
    console.error('[Supabase] Failed to subscribe to deposits:', error);
    return () => {};
  }
}

/**
 * Unsubscribe from all channels
 */
export function unsubscribeAll(): void {
  activeChannels.forEach((channel, name) => {
    channel.unsubscribe();
    console.log('[Supabase] Unsubscribed from', name);
  });
  activeChannels.clear();
}

// ============================================================================
// UTILITY
// ============================================================================

/**
 * Check database connection
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }
  
  try {
    const client = getSupabaseClient();
    const { data, error } = await client.from('barangay_stats').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('[Supabase] Connection check failed:', error);
      return false;
    }
    
    console.log('[Supabase] Connection successful');
    return true;
  } catch (error) {
    console.error('[Supabase] Connection check error:', error);
    return false;
  }
}
