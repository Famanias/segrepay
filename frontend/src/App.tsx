/**
 * Main App Component
 * Routes between different views based on active tab
 */

import React from 'react';
import { Layout } from '@/components/Layout';
import { VerifierPanel } from '@/pages/VerifierPanel';
import { CitizenDashboard } from '@/pages/CitizenDashboard';
import { Leaderboard } from '@/pages/Leaderboard';
import { useAppStore } from '@/stores/appStore';

function App() {
  const activeTab = useAppStore((state) => state.activeTab);

  return (
    <Layout>
      {activeTab === 'verifier' && <VerifierPanel />}
      {activeTab === 'citizen' && <CitizenDashboard />}
      {activeTab === 'leaderboard' && <Leaderboard />}
    </Layout>
  );
}

export default App;
