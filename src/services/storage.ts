import { Project, UserSettings, getProjectServices } from '../types';

const PROJECTS_STORAGE_KEY = 'devhub_projects_v3';
const SETTINGS_STORAGE_KEY = 'devhub_settings_v2';

const LEGACY_MOCK_IDS = new Set([
  'devhub-core',
  'client-api',
  'portfolio-site',
  'school-comp-sci',
  'code-reviewer-cli',
]);

export const DEFAULT_SETTINGS: UserSettings = {
  developerName: 'Developer',
  animateGreetingName: true,
  theme: 'system',
  autostartOnLogin: true,
  minimizeToTray: true,
  preferredIde: 'vscode',
  defaultTerminal: 'powershell',
  defaultProjectsDir: 'C:\\Users\\ThinkPad\\Desktop\\Danny',
};

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'sample-project',
    name: 'Sample Project',
    path: 'C:\\Users\\ThinkPad\\Desktop\\Danny\\Development Hub',
    category: 'work',
    priority: 'medium',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: 'Sample repository to explore DevHub features: multi-service controller, working tree diagram, and document viewer.',
    favorite: true,
    services: [
      {
        id: 'srv-sample-1',
        name: 'Frontend Service',
        folder: './',
        command: 'npm run dev',
      },
      {
        id: 'srv-sample-2',
        name: 'Core Service',
        folder: './src-tauri',
        command: 'cargo check',
      },
    ],
    devCommand: 'npm run dev',
    gitStatus: {
      branch: 'main',
      uncommittedCount: 0,
      lastCommitTime: new Date().toISOString(),
      lastCommitMessage: 'initial commit',
      isClean: true,
    },
    lastOpenedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
];

export const loadProjects = (): Project[] => {
  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (!raw) {
      // Check legacy storage keys (v2 / v1)
      const legacyRaw =
        localStorage.getItem('devhub_projects_v2') ||
        localStorage.getItem('devhub_projects');
      if (legacyRaw) {
        try {
          const legacyParsed: Project[] = JSON.parse(legacyRaw);
          // Preserve any custom user-created projects while filtering out the old 5 mock projects
          const customProjects = legacyParsed.filter(
            (p) => !LEGACY_MOCK_IDS.has(p.id)
          );
          if (customProjects.length > 0) {
            const combined = [...INITIAL_PROJECTS, ...customProjects];
            saveProjects(combined);
            return combined;
          }
        } catch {
          // ignore legacy parse errors
        }
      }
      saveProjects(INITIAL_PROJECTS);
      return INITIAL_PROJECTS;
    }
    const parsed: Project[] = JSON.parse(raw);
    return parsed.map((p) => {
      if (!p.services || p.services.length === 0) {
        return {
          ...p,
          services: getProjectServices(p),
        };
      }
      return p;
    });
  } catch (err) {
    console.error('Failed to load projects:', err);
    return INITIAL_PROJECTS;
  }
};

export const saveProjects = (projects: Project[]): void => {
  try {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  } catch (err) {
    console.error('Failed to save projects:', err);
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
