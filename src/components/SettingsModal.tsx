import React from 'react';
import {
  X,
  Power,
  Minimize2,
  Code2,
  Terminal,
  Download,
  RotateCcw,
} from 'lucide-react';
import { UserSettings, Project } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  projects: Project[];
  onResetData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  projects,
  onResetData,
}) => {
  if (!isOpen) return null;

  const handleExportJson = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(projects, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'devhub-projects-backup.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-base font-semibold text-slate-100">
            DevHub Settings
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* System Autostart */}
          <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-indigo-950/60 text-indigo-400 border border-indigo-900/50 mt-0.5">
                <Power size={18} />
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-100">
                  Launch on Laptop Startup
                </h4>
                <p className="text-xs text-slate-400">
                  Automatically open DevHub whenever your computer powers on.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
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
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Minimize to Tray */}
          <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-indigo-950/60 text-indigo-400 border border-indigo-900/50 mt-0.5">
                <Minimize2 size={18} />
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-100">
                  Minimize to System Tray
                </h4>
                <p className="text-xs text-slate-400">
                  Keep DevHub running silently in the tray for instant hotkey recall.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
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
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Preferred IDE */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 inline-flex items-center gap-1.5">
              <Code2 size={15} />
              <span>Preferred IDE / Editor</span>
            </label>
            <select
              value={settings.preferredIde}
              onChange={(e) =>
                onUpdateSettings({
                  ...settings,
                  preferredIde: e.target.value as any,
                })
              }
              className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
            >
              <option value="vscode">Visual Studio Code (code)</option>
              <option value="cursor">Cursor (cursor)</option>
              <option value="zed">Zed (zed)</option>
              <option value="sublime">Sublime Text (subl)</option>
            </select>
          </div>

          {/* Default Terminal */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 inline-flex items-center gap-1.5">
              <Terminal size={15} />
              <span>Default Terminal</span>
            </label>
            <select
              value={settings.defaultTerminal}
              onChange={(e) =>
                onUpdateSettings({
                  ...settings,
                  defaultTerminal: e.target.value as any,
                })
              }
              className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
            >
              <option value="powershell">Windows PowerShell</option>
              <option value="terminal">Windows Terminal (wt)</option>
              <option value="cmd">Command Prompt (cmd)</option>
            </select>
          </div>

          {/* Data Backup & Reset */}
          <div className="pt-2 flex items-center justify-between">
            <button
              onClick={handleExportJson}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
            >
              <Download size={13} />
              <span>Export Backup (JSON)</span>
            </button>

            <button
              onClick={() => {
                if (confirm('Reset projects to default demo sample data?')) {
                  onResetData();
                  onClose();
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-medium border border-rose-900/50 transition-colors cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Reset Demo Data</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
