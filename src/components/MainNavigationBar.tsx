import React from 'react';
import { FolderGit2, Wrench, Info } from 'lucide-react';
import { NavigationTab } from '../types';

interface MainNavigationBarProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  projectCount?: number;
}

export const MainNavigationBar: React.FC<MainNavigationBarProps> = ({
  activeTab,
  onSelectTab,
  projectCount = 0,
}) => {
  const tabs: { id: NavigationTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'home',
      label: 'Repositories',
      icon: <FolderGit2 size={15} />,
      badge: projectCount > 0 ? `${projectCount}` : undefined,
    },
    {
      id: 'tools',
      label: 'Developer Tools and Resources',
      icon: <Wrench size={15} />,
    },
    {
      id: 'about',
      label: 'About',
      icon: <Info size={15} />,
    },
  ];

  return (
    <div className="w-full border-b border-[var(--border-color)] mb-8">
      <nav className="flex items-center gap-2 sm:gap-6 overflow-x-auto -mb-px no-scrollbar">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`group flex items-center gap-2 py-3 px-1.5 sm:px-2 border-b-2 text-xs sm:text-sm font-mono tracking-tight transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'border-[var(--text-primary)] text-[var(--text-primary)] font-semibold'
                  : 'border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] font-medium'
              }`}
            >
              <span
                className={`transition-colors ${
                  isActive
                    ? 'text-[var(--text-primary)]'
                    : 'text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)]'
                }`}
              >
                {tab.icon}
              </span>
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono transition-colors ${
                    isActive
                      ? 'bg-[var(--active-pill-bg)] text-[var(--active-pill-text)]'
                      : 'bg-[var(--bg-subtle)] text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)] border border-[var(--border-color)]'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
