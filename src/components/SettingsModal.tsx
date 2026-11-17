import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Palette,
  Terminal,
  HardDrive,
  Power,
  Minimize2,
  Code2,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Sun,
  Moon,
  Monitor,
  Check,
} from 'lucide-react';
import { UserSettings, Project } from '../types';
import { CustomSelect, SelectOption } from './CustomSelect';
import { VsCodeIcon } from './VsCodeIcon';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  projects: Project[];
  onResetData: () => void;
  onImportProjects?: (imported: Project[]) => void;
}

type SettingsSection = 'identity' | 'appearance' | 'environment' | 'data';

const ideOptions: SelectOption<UserSettings['preferredIde']>[] = [
  {
    value: 'vscode',
    label: 'Visual Studio Code',
    chip: 'code',
    icon: <VsCodeIcon size={14} />,
    description: 'Standard VS Code binary command',
  },
  {
    value: 'cursor',
    label: 'Cursor AI Editor',
    chip: 'cursor',
    icon: <Sparkles size={14} />,
    description: 'AI-first code editor fork',
  },
  {
    value: 'zed',
    label: 'Zed Editor',
    chip: 'zed',
    icon: <Terminal size={14} />,
    description: 'High-performance Rust editor',
  },
  {
    value: 'sublime',
    label: 'Sublime Text',
    chip: 'subl',
    icon: <Code2 size={14} />,
    description: 'Lightweight desktop editor',
  },
];

const terminalOptions: SelectOption<UserSettings['defaultTerminal']>[] = [
  {
    value: 'powershell',
    label: 'Windows PowerShell',
    chip: 'powershell.exe',
    icon: <Terminal size={14} />,
    description: 'Default modern shell on Windows',
  },
  {
    value: 'terminal',
    label: 'Windows Terminal',
    chip: 'wt.exe',
    icon: <Monitor size={14} />,
    description: 'Tabbed modern Windows Terminal',
  },
  {
    value: 'cmd',
    label: 'Command Prompt',
    chip: 'cmd.exe',
    icon: <Terminal size={14} />,
    description: 'Classic Windows command line',
  },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  projects,
  onResetData,
  onImportProjects,
}) => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('identity');
  const [isRendered, setIsRendered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Smooth floating modal fade & scale animation
  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      const timer = setTimeout(() => setIsVisible(true), 15);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setIsRendered(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Escape key listener to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isRendered) return null;

  const handleExportJson = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(projects, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'devhub-projects.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (
          Array.isArray(parsed) &&
          parsed.length > 0 &&
          parsed[0].name &&
          parsed[0].path
        ) {
          if (confirm(`Import ${parsed.length} repositories from "${file.name}"? This will merge with your current repositories.`)) {
            if (onImportProjects) {
              onImportProjects(parsed);
              onClose();
            }
          }
        } else {
          alert('Invalid backup file: Expected a JSON array of repositories.');
        }
      } catch (err) {
        alert(`Failed to parse backup JSON: ${err}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const navItems: { id: SettingsSection; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'identity',
      label: 'Identity & Profile',
      icon: <User size={15} />,
      desc: 'Developer name and greeting animation',
    },
    {
      id: 'appearance',
      label: 'Appearance & Theme',
      icon: <Palette size={15} />,
      desc: 'Monochrome color modes and window behavior',
    },
    {
      id: 'environment',
      label: 'Environment & Tooling',
      icon: <Terminal size={15} />,
      desc: 'Default IDE command and terminal shell',
    },
    {
      id: 'data',
      label: 'Data Management',
      icon: <HardDrive size={15} />,
      desc: 'JSON snapshots and factory demo restore',
    },
  ];

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-xs transition-opacity duration-200 ease-out ${
        isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      onClick={onClose}
    >
      {/* Floating Centered Modal (Fixed Viewport Proportions, Adapts to Window Size) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-[92vw] max-w-4xl h-[84vh] min-h-[520px] rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-2xl flex flex-col overflow-hidden transform transition-all duration-250 ease-out ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-4 border-b border-[var(--border-color)] bg-[var(--bg-subtle)] shrink-0">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-[var(--text-primary)]">
              DevHub Preferences
            </h2>
            <p className="text-xs font-mono text-[var(--text-tertiary)] mt-0.5">
              Configure your developer workspace and preferences
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-canvas)] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* 2-Section Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Section 1: Left Navigation Sidebar */}
          <aside className="w-60 border-r border-[var(--border-color)] bg-[var(--bg-subtle)]/40 p-4 space-y-1.5 shrink-0 overflow-y-auto">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] px-2 mb-2 block font-semibold">
              Sections
            </span>
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`monochrome-btn w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[var(--active-pill-bg)] text-[var(--active-pill-text)] shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={isActive ? 'text-[var(--active-pill-text)]' : 'text-[var(--text-tertiary)]'}>
                      {item.icon}
                    </span>
                    <span className="text-xs font-medium font-mono">
                      {item.label}
                    </span>
                  </div>
                  {isActive && <ChevronRight size={13} />}
                </button>
              );
            })}
          </aside>

          {/* Section 2: Right Content Pane */}
          <main className="flex-1 p-6 overflow-y-auto space-y-5">
            {/* CATEGORY 1: Identity & Profile */}
            {activeSection === 'identity' && (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">
                    Identity & Profile
                  </h3>
                  <p className="text-xs font-mono text-[var(--text-tertiary)] mt-0.5">
                    Personalize your identity and standup greeting banner.
                  </p>
                </div>

                {/* Developer Name Field */}
                <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-subtle)] space-y-2">
                  <label className="block text-xs font-medium font-mono uppercase text-[var(--text-secondary)]">
                    Developer Name
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      maxLength={20}
                      placeholder="Developer"
                      value={settings.developerName ?? ''}
                      onChange={(e) =>
                        onUpdateSettings({
                          ...settings,
                          developerName: e.target.value,
                        })
                      }
                      onBlur={() => {
                        if (!settings.developerName || !settings.developerName.trim()) {
                          onUpdateSettings({
                            ...settings,
                            developerName: 'Developer',
                          });
                        }
                      }}
                      className="monochrome-input w-full px-3.5 py-2 rounded-md text-xs font-mono"
                    />
                    <span className="text-[11px] font-mono text-[var(--text-tertiary)] shrink-0">
                      {(settings.developerName ?? '').length}/20
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-[var(--text-tertiary)]">
                    Displayed on your daily morning briefing. Defaults to "Developer".
                  </p>
                </div>

                {/* Greeting Animation Toggle */}
                <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-subtle)] flex items-center justify-between">
                  <div className="space-y-1 pr-4">
                    <div className="text-xs font-medium text-[var(--text-primary)] inline-flex items-center gap-1.5 font-mono">
                      <Sparkles size={14} />
                      <span>Animated Greeting Loop</span>
                    </div>
                    <p className="text-[11px] font-mono text-[var(--text-tertiary)]">
                      Pops out characters one-by-one every 0.3s and continuously loops.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={settings.animateGreetingName ?? true}
                      onChange={(e) =>
                        onUpdateSettings({
                          ...settings,
                          animateGreetingName: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-[var(--bg-canvas)] border border-[var(--border-color)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-[var(--text-primary)] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[var(--text-primary)] after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--accent-btn-bg)]"></div>
                  </label>
                </div>

                {/* Autostart on Boot */}
                <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-subtle)] flex items-center justify-between">
                  <div className="space-y-1 pr-4">
                    <div className="text-xs font-medium text-[var(--text-primary)] inline-flex items-center gap-1.5 font-mono">
                      <Power size={14} />
                      <span>Launch on System Login</span>
                    </div>
                    <p className="text-[11px] font-mono text-[var(--text-tertiary)]">
                      Automatically start DevHub when your computer powers on.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={settings.autostartOnLogin}
                      onChange={(e) =>
                        onUpdateSettings({
                          ...settings,
                          autostartOnLogin: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-[var(--bg-canvas)] border border-[var(--border-color)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-[var(--text-primary)] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[var(--text-primary)] after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--accent-btn-bg)]"></div>
                  </label>
                </div>
              </div>
            )}

            {/* CATEGORY 2: Appearance & Theme */}
            {activeSection === 'appearance' && (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">
                    Appearance & Theme
                  </h3>
                  <p className="text-xs font-mono text-[var(--text-tertiary)] mt-0.5">
                    Configure color schemes and window display behavior.
                  </p>
                </div>

                {/* Theme Mode Selector Cards */}
                <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-subtle)] space-y-3">
                  <label className="block text-xs font-medium font-mono uppercase text-[var(--text-secondary)]">
                    Color Mode
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(
                      [
                        {
                          mode: 'dark',
                          label: 'Dark Mode',
                          icon: (sel: boolean) => (
                            <Moon
                              size={16}
                              className={
                                sel ? 'text-indigo-400' : 'text-[var(--text-secondary)]'
                              }
                            />
                          ),
                          desc: 'Pitch Black',
                        },
                        {
                          mode: 'light',
                          label: 'Light Mode',
                          icon: (sel: boolean) => (
                            <Sun
                              size={16}
                              className={
                                sel ? 'text-amber-500' : 'text-[var(--text-secondary)]'
                              }
                            />
                          ),
                          desc: 'Paper White',
                        },
                        {
                          mode: 'system',
                          label: 'System Mode',
                          icon: (sel: boolean) => (
                            <Monitor
                              size={16}
                              className={
                                sel ? 'text-sky-400' : 'text-[var(--text-secondary)]'
                              }
                            />
                          ),
                          desc: 'Follows OS',
                        },
                      ] as const
                    ).map((item) => {
                      const isSelected = settings.theme === item.mode;
                      return (
                        <button
                          key={item.mode}
                          onClick={() => onUpdateSettings({ ...settings, theme: item.mode })}
                          className={`monochrome-btn p-3 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer ${
                            isSelected
                              ? 'border-sky-500 bg-sky-500/10 dark:border-sky-400 dark:bg-sky-500/15 shadow-xs'
                              : 'border-[var(--border-color)] bg-[var(--bg-canvas)] opacity-70 hover:opacity-100 hover:border-[var(--border-hover)]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span>{item.icon(isSelected)}</span>
                            {isSelected && (
                              <Check size={14} className="text-sky-500 dark:text-sky-400" />
                            )}
                          </div>
                          <div>
                            <div
                              className={`text-xs font-medium font-mono ${
                                isSelected
                                  ? 'text-sky-600 dark:text-sky-300 font-semibold'
                                  : 'text-[var(--text-primary)]'
                              }`}
                            >
                              {item.label}
                            </div>
                            <div className="text-[10px] font-mono text-[var(--text-tertiary)] mt-0.5">
                              {item.desc}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Minimize to Tray */}
                <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-subtle)] flex items-center justify-between">
                  <div className="space-y-1 pr-4">
                    <div className="text-xs font-medium text-[var(--text-primary)] inline-flex items-center gap-1.5 font-mono">
                      <Minimize2 size={14} />
                      <span>Minimize to Tray on Close</span>
                    </div>
                    <p className="text-[11px] font-mono text-[var(--text-tertiary)]">
                      Silently docks to the Windows system tray instead of closing completely.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={settings.minimizeToTray}
                      onChange={(e) =>
                        onUpdateSettings({
                          ...settings,
                          minimizeToTray: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-[var(--bg-canvas)] border border-[var(--border-color)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-[var(--text-primary)] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[var(--text-primary)] after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--accent-btn-bg)]"></div>
                  </label>
                </div>
              </div>
            )}

            {/* CATEGORY 3: Environment & Tooling */}
            {activeSection === 'environment' && (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">
                    Environment & Tooling
                  </h3>
                  <p className="text-xs font-mono text-[var(--text-tertiary)] mt-0.5">
                    Configure your primary code editor and shell launcher commands.
                  </p>
                </div>

                {/* Preferred IDE */}
                <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-subtle)] space-y-2">
                  <label className="block text-xs font-medium font-mono uppercase text-[var(--text-secondary)] inline-flex items-center gap-1.5">
                    <Code2 size={14} />
                    <span>Primary IDE Execution Command</span>
                  </label>
                  <CustomSelect
                    value={settings.preferredIde}
                    onChange={(val) =>
                      onUpdateSettings({
                        ...settings,
                        preferredIde: val,
                      })
                    }
                    options={ideOptions}
                  />
                  <p className="text-[11px] font-mono text-[var(--text-tertiary)]">
                    The editor binary invoked by the "Launch VS Code" action button.
                  </p>
                </div>

                {/* Default Terminal */}
                <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-subtle)] space-y-2">
                  <label className="block text-xs font-medium font-mono uppercase text-[var(--text-secondary)] inline-flex items-center gap-1.5">
                    <Terminal size={14} />
                    <span>Spawn Shell / Terminal</span>
                  </label>
                  <CustomSelect
                    value={settings.defaultTerminal}
                    onChange={(val) =>
                      onUpdateSettings({
                        ...settings,
                        defaultTerminal: val,
                      })
                    }
                    options={terminalOptions}
                  />
                  <p className="text-[11px] font-mono text-[var(--text-tertiary)]">
                    The shell window spawned when clicking "Open Terminal".
                  </p>
                </div>
              </div>
            )}

            {/* CATEGORY 4: Data Management */}
            {activeSection === 'data' && (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">
                    Data Management
                  </h3>
                  <p className="text-xs font-mono text-[var(--text-tertiary)] mt-0.5">
                    Export backups or restore default demo repositories.
                  </p>
                </div>

                {/* JSON Backup Export */}
                <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-subtle)] flex items-center justify-between">
                  <div className="space-y-1 pr-4">
                    <div className="text-xs font-medium text-[var(--text-primary)] font-mono">
                      Export Repositories Snapshot
                    </div>
                    <p className="text-[11px] font-mono text-[var(--text-tertiary)]">
                      Download a structured JSON file containing all tracked paths and notes.
                    </p>
                  </div>
                  <button
                    onClick={handleExportJson}
                    className="monochrome-btn inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-[var(--accent-btn-bg)] text-[var(--accent-btn-text)] text-xs font-mono font-medium hover:opacity-90 cursor-pointer shadow-xs shrink-0"
                  >
                    <Download size={13} />
                    <span>Export JSON</span>
                  </button>
                </div>

                {/* JSON Backup Import */}
                <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-subtle)] flex items-center justify-between">
                  <div className="space-y-1 pr-4">
                    <div className="text-xs font-medium text-[var(--text-primary)] font-mono">
                      Import Repositories Snapshot
                    </div>
                    <p className="text-[11px] font-mono text-[var(--text-tertiary)]">
                      Restore or merge repositories from a previously exported JSON backup.
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={handleImportFile}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="monochrome-btn inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-[var(--border-color)] bg-[var(--bg-canvas)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-mono font-medium cursor-pointer shadow-xs shrink-0"
                  >
                    <Upload size={13} />
                    <span>Import JSON</span>
                  </button>
                </div>

                {/* Factory Reset */}
                <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 flex items-center justify-between">
                  <div className="space-y-1 pr-4">
                    <div className="text-xs font-medium text-rose-500 font-mono">
                      Restore Factory Demo Data
                    </div>
                    <p className="text-[11px] font-mono text-[var(--text-tertiary)]">
                      Replaces current repositories with initial sample projects and default configuration.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('Restore initial sample repositories and default settings?')) {
                        onResetData();
                        onClose();
                      }
                    }}
                    className="monochrome-btn inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 text-xs font-mono font-medium cursor-pointer shrink-0"
                  >
                    <RotateCcw size={13} />
                    <span>Reset Data</span>
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>

        {/* Footer */}
        <div className="px-7 py-3.5 border-t border-[var(--border-color)] bg-[var(--bg-subtle)] flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="monochrome-btn px-5 py-2 rounded-md bg-[var(--accent-btn-bg)] text-[var(--accent-btn-text)] text-xs font-mono font-medium hover:opacity-90 cursor-pointer shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
