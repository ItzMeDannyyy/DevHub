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
  const modes: { mode: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { mode: 'light', label: 'Light', icon: <Sun size={13} /> },
    { mode: 'dark', label: 'Dark', icon: <Moon size={13} /> },
    { mode: 'system', label: 'System', icon: <Monitor size={13} /> },
  ];

  return (
    <div className="inline-flex items-center rounded-md border border-[var(--border-color)] bg-[var(--bg-subtle)] p-0.5">
      {modes.map((item) => {
        const isActive = theme === item.mode;
        return (
          <button
            key={item.mode}
            onClick={() => onThemeChange(item.mode)}
            title={`Switch to ${item.label} mode`}
            className={`monochrome-btn inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono transition-all cursor-pointer ${
              isActive
                ? 'bg-[var(--active-pill-bg)] text-[var(--active-pill-text)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {item.icon}
            <span className="hidden sm:inline">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};
