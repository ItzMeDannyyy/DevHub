import { useState, useEffect, useMemo } from 'react';
import {
  FolderPlus,
  CheckCircle2,
  Server,
} from 'lucide-react';
import { Project, ProjectCategory, UserSettings, ThemeMode, NavigationTab, RunningProcess, getProjectServices } from './types';
import {
  loadProjects,
  saveProjects,
  loadSettings,
  saveSettings,
  loadRepoDraft,
  INITIAL_PROJECTS,
} from './services/storage';
import {
  openInIde,
  openInTerminal,
  openInFileManager,
  startDevProcess,
  killProcess,
  resolveServicePath,
  validateDirectoryPath,
  inspectGitRepo,
  checkProcessRunning,
} from './services/tauriBridge';
import { Navbar } from './components/Navbar';
import { MainNavigationBar } from './components/MainNavigationBar';
import { DeveloperTools } from './components/DeveloperTools';
import { AboutView } from './components/AboutView';
import { ScopeFilter } from './components/ScopeFilter';
import { ProjectCard } from './components/ProjectCard';
import { ProjectControlModal } from './components/ProjectControlModal';
import { AddProjectModal } from './components/AddProjectModal';
import { SettingsModal } from './components/SettingsModal';
import { WorkingTreeDiagramView } from './components/WorkingTreeDiagramView';
import { ActiveServicesModal } from './components/ActiveServicesModal';
import './App.css';

export function App() {
  const [projects, setProjects] = useState<Project[]>(loadProjects);
  const [settings, setSettings] = useState<UserSettings>(loadSettings);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [hasRepoDraft, setHasRepoDraft] = useState<boolean>(() => loadRepoDraft() !== null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [treeProject, setTreeProject] = useState<Project | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isActiveServicesModalOpen, setIsActiveServicesModalOpen] = useState(false);
  const [activeNavTab, setActiveNavTab] = useState<NavigationTab>('home');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const totalActiveServicesCount = useMemo(() => {
    return projects.reduce((acc, p) => {
      const srvs = getProjectServices(p);
      return acc + srvs.filter((s) => !!s.runningProcess).length;
    }, 0);
  }, [projects]);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      if (activeNavTab !== 'home') setActiveNavTab('home');
      if (treeProject) setTreeProject(null);
    }
  };

  // Apply Theme (Dark / Light / System)
  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      if (settings.theme === 'dark') {
        root.classList.add('dark');
      } else if (settings.theme === 'light') {
        root.classList.remove('dark');
      } else {
        // System
        if (mediaQuery.matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };

    applyTheme();

    const listener = () => {
      if (settings.theme === 'system') {
        applyTheme();
      }
    };

    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, [settings.theme]);

  // Select project & lazily verify process health on-demand
  const handleSelectProject = async (p: Project) => {
    setSelectedProject(p);

    const srvs = getProjectServices(p);
    let changed = false;
    const updatedSrvs = await Promise.all(
      srvs.map(async (s) => {
        if (s.runningProcess) {
          const alive = await checkProcessRunning(s.runningProcess.pid);
          if (!alive) {
            changed = true;
            return { ...s, runningProcess: undefined };
          }
        }
        return s;
      })
    );

    let updatedRunningProcess = p.runningProcess;
    if (updatedRunningProcess) {
      const alive = await checkProcessRunning(updatedRunningProcess.pid);
      if (!alive) {
        changed = true;
        updatedRunningProcess = undefined;
      }
    }

    if (changed) {
      const updatedProj = {
        ...p,
        services: updatedSrvs,
        runningProcess: updatedRunningProcess,
      };
      setSelectedProject((current) => {
        if (current && current.id === p.id) {
          return updatedProj;
        }
        return current;
      });
      const updatedList = projects.map((item) =>
        item.id === p.id ? updatedProj : item
      );
      updateProjectsState(updatedList);
    }
  };

  const updateProjectsState = (updated: Project[]) => {
    setProjects(updated);
    saveProjects(updated);
    // Keep selected project in sync ONLY if currently open
    setSelectedProject((current) => {
      if (current) {
        const match = updated.find((p) => p.id === current.id);
        return match || null;
      }
      return null;
    });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Keyboard shortcut Ctrl+K to navigate & focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (activeNavTab !== 'home') setActiveNavTab('home');
        if (treeProject) setTreeProject(null);
        setTimeout(() => {
          const searchInput = document.getElementById('main-search-input') as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
            searchInput.select();
          }
        }, 50);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeNavTab, treeProject]);

  // Launch Handlers with path validation guard
  const handleOpenIde = async (p: Project, customIde?: string) => {
    if (p.path) {
      const val = await validateDirectoryPath(p.path);
      if (!val.isValid) {
        showToast('Cannot open IDE: Directory does not exist on disk');
        return;
      }
    }
    const targetIde = customIde || settings.preferredIde || 'vscode';
    const res = await openInIde(p.path, targetIde);
    showToast(res.message);

    const updated = projects.map((item) =>
      item.id === p.id ? { ...item, lastOpenedAt: new Date().toISOString() } : item
    );
    updateProjectsState(updated);
  };

  const handleOpenTerminal = async (p: Project, customTerminal?: string) => {
    if (p.path) {
      const val = await validateDirectoryPath(p.path);
      if (!val.isValid) {
        showToast('Cannot open Terminal: Directory does not exist on disk');
        return;
      }
    }
    const targetTerminal = customTerminal || settings.defaultTerminal || 'powershell';
    const res = await openInTerminal(p.path, targetTerminal);
    showToast(res.message);
  };

  const handleOpenFolder = async (p: Project) => {
    if (p.path) {
      const val = await validateDirectoryPath(p.path);
      if (!val.isValid) {
        showToast('Cannot open Explorer: Directory does not exist on disk');
        return;
      }
    }
    const res = await openInFileManager(p.path);
    showToast(res.message);
  };

  // Service Process Handlers
  const handleStartService = async (p: Project, serviceId: string, cmd?: string) => {
    const services = getProjectServices(p);
    const targetService = services.find((s) => s.id === serviceId);
    if (!targetService) return;

    const commandToRun = (cmd || targetService.command).trim();
    const workingDir = resolveServicePath(p.path, targetService.folder);

    const res = await startDevProcess(workingDir, commandToRun);
    if (res.success && res.pid) {
      const runningProc: RunningProcess = {
        pid: res.pid,
        command: commandToRun,
        port: res.port || 3000,
        startedAt: new Date().toISOString(),
      };

      const updatedServices = services.map((s) =>
        s.id === serviceId
          ? { ...s, command: commandToRun, runningProcess: runningProc }
          : s
      );

      const updated = projects.map((item) =>
        item.id === p.id
          ? {
              ...item,
              services: updatedServices,
              runningProcess: runningProc,
              devCommand: commandToRun,
            }
          : item
      );
      updateProjectsState(updated);
      showToast(res.message);
    } else {
      showToast(res.message);
    }
  };

  const handleKillService = async (p: Project, serviceId: string) => {
    const services = getProjectServices(p);
    const targetService = services.find((s) => s.id === serviceId);
    if (!targetService?.runningProcess) return;

    const pid = targetService.runningProcess.pid;
    const res = await killProcess(pid);

    const updatedServices = services.map((s) =>
      s.id === serviceId ? { ...s, runningProcess: undefined } : s
    );

    const activeServices = updatedServices.filter((s) => !!s.runningProcess);

    const updated = projects.map((item) =>
      item.id === p.id
        ? {
            ...item,
            services: updatedServices,
            runningProcess: activeServices[0]?.runningProcess,
          }
        : item
    );
    updateProjectsState(updated);
    showToast(res.message);
  };

  const handleStartAllServices = async (p: Project) => {
    const services = getProjectServices(p);
    const stoppedServices = services.filter((s) => !s.runningProcess);

    if (stoppedServices.length === 0) {
      showToast('All services are already running');
      return;
    }

    showToast(`Launching ${stoppedServices.length} services simultaneously...`);

    // Concurrently trigger all stopped services
    const launchPromises = stoppedServices.map(async (service) => {
      const workingDir = resolveServicePath(p.path, service.folder);
      const res = await startDevProcess(workingDir, service.command);
      return {
        serviceId: service.id,
        command: service.command,
        res,
      };
    });

    const results = await Promise.all(launchPromises);
    let startedCount = 0;

    const updatedServices = services.map((s) => {
      const match = results.find((r) => r.serviceId === s.id);
      if (match && match.res.success && match.res.pid) {
        startedCount++;
        return {
          ...s,
          runningProcess: {
            pid: match.res.pid,
            command: match.command,
            port: match.res.port || 3000,
            startedAt: new Date().toISOString(),
          },
        };
      }
      return s;
    });

    const activeServices = updatedServices.filter((s) => !!s.runningProcess);

    const updated = projects.map((item) =>
      item.id === p.id
        ? {
            ...item,
            services: updatedServices,
            runningProcess: activeServices[0]?.runningProcess,
          }
        : item
    );
    updateProjectsState(updated);
    showToast(`Started ${startedCount} of ${stoppedServices.length} services simultaneously`);
  };

  const handleKillAllServices = async (p: Project) => {
    const services = getProjectServices(p);
    const runningServices = services.filter((s) => !!s.runningProcess);

    if (runningServices.length === 0) return;

    showToast(`Stopping ${runningServices.length} running services...`);

    await Promise.all(
      runningServices.map(async (service) => {
        if (service.runningProcess) {
          await killProcess(service.runningProcess.pid);
        }
      })
    );

    const updatedServices = services.map((s) => ({
      ...s,
      runningProcess: undefined,
    }));

    const updated = projects.map((item) =>
      item.id === p.id
        ? {
            ...item,
            services: updatedServices,
            runningProcess: undefined,
          }
        : item
    );
    updateProjectsState(updated);
    showToast(`Terminated ${runningServices.length} running services`);
  };

  const handleKillSingleActiveService = async (projectId: string, serviceId: string) => {
    const proj = projects.find((p) => p.id === projectId);
    if (!proj) return;
    await handleKillService(proj, serviceId);
  };

  const handleKillAllActiveServicesGlobally = async () => {
    const allActive = projects.flatMap((p) =>
      getProjectServices(p)
        .filter((s) => !!s.runningProcess)
        .map((s) => ({ project: p, service: s, pid: s.runningProcess!.pid }))
    );

    if (allActive.length === 0) return;

    showToast(`Stopping all ${allActive.length} active services...`);

    await Promise.all(allActive.map((item) => killProcess(item.pid)));

    const updated = projects.map((p) => {
      const srvs = getProjectServices(p);
      const cleaned = srvs.map((s) => ({
        ...s,
        runningProcess: undefined,
      }));
      return {
        ...p,
        services: cleaned,
        runningProcess: undefined,
      };
    });

    updateProjectsState(updated);
    if (selectedProject) {
      const updatedSelected = updated.find((p) => p.id === selectedProject.id);
      if (updatedSelected) setSelectedProject(updatedSelected);
    }
    showToast(`Stopped all ${allActive.length} active services`);
  };

  const handleToggleFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = projects.map((p) =>
      p.id === id ? { ...p, favorite: !p.favorite } : p
    );
    updateProjectsState(updated);
  };

  const handleDeleteProject = async (id: string) => {
    if (confirm('Are you sure you want to remove this repository from DevHub?')) {
      const target = projects.find((p) => p.id === id);
      if (target) {
        const srvs = getProjectServices(target);
        await Promise.all(
          srvs.map((s) => {
            if (s.runningProcess) {
              return killProcess(s.runningProcess.pid);
            }
            return Promise.resolve();
          })
        );
      }
      const updated = projects.filter((p) => p.id !== id);
      updateProjectsState(updated);
      setSelectedProject(null);
      showToast('Repository removed');
    }
  };

  const handleRefreshGit = async (p: Project) => {
    if (!p.path) return;
    const git = await inspectGitRepo(p.path);
    if (git) {
      const updated = projects.map((item) =>
        item.id === p.id
          ? {
              ...item,
              gitStatus: {
                branch: git.branch,
                uncommittedCount: git.uncommittedCount,
                lastCommitTime: new Date().toISOString(),
                lastCommitMessage: git.lastCommitMessage,
                isClean: git.isClean,
              },
            }
          : item
      );
      updateProjectsState(updated);
    }
  };

  const handleImportProjects = (imported: Project[]) => {
    const existingIds = new Set(projects.map((p) => p.id));
    const newItems = imported.filter((p) => !existingIds.has(p.id));
    const merged = [...projects, ...newItems];
    updateProjectsState(merged);
    showToast(`Imported ${newItems.length} repositories from backup`);
  };

  const handleSaveProject = (projectData: Partial<Project>) => {
    if (projectData.id) {
      const updated = projects.map((p) =>
        p.id === projectData.id ? ({ ...p, ...projectData } as Project) : p
      );
      updateProjectsState(updated);
      showToast('Repository updated');
    } else {
      const initialServices =
        projectData.services && projectData.services.length > 0
          ? projectData.services
          : [
              {
                id: `srv-${Date.now()}-1`,
                name: 'Frontend',
                folder: './',
                command: projectData.devCommand || 'npm run dev',
              },
            ];

      const newProj: Project = {
        id: `proj-${Date.now()}`,
        name: projectData.name || 'Untitled Repository',
        path: projectData.path || '',
        category: (projectData.category as any) || 'work',
        priority: projectData.priority || 'medium',
        deadline: projectData.deadline,
        services: initialServices,
        devCommand: initialServices[0]?.command || projectData.devCommand || 'npm run dev',
        notes: projectData.notes,
        favorite: false,
        gitStatus: {
          branch: 'main',
          uncommittedCount: 0,
          lastCommitTime: new Date().toISOString(),
          lastCommitMessage: 'initial commit',
          isClean: true,
        },
        createdAt: new Date().toISOString(),
        lastOpenedAt: new Date().toISOString(),
      };
      updateProjectsState([newProj, ...projects]);
      showToast('Repository added');
    }
  };

  const handleThemeChange = (newTheme: ThemeMode) => {
    const updatedSettings = { ...settings, theme: newTheme };
    setSettings(updatedSettings);
    saveSettings(updatedSettings);
  };

  const handleUpdateSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleResetData = async () => {
    // Terminate any active background services across all projects before reset
    await Promise.all(
      projects.flatMap((p) =>
        getProjectServices(p)
          .filter((s) => !!s.runningProcess)
          .map((s) => killProcess(s.runningProcess!.pid))
      )
    );
    updateProjectsState(INITIAL_PROJECTS);
    showToast('Reset to demo sample repositories');
  };

  // Filter & Search
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesCategory =
        selectedCategory === 'all' || p.category === selectedCategory;
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.gitStatus?.branch &&
          p.gitStatus.branch.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.notes && p.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesCategory && matchesSearch;
    });
  }, [projects, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col font-sans">
      {/* Top Monochrome Floating Navigation */}
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onOpenAddModal={() => {
          setEditingProject(null);
          setIsAddModalOpen(true);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        theme={settings.theme}
        onThemeChange={handleThemeChange}
        hasRepoDraft={hasRepoDraft}
        onResumeDraft={() => {
          setEditingProject(null);
          setIsAddModalOpen(true);
        }}
      />

      {/* Main Content Area (Spaced for Floating Oval Header) */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 pt-26 pb-12">
        {/* Navigation Bar (Text with a bar on bottom) - Hidden during Working Tree Diagram view */}
        {!treeProject && (
          <MainNavigationBar
            activeTab={activeNavTab}
            onSelectTab={(tab) => {
              setTreeProject(null);
              setActiveNavTab(tab);
            }}
            projectCount={projects.length}
          />
        )}

        {/* Dedicated View: Working Tree Diagram View */}
        {treeProject ? (
          <WorkingTreeDiagramView
            project={treeProject}
            onBack={() => setTreeProject(null)}
            onShowToast={showToast}
          />
        ) : (
          <>
            {/* TAB 1: Home View - Pure Repository Grid */}
            {activeNavTab === 'home' && (
              <div className="animate-fade-in">
                {/* Interactive Sliding Scope Filter */}
                <ScopeFilter
                  selectedCategory={selectedCategory}
                  onSelectCategory={setSelectedCategory}
                  projectCount={projects.length}
                />

                {/* Repositories Grid Header */}
                <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-[var(--border-color)]">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold">
                      Tracked Repositories
                    </h2>
                    <span className="text-[11px] font-mono text-[var(--text-tertiary)]">
                      [{filteredProjects.length} showing]
                    </span>
                  </div>

                  {/* Active Services Floating Modal Trigger Button */}
                  <button
                    onClick={() => setIsActiveServicesModalOpen(true)}
                    className={`monochrome-btn inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono font-medium transition-all cursor-pointer shadow-2xs ${
                      totalActiveServicesCount > 0
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-500/20'
                        : 'border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)]'
                    }`}
                    title="View and manage all active services across repositories"
                  >
                    <Server
                      size={13}
                      className={
                        totalActiveServicesCount > 0
                          ? 'text-emerald-500 animate-pulse'
                          : 'text-[var(--text-tertiary)]'
                      }
                    />
                    <span>Active Services</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                        totalActiveServicesCount > 0
                          ? 'bg-emerald-500 text-white dark:text-[#0d1117]'
                          : 'bg-[var(--bg-subtle)] text-[var(--text-tertiary)] border border-[var(--border-color)]'
                      }`}
                    >
                      {totalActiveServicesCount}
                    </span>
                  </button>
                </div>

                {/* Minimalist Projects Grid */}
                {filteredProjects.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[var(--border-color)] p-12 text-center bg-[var(--bg-card)]">
                    <div className="w-9 h-9 rounded-md bg-[var(--bg-subtle)] border border-[var(--border-color)] text-[var(--text-secondary)] flex items-center justify-center mx-auto mb-3">
                      <FolderPlus size={16} />
                    </div>
                    <h3 className="text-xs font-mono font-medium text-[var(--text-primary)]">
                      No matching repositories
                    </h3>
                    <p className="text-[11px] text-[var(--text-tertiary)] max-w-sm mx-auto mt-1 mb-4 font-mono">
                      Adjust search keywords or add a new repository.
                    </p>
                    <button
                      onClick={() => {
                        setEditingProject(null);
                        setIsAddModalOpen(true);
                      }}
                      className="monochrome-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--accent-btn-bg)] text-[var(--accent-btn-text)] text-xs font-mono font-medium hover:opacity-90 cursor-pointer shadow-xs"
                    >
                      <span>Add Repository</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProjects.map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        onSelect={handleSelectProject}
                        onToggleFavorite={handleToggleFavorite}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Developer Tools and Resources */}
            {activeNavTab === 'tools' && <DeveloperTools />}

            {/* TAB 3: About View */}
            {activeNavTab === 'about' && <AboutView projects={projects} />}
          </>
        )}
      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-3.5 py-2.5 rounded-md bg-[var(--bg-card)] border border-[var(--border-hover)] text-[var(--text-primary)] text-xs font-mono shadow-2xl">
          <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Project Control Panel Modal (On Card Click) */}
      <ProjectControlModal
        project={selectedProject}
        isOpen={!!selectedProject}
        onClose={() => setSelectedProject(null)}
        onOpenIde={handleOpenIde}
        onOpenTerminal={handleOpenTerminal}
        onOpenFolder={handleOpenFolder}
        onOpenWorkingTree={(p) => {
          setSelectedProject(null);
          setTreeProject(p);
        }}
        onStartService={handleStartService}
        onKillService={handleKillService}
        onStartAllServices={handleStartAllServices}
        onKillAllServices={handleKillAllServices}
        onToggleFavorite={(id) => handleToggleFavorite(id)}
        onEdit={(p) => {
          setSelectedProject(null);
          setEditingProject(p);
          setIsAddModalOpen(true);
        }}
        onDelete={handleDeleteProject}
        onRefreshGit={handleRefreshGit}
        onBranchSwitched={(updated) => {
          setSelectedProject(updated);
          const newProjects = projects.map((item) =>
            item.id === updated.id ? updated : item
          );
          updateProjectsState(newProjects);
          showToast(`Switched to branch "${updated.gitStatus?.branch}"`);
        }}
        onUpdateProject={(updated) => {
          setSelectedProject(updated);
          const newProjects = projects.map((item) =>
            item.id === updated.id ? updated : item
          );
          updateProjectsState(newProjects);
          showToast('Repository link updated');
        }}
      />

      {/* Add / Edit Repository Modal */}
      <AddProjectModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingProject(null);
        }}
        onSave={handleSaveProject}
        initialProject={editingProject}
        onDraftChange={(draftExists) => setHasRepoDraft(draftExists)}
        onDraftSavedNotify={() => {
          showToast('Repository draft auto-saved. Click "Resume Draft" in the header anytime.');
        }}
      />

      {/* Preferences / Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        projects={projects}
        onResetData={handleResetData}
        onImportProjects={handleImportProjects}
      />

      {/* Comprehensive Active Services Floating Modal in the Center */}
      <ActiveServicesModal
        isOpen={isActiveServicesModalOpen}
        onClose={() => setIsActiveServicesModalOpen(false)}
        projects={projects}
        onKillService={handleKillSingleActiveService}
        onKillAllServices={handleKillAllActiveServicesGlobally}
        onSelectProject={(p) => {
          setIsActiveServicesModalOpen(false);
          setSelectedProject(p);
        }}
      />
    </div>
  );
}

export default App;
