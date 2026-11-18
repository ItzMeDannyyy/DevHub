import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  X,
  Folder,
  FolderOpen,
  FileText,
  Save,
  Terminal,
  CircleHelp,
  Plus,
  Trash2,
  Layers,
  RefreshCw,
  FolderTree,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Tag,
} from 'lucide-react';
import {
  Project,
  ProjectCategory,
  Priority,
  ProjectService,
  getProjectServices,
  AddRepoDraft,
} from '../types';
import {
  saveRepoDraft,
  loadRepoDraft,
  clearRepoDraft,
  isDraftMeaningful,
} from '../services/storage';
import { CustomSelect, SelectOption } from './CustomSelect';
import { CustomDateTimePicker } from './CustomDateTimePicker';
import { CategoryBadge, PriorityBadge } from './Badges';
import { GithubIcon } from './GithubIcon';
import {
  listSubdirectories,
  validateDirectoryPath,
  selectFolderDialog,
  getGitRemoteUrl,
  formatRepoWebUrl,
} from '../services/tauriBridge';

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (projectData: Partial<Project>) => void;
  initialProject?: Project | null;
  onDraftChange?: (hasDraft: boolean) => void;
  onDraftSavedNotify?: () => void;
}

interface ServiceFormItem {
  id: string;
  name: string;
  folder: string;
  command: string;
  isCustomFolder?: boolean;
}

export const inferServiceNameFromFolder = (folder: string, index: number = 0): string => {
  if (!folder || folder === './' || folder === '.') {
    return index === 0 ? 'Frontend' : 'Backend API';
  }
  const clean = folder.replace(/^\.\//, '').replace(/\/$/, '').trim();
  if (!clean) return index === 0 ? 'Frontend' : 'Backend API';

  const lower = clean.toLowerCase();
  if (lower === 'src-tauri' || lower === 'tauri') return 'Desktop Core';
  if (lower === 'backend' || lower === 'server' || lower === 'api') return 'Backend API';
  if (lower === 'frontend' || lower === 'client' || lower === 'web' || lower === 'ui') return 'Frontend';
  if (lower === 'docs' || lower === 'documentation') return 'Documentation';
  if (lower === 'worker' || lower === 'jobs' || lower === 'queue') return 'Worker';

  return clean
    .split(/[-_/]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const categoryOptions: SelectOption<Exclude<ProjectCategory, 'all'>>[] = [
  {
    value: 'work',
    label: 'Work',
    customRender: <CategoryBadge category="work" size="md" />,
    description: 'Internal & team core systems',
  },
  {
    value: 'client',
    label: 'Client',
    customRender: <CategoryBadge category="client" size="md" />,
    description: 'External deliverables & contracts',
  },
  {
    value: 'personal',
    label: 'Personal',
    customRender: <CategoryBadge category="personal" size="md" />,
    description: 'Side projects & experiments',
  },
  {
    value: 'school',
    label: 'School',
    customRender: <CategoryBadge category="school" size="md" />,
    description: 'Academic courses & university assignments',
  },
  {
    value: 'open-source',
    label: 'Open Source',
    customRender: <CategoryBadge category="open-source" size="md" />,
    description: 'Public community repositories',
  },
];

const priorityOptions: SelectOption<Priority>[] = [
  {
    value: 'critical',
    label: 'Critical',
    customRender: <PriorityBadge priority="critical" size="md" />,
    description: 'Immediate deadline or blocking blocker',
  },
  {
    value: 'high',
    label: 'High',
    customRender: <PriorityBadge priority="high" size="md" />,
    description: 'Active sprint deliverables',
  },
  {
    value: 'medium',
    label: 'Medium',
    customRender: <PriorityBadge priority="medium" size="md" />,
    description: 'Normal backlog pacing',
  },
  {
    value: 'low',
    label: 'Low',
    customRender: <PriorityBadge priority="low" size="md" />,
    description: 'Backlog or exploratory feature',
  },
];

export const AddProjectModal: React.FC<AddProjectModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialProject,
  onDraftChange,
  onDraftSavedNotify,
}) => {
  const [name, setName] = useState('');
  const [path, setPath] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [category, setCategory] = useState<Exclude<ProjectCategory, 'all'>>('work');
  const [priority, setPriority] = useState<Priority>('medium');
  const [deadline, setDeadline] = useState('');
  const [notes, setNotes] = useState('');
  const [showPathHelp, setShowPathHelp] = useState(false);
  const [detectedFolders, setDetectedFolders] = useState<string[]>([]);
  const [isScanningFolders, setIsScanningFolders] = useState(false);
  const [services, setServices] = useState<ServiceFormItem[]>([
    {
      id: 'srv-1',
      name: 'Frontend',
      folder: './',
      command: 'npm run dev',
    },
  ]);

  // Draft restoration state & initialization guard
  const [isRestoredDraft, setIsRestoredDraft] = useState(false);
  const isInitializedRef = useRef(false);

  // Path validity verification state & submission state
  const [pathValidation, setPathValidation] = useState<{
    status: 'idle' | 'checking' | 'valid' | 'invalid';
    errorMessage?: string;
    canonicalPath?: string;
    folderCount?: number;
  }>({
    status: 'idle',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [isRendered, setIsRendered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Strip wrapping quotes on change (common when copying from Windows Explorer)
  const handlePathChange = (val: string) => {
    const sanitized = val.replace(/^["']|["']$/g, '');
    setPath(sanitized);
    setSubmitError(null);
    if (!sanitized.trim()) {
      setPathValidation({ status: 'idle' });
      setDetectedFolders([]);
    } else {
      setPathValidation({ status: 'checking' });
    }
  };

  const [isBrowsing, setIsBrowsing] = useState(false);

  // Native Folder Browser dialog
  const handleBrowseFolder = async () => {
    try {
      setIsBrowsing(true);
      const selectedPath = await selectFolderDialog(path);
      if (selectedPath) {
        const clean = selectedPath.replace(/^["']|["']$/g, '').trim();
        setPath(clean);
        setSubmitError(null);

        // Auto-populate project name from folder name if currently empty
        if (!name.trim()) {
          const parts = clean.split(/[\\/]/).filter(Boolean);
          const lastFolder = parts[parts.length - 1];
          if (lastFolder) {
            setName(lastFolder);
          }
        }

        // Immediately trigger directory validation and subdirectory scanning
        validateAndScan(clean);
      }
    } catch (err) {
      console.warn('Folder selection failed:', err);
    } finally {
      setIsBrowsing(false);
    }
  };

  // Validate directory path on disk and scan subdirectories
  const validateAndScan = useCallback(async (targetPath: string) => {
    const clean = targetPath.trim().replace(/^["']|["']$/g, '').trim();
    if (!clean || clean.length < 2) {
      setPathValidation({ status: 'idle' });
      setDetectedFolders([]);
      return;
    }

    setPathValidation({ status: 'checking' });
    setIsScanningFolders(true);

    try {
      const res = await validateDirectoryPath(clean);
      if (!res.isValid) {
        setPathValidation({
          status: 'invalid',
          errorMessage: res.errorMessage || 'Directory path does not exist on disk.',
        });
        setDetectedFolders([]);
      } else {
        setPathValidation({
          status: 'valid',
          canonicalPath: res.canonicalPath,
          folderCount: res.subdirectoriesCount,
        });

        // Automatically detect Git remote URL if user hasn't typed one
        getGitRemoteUrl(clean).then((remote) => {
          if (remote) {
            setGithubUrl((prev) => (prev ? prev : remote));
          }
        });

        const dirs = await listSubdirectories(clean);
        setDetectedFolders(dirs);
      }
    } catch (err) {
      console.warn('Path validation error:', err);
      setPathValidation({
        status: 'invalid',
        errorMessage: String(err),
      });
      setDetectedFolders([]);
    } finally {
      setIsScanningFolders(false);
    }
  }, []);

  // Auto-scan and validate whenever path changes (debounced by 300ms)
  useEffect(() => {
    if (!isOpen || !path.trim()) {
      setPathValidation({ status: 'idle' });
      setDetectedFolders([]);
      return;
    }

    const timer = setTimeout(() => {
      validateAndScan(path);
    }, 300);

    return () => clearTimeout(timer);
  }, [path, isOpen, validateAndScan]);

  // Dynamically assemble folder dropdown options using ONLY discovered folders from disk
  const dynamicFolderOptions = useMemo<SelectOption<string>[]>(() => {
    const options: SelectOption<string>[] = [
      {
        value: './',
        label: './ (Root Directory)',
        description: 'Repository root directory',
      },
    ];

    // Add only folders detected on disk in this directory
    if (detectedFolders.length > 0) {
      detectedFolders.forEach((folder) => {
        options.push({
          value: folder,
          label: folder,
          chip: 'found',
          description: 'Subdirectory found in this repository',
        });
      });
    }

    // Also include any currently configured folder from existing services so it remains selectable
    services.forEach((s) => {
      if (
        s.folder &&
        s.folder !== './' &&
        s.folder !== '__custom__' &&
        !options.some((o) => o.value === s.folder)
      ) {
        options.push({
          value: s.folder,
          label: s.folder,
          description: 'Configured folder',
        });
      }
    });

    // Custom option
    options.push({
      value: '__custom__',
      label: 'Custom subfolder...',
      description: 'Specify custom relative folder path',
    });

    return options;
  }, [detectedFolders, services]);

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

  useEffect(() => {
    if (!isOpen) {
      isInitializedRef.current = false;
      return;
    }

    if (initialProject) {
      setName(initialProject.name);
      setPath(initialProject.path);
      setGithubUrl(initialProject.githubUrl || initialProject.gitStatus?.remoteUrl || '');
      setCategory(initialProject.category);
      setPriority(initialProject.priority);
      setDeadline(initialProject.deadline || '');
      setNotes(initialProject.notes || '');
      setSubmitError(null);
      setIsRestoredDraft(false);
      validateAndScan(initialProject.path);

      const initialServices = getProjectServices(initialProject);
      setServices(
        initialServices.map((s, idx) => ({
          id: s.id || `srv-${idx + 1}`,
          name: s.name || inferServiceNameFromFolder(s.folder || './', idx),
          folder: s.folder || './',
          command: s.command || 'npm run dev',
          isCustomFolder: false,
        }))
      );
      isInitializedRef.current = true;
    } else {
      // Check if a saved draft exists
      const draft = loadRepoDraft();
      if (draft && isDraftMeaningful(draft)) {
        setName(draft.name || '');
        setPath(draft.path || '');
        setGithubUrl(draft.githubUrl || '');
        setCategory(draft.category || 'work');
        setPriority(draft.priority || 'medium');
        setDeadline(draft.deadline || '');
        setNotes(draft.notes || '');
        setSubmitError(null);
        setIsRestoredDraft(true);
        if (draft.services && draft.services.length > 0) {
          setServices(draft.services);
        } else {
          setServices([
            {
              id: 'srv-1',
              name: 'Frontend',
              folder: './',
              command: 'npm run dev',
              isCustomFolder: false,
            },
          ]);
        }
        if (draft.path) {
          validateAndScan(draft.path);
        }
      } else {
        setName('');
        setPath('');
        setGithubUrl('');
        setCategory('work');
        setPriority('medium');
        setDeadline('');
        setNotes('');
        setSubmitError(null);
        setPathValidation({ status: 'idle' });
        setDetectedFolders([]);
        setIsRestoredDraft(false);
        setServices([
          {
            id: 'srv-1',
            name: 'Frontend',
            folder: './',
            command: 'npm run dev',
            isCustomFolder: false,
          },
        ]);
      }
      isInitializedRef.current = true;
    }
  }, [initialProject, isOpen, validateAndScan]);

  // Auto-save form inputs to localStorage draft on change
  useEffect(() => {
    if (!isOpen || initialProject || !isInitializedRef.current) return;

    const currentDraft: AddRepoDraft = {
      name,
      path,
      githubUrl,
      category,
      priority,
      deadline,
      notes,
      services,
      savedAt: new Date().toISOString(),
    };

    if (isDraftMeaningful(currentDraft)) {
      saveRepoDraft(currentDraft);
      onDraftChange?.(true);
    } else {
      clearRepoDraft();
      onDraftChange?.(false);
      setIsRestoredDraft(false);
    }
  }, [
    name,
    path,
    githubUrl,
    category,
    priority,
    deadline,
    notes,
    services,
    isOpen,
    initialProject,
    onDraftChange,
  ]);

  // Explicitly discard saved draft and clear form
  const handleDiscardDraft = () => {
    clearRepoDraft();
    onDraftChange?.(false);
    setName('');
    setPath('');
    setGithubUrl('');
    setCategory('work');
    setPriority('medium');
    setDeadline('');
    setNotes('');
    setSubmitError(null);
    setPathValidation({ status: 'idle' });
    setDetectedFolders([]);
    setIsRestoredDraft(false);
    setServices([
      {
        id: 'srv-1',
        name: 'Frontend',
        folder: './',
        command: 'npm run dev',
        isCustomFolder: false,
      },
    ]);
  };

  // Safe close handler that guarantees draft persistence when adding a repo
  const handleClose = useCallback(() => {
    if (!initialProject && isInitializedRef.current) {
      const currentDraft: AddRepoDraft = {
        name,
        path,
        githubUrl,
        category,
        priority,
        deadline,
        notes,
        services,
        savedAt: new Date().toISOString(),
      };
      if (isDraftMeaningful(currentDraft)) {
        saveRepoDraft(currentDraft);
        onDraftChange?.(true);
        onDraftSavedNotify?.();
      }
    }
    onClose();
  }, [
    initialProject,
    name,
    path,
    githubUrl,
    category,
    priority,
    deadline,
    notes,
    services,
    onDraftChange,
    onDraftSavedNotify,
    onClose,
  ]);

  // Escape key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  if (!isRendered) return null;

  const handleAddService = () => {
    const newId = `srv-${Date.now()}-${services.length + 1}`;
    const unusedFolder =
      detectedFolders.find(
        (f) => f !== './' && !services.some((s) => s.folder === f)
      ) || './';
    const suggestedName = inferServiceNameFromFolder(unusedFolder, services.length);

    setServices([
      ...services,
      {
        id: newId,
        name: suggestedName,
        folder: unusedFolder,
        command: 'npm run dev',
        isCustomFolder: false,
      },
    ]);
  };

  const handleRemoveService = (index: number) => {
    if (services.length <= 1) return;
    setServices(services.filter((_, idx) => idx !== index));
  };

  const handleUpdateService = (index: number, updates: Partial<ServiceFormItem>) => {
    setServices((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, ...updates } : item))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const cleanPath = path.trim().replace(/^["']|["']$/g, '').trim();

    if (!trimmedName) {
      setSubmitError('Project Name is required.');
      return;
    }

    if (!cleanPath) {
      setSubmitError('Directory path is required.');
      setPathValidation({
        status: 'invalid',
        errorMessage: 'Directory path cannot be empty. Please provide an absolute folder path.',
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Strictly verify path on disk before creating or saving repository
      const val = await validateDirectoryPath(cleanPath);

      if (!val.isValid) {
        setPathValidation({
          status: 'invalid',
          errorMessage: val.errorMessage || 'Directory path does not exist on disk.',
        });
        setSubmitError(
          val.errorMessage ||
            'Cannot save repository: The specified path does not exist on disk or is not a folder.'
        );
        setIsSubmitting(false);
        return; // Block submission!
      }

      const finalPath = val.canonicalPath || cleanPath;

      const sanitizedServices: ProjectService[] = services.map((s, idx) => ({
        id: s.id || `srv-${Date.now()}-${idx}`,
        name: s.name?.trim() || inferServiceNameFromFolder(s.folder || './', idx),
        folder: (s.folder || './').trim(),
        command: (s.command || 'npm run dev').trim(),
      }));

      if (!initialProject) {
        clearRepoDraft();
        onDraftChange?.(false);
        setIsRestoredDraft(false);
      }

      onSave({
        ...(initialProject ? { id: initialProject.id } : {}),
        name: trimmedName,
        path: finalPath,
        category,
        priority,
        deadline: deadline || undefined,
        githubUrl: githubUrl.trim() ? formatRepoWebUrl(githubUrl.trim()) : undefined,
        services: sanitizedServices,
        devCommand: sanitizedServices[0]?.command || 'npm run dev',
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err) {
      console.error('Validation error on submit:', err);
      setSubmitError(`Validation error: ${err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs transition-opacity duration-300 ease-out ${
        isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      onClick={handleClose}
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
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-subtle)] shrink-0">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-[var(--text-primary)] font-sans">
                {initialProject ? 'Edit Repository' : 'Add Repository'}
              </h2>
              <p className="text-xs font-mono text-[var(--text-tertiary)] mt-0.5">
                {initialProject
                  ? 'Update metadata and local service configurations'
                  : 'Add a local codebase directory to your command deck'}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-canvas)] transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 pb-28 space-y-5 flex-1 overflow-y-auto">
            {/* Restored Draft Banner */}
            {isRestoredDraft && !initialProject && (
              <div className="p-3.5 rounded-lg border border-amber-500/40 bg-amber-500/10 text-xs font-mono flex items-center justify-between gap-3 animate-fade-in shadow-2xs">
                <div className="flex items-center gap-2.5 text-amber-500 dark:text-amber-400 min-w-0">
                  <AlertTriangle size={16} className="shrink-0 text-amber-500" />
                  <div className="min-w-0">
                    <span className="font-semibold text-amber-600 dark:text-amber-300 uppercase tracking-wide text-[11px] block">
                      Unsaved Draft Restored
                    </span>
                    <span className="text-[11px] text-[var(--text-secondary)] truncate block">
                      Recovered your previously entered repository data and configured services.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDiscardDraft}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-amber-500/30 hover:border-amber-500/60 bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-300 text-xs font-mono font-medium cursor-pointer transition-all shrink-0"
                  title="Discard saved draft and reset all fields"
                >
                  <Trash2 size={13} />
                  <span>Discard</span>
                </button>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium font-mono uppercase text-[var(--text-secondary)] mb-1.5">
                Project Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Analytics Backend API"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="monochrome-input w-full px-3.5 py-2 rounded-md text-xs placeholder-[var(--text-tertiary)]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5 relative">
                <label className="block text-xs font-medium font-mono uppercase text-[var(--text-secondary)]">
                  Directory Path (Absolute) *
                </label>

                {/* Help Question Mark Button */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowPathHelp(!showPathHelp)}
                    title="How to select repository folder"
                    className="monochrome-btn p-1 rounded-full text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer flex items-center"
                  >
                    <CircleHelp size={13} />
                  </button>

                  {/* Informational Bubble Popover */}
                  {showPathHelp && (
                    <div
                      className="absolute right-0 top-full mt-2 w-72 p-3.5 rounded-xl border border-[var(--border-hover)] bg-[var(--bg-card)] shadow-2xl text-[11px] font-mono z-30 text-[var(--text-primary)] animate-fade-in"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="absolute -top-1.5 right-2.5 w-3 h-3 rotate-45 border-t border-l border-[var(--border-hover)] bg-[var(--bg-card)]" />

                      <div className="flex items-start justify-between gap-2 mb-2 pb-1.5 border-b border-[var(--border-color)] relative z-10">
                        <span className="font-semibold text-xs text-[var(--text-primary)]">
                          Selecting your folder
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowPathHelp(false)}
                          className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer"
                        >
                          <X size={13} />
                        </button>
                      </div>

                      <div className="space-y-1.5 text-[var(--text-secondary)] leading-relaxed relative z-10">
                        <div className="flex items-start gap-1.5">
                          <span className="text-[var(--text-primary)] font-bold">1.</span>
                          <span>Click <strong>Browse</strong> to choose your folder directly via File Explorer.</span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <span className="text-[var(--text-primary)] font-bold">2.</span>
                          <span>Or open <strong>File Explorer</strong>, press <kbd className="px-1 py-0.5 rounded bg-[var(--bg-subtle)] border border-[var(--border-color)] text-[10px]">Ctrl + L</kbd> to copy the path, and paste it here.</span>
                        </div>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-[var(--border-color)] text-[10px] text-[var(--text-tertiary)] truncate relative z-10">
                        e.g. C:\Users\ThinkPad\Projects\app
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Input + Native Browse Button Group */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1 min-w-0">
                  <Folder
                    size={14}
                    className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
                      pathValidation.status === 'invalid'
                        ? 'text-rose-500'
                        : pathValidation.status === 'valid'
                        ? 'text-emerald-500'
                        : 'text-[var(--text-tertiary)]'
                    }`}
                  />
                  <input
                    type="text"
                    required
                    placeholder="C:\Users\...\Projects\api"
                    value={path}
                    onChange={(e) => handlePathChange(e.target.value)}
                    className={`monochrome-input w-full pl-9 pr-9 py-2 rounded-md text-xs font-mono placeholder-[var(--text-tertiary)] transition-colors ${
                      pathValidation.status === 'invalid'
                        ? '!border-rose-500 focus:!border-rose-500 !ring-rose-500/20'
                        : pathValidation.status === 'valid'
                        ? '!border-emerald-500/50'
                        : ''
                    }`}
                  />

                  {/* Status Indicator Icon in right edge of input */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                    {pathValidation.status === 'checking' && (
                      <RefreshCw size={13} className="animate-spin text-[var(--text-secondary)]" />
                    )}
                    {pathValidation.status === 'valid' && (
                      <CheckCircle2 size={14} className="text-emerald-500" />
                    )}
                    {pathValidation.status === 'invalid' && (
                      <AlertCircle size={14} className="text-rose-500" />
                    )}
                  </div>
                </div>

                {/* Browse Button */}
                <button
                  type="button"
                  onClick={handleBrowseFolder}
                  disabled={isBrowsing}
                  className="monochrome-btn inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-[var(--border-color)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-card)] hover:border-[var(--border-hover)] text-xs font-mono font-medium text-[var(--text-primary)] transition-all cursor-pointer shrink-0 shadow-2xs disabled:opacity-50"
                  title="Browse computer to select repository folder"
                >
                  <FolderOpen size={14} className="text-sky-500 shrink-0" />
                  <span>{isBrowsing ? 'Browsing...' : 'Browse'}</span>
                </button>
              </div>

              {/* Status Message / Error Fallback Alert */}
              {pathValidation.status === 'invalid' && (
                <div className="mt-2 p-3 rounded-lg border border-rose-500/30 bg-rose-500/5 text-rose-500 text-xs font-mono space-y-1.5 animate-fade-in">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={15} className="shrink-0 mt-0.5 text-rose-500" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-rose-500 text-[11px] uppercase tracking-wide">
                        Invalid Directory Path
                      </div>
                      <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-relaxed break-all">
                        {pathValidation.errorMessage || 'Directory path does not exist on disk or is not a folder.'}
                      </p>
                    </div>
                  </div>
                  <div className="pl-6 pt-1 border-t border-rose-500/20 text-[10px] text-[var(--text-tertiary)] flex flex-wrap items-center gap-1.5">
                    <span>Tip: In File Explorer, open your folder and press <kbd className="px-1 py-0.5 bg-[var(--bg-subtle)] border border-[var(--border-color)] rounded text-[var(--text-secondary)]">Ctrl + L</kbd> to copy the exact path.</span>
                  </div>
                </div>
              )}

              {pathValidation.status === 'valid' && (
                <div className="mt-2 px-3 py-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 text-xs font-mono flex items-center justify-between animate-fade-in">
                  <div className="flex items-center gap-2 min-w-0 text-[var(--text-primary)]">
                    <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                    <span className="text-[11px] truncate font-medium">
                      Verified folder on disk
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-500 font-medium shrink-0 pl-2">
                    {detectedFolders.length} subfolders discovered
                  </span>
                </div>
              )}

              {pathValidation.status === 'checking' && (
                <div className="mt-2 px-3 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] text-xs font-mono flex items-center gap-2 text-[var(--text-tertiary)]">
                  <RefreshCw size={11} className="animate-spin text-[var(--text-secondary)] shrink-0" />
                  <span className="text-[11px]">Verifying path on disk...</span>
                </div>
              )}
            </div>

            {/* GitHub / Remote Repository URL Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium font-mono uppercase text-[var(--text-secondary)]">
                  GitHub / Remote URL (Optional)
                </label>
                {githubUrl.trim() && (
                  <span className="text-[10px] text-sky-500 font-mono truncate max-w-[220px]">
                    {formatRepoWebUrl(githubUrl)}
                  </span>
                )}
              </div>
              <div className="relative">
                <GithubIcon
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
                />
                <input
                  type="text"
                  placeholder="https://github.com/username/project or owner/repo"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  className="monochrome-input w-full pl-9 pr-3.5 py-2 rounded-md text-xs font-mono placeholder-[var(--text-tertiary)]"
                />
              </div>
              <p className="mt-1 text-[10px] font-mono text-[var(--text-tertiary)]">
                Auto-detected from Git if present. Enables 1-click browser redirect in the repository modal.
              </p>
            </div>

            {/* Custom Category & Priority Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium font-mono uppercase text-[var(--text-secondary)] mb-1.5">
                  Category
                </label>
                <CustomSelect
                  value={category}
                  onChange={(val) => setCategory(val)}
                  options={categoryOptions}
                  menuWidth="w-full sm:min-w-[280px]"
                  align="left"
                />
              </div>

              <div>
                <label className="block text-xs font-medium font-mono uppercase text-[var(--text-secondary)] mb-1.5">
                  Priority
                </label>
                <CustomSelect
                  value={priority}
                  onChange={(val) => setPriority(val)}
                  options={priorityOptions}
                  menuWidth="w-full sm:min-w-[280px]"
                  align="right"
                />
              </div>
            </div>

            {/* Services & Process Controller Commands */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Layers size={13} className="text-[var(--text-secondary)]" />
                  <label className="block text-xs font-medium font-mono uppercase text-[var(--text-secondary)]">
                    Services & Commands
                  </label>
                  <span className="text-[10px] font-mono text-[var(--text-tertiary)]">
                    ({services.length})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {isScanningFolders ? (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-[var(--text-tertiary)] animate-pulse">
                      <RefreshCw size={10} className="animate-spin text-[var(--text-secondary)]" />
                      <span>Scanning directories...</span>
                    </span>
                  ) : detectedFolders.length > 0 ? (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-500 font-medium">
                      <FolderTree size={11} />
                      <span>{detectedFolders.length} subfolders found</span>
                    </span>
                  ) : path.trim() ? (
                    <span className="text-[10px] font-mono text-[var(--text-tertiary)]">
                      Root only
                    </span>
                  ) : null}

                  {path.trim() && (
                    <button
                      type="button"
                      onClick={() => validateAndScan(path)}
                      disabled={isScanningFolders}
                      title="Re-scan directory folders from disk"
                      className="monochrome-btn p-1 rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-canvas)] transition-colors cursor-pointer"
                    >
                      <RefreshCw size={11} className={isScanningFolders ? 'animate-spin' : ''} />
                    </button>
                  )}
                </div>
              </div>

              <p className="text-[11px] font-mono text-[var(--text-tertiary)] mb-3">
                {detectedFolders.length > 0
                  ? `Choose from ${detectedFolders.length} subdirectories detected directly on disk, or enter a custom path.`
                  : 'Configure services to run for this repository (e.g. frontend, backend API, worker).'}
              </p>

              {/* Service Cards List */}
              <div className="space-y-3">
                {services.map((service, index) => {
                  const isKnown = dynamicFolderOptions.some(
                    (o) => o.value !== '__custom__' && o.value === service.folder
                  );
                  const selectValue = service.isCustomFolder
                    ? '__custom__'
                    : isKnown
                    ? service.folder
                    : '__custom__';

                  return (
                    <div
                      key={service.id || index}
                      className="p-3.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] space-y-3"
                    >
                      {/* Service Header Row */}
                      <div className="flex items-center justify-between pb-2.5 border-b border-[var(--border-color)]">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-[var(--bg-canvas)] border border-[var(--border-color)] text-[10px] font-mono font-bold flex items-center justify-center text-[var(--text-primary)]">
                            {index + 1}
                          </span>
                          <span className="text-xs font-mono font-semibold text-[var(--text-primary)]">
                            {service.name.trim() || `Service #${index + 1}`}
                          </span>
                        </div>

                        {services.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveService(index)}
                            className="p-1 rounded text-[var(--text-tertiary)] hover:text-rose-500 hover:bg-[var(--bg-canvas)] transition-colors cursor-pointer"
                            title="Remove service"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>

                      {/* Explicit Service Name Input */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)]">
                            Service Name *
                          </label>
                          <span className="text-[10px] font-mono text-[var(--text-tertiary)]">
                            Identifies process (e.g. Frontend vs Backend)
                          </span>
                        </div>
                        <div className="relative">
                          <Tag
                            size={12}
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none"
                          />
                          <input
                            type="text"
                            required
                            placeholder="e.g. Frontend, Backend API, Webhook Worker, Docs"
                            value={service.name}
                            onChange={(e) =>
                              handleUpdateService(index, { name: e.target.value })
                            }
                            className="monochrome-input w-full pl-8 pr-3 py-1.5 rounded-md text-xs font-mono placeholder-[var(--text-tertiary)]"
                          />
                        </div>
                      </div>

                      {/* 2 Required Input Fields: Folder Dropdown & Command Input */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Input Field 1: Folder Selector Dropdown */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)]">
                              Folder (Working Directory) *
                            </label>
                            {detectedFolders.length > 0 && (
                              <span className="text-[10px] font-mono text-emerald-500">
                                {detectedFolders.length} detected
                              </span>
                            )}
                          </div>
                          <CustomSelect
                            value={selectValue}
                            onChange={(val) => {
                              const chosenFolder =
                                val === '__custom__'
                                  ? service.folder === './'
                                    ? './'
                                    : service.folder
                                  : val;
                              const updates: Partial<ServiceFormItem> = {
                                isCustomFolder: val === '__custom__',
                                folder: chosenFolder,
                              };
                              if (
                                !service.name.trim() ||
                                service.name === 'Frontend' ||
                                service.name === 'Backend API' ||
                                service.name === 'Main Service' ||
                                service.name.startsWith('Service ')
                              ) {
                                updates.name = inferServiceNameFromFolder(
                                  chosenFolder,
                                  index
                                );
                              }
                              handleUpdateService(index, updates);
                            }}
                            options={dynamicFolderOptions}
                            menuWidth="w-full sm:min-w-[280px]"
                            align="left"
                          />

                          {/* Inline custom folder path input if custom is chosen */}
                          {(service.isCustomFolder || selectValue === '__custom__') && (
                            <div className="relative mt-2">
                              <Folder
                                size={12}
                                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none"
                              />
                              <input
                                type="text"
                                placeholder="./custom-path"
                                value={service.folder}
                                onChange={(e) =>
                                  handleUpdateService(index, {
                                    folder: e.target.value,
                                    isCustomFolder: true,
                                  })
                                }
                                className="monochrome-input w-full pl-8 pr-3 py-1.5 rounded-md text-xs font-mono placeholder-[var(--text-tertiary)]"
                              />
                            </div>
                          )}
                        </div>

                        {/* Input Field 2: Command Input */}
                        <div>
                          <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] mb-1">
                            Service Command *
                          </label>
                          <div className="relative">
                            <Terminal
                              size={13}
                              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none"
                            />
                            <input
                              type="text"
                              required
                              placeholder="e.g. npm run dev, cargo run, bun dev"
                              value={service.command}
                              onChange={(e) =>
                                handleUpdateService(index, { command: e.target.value })
                              }
                              className="monochrome-input w-full pl-8 pr-3 py-2 rounded-md text-xs font-mono placeholder-[var(--text-tertiary)]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Add Service Button */}
                <button
                  type="button"
                  onClick={handleAddService}
                  className="monochrome-btn w-full py-2.5 rounded-lg border border-dashed border-[var(--border-color)] hover:border-[var(--border-hover)] bg-[var(--bg-canvas)] hover:bg-[var(--bg-subtle)] text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Add Another Service</span>
                </button>
              </div>
            </div>

            {/* Custom Date & Time Picker */}
            <div>
              <label className="block text-xs font-medium font-mono uppercase text-[var(--text-secondary)] mb-1.5">
                Target Deadline (Optional)
              </label>
              <CustomDateTimePicker
                value={deadline}
                onChange={(val) => setDeadline(val)}
                placeholder="Select target deadline & time..."
              />
            </div>

            {/* Notes & Reminders */}
            <div>
              <label className="block text-xs font-medium font-mono uppercase text-[var(--text-secondary)] mb-1.5">
                Notes & Reminders
              </label>
              <div className="relative">
                <FileText
                  size={14}
                  className="absolute left-3 top-3 text-[var(--text-tertiary)] pointer-events-none"
                />
                <textarea
                  rows={3}
                  placeholder="Active sprint goal, key branches, current blockers..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="monochrome-input w-full pl-9 pr-3.5 py-2 rounded-md text-xs placeholder-[var(--text-tertiary)] resize-none"
                />
              </div>
            </div>

            {/* Error Fallback Banner upon submission */}
            {submitError && (
              <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/5 text-rose-500 text-xs font-mono flex items-start gap-2.5 animate-fade-in">
                <AlertTriangle size={15} className="shrink-0 mt-0.5 text-rose-500" />
                <div className="flex-1">
                  <div className="font-semibold text-rose-500 text-[11px] uppercase tracking-wide">
                    Cannot Add Repository
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                    {submitError}
                  </p>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-[var(--border-color)]">
              <div>
                {isRestoredDraft && !initialProject && (
                  <button
                    type="button"
                    onClick={handleDiscardDraft}
                    className="monochrome-btn inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-amber-500/30 hover:border-amber-500/60 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 dark:text-amber-400 text-xs font-mono cursor-pointer transition-colors"
                  >
                    <Trash2 size={13} />
                    <span>Discard Draft</span>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleClose}
                  className="monochrome-btn px-4 py-2 rounded-md border border-[var(--border-color)] bg-[var(--bg-canvas)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-mono cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || pathValidation.status === 'invalid'}
                  className={`monochrome-btn inline-flex items-center gap-1.5 px-5 py-2 rounded-md bg-[var(--accent-btn-bg)] text-[var(--accent-btn-text)] text-xs font-mono font-medium transition-all shadow-xs ${
                    isSubmitting || pathValidation.status === 'invalid'
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:opacity-90 cursor-pointer'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Verifying Path...</span>
                    </>
                  ) : (
                    <>
                      <Save size={13} />
                      <span>{initialProject ? 'Save Changes' : 'Add Repository'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
