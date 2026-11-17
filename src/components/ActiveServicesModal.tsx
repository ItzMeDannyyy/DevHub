import React, { useEffect, useState } from 'react';
import {
  X,
  Server,
  Square,
  Folder,
  Terminal,
  FolderOpen,
  CheckCircle2,
  Copy,
  Check,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Project, getProjectServices } from '../types';
import { CategoryBadge, PriorityBadge } from './Badges';
import { openInFileManager, openInTerminal } from '../services/tauriBridge';

interface ActiveServicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  onKillService: (projectId: string, serviceId: string) => Promise<void>;
  onKillAllServices: () => Promise<void>;
  onSelectProject?: (project: Project) => void;
}

export const ActiveServicesModal: React.FC<ActiveServicesModalProps> = ({
  isOpen,
  onClose,
  projects,
  onKillService,
  onKillAllServices,
  onSelectProject,
}) => {
  const [isRendered, setIsRendered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [killingServiceId, setKillingServiceId] = useState<string | null>(null);
  const [isKillingAll, setIsKillingAll] = useState(false);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  // Smooth floating modal animation (Center scale fade in/out)
  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      const timer = setTimeout(() => setIsVisible(true), 20);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setIsRendered(false), 220);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Aggregate active services grouped by repository
  const activeRepositoryGroups = projects
    .map((project) => {
      const services = getProjectServices(project);
      const activeServices = services.filter((s) => !!s.runningProcess);
      return {
        project,
        activeServices,
      };
    })
    .filter((group) => group.activeServices.length > 0);

  const totalActiveServicesCount = activeRepositoryGroups.reduce(
    (acc, group) => acc + group.activeServices.length,
    0
  );

  const handleCopyPath = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(path);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 1400);
  };

  const handleKillSingle = async (projectId: string, serviceId: string) => {
    setKillingServiceId(serviceId);
    try {
      await onKillService(projectId, serviceId);
    } finally {
      setKillingServiceId(null);
    }
  };

  const handleKillAll = async () => {
    setIsKillingAll(true);
    try {
      await onKillAllServices();
    } finally {
      setIsKillingAll(false);
    }
  };

  if (!isRendered) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-xs transition-opacity duration-200 ease-out ${
        isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      onClick={onClose}
    >
      {/* Floating Centered Modal Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-[94vw] max-w-3xl max-h-[84vh] rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-2xl flex flex-col overflow-hidden transform transition-all duration-250 ease-out ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-subtle)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-primary)] shadow-2xs">
              <Server
                size={16}
                className={
                  totalActiveServicesCount > 0 ? 'text-emerald-500' : 'text-[var(--text-tertiary)]'
                }
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold tracking-tight text-[var(--text-primary)] font-sans">
                  Active Services Monitor
                </h2>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider ${
                    totalActiveServicesCount > 0
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : 'bg-[var(--bg-card)] text-[var(--text-tertiary)] border border-[var(--border-color)]'
                  }`}
                >
                  {totalActiveServicesCount} Active
                </span>
              </div>
              <p className="text-xs font-mono text-[var(--text-tertiary)] mt-0.5">
                Centralized controller for background processes running across all repositories
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {totalActiveServicesCount > 0 && (
              <button
                onClick={handleKillAll}
                disabled={isKillingAll}
                className="monochrome-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-semibold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                title="Terminate all active services across all repositories simultaneously"
              >
                <Square size={11} fill="currentColor" />
                <span>{isKillingAll ? 'Stopping All...' : 'Stop All Services'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-canvas)] transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body / Scrollable Content */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {totalActiveServicesCount === 0 ? (
            /* Empty State */
            <div className="py-12 px-6 rounded-xl border border-dashed border-[var(--border-color)] bg-[var(--bg-subtle)] text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center mx-auto text-emerald-500 shadow-2xs">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] font-mono">
                  All Repositories Idle
                </h3>
                <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto mt-1 leading-relaxed font-sans">
                  No background dev servers or microservices are currently running. Your CPU and laptop battery are completely relaxed.
                </p>
              </div>
              <div className="pt-2 text-[11px] font-mono text-[var(--text-tertiary)] flex items-center justify-center gap-1.5">
                <ShieldCheck size={13} className="text-emerald-500" />
                <span>Zero zombie processes detected</span>
              </div>
            </div>
          ) : (
            /* Comprehensive Active Services List by Repository */
            <div className="space-y-5">
              {activeRepositoryGroups.map(({ project, activeServices }) => (
                <div
                  key={project.id}
                  className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-subtle)] overflow-hidden shadow-xs"
                >
                  {/* Repository Header Bar */}
                  <div className="px-4 py-3 bg-[var(--bg-card)] border-b border-[var(--border-color)] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1 rounded bg-[var(--bg-subtle)] border border-[var(--border-color)] text-[var(--text-primary)] shrink-0">
                        <Folder size={13} />
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onSelectProject?.(project);
                        }}
                        className="text-xs font-sans font-bold text-[var(--text-primary)] hover:underline truncate text-left cursor-pointer flex items-center gap-1.5"
                        title="Click to view repository control deck"
                      >
                        <span className="truncate">{project.name}</span>
                        <ArrowRight size={11} className="text-[var(--text-tertiary)] shrink-0" />
                      </button>

                      <CategoryBadge category={project.category} size="sm" />
                      <PriorityBadge priority={project.priority} size="sm" />
                    </div>

                    {/* Repository Path & Explorer Trigger */}
                    <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-tertiary)] shrink-0">
                      <span className="text-[11px] text-[var(--text-secondary)] truncate max-w-[200px] hidden md:inline">
                        {project.path}
                      </span>

                      <button
                        onClick={(e) => handleCopyPath(project.path, e)}
                        className="p-1 rounded hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
                        title="Copy folder path"
                      >
                        {copiedPath === project.path ? (
                          <Check size={12} className="text-emerald-500" />
                        ) : (
                          <Copy size={12} />
                        )}
                      </button>

                      <button
                        onClick={() => openInFileManager(project.path)}
                        className="p-1 rounded hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
                        title="Open folder in File Explorer"
                      >
                        <FolderOpen size={12} />
                      </button>

                      <button
                        onClick={() => openInTerminal(project.path)}
                        className="p-1 rounded hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
                        title="Open in Terminal"
                      >
                        <Terminal size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Active Services List for this Repository */}
                  <div className="p-3 space-y-2.5">
                    {activeServices.map((service) => {
                      const proc = service.runningProcess!;
                      const isKillingThis = killingServiceId === service.id;

                      return (
                        <div
                          key={service.id}
                          className="p-3 rounded-lg border border-emerald-500/30 bg-[var(--bg-card)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                        >
                          <div className="space-y-1.5 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-mono font-bold text-[var(--text-primary)]">
                                {service.name || 'Main Service'}
                              </span>

                              {/* PID and Port Badges */}
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-semibold">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span>PID {proc.pid}</span>
                              </span>

                              {proc.port && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono bg-[var(--bg-subtle)] text-[var(--text-primary)] border border-[var(--border-color)]">
                                  <span>Port :{proc.port}</span>
                                </span>
                              )}

                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-[var(--bg-subtle)] border border-[var(--border-color)] text-[var(--text-secondary)]">
                                <Layers size={10} />
                                <span>{service.folder}</span>
                              </span>
                            </div>

                            {/* Executed Command Display */}
                            <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)] truncate">
                              <span className="text-[var(--text-tertiary)] select-none">$</span>
                              <code className="text-[11px] text-[var(--text-primary)] truncate font-semibold">
                                {proc.command || service.command}
                              </code>
                            </div>
                          </div>

                          {/* Action Button: Kill PID */}
                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            <button
                              onClick={() => handleKillSingle(project.id, service.id)}
                              disabled={isKillingThis}
                              className="monochrome-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-300 hover:bg-rose-600 hover:text-white text-xs font-mono font-semibold transition-all cursor-pointer shadow-xs disabled:opacity-50"
                              title={`Kill process PID ${proc.pid}`}
                            >
                              <Square size={11} fill="currentColor" />
                              <span>{isKillingThis ? 'Stopping...' : 'Stop Service'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[var(--border-color)] bg-[var(--bg-subtle)] flex items-center justify-between text-xs font-mono text-[var(--text-tertiary)] shrink-0">
          <span>Processes run independently and terminate cleanly without zombie subshells.</span>
          <button
            onClick={onClose}
            className="monochrome-btn px-3 py-1 rounded-md border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
