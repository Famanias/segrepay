/**
 * Main App Component
 * Routes between different views based on active tab
 */

import React, { useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { VerifierPanel } from '@/pages/VerifierPanel';
import { CitizenDashboard } from '@/pages/CitizenDashboard';
import { Leaderboard } from '@/pages/Leaderboard';
import { EcoSnap } from '@/pages/EcoSnap';
import { useAppStore } from '@/stores/appStore';
import { isSupabaseConfigured, checkSupabaseConnection } from '@/services/supabase';

function App() {
  const activeTab = useAppStore((state) => state.activeTab);
  const initRealtimeSync = useAppStore((state) => state.initRealtimeSync);
  const loadInitialData = useAppStore((state) => state.loadInitialData);
  const unsubscribeRealtime = useAppStore((state) => state.unsubscribeRealtime);

  // Initialize Supabase real-time sync on app load
  useEffect(() => {
    const init = async () => {
      if (isSupabaseConfigured()) {
        const connected = await checkSupabaseConnection();
        if (connected) {
          await loadInitialData();
          initRealtimeSync();
          console.log('[App] Supabase real-time sync initialized');
        }
      }
    };

    init();

    // Cleanup subscriptions on unmount
    return () => {
      unsubscribeRealtime();
    };
  }, [initRealtimeSync, loadInitialData, unsubscribeRealtime]);

  return (
    <Layout>
      {activeTab === 'verifier' && <VerifierPanel />}
      {activeTab === 'citizen' && <CitizenDashboard />}
      {activeTab === 'ecosnap' && <EcoSnap />}
      {activeTab === 'leaderboard' && <Leaderboard />}
    </Layout>
  );
}

export default App;
