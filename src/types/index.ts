export type ProjectCategory = 'all' | 'work' | 'client' | 'personal' | 'open-source';

export type Priority = 'low' | 'medium' | 'high' | 'critical';

export interface GitStatus {
  branch: string;
  uncommittedCount: number;
  lastCommitTime: string;
  lastCommitMessage: string;
  isClean: boolean;
}

export interface Project {
  id: string;
  name: string;
  path: string;
  category: Exclude<ProjectCategory, 'all'>;
  priority: Priority;
  deadline?: string; // ISO 8601 string: YYYY-MM-DD
  notes?: string;
  favorite: boolean;
  gitStatus?: GitStatus;
  lastOpenedAt?: string;
  createdAt: string;
}

export interface UserSettings {
  autostartOnLogin: boolean;
  minimizeToTray: boolean;
  preferredIde: 'vscode' | 'cursor' | 'zed' | 'sublime' | 'custom';
  customIdeCommand?: string;
  defaultTerminal: 'terminal' | 'powershell' | 'cmd';
  defaultProjectsDir?: string;
}
