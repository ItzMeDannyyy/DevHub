import React from 'react';
import {
  FolderGit2,
  Search,
  Plus,
  Settings as SettingsIcon,
  Filter,
} from 'lucide-react';
import { ProjectCategory } from '../types';

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: ProjectCategory;
  onSelectCategory: (cat: ProjectCategory) => void;
  onOpenAddModal: () => void;
  onOpenSettings: () => void;
  projectCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  onOpenAddModal,
  onOpenSettings,
  projectCount,
}) => {
  const categories: { key: ProjectCategory; label: string }[] = [
    { key: 'all', label: 'All Projects' },
    { key: 'work', label: 'Work' },
    { key: 'client', label: 'Client' },
    { key: 'personal', label: 'Personal' },
    { key: 'open-source', label: 'Open Source' },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md px-6 py-3.5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Brand & Search */}
        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <FolderGit2 size={20} strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-100 tracking-tight">DevHub</span>
                <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/50">
                  v0.1.0
                </span>
              </div>
              <p className="text-xs text-slate-400">Developer Command Center</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 max-w-md ml-2">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search projects by name, branch, or tag... (Ctrl + K)"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium shadow-sm shadow-indigo-950 transition-colors cursor-pointer"
          >
            <Plus size={16} strokeWidth={2.4} />
            <span>Add Project</span>
          </button>

          <button
            onClick={onOpenSettings}
            title="Settings"
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
          >
            <SettingsIcon size={18} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Categories Filter Strip */}
      <div className="flex items-center gap-2 pt-3 mt-1 overflow-x-auto">
        <div className="inline-flex items-center gap-1.5 text-xs text-slate-500 mr-1">
          <Filter size={13} />
          <span>Filter:</span>
        </div>
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => onSelectCategory(cat.key)}
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                  : 'bg-slate-900 text-slate-400 border border-slate-800/80 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span>{cat.label}</span>
              {cat.key === 'all' && (
                <span className="ml-1.5 text-[11px] opacity-75">({projectCount})</span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};
