import { Project, UserSettings } from '../types';

const PROJECTS_STORAGE_KEY = 'devhub_projects_v1';
const SETTINGS_STORAGE_KEY = 'devhub_settings_v1';

export const DEFAULT_SETTINGS: UserSettings = {
  autostartOnLogin: true,
  minimizeToTray: true,
  preferredIde: 'vscode',
  defaultTerminal: 'powershell',
  defaultProjectsDir: 'C:\\Users\\ThinkPad\\Desktop\\Danny',
};

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'devhub-core',
    name: 'Development Hub (DevHub)',
    path: 'C:\\Users\\ThinkPad\\Desktop\\Danny\\Development Hub',
    category: 'work',
    priority: 'critical',
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: 'Cross-platform developer efficiency hub with one-click IDE launch and morning briefing.',
    favorite: true,
    gitStatus: {
      branch: 'main',
      uncommittedCount: 3,
      lastCommitTime: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      lastCommitMessage: 'feat: add morning briefing and IDE launcher spec',
      isClean: false,
    },
    lastOpenedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'client-api',
    name: 'Client E-Commerce API',
    path: 'C:\\Users\\ThinkPad\\Projects\\client-ecommerce-api',
    category: 'client',
    priority: 'high',
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: 'Stripe webhook integration & order processing refactor.',
    favorite: true,
    gitStatus: {
      branch: 'feature/payment-webhook',
      uncommittedCount: 5,
      lastCommitTime: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
      lastCommitMessage: 'wip: handle customer subscription renewals',
      isClean: false,
    },
    lastOpenedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'portfolio-redesign',
    name: 'Developer Portfolio & Blog',
    path: 'C:\\Users\\ThinkPad\\Projects\\personal-portfolio',
    category: 'personal',
    priority: 'medium',
    deadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: 'Migrating blog posts to MDX and updating projects showcase.',
    favorite: false,
    gitStatus: {
      branch: 'main',
      uncommittedCount: 0,
      lastCommitTime: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      lastCommitMessage: 'style: refresh dark theme accents',
      isClean: true,
    },
    lastOpenedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ai-code-reviewer',
    name: 'OpenSource AI Code Reviewer',
    path: 'C:\\Users\\ThinkPad\\Projects\\ai-code-reviewer',
    category: 'open-source',
    priority: 'low',
    notes: 'CLI tool that analyzes git diffs using LLMs.',
    favorite: false,
    gitStatus: {
      branch: 'feat/ast-parser',
      uncommittedCount: 1,
      lastCommitTime: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
      lastCommitMessage: 'refactor: tree-sitter bindings',
      isClean: false,
    },
    lastOpenedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const loadProjects = (): Project[] => {
  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (!raw) {
      saveProjects(INITIAL_PROJECTS);
      return INITIAL_PROJECTS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load projects from storage:', err);
    return INITIAL_PROJECTS;
  }
};

export const saveProjects = (projects: Project[]): void => {
  try {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  } catch (err) {
    console.error('Failed to save projects to storage:', err);
  }
};

export const loadSettings = (): UserSettings => {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      saveSettings(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (err) {
    console.error('Failed to load settings:', err);
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (settings: UserSettings): void => {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
};
