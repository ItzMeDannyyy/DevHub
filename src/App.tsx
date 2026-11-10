import { useState, useEffect, useMemo } from 'react';
import {
  FolderPlus,
  CheckCircle2,
} from 'lucide-react';
import { Project, ProjectCategory, UserSettings } from './types';
import {
  loadProjects,
  saveProjects,
  loadSettings,
  saveSettings,
  INITIAL_PROJECTS,
} from './services/storage';
import {
  openInIde,
  openInTerminal,
  openInFileManager,
} from './services/tauriBridge';
import { Navbar } from './components/Navbar';
import { MorningBriefing } from './components/MorningBriefing';
import { ProjectCard } from './components/ProjectCard';
import { AddProjectModal } from './components/AddProjectModal';
import { SettingsModal } from './components/SettingsModal';
import './App.css';

export function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [settings, setSettings] = useState<UserSettings>(loadSettings);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initialize
  useEffect(() => {
    setProjects(loadProjects());
  }, []);

  // Save projects whenever they change
  const updateProjectsState = (updated: Project[]) => {
    setProjects(updated);
    saveProjects(updated);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        if (searchInput) searchInput.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Launch Handlers
  const handleOpenIde = async (p: Project) => {
    const res = await openInIde(p.path, settings.preferredIde);
    showToast(res.message);

    // Update lastOpenedAt timestamp
    const updated = projects.map((item) =>
      item.id === p.id ? { ...item, lastOpenedAt: new Date().toISOString() } : item
    );
    updateProjectsState(updated);
  };

  const handleOpenTerminal = async (p: Project) => {
    const res = await openInTerminal(p.path);
    showToast(res.message);
  };

  const handleOpenFolder = async (p: Project) => {
    const res = await openInFileManager(p.path);
    showToast(res.message);
  };

  const handleToggleFavorite = (id: string) => {
    const updated = projects.map((p) =>
      p.id === id ? { ...p, favorite: !p.favorite } : p
    );
    updateProjectsState(updated);
  };

  const handleDeleteProject = (id: string) => {
    if (confirm('Are you sure you want to remove this project from DevHub?')) {
      const updated = projects.filter((p) => p.id !== id);
      updateProjectsState(updated);
      showToast('Project removed');
    }
  };

  const handleSaveProject = (projectData: Partial<Project>) => {
    if (projectData.id) {
      // Edit
      const updated = projects.map((p) =>
        p.id === projectData.id ? ({ ...p, ...projectData } as Project) : p
      );
      updateProjectsState(updated);
      showToast('Project updated successfully');
    } else {
      // Create
      const newProj: Project = {
        id: `proj-${Date.now()}`,
        name: projectData.name || 'Untitled Project',
        path: projectData.path || '',
        category: (projectData.category as any) || 'work',
        priority: projectData.priority || 'medium',
        deadline: projectData.deadline,
        notes: projectData.notes,
        favorite: false,
        gitStatus: {
          branch: 'main',
          uncommittedCount: 0,
          lastCommitTime: new Date().toISOString(),
          lastCommitMessage: 'initial setup',
          isClean: true,
        },
        createdAt: new Date().toISOString(),
        lastOpenedAt: new Date().toISOString(),
      };
      updateProjectsState([newProj, ...projects]);
      showToast('New project registered!');
    }
  };

  const handleUpdateSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleResetData = () => {
    updateProjectsState(INITIAL_PROJECTS);
    showToast('Reset to demo sample projects');
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onOpenAddModal={() => {
          setEditingProject(null);
          setIsAddModalOpen(true);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        projectCount={projects.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6">
        {/* Morning Briefing Section */}
        <MorningBriefing
          projects={projects}
          onOpenProject={handleOpenIde}
        />

        {/* Project Section Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-200">
              Active Repositories
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              ({filteredProjects.length} showing)
            </span>
          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 p-12 text-center bg-slate-900/40">
            <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <FolderPlus size={22} />
            </div>
            <h3 className="text-sm font-semibold text-slate-200">
              No matching projects found
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
              Try adjusting your search terms or filter, or add a new project to your workspace.
            </p>
            <button
              onClick={() => {
                setEditingProject(null);
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <span>Add Your First Project</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onOpenIde={handleOpenIde}
                onOpenTerminal={handleOpenTerminal}
                onOpenFolder={handleOpenFolder}
                onToggleFavorite={handleToggleFavorite}
                onEdit={(p) => {
                  setEditingProject(p);
                  setIsAddModalOpen(true);
                }}
                onDelete={handleDeleteProject}
              />
            ))}
          </div>
        )}
      </main>

      {/* Floating Action / Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg bg-slate-900 border border-indigo-500/40 text-slate-100 text-xs shadow-2xl animate-fade-in">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modals */}
      <AddProjectModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingProject(null);
        }}
        onSave={handleSaveProject}
        initialProject={editingProject}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        projects={projects}
        onResetData={handleResetData}
      />
    </div>
  );
}

export default App;
