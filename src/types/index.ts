export type ProjectCategory = 'all' | 'work' | 'client' | 'personal' | 'school' | 'open-source';

export type Priority = 'low' | 'medium' | 'high' | 'critical';

export type ThemeMode = 'dark' | 'light' | 'system';

export type NavigationTab = 'home' | 'tools' | 'about';

export interface GitStatus {
  branch: string;
  uncommittedCount: number;
  lastCommitTime: string;
  lastCommitMessage: string;
  isClean: boolean;
  remoteUrl?: string;
}

export interface RunningProcess {
  pid: number;
  command: string;
  startedAt: string;
  port?: number;
}

export interface ProjectService {
  id: string;
  name?: string;
  folder: string;
  command: string;
  runningProcess?: RunningProcess;
}

export interface FileTreeNode {
  id: string;
  name: string;
  path: string;
  isDir: boolean;
  size?: number;
  extension?: string;
  children?: FileTreeNode[];
}

export const getProjectServices = (project: Project): ProjectService[] => {
  if (project.services && project.services.length > 0) {
    return project.services;
  }
  return [
    {
      id: 'srv-1',
      name: 'Frontend',
      folder: './',
      command: project.devCommand || 'npm run dev',
      runningProcess: project.runningProcess,
    },
  ];
};

export interface Project {
  id: string;
  name: string;
  path: string;
  category: Exclude<ProjectCategory, 'all'>;
  priority: Priority;
  deadline?: string; // YYYY-MM-DD
  notes?: string;
  favorite: boolean;
  services?: ProjectService[];
  devCommand?: string;
  runningProcess?: RunningProcess;
  gitStatus?: GitStatus;
  githubUrl?: string;
  lastOpenedAt?: string;
  createdAt: string;
}

export interface UserSettings {
  developerName: string;
  animateGreetingName: boolean;
  theme: ThemeMode;
  autostartOnLogin: boolean;
  minimizeToTray: boolean;
  preferredIde: 'vscode' | 'cursor' | 'zed' | 'sublime' | 'custom';
  defaultTerminal: 'powershell' | 'terminal' | 'cmd';
  defaultProjectsDir?: string;
}

export interface AddRepoDraftServiceItem {
  id: string;
  name: string;
  folder: string;
  command: string;
  isCustomFolder?: boolean;
}

export interface AddRepoDraft {
  name: string;
  path: string;
  githubUrl: string;
  category: Exclude<ProjectCategory, 'all'>;
  priority: Priority;
  deadline: string;
  notes: string;
  services: AddRepoDraftServiceItem[];
  savedAt: string;
}
