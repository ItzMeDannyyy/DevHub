import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  X,
  ExternalLink,
  Terminal,
  FolderOpen,
  Play,
  Square,
  Copy,
  Check,
  GitBranch,
  FileCode2,
  GitCommit,
  Calendar,
  Star,
  Edit3,
  Trash2,
  Server,
  Folder,
  Layers,
  FolderTree,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  Plus,
} from 'lucide-react';
import { Project, getProjectServices } from '../types';
import { formatDeadlineDisplay } from '../utils/date';
import { CategoryBadge, PriorityBadge } from './Badges';
import { GithubIcon } from './GithubIcon';
import {
  validateDirectoryPath,
  listGitBranches,
  switchGitBranch,
  openExternalUrl,
  getGitRemoteUrl,
  setGitRemoteUrl,
  formatRepoWebUrl,
} from '../services/tauriBridge';

interface ProjectControlModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenIde: (p: Project) => void;
  onOpenTerminal: (p: Project) => void;
  onOpenFolder: (p: Project) => void;
  onOpenWorkingTree: (p: Project) => void;
  onStartService: (p: Project, serviceId: string, cmd?: string) => void;
  onKillService: (p: Project, serviceId: string) => void;
  onStartAllServices: (p: Project) => void;
  onKillAllServices: (p: Project) => void;
  onToggleFavorite: (id: string) => void;
  onEdit: (p: Project) => void;
  onDelete: (id: string) => void;
  onRefreshGit?: (p: Project) => void;
  onBranchSwitched?: (updatedProject: Project) => void;
  onUpdateProject?: (updatedProject: Project) => void;
}

export const ProjectControlModal: React.FC<ProjectControlModalProps> = ({
  project,
  isOpen,
  onClose,
  onOpenIde,
  onOpenTerminal,
  onOpenFolder,
  onOpenWorkingTree,
  onStartService,
  onKillService,
  onStartAllServices,
  onKillAllServices,
  onToggleFavorite,
  onEdit,
  onDelete,
  onRefreshGit,
  onBranchSwitched,
  onUpdateProject,
}) => {
  const [copied, setCopied] = useState(false);
  const [customCmds, setCustomCmds] = useState<Record<string, string>>({});
  const [isRendered, setIsRendered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isPathValid, setIsPathValid] = useState<boolean | null>(null);

  // GitHub / Remote Repository URL states
  const [detectedRemoteUrl, setDetectedRemoteUrl] = useState<string | null>(null);
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [syncWithGitRemote, setSyncWithGitRemote] = useState(true);
  const [isSavingUrl, setIsSavingUrl] = useState(false);
  const [urlSaveError, setUrlSaveError] = useState<string | null>(null);

  // Git Branch switching states
  const [branches, setBranches] = useState<string[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const [isSwitchingBranch, setIsSwitchingBranch] = useState(false);
  const [branchError, setBranchError] = useState<string | null>(null);
  const [branchSearch, setBranchSearch] = useState<string>(project?.gitStatus?.branch || 'main');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const comboboxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Active repository URL resolution (user defined override -> git status remote -> live probed remote)
  const activeRepoUrl = useMemo(() => {
    if (project?.githubUrl && project.githubUrl.trim()) {
      return project.githubUrl.trim();
    }
    if (project?.gitStatus?.remoteUrl && project.gitStatus.remoteUrl.trim()) {
      return project.gitStatus.remoteUrl.trim();
    }
    return detectedRemoteUrl || null;
  }, [project?.githubUrl, project?.gitStatus?.remoteUrl, detectedRemoteUrl]);

  const browserWebUrl = useMemo(() => {
    return activeRepoUrl ? formatRepoWebUrl(activeRepoUrl) : null;
  }, [activeRepoUrl]);

  // Query git remote origin if not already stored
  useEffect(() => {
    let isMounted = true;
    if (isOpen && project?.path) {
      if (!project.githubUrl && !project.gitStatus?.remoteUrl) {
        getGitRemoteUrl(project.path).then((url) => {
          if (isMounted) {
            setDetectedRemoteUrl(url);
          }
        });
      } else {
        setDetectedRemoteUrl(null);
      }
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, project?.path, project?.githubUrl, project?.gitStatus?.remoteUrl]);

  const handleOpenGitHub = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (browserWebUrl) {
      openExternalUrl(browserWebUrl);
    }
  };

  const handleOpenUrlEditor = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCustomUrlInput(activeRepoUrl || '');
    setUrlSaveError(null);
    setIsEditingUrl(true);
  };

  const handleSaveRepoUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    setIsSavingUrl(true);
    setUrlSaveError(null);

    const cleanInput = customUrlInput.trim();
    const formattedWeb = cleanInput ? formatRepoWebUrl(cleanInput) : '';

    try {
      if (syncWithGitRemote && project.path) {
        try {
          await setGitRemoteUrl(project.path, cleanInput);
        } catch (err: any) {
          console.warn('Could not set git remote origin:', err);
        }
      }

      const updated: Project = {
        ...project,
        githubUrl: formattedWeb || undefined,
        gitStatus: project.gitStatus
          ? {
              ...project.gitStatus,
              remoteUrl: cleanInput || undefined,
            }
          : undefined,
      };

      setDetectedRemoteUrl(cleanInput || null);
      if (onUpdateProject) {
        onUpdateProject(updated);
      }
      setIsEditingUrl(false);
    } catch (err: any) {
      setUrlSaveError(
        typeof err === 'string' ? err : err?.message || 'Failed to save repository URL'
      );
    } finally {
      setIsSavingUrl(false);
    }
  };

  const handleRemoveRepoUrl = async () => {
    if (!project) return;
    setIsSavingUrl(true);
    setUrlSaveError(null);
    try {
      if (syncWithGitRemote && project.path) {
        try {
          await setGitRemoteUrl(project.path, '');
        } catch {
          // ignore
        }
      }
      const updated: Project = {
        ...project,
        githubUrl: undefined,
        gitStatus: project.gitStatus
          ? {
              ...project.gitStatus,
              remoteUrl: undefined,
            }
          : undefined,
      };
      setDetectedRemoteUrl(null);
      setCustomUrlInput('');
      if (onUpdateProject) {
        onUpdateProject(updated);
      }
      setIsEditingUrl(false);
    } catch (err: any) {
      setUrlSaveError(
        typeof err === 'string' ? err : err?.message || 'Failed to remove repository URL'
      );
    } finally {
      setIsSavingUrl(false);
    }
  };

  // Sync branchSearch when project's current branch changes
  useEffect(() => {
    if (project?.gitStatus?.branch) {
      setBranchSearch(project.gitStatus.branch);
    }
  }, [project?.gitStatus?.branch]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (comboboxRef.current && !comboboxRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
        // Reset search input to current branch if closed without selecting
        setBranchSearch(project?.gitStatus?.branch || 'main');
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen, project?.gitStatus?.branch]);

  const loadBranches = useCallback(async () => {
    if (!project?.path) return;
    setIsLoadingBranches(true);
    setBranchError(null);
    try {
      const list = await listGitBranches(project.path);
      const curBranch = project.gitStatus?.branch || 'main';
      const allBranches = Array.from(new Set([curBranch, ...list]));
      setBranches(allBranches);
    } catch (err: any) {
      console.warn('Failed to load branches:', err);
    } finally {
      setIsLoadingBranches(false);
    }
  }, [project?.path, project?.gitStatus?.branch]);

  useEffect(() => {
    if (isOpen && project?.path) {
      loadBranches();
    }
  }, [isOpen, project?.path, loadBranches]);

  // Filter & sort matching ANY character sequence anywhere in branch name
  const filteredAndSortedBranches = useMemo(() => {
    const q = branchSearch.trim().toLowerCase();
    const curBranch = project?.gitStatus?.branch || 'main';

    if (!q) {
      // Put current branch first, then remaining sorted alphabetically
      return [
        curBranch,
        ...branches.filter((b) => b !== curBranch).sort((a, b) => a.localeCompare(b)),
      ];
    }

    // Match any character sequence
    const matched = branches.filter((b) => b.toLowerCase().includes(q));

    // Sort matching branches:
    // 1. Exact match first
    // 2. Starts with query
    // 3. Substring earliest index match
    // 4. Alphabetical
    return matched.sort((a, b) => {
      const aLower = a.toLowerCase();
      const bLower = b.toLowerCase();

      if (aLower === q && bLower !== q) return -1;
      if (bLower === q && aLower !== q) return 1;

      const aStarts = aLower.startsWith(q);
      const bStarts = bLower.startsWith(q);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      const aIdx = aLower.indexOf(q);
      const bIdx = bLower.indexOf(q);
      if (aIdx !== bIdx) return aIdx - bIdx;

      return aLower.localeCompare(bLower);
    });
  }, [branches, branchSearch, project?.gitStatus?.branch]);

  const handleSwitchBranch = async (targetBranch: string) => {
    const clean = targetBranch.trim();
    if (!project?.path || !clean) return;
    setIsSwitchingBranch(true);
    setBranchError(null);

    const result = await switchGitBranch(project.path, clean);
    setIsSwitchingBranch(false);

    if (result.success && result.info) {
      setBranchSearch(result.info.branch);
      const updatedProject: Project = {
        ...project,
        gitStatus: {
          branch: result.info.branch,
          uncommittedCount: result.info.uncommittedCount,
          lastCommitTime: new Date().toISOString(),
          lastCommitMessage: result.info.lastCommitMessage,
          isClean: result.info.isClean,
        },
      };
      if (!branches.includes(result.info.branch)) {
        setBranches((prev) => [result.info!.branch, ...prev]);
      }
      onBranchSwitched?.(updatedProject);
    } else {
      setBranchError(result.error || 'Failed to switch branch');
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isDropdownOpen) {
        setIsDropdownOpen(true);
      } else {
        setHighlightedIndex((prev) =>
          prev < filteredAndSortedBranches.length - 1 ? prev + 1 : prev
        );
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isDropdownOpen && filteredAndSortedBranches.length > 0) {
        const target = filteredAndSortedBranches[highlightedIndex] || filteredAndSortedBranches[0];
        if (target && target !== project?.gitStatus?.branch) {
          handleSwitchBranch(target);
        }
        setIsDropdownOpen(false);
      } else if (branchSearch.trim() && branchSearch.trim() !== project?.gitStatus?.branch) {
        handleSwitchBranch(branchSearch.trim());
        setIsDropdownOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
      setBranchSearch(project?.gitStatus?.branch || 'main');
    }
  };

  // Smooth slide-over entry and exit (Right to Left)
  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      const timer = setTimeout(() => setIsVisible(true), 15);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setIsRendered(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Check path validity on disk and refresh git status when modal opens
  useEffect(() => {
    if (!project?.path || !isOpen) {
      setIsPathValid(null);
      return;
    }

    validateDirectoryPath(project.path).then((res) => {
      setIsPathValid(res.isValid);
      if (res.isValid && onRefreshGit) {
        onRefreshGit(project);
      }
    });
  }, [project?.path, isOpen]);

  // Reset custom commands when project changes
  useEffect(() => {
    setCustomCmds({});
  }, [project?.id]);

  // Escape key listener to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isRendered || !project) return null;

  const services = getProjectServices(project);
  const runningServices = services.filter((s) => !!s.runningProcess);
  const runningCount = runningServices.length;
  const allRunning = services.length > 0 && runningCount === services.length;
  const anyRunning = runningCount > 0;

  const handleCopyPath = () => {
    navigator.clipboard.writeText(project.path);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div
      className={`fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs transition-opacity duration-300 ease-out ${
        isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      onClick={onClose}
    >
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        {/* Slide-over Drawer Panel (Right to Left) */}
        <div
          onClick={(e) => e.stopPropagation()}
          className={`w-screen max-w-xl bg-[var(--bg-card)] border-l border-[var(--border-color)] shadow-2xl flex flex-col transform transition-transform duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isVisible ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Header */}
          <div className="flex items-start justify-between px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-subtle)] shrink-0 gap-3">
            {/* Title First, Badges Below */}
            <div className="flex-1 min-w-0 space-y-1.5">
              <h2 className="text-lg font-bold tracking-tight text-[var(--text-primary)] truncate font-sans">
                {project.name}
              </h2>
              <div className="flex items-center gap-1.5 flex-wrap">
                <CategoryBadge category={project.category} size="sm" />
                <PriorityBadge priority={project.priority} size="sm" />
                {project.deadline && (
                  <span className="text-xs font-mono px-2 py-0.5 rounded-md border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-primary)] font-semibold inline-flex items-center gap-1.5 shadow-2xs">
                    <Calendar size={11} className="text-amber-500" />
                    <span>Due {formatDeadlineDisplay(project.deadline)}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Header Action Buttons (Balanced, Clean Size) */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* GitHub Repo Button or Add GitHub URL Button */}
              {browserWebUrl ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleOpenGitHub}
                    className="monochrome-btn inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:border-sky-500/50 hover:bg-sky-500/10 text-xs font-mono font-medium transition-all cursor-pointer shadow-2xs group"
                    title={`Open GitHub repository in browser: ${browserWebUrl}`}
                  >
                    <GithubIcon size={14} className="text-sky-500 shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="hidden sm:inline font-semibold">GitHub</span>
                    <ExternalLink size={11} className="text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] shrink-0" />
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenUrlEditor}
                    className="p-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-canvas)] transition-all cursor-pointer shadow-2xs"
                    title="Edit repository URL"
                  >
                    <Edit3 size={13} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleOpenUrlEditor}
                  className="monochrome-btn inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-dashed border-[var(--border-color)] hover:border-sky-500/50 bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-sky-500/5 text-xs font-mono font-medium transition-all cursor-pointer shadow-2xs group"
                  title="Link a GitHub repository URL to this project"
                >
                  <GithubIcon size={14} className="text-sky-500 shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="hidden sm:inline font-medium">Add GitHub Repo</span>
                  <span className="sm:hidden font-medium">GitHub</span>
                </button>
              )}

              {/* Star Favorite Button */}
              <button
                type="button"
                onClick={() => onToggleFavorite(project.id)}
                className={`p-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-canvas)] hover:border-[var(--border-hover)] transition-all cursor-pointer shadow-2xs ${
                  project.favorite
                    ? 'text-amber-400 fill-amber-400 border-amber-500/30 bg-amber-500/5'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
                }`}
                title={project.favorite ? 'Unstar' : 'Star'}
              >
                <Star
                  size={15}
                  fill={project.favorite ? 'currentColor' : 'none'}
                />
              </button>

              {/* Close (X) Button */}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-canvas)] hover:border-[var(--border-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer shadow-2xs"
                title="Close drawer (Esc)"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Edit Repository URL Popover Modal */}
          {isEditingUrl && (
            <div
              className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
              onClick={() => setIsEditingUrl(false)}
            >
              <div
                className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl overflow-hidden animate-scale-in"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-color)] bg-[var(--bg-subtle)]">
                  <div className="flex items-center gap-2">
                    <GithubIcon size={16} className="text-sky-500" />
                    <h3 className="text-sm font-semibold text-[var(--text-primary)] font-sans">
                      {activeRepoUrl ? 'Edit GitHub URL' : 'Link GitHub Repository'}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditingUrl(false)}
                    className="p-1 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-canvas)] transition-colors cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleSaveRepoUrl} className="p-5 space-y-4">
                  <p className="text-xs text-[var(--text-secondary)] font-sans leading-relaxed">
                    Enter the GitHub repository link (or clone URL) for <strong>{project.name}</strong>.
                  </p>

                  <div>
                    <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] mb-1.5">
                      Repository URL
                    </label>
                    <div className="relative">
                      <GithubIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                      <input
                        type="text"
                        autoFocus
                        placeholder="https://github.com/username/project or owner/repo"
                        value={customUrlInput}
                        onChange={(e) => setCustomUrlInput(e.target.value)}
                        className="monochrome-input w-full pl-9 pr-3.5 py-2 rounded-md text-xs font-mono placeholder-[var(--text-tertiary)]"
                      />
                    </div>
                    {customUrlInput.trim() && (
                      <div className="mt-2 p-2 rounded-md bg-[var(--bg-canvas)] border border-[var(--border-color)] text-[11px] font-mono text-[var(--text-tertiary)] flex items-center justify-between">
                        <span className="truncate pr-2 text-sky-500">
                          {formatRepoWebUrl(customUrlInput)}
                        </span>
                        <span className="text-[10px] uppercase font-bold shrink-0">Web Preview</span>
                      </div>
                    )}
                    {urlSaveError && (
                      <p className="mt-1.5 text-xs font-mono text-rose-500">
                        {urlSaveError}
                      </p>
                    )}
                  </div>

                  <label className="flex items-start gap-2 pt-1 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={syncWithGitRemote}
                      onChange={(e) => setSyncWithGitRemote(e.target.checked)}
                      className="mt-0.5 rounded border-[var(--border-color)] accent-sky-500"
                    />
                    <span className="text-xs text-[var(--text-secondary)] font-sans">
                      Also set as Git remote origin on disk (<code>git remote set-url origin</code>)
                    </span>
                  </label>

                  <div className="pt-2 flex items-center justify-between border-t border-[var(--border-color)]">
                    {activeRepoUrl ? (
                      <button
                        type="button"
                        onClick={handleRemoveRepoUrl}
                        disabled={isSavingUrl}
                        className="monochrome-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-500/30 hover:border-rose-500/60 bg-rose-500/10 text-rose-500 text-xs font-mono cursor-pointer transition-colors"
                      >
                        <Trash2 size={12} />
                        <span>Remove Link</span>
                      </button>
                    ) : (
                      <div />
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingUrl(false)}
                        className="monochrome-btn px-3 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingUrl}
                        className="monochrome-btn inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[var(--accent-btn-bg)] text-[var(--accent-btn-text)] text-xs font-mono font-medium hover:opacity-90 cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        {isSavingUrl ? (
                          <>
                            <RefreshCw size={12} className="animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Check size={12} />
                            <span>Save URL</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Drawer Body */}
          <div className="p-6 space-y-6 flex-1 overflow-y-auto">
            {/* Directory Path */}
            <div>
              <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] mb-1.5">
                Filesystem Location
              </label>
              <div className="flex items-center justify-between p-2.5 rounded-md bg-[var(--bg-canvas)] border border-[var(--border-color)] font-mono text-xs">
                <span className="truncate mr-3 select-all text-[var(--text-secondary)]">
                  {project.path}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={handleCopyPath}
                    className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                    title="Copy path"
                  >
                    {copied ? (
                      <Check size={14} className="text-emerald-500" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                  <button
                    onClick={() => onOpenFolder(project)}
                    className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                    title="Open in File Explorer"
                  >
                    <FolderOpen size={14} />
                  </button>
                </div>
              </div>

              {isPathValid === false && (
                <div className="mt-2 p-2.5 rounded-lg border border-rose-500/30 bg-rose-500/5 text-rose-500 text-xs font-mono flex items-center justify-between animate-fade-in">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={14} className="shrink-0 text-rose-500" />
                    <span className="text-[11px]">
                      Directory path not found on disk.
                    </span>
                  </div>
                  <button
                    onClick={() => onEdit(project)}
                    className="underline text-[11px] font-semibold hover:text-rose-400 cursor-pointer"
                  >
                    Update Path
                  </button>
                </div>
              )}
            </div>

            {/* Launch Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onOpenIde(project)}
                className="monochrome-btn inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-[var(--accent-btn-bg)] text-[var(--accent-btn-text)] text-xs font-mono font-medium hover:opacity-90 cursor-pointer shadow-xs"
              >
                <ExternalLink size={14} />
                <span>Launch VS Code</span>
              </button>

              <button
                onClick={() => onOpenTerminal(project)}
                className="monochrome-btn inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md border border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-primary)] text-xs font-mono font-medium hover:border-[var(--border-hover)] cursor-pointer"
              >
                <Terminal size={14} />
                <span>Open Terminal</span>
              </button>
            </div>

            {/* Working Tree Diagram Navigation Button */}
            <button
              onClick={() => {
                onClose();
                onOpenWorkingTree(project);
              }}
              className="w-full monochrome-btn inline-flex items-center justify-between px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-subtle)] hover:border-[var(--border-hover)] text-[var(--text-primary)] text-xs font-mono font-semibold transition-all cursor-pointer shadow-xs group"
            >
              <div className="flex items-center gap-2.5">
                <FolderTree size={14} className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors" />
                <span>Open Working Tree Diagram</span>
              </div>
              <ArrowRight size={13} className="text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Git Branch Switcher (Positioned directly below Working Tree Diagram) */}
            <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-subtle)] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GitBranch size={14} className="text-sky-500 shrink-0" />
                  <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold">
                    Git Branch
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] shadow-2xs">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        project.gitStatus?.isClean ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    />
                    <span>{project.gitStatus?.branch || 'main'}</span>
                  </span>

                  <button
                    onClick={loadBranches}
                    disabled={isLoadingBranches}
                    className="p-1 rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                    title="Refresh branch list"
                  >
                    <RefreshCw size={12} className={isLoadingBranches ? 'animate-spin' : ''} />
                  </button>
                </div>
              </div>

              {/* Typable Combobox Branch Selector */}
              <div className="space-y-2">
                <div ref={comboboxRef} className="relative w-full">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <GitBranch
                        size={13}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none shrink-0"
                      />
                      <input
                        ref={inputRef}
                        type="text"
                        disabled={isSwitchingBranch}
                        value={branchSearch}
                        onFocus={() => {
                          setIsDropdownOpen(true);
                          setHighlightedIndex(0);
                        }}
                        onClick={() => {
                          if (!isDropdownOpen) setIsDropdownOpen(true);
                        }}
                        onChange={(e) => {
                          setBranchSearch(e.target.value);
                          setIsDropdownOpen(true);
                          setHighlightedIndex(0);
                        }}
                        onKeyDown={handleInputKeyDown}
                        placeholder="Type to search branch (e.g. deve, main)..."
                        className="monochrome-input w-full pl-8.5 pr-16 py-2 rounded-lg text-xs font-mono placeholder-[var(--text-tertiary)] cursor-text disabled:opacity-60"
                      />

                      {/* Right side controls: Clear / Chevron */}
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        {branchSearch && (
                          <button
                            type="button"
                            onClick={() => {
                              setBranchSearch('');
                              inputRef.current?.focus();
                              setIsDropdownOpen(true);
                            }}
                            className="p-1 rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer"
                            title="Clear search"
                          >
                            <X size={12} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setIsDropdownOpen((prev) => !prev);
                            inputRef.current?.focus();
                          }}
                          className="p-1 rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer"
                          title={isDropdownOpen ? 'Close list' : 'Show all branches'}
                        >
                          <ChevronDown
                            size={13}
                            className={`transition-transform duration-200 ${
                              isDropdownOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Quick Checkout Button if typed branch differs from current */}
                    {branchSearch.trim() && branchSearch.trim() !== project.gitStatus?.branch && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          handleSwitchBranch(branchSearch.trim());
                        }}
                        disabled={isSwitchingBranch}
                        className="monochrome-btn inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--accent-btn-bg)] text-[var(--accent-btn-text)] text-xs font-mono font-medium hover:opacity-90 cursor-pointer shadow-xs shrink-0 disabled:opacity-50"
                      >
                        {isSwitchingBranch ? (
                          <>
                            <RefreshCw size={11} className="animate-spin" />
                            <span>Switching...</span>
                          </>
                        ) : (
                          <>
                            <Check size={11} />
                            <span>Checkout</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Dropdown Menu (Always drops DOWN, limited height, scrollable) */}
                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 z-50 max-h-52 overflow-y-auto rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-2xl p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-2 py-1 text-[10px] font-mono uppercase text-[var(--text-tertiary)] font-semibold border-b border-[var(--border-color)] mb-1 flex items-center justify-between">
                        <span>Branches ({filteredAndSortedBranches.length})</span>
                        <span className="text-[9px]">Click or press Enter</span>
                      </div>

                      {filteredAndSortedBranches.length > 0 ? (
                        filteredAndSortedBranches.map((b, idx) => {
                          const isCurrent = b === project.gitStatus?.branch;
                          const isHighlighted = idx === highlightedIndex;

                          return (
                            <button
                              key={b}
                              type="button"
                              onClick={() => {
                                setIsDropdownOpen(false);
                                setBranchSearch(b);
                                if (!isCurrent) {
                                  handleSwitchBranch(b);
                                }
                              }}
                              onMouseEnter={() => setHighlightedIndex(idx)}
                              className={`w-full group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs font-mono transition-colors cursor-pointer ${
                                isHighlighted
                                  ? 'bg-[var(--bg-subtle)] text-[var(--text-primary)]'
                                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <GitBranch
                                  size={12}
                                  className={
                                    isCurrent ? 'text-sky-500 shrink-0' : 'text-[var(--text-tertiary)] shrink-0'
                                  }
                                />
                                <span className={isCurrent ? 'font-bold text-[var(--text-primary)]' : ''}>
                                  {b}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                {isCurrent ? (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-mono bg-sky-500/15 text-sky-600 dark:text-sky-300 border border-sky-500/30">
                                    <Check size={10} />
                                    <span>active</span>
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity">
                                    Checkout
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        <div className="p-3 text-center text-xs font-mono text-[var(--text-tertiary)]">
                          No matching branches for "{branchSearch}"
                        </div>
                      )}

                      {/* Custom branch option if typed query doesn't match an existing branch */}
                      {branchSearch.trim() &&
                        !branches.some((b) => b.toLowerCase() === branchSearch.trim().toLowerCase()) && (
                          <div className="pt-1 mt-1 border-t border-[var(--border-color)]">
                            <button
                              type="button"
                              onClick={() => {
                                setIsDropdownOpen(false);
                                handleSwitchBranch(branchSearch.trim());
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs font-mono text-sky-600 dark:text-sky-400 hover:bg-[var(--bg-subtle)] cursor-pointer"
                            >
                              <Plus size={12} />
                              <span className="truncate">
                                Checkout new branch "<strong>{branchSearch.trim()}</strong>"
                              </span>
                            </button>
                          </div>
                        )}
                    </div>
                  )}
                </div>

                {/* Branch Switching Error Alert */}
                {branchError && (
                  <div className="p-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-500 text-xs font-mono flex items-start gap-2 animate-fade-in">
                    <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <span className="font-semibold block">Git Checkout Error</span>
                      <span className="text-[11px] text-[var(--text-secondary)] font-mono break-all block">
                        {branchError}
                      </span>
                    </div>
                  </div>
                )}

                {/* Explanatory micro-footer */}
                <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-tertiary)] pt-1">
                  <span>Selected branch updates repository files on disk.</span>
                  <span className="text-sky-500">Auto-synced with VS Code</span>
                </div>
              </div>
            </div>

            {/* Run Service and Commands */}
            <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-subtle)]">
              {/* Process Controller Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3.5 pb-2.5 border-b border-[var(--border-color)]">
                <div>
                  <div className="flex items-center gap-1.5">
                    <Server size={13} className="text-[var(--text-primary)]" />
                    <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold">
                      Run Service and Commands
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-mono text-[var(--text-tertiary)]">
                      {services.length} {services.length === 1 ? 'service' : 'services'} configured
                    </span>
                    {anyRunning ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-500 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>{runningCount} active</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-[var(--text-tertiary)]">
                        • All stopped
                      </span>
                    )}
                  </div>
                </div>

                {/* Simultaneous Run All & Stop All Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onStartAllServices(project)}
                    disabled={allRunning}
                    className={`monochrome-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all cursor-pointer shadow-xs ${
                      allRunning
                        ? 'bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-tertiary)] opacity-60 cursor-not-allowed'
                        : 'bg-[var(--accent-btn-bg)] text-[var(--accent-btn-text)] hover:opacity-90'
                    }`}
                    title="Launch all stopped services simultaneously"
                  >
                    <Play size={12} fill="currentColor" />
                    <span>Run All Services</span>
                  </button>

                  {anyRunning && (
                    <button
                      onClick={() => onKillAllServices(project)}
                      className="monochrome-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-medium transition-colors cursor-pointer shadow-xs"
                      title="Terminate all active running processes"
                    >
                      <Square size={11} fill="currentColor" />
                      <span>Stop All</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Service Cards List */}
              <div className="space-y-3">
                {services.map((service, index) => {
                  const isServiceRunning = !!service.runningProcess;
                  const currentCmd =
                    customCmds[service.id] !== undefined
                      ? customCmds[service.id]
                      : service.command;

                  return (
                    <div
                      key={service.id || index}
                      className={`p-3 rounded-lg border transition-all ${
                        isServiceRunning
                          ? 'border-emerald-500/40 bg-emerald-500/5'
                          : 'border-[var(--border-color)] bg-[var(--bg-canvas)]'
                      }`}
                    >
                      {/* Service Top Info */}
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--border-color)]">
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-xs font-mono font-semibold text-[var(--text-primary)] truncate">
                            {service.name || `Service ${index + 1}`}
                          </span>
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--bg-subtle)] border border-[var(--border-color)] text-[10px] font-mono text-[var(--text-secondary)] shrink-0">
                            <Folder size={10} />
                            <span>{service.folder}</span>
                          </span>
                        </div>

                        {/* Status badge */}
                        {isServiceRunning ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>PID {service.runningProcess?.pid}</span>
                            {service.runningProcess?.port && (
                              <span>:{service.runningProcess.port}</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-[var(--text-tertiary)] shrink-0">
                            Stopped
                          </span>
                        )}
                      </div>

                      {/* Command & Run/Kill Service Action Row */}
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] font-mono text-xs select-none">
                            $
                          </span>
                          <input
                            type="text"
                            value={currentCmd}
                            disabled={isServiceRunning}
                            onChange={(e) =>
                              setCustomCmds((prev) => ({
                                ...prev,
                                [service.id]: e.target.value,
                              }))
                            }
                            placeholder="e.g. npm run dev"
                            className="monochrome-input w-full pl-6 pr-2.5 py-1.5 rounded-md text-xs font-mono placeholder-[var(--text-tertiary)] disabled:opacity-75 disabled:cursor-not-allowed"
                          />
                        </div>

                        {isServiceRunning ? (
                          <button
                            onClick={() => onKillService(project, service.id)}
                            className="monochrome-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-medium transition-colors cursor-pointer shadow-xs shrink-0"
                            title="Terminate this service PID"
                          >
                            <Square size={11} fill="currentColor" />
                            <span>Kill PID</span>
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              onStartService(project, service.id, currentCmd)
                            }
                            className="monochrome-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--accent-btn-bg)] text-[var(--accent-btn-text)] text-xs font-mono font-medium hover:opacity-90 cursor-pointer shadow-xs shrink-0"
                            title="Run this service"
                          >
                            <Play size={11} fill="currentColor" />
                            <span>Run Service</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Add More Services Hint */}
              <div className="mt-3 pt-2 border-t border-[var(--border-color)] flex items-center justify-between text-[11px] font-mono text-[var(--text-tertiary)]">
                <span>Services run in their respective subfolders.</span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEdit(project);
                  }}
                  className="hover:text-[var(--text-primary)] underline cursor-pointer inline-flex items-center gap-1"
                >
                  <Layers size={11} />
                  <span>Configure services</span>
                </button>
              </div>
            </div>

            {/* Git Workspace Status */}
            {project.gitStatus && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)]">
                    Git Workspace Status
                  </label>
                  {onRefreshGit && (
                    <button
                      onClick={() => onRefreshGit(project)}
                      title="Re-check Git status from disk"
                      className="monochrome-btn px-2 py-0.5 rounded border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-canvas)] transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-mono"
                    >
                      <RefreshCw size={10} />
                      <span>Refresh Git</span>
                    </button>
                  )}
                </div>
                <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-color)] space-y-2.5 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-[var(--text-primary)]">
                      <GitBranch size={13} />
                      <span>{project.gitStatus.branch}</span>
                    </span>
                    {project.gitStatus.uncommittedCount > 0 ? (
                      <span className="text-amber-500 text-[11px] inline-flex items-center gap-1">
                        <FileCode2 size={12} />
                        {project.gitStatus.uncommittedCount} modified files
                      </span>
                    ) : (
                      <span className="text-emerald-500 text-[11px]">
                        Clean working directory
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)] pt-2.5 border-t border-[var(--border-color)]">
                    <GitCommit size={12} />
                    <span className="truncate">
                      "{project.gitStatus.lastCommitMessage}"
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            {project.notes && (
              <div>
                <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] mb-1">
                  Project Notes
                </label>
                <p className="text-xs text-[var(--text-secondary)] p-3 rounded-md bg-[var(--bg-subtle)] border border-[var(--border-color)]">
                  {project.notes}
                </p>
              </div>
            )}
          </div>

          {/* Drawer Footer */}
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-[var(--border-color)] bg-[var(--bg-subtle)] shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onClose();
                  onEdit(project);
                }}
                className="monochrome-btn inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                <Edit3 size={12} />
                <span>Edit Details</span>
              </button>
              <button
                onClick={() => {
                  onClose();
                  onDelete(project.id);
                }}
                className="monochrome-btn inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-mono text-rose-500 hover:text-rose-400 transition-colors cursor-pointer"
              >
                <Trash2 size={12} />
                <span>Delete</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="monochrome-btn px-4 py-1.5 rounded-md border border-[var(--border-color)] bg-[var(--bg-card)] text-xs font-mono font-medium hover:border-[var(--border-hover)] cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
