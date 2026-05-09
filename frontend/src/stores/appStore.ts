/**
 * Application State Management with Zustand
 * Handles UI state, notifications, and app-wide settings
 */

import { create } from 'zustand';
import type { Notification, WasteDeposit, BarangayRanking } from '@/types';
import { 
  isSupabaseConfigured, 
  subscribeToLeaderboardChanges, 
  subscribeToNewDeposits,
  getLeaderboardFromDB,
  getRecentDepositsFromDB 
} from '@/services/supabase';

interface AppStore {
  // UI State
  activeTab: 'verifier' | 'citizen' | 'ecosnap' | 'leaderboard';
  isQrModalOpen: boolean;
  selectedHouseholdId: string | null;
  
  // Data State
  recentDeposits: WasteDeposit[];
  leaderboard: BarangayRanking[];
  
  // Notifications
  notifications: Notification[];
  
  // Actions
  setActiveTab: (tab: 'verifier' | 'citizen' | 'ecosnap' | 'leaderboard') => void;
  openQrModal: (householdId: string) => void;
  closeQrModal: () => void;
  
  // Supabase Actions
  initRealtimeSync: () => void;
  unsubscribeRealtime: () => void;
  loadInitialData: () => Promise<void>;
  
  // Data Actions
  setRecentDeposits: (deposits: WasteDeposit[]) => void;
  addDeposit: (deposit: WasteDeposit) => void;
  setLeaderboard: (leaderboard: BarangayRanking[]) => void;
  updateLeaderboardRanking: (barangayId: number, newTotal: bigint) => void;
  
  // Notification Actions
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  // Success/Error helpers
  showSuccess: (title: string, message: string) => void;
  showError: (title: string, message: string) => void;
  showWarning: (title: string, message: string) => void;
  showInfo: (title: string, message: string) => void;
}

// Generate unique ID for notifications
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export const useAppStore = create<AppStore>((set, get) => ({
  // Initial state
  activeTab: 'citizen',
  isQrModalOpen: false,
  selectedHouseholdId: null,
  recentDeposits: [],
  leaderboard: [],
  notifications: [],

  // Tab Navigation
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Supabase Real-time Sync
  initRealtimeSync: () => {
    if (!isSupabaseConfigured()) {
      console.log('[AppStore] Supabase not configured, skipping realtime sync');
      return;
    }

    // Subscribe to leaderboard changes
    const unsubscribeLeaderboard = subscribeToLeaderboardChanges((leaderboard) => {
      set({ leaderboard });
    });

    // Subscribe to new deposits
    const unsubscribeDeposits = subscribeToNewDeposits((deposit) => {
      const { recentDeposits } = get();
      // Add new deposit to top of list, keep max 50
      set({ 
        recentDeposits: [deposit, ...recentDeposits].slice(0, 50) 
      });
    });

    // Store unsubscribe functions for cleanup
    set({ 
      _unsubscribeLeaderboard: unsubscribeLeaderboard,
      _unsubscribeDeposits: unsubscribeDeposits 
    } as any);
  },

  unsubscribeRealtime: () => {
    const state = get();
    (state as any)._unsubscribeLeaderboard?.();
    (state as any)._unsubscribeDeposits?.();
  },

  loadInitialData: async () => {
    if (!isSupabaseConfigured()) {
      return;
    }

    try {
      // Load leaderboard
      const leaderboard = await getLeaderboardFromDB();
      set({ leaderboard });

      // Load recent deposits
      const recentDeposits = await getRecentDepositsFromDB(20);
      set({ recentDeposits });

      console.log('[AppStore] Initial data loaded from Supabase');
    } catch (error) {
      console.error('[AppStore] Failed to load initial data:', error);
    }
  },

  // QR Modal
  openQrModal: (householdId) => set({ 
    isQrModalOpen: true, 
    selectedHouseholdId: householdId 
  }),
  closeQrModal: () => set({ 
    isQrModalOpen: false, 
    selectedHouseholdId: null 
  }),

  // Data Actions
  setRecentDeposits: (deposits) => set({ recentDeposits: deposits }),
  
  addDeposit: (deposit) => {
    const { recentDeposits } = get();
    set({ 
      recentDeposits: [deposit, ...recentDeposits].slice(0, 50) // Keep last 50
    });
  },
  
  setLeaderboard: (leaderboard) => {
    // Sort and assign ranks
    const sorted = [...leaderboard].sort((a, b) => 
      b.totalEco > a.totalEco ? 1 : -1
    );
    sorted.forEach((item, index) => {
      item.rank = index + 1;
    });
    set({ leaderboard: sorted });
  },
  
  updateLeaderboardRanking: (barangayId, newTotal) => {
    const { leaderboard } = get();
    const updated = leaderboard.map((item) => {
      if (item.id === barangayId) {
        return { ...item, totalEco: newTotal };
      }
      return item;
    });
    
    // Re-sort and re-rank
    const sorted = updated.sort((a, b) => 
      b.totalEco > a.totalEco ? 1 : -1
    );
    sorted.forEach((item, index) => {
      item.rank = index + 1;
    });
    
    set({ leaderboard: sorted });
  },

  // Notification Actions
  addNotification: (notification) => {
    const id = generateId();
    const duration = notification.duration || 5000;
    
    set((state) => ({
      notifications: [...state.notifications, { ...notification, id }],
    }));

    // Auto-remove after duration
    setTimeout(() => {
      get().removeNotification(id);
    }, duration);
  },
  
  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },
  
  clearNotifications: () => set({ notifications: [] }),

  // Convenience helpers
  showSuccess: (title, message) => {
    get().addNotification({
      type: 'success',
      title,
      message,
      duration: 5000,
    });
  },
  
  showError: (title, message) => {
    get().addNotification({
      type: 'error',
      title,
      message,
      duration: 8000,
    });
  },
  
  showWarning: (title, message) => {
    get().addNotification({
      type: 'warning',
      title,
      message,
      duration: 6000,
    });
  },
  
  showInfo: (title, message) => {
    get().addNotification({
      type: 'info',
      title,
      message,
      duration: 4000,
    });
  },
}));
