/**
 * Tab Navigation Component
 * Allows switching between Verifier, Citizen, and Leaderboard views
 */

import React from 'react';

interface Tab {
  id: 'verifier' | 'citizen' | 'leaderboard';
  label: string;
  icon: string;
}

interface TabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tab: 'verifier' | 'citizen' | 'leaderboard') => void;
}

export function TabNavigation({ tabs, activeTab, onTabChange }: TabNavigationProps) {
  return (
    <nav className="flex gap-1 overflow-x-auto py-2">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
              transition-all duration-200 whitespace-nowrap
              ${isActive 
                ? 'bg-white text-segre-green shadow-sm' 
                : 'text-white/70 hover:text-white hover:bg-white/10'
              }
            `}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {isActive && (
              <span className="hidden sm:inline-flex w-1.5 h-1.5 bg-segre-green rounded-full ml-1" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
