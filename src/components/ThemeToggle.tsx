import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { ThemeMode } from '../types';

interface ThemeToggleProps {
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  theme,
  onThemeChange,
}) => {
  const modes: {
    mode: ThemeMode;
    label: string;
    icon: (isActive: boolean) => React.ReactNode;
  }[] = [
    {
      mode: 'light',
      label: 'Light',
      icon: (active) => (
        <Sun
          size={13}
          className={active ? 'text-amber-500' : 'text-inherit'}
        />
      ),
    },
    {
      mode: 'dark',
      label: 'Dark',
      icon: (active) => (
        <Moon
          size={13}
          className={active ? 'text-indigo-400' : 'text-inherit'}
        />
      ),
    },
    {
      mode: 'system',
      label: 'System',
      icon: (active) => (
        <Monitor
          size={13}
          className={active ? 'text-sky-400' : 'text-inherit'}
        />
      ),
    },
  ];

  return (
    <div className="inline-flex items-center rounded-lg border border-[var(--border-color)] bg-[var(--bg-canvas)] p-1 gap-0.5 shadow-2xs">
      {modes.map((item) => {
        const isActive = theme === item.mode;
        return (
          <button
            key={item.mode}
            onClick={() => onThemeChange(item.mode)}
            title={`Switch to ${item.label} mode`}
            className={`monochrome-btn inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-medium transition-all cursor-pointer ${
              isActive
                ? 'bg-white text-zinc-900 border border-zinc-200/90 shadow-xs font-semibold dark:bg-[#30363d] dark:text-[#f0f6fc] dark:border-[#6e7681]/50 dark:shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] border border-transparent'
            }`}
          >
            {item.icon(isActive)}
            <span className="hidden sm:inline">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};
