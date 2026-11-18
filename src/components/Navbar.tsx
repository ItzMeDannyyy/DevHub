import React, { useState, useRef, useEffect } from 'react';
import {
  FolderGit2,
  Search,
  Plus,
  Settings as SettingsIcon,
  Command,
  Sun,
  Moon,
  Monitor,
  AlertTriangle,
} from 'lucide-react';
import { ThemeMode } from '../types';
import { ThemeToggle } from './ThemeToggle';

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenAddModal: () => void;
  onOpenSettings: () => void;
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  hasRepoDraft?: boolean;
  onResumeDraft?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  onSearchChange,
  onOpenAddModal,
  onOpenSettings,
  theme,
  onThemeChange,
  hasRepoDraft = false,
  onResumeDraft,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [forceCollapsed, setForceCollapsed] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setForceCollapsed(false);
        setIsSearchFocused(true);
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 60);
      }

      // Escape key to dismiss search and collapse header
      if (e.key === 'Escape') {
        if (isSearchFocused || isHovered) {
          e.preventDefault();
          searchInputRef.current?.blur();
          setIsSearchFocused(false);
          setForceCollapsed(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchFocused, isHovered]);

  const isExpanded =
    !forceCollapsed &&
    (isHovered || isSearchFocused || searchQuery.trim().length > 0);

  const handleCycleTheme = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (theme === 'light') onThemeChange('dark');
    else if (theme === 'dark') onThemeChange('system');
    else onThemeChange('light');
  };

  const getThemeIcon = () => {
    if (theme === 'light') return <Sun size={15} className="text-amber-500" />;
    if (theme === 'dark') return <Moon size={15} className="text-indigo-400" />;
    return <Monitor size={15} className="text-sky-400" />;
  };

  return (
    <div
      onMouseEnter={() => {
        setForceCollapsed(false);
        setIsHovered(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        setForceCollapsed(false);
      }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center pt-1 pb-3 px-4 transition-all"
    >
      {/* Floating Oval Island (Enlarged with Luxuriously Smooth Easing) */}
      <nav
        className={`relative flex items-center justify-between rounded-full border border-[var(--border-color)] bg-[var(--bg-card)]/95 backdrop-blur-2xl shadow-2xl transition-all duration-550 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isExpanded
            ? 'w-[94vw] max-w-4xl px-7 py-3.5 shadow-2xl'
            : hasRepoDraft
            ? 'w-auto min-w-[340px] px-4.5 py-2.5 cursor-pointer hover:border-[var(--border-hover)] hover:shadow-xl'
            : 'w-72 px-4.5 py-2.5 cursor-pointer hover:border-[var(--border-hover)] hover:shadow-xl'
        }`}
      >
        {/* Left Side: Brand Identity */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--logo-bg)] text-[var(--logo-text)] shadow-xs transition-colors">
            <FolderGit2 size={16} strokeWidth={2.4} />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-tight text-[var(--text-primary)]">
              DevHub
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
        </div>

        {/* Collapsed State: Persistent Action Icons */}
        {!isExpanded && (
          <div className="flex items-center gap-1.5 pl-3 border-l border-[var(--border-color)]">
            {hasRepoDraft && onResumeDraft && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onResumeDraft();
                }}
                title="Unsaved Repository Draft — Click to resume"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 text-amber-500 dark:text-amber-400 transition-all text-xs font-mono font-medium animate-pulse cursor-pointer shadow-xs"
              >
                <AlertTriangle size={13} className="shrink-0 text-amber-500 dark:text-amber-400" />
                <span>Resume Draft</span>
              </button>
            )}

            <button
              onClick={handleCycleTheme}
              title={`Theme: ${theme.toUpperCase()} (Click to toggle)`}
              className="p-1.5 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
            >
              {getThemeIcon()}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenAddModal();
              }}
              title="Add Repository"
              className="p-1.5 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
            >
              <Plus size={15} strokeWidth={2.4} />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenSettings();
              }}
              title="Preferences & Settings"
              className="p-1.5 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
            >
              <SettingsIcon size={15} />
            </button>
          </div>
        )}

        {/* Center: Search Bar (Revealed on Fluid Expansion) */}
        <div
          className={`transition-all duration-450 ease-out flex-1 max-w-md mx-6 overflow-hidden ${
            isExpanded
              ? 'opacity-100 scale-x-100 pointer-events-auto delay-75'
              : 'opacity-0 scale-x-0 w-0 max-w-0 mx-0 pointer-events-none'
          }`}
        >
          <div className="relative w-full">
            <Search
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none"
            />
            <input
              id="main-search-input"
              ref={searchInputRef}
              type="text"
              placeholder="Search repositories... (Esc to dismiss)"
              value={searchQuery}
              onFocus={() => {
                setForceCollapsed(false);
                setIsSearchFocused(true);
              }}
              onBlur={() => setIsSearchFocused(false)}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.stopPropagation();
                  searchInputRef.current?.blur();
                  setIsSearchFocused(false);
                  setForceCollapsed(true);
                }
              }}
              className="monochrome-input w-full pl-9 pr-14 py-2 rounded-full text-xs font-mono placeholder-[var(--text-tertiary)]"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-subtle)] border border-[var(--border-color)] text-[var(--text-tertiary)] inline-flex items-center">
                <Command size={9} className="mr-0.5" /> K
              </kbd>
            </div>
          </div>
        </div>

        {/* Right Side: Theme Switcher & Actions (Revealed on Fluid Expansion) */}
        <div
          className={`flex items-center gap-3 shrink-0 transition-all duration-450 ease-out ${
            isExpanded
              ? 'opacity-100 scale-100 pointer-events-auto delay-75'
              : 'opacity-0 scale-95 w-0 overflow-hidden pointer-events-none'
          }`}
        >
          <ThemeToggle theme={theme} onThemeChange={onThemeChange} />

          {hasRepoDraft && onResumeDraft && (
            <button
              onClick={onResumeDraft}
              title="Unsaved Repository Draft — Click to continue adding repository"
              className="monochrome-btn inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-amber-500/50 bg-amber-500/15 hover:bg-amber-500/25 text-amber-500 dark:text-amber-300 text-xs font-mono font-medium transition-all shadow-xs cursor-pointer animate-pulse whitespace-nowrap"
            >
              <AlertTriangle size={13} className="shrink-0 text-amber-500 dark:text-amber-400" />
              <span>Resume Draft</span>
            </button>
          )}

          <button
            onClick={onOpenAddModal}
            className="monochrome-btn inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--accent-btn-bg)] text-[var(--accent-btn-text)] text-xs font-mono font-medium hover:opacity-90 cursor-pointer shadow-xs whitespace-nowrap"
          >
            <Plus size={14} strokeWidth={2.4} />
            <span>Add Repo</span>
          </button>

          <button
            onClick={onOpenSettings}
            title="Settings"
            className="monochrome-btn inline-flex items-center justify-center w-8.5 h-8.5 rounded-full border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] transition-colors cursor-pointer shrink-0"
          >
            <SettingsIcon size={15} />
          </button>
        </div>
      </nav>
    </div>
  );
};
