import { invoke } from '@tauri-apps/api/core';
import { openUrl as tauriOpenUrl } from '@tauri-apps/plugin-opener';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { FileTreeNode } from '../types';

export const isTauriEnvironment = (): boolean => {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
};

export const openExternalUrl = async (url: string): Promise<void> => {
  if (isTauriEnvironment()) {
    try {
      await tauriOpenUrl(url);
      return;
    } catch (err) {
      console.warn('Failed to open URL via plugin-opener:', err);
    }
  }
  window.open(url, '_blank', 'noopener,noreferrer');
};

/**
 * Open a native OS folder picker dialog to select a repository directory.
 * Returns the selected absolute path, or null if the user canceled.
 */
export const selectFolderDialog = async (defaultPath?: string): Promise<string | null> => {
  if (isTauriEnvironment()) {
    try {
      const selected = await openDialog({
        directory: true,
        multiple: false,
        title: 'Select Repository Folder',
        defaultPath: defaultPath && defaultPath.trim() ? defaultPath.trim() : undefined,
      });

      if (typeof selected === 'string') {
        return selected;
      }
      return null;
    } catch (err) {
      console.warn('Native folder selection dialog failed:', err);
      return null;
    }
  }

  // Browser-only fallback when testing outside Tauri desktop shell
  const fallback = window.prompt('Enter repository folder path:', defaultPath || '');
  return fallback && fallback.trim() ? fallback.trim() : null;
};

export interface FileContentData {
  content: string;
  isBinary: boolean;
  size: number;
  lineCount: number;
}

export interface LaunchResult {
  success: boolean;
  message: string;
}

export interface ProcessStartResult {
  success: boolean;
  pid?: number;
  message: string;
  port?: number;
}

export interface PathValidationResult {
  isValid: boolean;
  exists: boolean;
  isDir: boolean;
  canonicalPath?: string;
  errorMessage?: string;
  subdirectoriesCount: number;
}

export const validateDirectoryPath = async (
  rawPath: string
): Promise<PathValidationResult> => {
  const clean = rawPath.trim().replace(/^["']|["']$/g, '').trim();

  if (!clean) {
    return {
      isValid: false,
      exists: false,
      isDir: false,
      errorMessage: 'Directory path cannot be empty. Please enter or paste a path.',
      subdirectoriesCount: 0,
    };
  }

  if (isTauriEnvironment()) {
    try {
      const res = (await invoke('validate_directory_path', { path: clean })) as {
        is_valid: boolean;
        exists: boolean;
        is_dir: boolean;
        canonical_path?: string;
        error_message?: string;
        subdirectories_count: number;
      };

      return {
        isValid: res.is_valid,
        exists: res.exists,
        isDir: res.is_dir,
        canonicalPath: res.canonical_path,
        errorMessage: res.error_message,
        subdirectoriesCount: res.subdirectories_count,
      };
    } catch (err) {
      console.error('Tauri invoke validate_directory_path failed:', err);
      return {
        isValid: false,
        exists: false,
        isDir: false,
        errorMessage: String(err),
        subdirectoriesCount: 0,
      };
    }
  }

  // Browser Preview Fallback:
  // Validate path format (Windows e.g. C:\... or POSIX /...)
  const isWindowsPath = /^[a-zA-Z]:[\\/]/.test(clean);
  const isPosixPath = clean.startsWith('/');

  if (!isWindowsPath && !isPosixPath) {
    return {
      isValid: false,
      exists: false,
      isDir: false,
      errorMessage:
        'Invalid path format. Please use an absolute path (e.g. C:\\Projects\\app or /home/user/app).',
      subdirectoriesCount: 0,
    };
  }

  // If in browser preview, check if path looks like a file extension
  const fileName = clean.split(/[\\/]/).pop() || '';
  if (fileName.includes('.') && !fileName.startsWith('.')) {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (
      ext &&
      ['ts', 'js', 'json', 'rs', 'toml', 'html', 'css', 'md', 'txt', 'py'].includes(
        ext
      )
    ) {
      return {
        isValid: false,
        exists: true,
        isDir: false,
        errorMessage: `The path points to a file (${fileName}), not a directory folder.`,
        subdirectoriesCount: 0,
      };
    }
  }

  return {
    isValid: true,
    exists: true,
    isDir: true,
    canonicalPath: clean,
    subdirectoriesCount: 3,
  };
};

export const openInIde = async (path: string, ide = 'vscode'): Promise<LaunchResult> => {
  if (isTauriEnvironment()) {
    try {
      await invoke('open_in_ide', { path, ide });
      return { success: true, message: `Opened in ${ide.toUpperCase()}` };
    } catch (err) {
      console.error('Tauri invoke open_in_ide failed:', err);
      return { success: false, message: String(err) };
    }
  }

  return {
    success: true,
    message: `[Preview] Launching ${ide.toUpperCase()} at "${path}"`,
  };
};

export const openInTerminal = async (path: string): Promise<LaunchResult> => {
  if (isTauriEnvironment()) {
    try {
      await invoke('open_in_terminal', { path });
      return { success: true, message: 'Opened terminal' };
    } catch (err) {
      console.error('Tauri invoke open_in_terminal failed:', err);
      return { success: false, message: String(err) };
    }
  }

  return {
    success: true,
    message: `[Preview] Opening terminal at "${path}"`,
  };
};

export const openInFileManager = async (path: string): Promise<LaunchResult> => {
  if (isTauriEnvironment()) {
    try {
      await invoke('open_in_file_manager', { path });
      return { success: true, message: 'Opened explorer' };
    } catch (err) {
      console.error('Tauri invoke open_in_file_manager failed:', err);
      return { success: false, message: String(err) };
    }
  }

  return {
    success: true,
    message: `[Preview] Opening folder "${path}"`,
  };
};

export const resolveServicePath = (basePath: string, folder = './'): string => {
  if (!folder || folder === './' || folder === '.') return basePath;
  const cleanFolder = folder.replace(/^(\.\/|\.\\)/, '');
  const sep = basePath.includes('/') ? '/' : '\\';
  const trimmedBase = basePath.endsWith(sep) ? basePath.slice(0, -1) : basePath;
  return `${trimmedBase}${sep}${cleanFolder}`;
};

export const listSubdirectories = async (path: string): Promise<string[]> => {
  if (!path || !path.trim()) return [];

  if (isTauriEnvironment()) {
    try {
      const dirs = (await invoke('list_subdirectories', { path: path.trim() })) as string[];
      if (Array.isArray(dirs)) {
        return dirs;
      }
    } catch (err) {
      console.warn('Failed to list subdirectories via Tauri:', err);
    }
  }

  // Fallback for current workspace if in browser preview
  const normalized = path.replace(/\\/g, '/').toLowerCase();
  if (normalized.includes('development hub')) {
    return ['./src', './src-tauri', './public'];
  }

  return [];
};

const normalizeTreeNode = (node: any, parentId = 'root'): FileTreeNode => {
  const id = `${parentId}-${node.name}`;
  return {
    id,
    name: node.name,
    path: node.path,
    isDir: !!node.is_dir,
    size: node.size,
    extension:
      node.extension ||
      (!node.is_dir && node.name.includes('.')
        ? node.name.split('.').pop()
        : undefined),
    children: Array.isArray(node.children)
      ? node.children.map((child: any) => normalizeTreeNode(child, id))
      : undefined,
  };
};

export const getDirectoryTree = async (
  path: string,
  maxDepth = 5
): Promise<FileTreeNode | null> => {
  if (!path || !path.trim()) return null;

  if (isTauriEnvironment()) {
    try {
      const tree = (await invoke('get_directory_tree', {
        path: path.trim(),
        maxDepth,
      })) as any;
      if (tree) {
        return normalizeTreeNode(tree);
      }
    } catch (err) {
      console.warn('Failed to get directory tree via Tauri:', err);
    }
  }

  // Browser preview mock generator
  return generateMockTree(path);
};

const generateMockTree = (basePath: string): FileTreeNode => {
  const normalized = basePath.replace(/\\/g, '/').toLowerCase();
  const folderName = basePath.split(/[\\/]/).filter(Boolean).pop() || 'Repository';

  if (normalized.includes('cs410') || normalized.includes('raft')) {
    return {
      id: 'root',
      name: folderName,
      path: basePath,
      isDir: true,
      children: [
        {
          id: 'root-src',
          name: 'src',
          path: `${basePath}/src`,
          isDir: true,
          children: [
            { id: 'src-lib', name: 'lib.rs', path: `${basePath}/src/lib.rs`, isDir: false, size: 14200, extension: 'rs' },
            { id: 'src-raft', name: 'raft.rs', path: `${basePath}/src/raft.rs`, isDir: false, size: 28400, extension: 'rs' },
            { id: 'src-rpc', name: 'rpc.rs', path: `${basePath}/src/rpc.rs`, isDir: false, size: 9800, extension: 'rs' },
            { id: 'src-state', name: 'state.rs', path: `${basePath}/src/state.rs`, isDir: false, size: 11500, extension: 'rs' },
          ],
        },
        {
          id: 'root-tests',
          name: 'tests',
          path: `${basePath}/tests`,
          isDir: true,
          children: [
            { id: 't-election', name: 'test_election.rs', path: `${basePath}/tests/test_election.rs`, isDir: false, size: 8400, extension: 'rs' },
            { id: 't-log', name: 'test_replication.rs', path: `${basePath}/tests/test_replication.rs`, isDir: false, size: 12300, extension: 'rs' },
          ],
        },
        { id: 'root-cargo', name: 'Cargo.toml', path: `${basePath}/Cargo.toml`, isDir: false, size: 1450, extension: 'toml' },
        { id: 'root-readme', name: 'README.md', path: `${basePath}/README.md`, isDir: false, size: 3200, extension: 'md' },
      ],
    };
  }

  if (normalized.includes('ecommerce') || normalized.includes('client-api')) {
    return {
      id: 'root',
      name: folderName,
      path: basePath,
      isDir: true,
      children: [
        {
          id: 'root-backend',
          name: 'backend',
          path: `${basePath}/backend`,
          isDir: true,
          children: [
            {
              id: 'be-src',
              name: 'src',
              path: `${basePath}/backend/src`,
              isDir: true,
              children: [
                { id: 'be-server', name: 'server.ts', path: `${basePath}/backend/src/server.ts`, isDir: false, size: 4500, extension: 'ts' },
                { id: 'be-auth', name: 'auth.ts', path: `${basePath}/backend/src/auth.ts`, isDir: false, size: 6800, extension: 'ts' },
                { id: 'be-payment', name: 'stripe.ts', path: `${basePath}/backend/src/stripe.ts`, isDir: false, size: 9100, extension: 'ts' },
              ],
            },
            { id: 'be-pkg', name: 'package.json', path: `${basePath}/backend/package.json`, isDir: false, size: 1800, extension: 'json' },
          ],
        },
        {
          id: 'root-frontend',
          name: 'frontend',
          path: `${basePath}/frontend`,
          isDir: true,
          children: [
            {
              id: 'fe-src',
              name: 'src',
              path: `${basePath}/frontend/src`,
              isDir: true,
              children: [
                { id: 'fe-app', name: 'App.tsx', path: `${basePath}/frontend/src/App.tsx`, isDir: false, size: 7200, extension: 'tsx' },
                { id: 'fe-checkout', name: 'Checkout.tsx', path: `${basePath}/frontend/src/Checkout.tsx`, isDir: false, size: 5400, extension: 'tsx' },
              ],
            },
            { id: 'fe-pkg', name: 'package.json', path: `${basePath}/frontend/package.json`, isDir: false, size: 1400, extension: 'json' },
          ],
        },
        { id: 'root-docker', name: 'docker-compose.yml', path: `${basePath}/docker-compose.yml`, isDir: false, size: 2100, extension: 'yml' },
        { id: 'root-readme', name: 'README.md', path: `${basePath}/README.md`, isDir: false, size: 4100, extension: 'md' },
      ],
    };
  }

  // Default DevHub structure
  return {
    id: 'root',
    name: folderName,
    path: basePath,
    isDir: true,
    children: [
      {
        id: 'root-src',
        name: 'src',
        path: `${basePath}/src`,
        isDir: true,
        children: [
          {
            id: 'src-components',
            name: 'components',
            path: `${basePath}/src/components`,
            isDir: true,
            children: [
              { id: 'c-navbar', name: 'Navbar.tsx', path: `${basePath}/src/components/Navbar.tsx`, isDir: false, size: 6800, extension: 'tsx' },
              { id: 'c-card', name: 'ProjectCard.tsx', path: `${basePath}/src/components/ProjectCard.tsx`, isDir: false, size: 4200, extension: 'tsx' },
              { id: 'c-modal', name: 'ProjectControlModal.tsx', path: `${basePath}/src/components/ProjectControlModal.tsx`, isDir: false, size: 16500, extension: 'tsx' },
              { id: 'c-briefing', name: 'MorningBriefing.tsx', path: `${basePath}/src/components/MorningBriefing.tsx`, isDir: false, size: 8900, extension: 'tsx' },
              { id: 'c-tree', name: 'WorkingTreeDiagram.tsx', path: `${basePath}/src/components/WorkingTreeDiagram.tsx`, isDir: false, size: 12000, extension: 'tsx' },
            ],
          },
          {
            id: 'src-services',
            name: 'services',
            path: `${basePath}/src/services`,
            isDir: true,
            children: [
              { id: 's-bridge', name: 'tauriBridge.ts', path: `${basePath}/src/services/tauriBridge.ts`, isDir: false, size: 5400, extension: 'ts' },
              { id: 's-storage', name: 'storage.ts', path: `${basePath}/src/services/storage.ts`, isDir: false, size: 6200, extension: 'ts' },
            ],
          },
          { id: 'src-app', name: 'App.tsx', path: `${basePath}/src/App.tsx`, isDir: false, size: 18200, extension: 'tsx' },
          { id: 'src-main', name: 'main.tsx', path: `${basePath}/src/main.tsx`, isDir: false, size: 1200, extension: 'tsx' },
          { id: 'src-css', name: 'App.css', path: `${basePath}/src/App.css`, isDir: false, size: 4300, extension: 'css' },
        ],
      },
      {
        id: 'root-tauri',
        name: 'src-tauri',
        path: `${basePath}/src-tauri`,
        isDir: true,
        children: [
          {
            id: 'tauri-src',
            name: 'src',
            path: `${basePath}/src-tauri/src`,
            isDir: true,
            children: [
              { id: 'rs-lib', name: 'lib.rs', path: `${basePath}/src-tauri/src/lib.rs`, isDir: false, size: 9800, extension: 'rs' },
              { id: 'rs-main', name: 'main.rs', path: `${basePath}/src-tauri/src/main.rs`, isDir: false, size: 420, extension: 'rs' },
            ],
          },
          { id: 'tauri-cargo', name: 'Cargo.toml', path: `${basePath}/src-tauri/Cargo.toml`, isDir: false, size: 1850, extension: 'toml' },
        ],
      },
      { id: 'root-pkg', name: 'package.json', path: `${basePath}/package.json`, isDir: false, size: 1100, extension: 'json' },
      { id: 'root-vite', name: 'vite.config.ts', path: `${basePath}/vite.config.ts`, isDir: false, size: 850, extension: 'ts' },
      { id: 'root-readme', name: 'README.md', path: `${basePath}/README.md`, isDir: false, size: 3400, extension: 'md' },
    ],
  };
};

export const startDevProcess = async (
  path: string,
  command = 'npm run dev'
): Promise<ProcessStartResult> => {
  if (isTauriEnvironment()) {
    try {
      const pid = (await invoke('start_dev_process', { path, command })) as number;
      return {
        success: true,
        pid,
        message: `Process started with PID ${pid} (${command})`,
      };
    } catch (err) {
      console.error('Failed to spawn dev process:', err);
      return { success: false, message: String(err) };
    }
  }

  // Simulated browser preview execution
  const simulatedPid = Math.floor(10000 + Math.random() * 89999);
  return {
    success: true,
    pid: simulatedPid,
    port: 3000,
    message: `Process started (PID: ${simulatedPid})`,
  };
};

export interface GitRepoInfo {
  branch: string;
  uncommittedCount: number;
  lastCommitMessage: string;
  isClean: boolean;
}

export const inspectGitRepo = async (path: string): Promise<GitRepoInfo | null> => {
  if (!path || !path.trim()) return null;

  if (isTauriEnvironment()) {
    try {
      const info = (await invoke('inspect_git_repo', { path: path.trim() })) as {
        branch: string;
        uncommitted_count: number;
        last_commit_message: string;
        is_clean: boolean;
      };

      return {
        branch: info.branch,
        uncommittedCount: info.uncommitted_count,
        lastCommitMessage: info.last_commit_message,
        isClean: info.is_clean,
      };
    } catch (err) {
      console.warn('Failed to inspect git repo via Tauri:', err);
      return null;
    }
  }

  return {
    branch: 'main',
    uncommittedCount: 0,
    lastCommitMessage: 'initial commit',
    isClean: true,
  };
};

export const listGitBranches = async (path: string): Promise<string[]> => {
  if (!path || !path.trim()) return [];

  if (isTauriEnvironment()) {
    try {
      return (await invoke('list_git_branches', { path: path.trim() })) as string[];
    } catch (err) {
      console.warn('Failed to list git branches via Tauri:', err);
      return [];
    }
  }

  return ['main', 'development'];
};

export const switchGitBranch = async (
  path: string,
  branch: string
): Promise<{ success: boolean; info?: GitRepoInfo; error?: string }> => {
  if (!path || !path.trim() || !branch || !branch.trim()) {
    return { success: false, error: 'Path and branch name are required' };
  }

  if (isTauriEnvironment()) {
    try {
      const info = (await invoke('switch_git_branch', {
        path: path.trim(),
        branch: branch.trim(),
      })) as {
        branch: string;
        uncommitted_count: number;
        last_commit_message: string;
        is_clean: boolean;
      };

      return {
        success: true,
        info: {
          branch: info.branch,
          uncommittedCount: info.uncommitted_count,
          lastCommitMessage: info.last_commit_message,
          isClean: info.is_clean,
        },
      };
    } catch (err: any) {
      const msg = typeof err === 'string' ? err : err?.message || 'Failed to switch branch';
      return { success: false, error: msg };
    }
  }

  return {
    success: true,
    info: {
      branch,
      uncommittedCount: 0,
      lastCommitMessage: `Switched to ${branch}`,
      isClean: true,
    },
  };
};

export const checkProcessRunning = async (pid: number): Promise<boolean> => {
  if (!pid || pid <= 0) return false;

  if (isTauriEnvironment()) {
    try {
      return (await invoke('check_process_running', { pid })) as boolean;
    } catch (err) {
      console.warn('Failed to check process status:', err);
      return false;
    }
  }

  return false;
};

export const killProcess = async (pid: number): Promise<LaunchResult> => {
  if (isTauriEnvironment()) {
    try {
      await invoke('kill_process_by_pid', { pid });
      return { success: true, message: `Terminated process PID ${pid}` };
    } catch (err) {
      console.error('Failed to kill process:', err);
      return { success: false, message: String(err) };
    }
  }

  return {
    success: true,
    message: `Terminated process PID ${pid}`,
  };
};

export const readFileContent = async (path: string): Promise<FileContentData> => {
  if (isTauriEnvironment()) {
    try {
      const res = (await invoke('read_file_content', { path: path.trim() })) as {
        content: string;
        is_binary: boolean;
        size: number;
        line_count: number;
      };
      return {
        content: res.content,
        isBinary: res.is_binary,
        size: res.size,
        lineCount: res.line_count,
      };
    } catch (err) {
      console.warn('Failed to read file via Tauri:', err);
      return {
        content: `Error reading file: ${err}`,
        isBinary: false,
        size: 0,
        lineCount: 1,
      };
    }
  }

  return getMockFileContent(path);
};

const getMockFileContent = (path: string): FileContentData => {
  const normalized = path.replace(/\\/g, '/');
  const fileName = normalized.split('/').pop() || 'file.txt';
  const ext = fileName.split('.').pop()?.toLowerCase();

  if (fileName === 'package.json') {
    const content = `{
  "name": "development-hub",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "tauri": "tauri"
  },
  "dependencies": {
    "@tauri-apps/api": "^2",
    "@tauri-apps/plugin-opener": "^2",
    "lucide-react": "^1.71.0",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "tailwindcss": "^4.3.5"
  }
}`;
    return { content, isBinary: false, size: content.length, lineCount: content.split('\n').length };
  }

  if (fileName === 'Cargo.toml') {
    const content = `[package]
name = "tauri-app"
version = "0.1.0"
description = "A Tauri App"
authors = ["you"]
edition = "2024"

[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-opener = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
`;
    return { content, isBinary: false, size: content.length, lineCount: content.split('\n').length };
  }

  if (fileName === 'README.md' || ext === 'md') {
    const content = `# Development Hub (DevHub)

A minimalist cross-platform developer command center and process controller built with **Tauri v2**, **React 19**, and **Tailwind CSS**.

## Core Capabilities
- **Monochrome & High-Contrast Design**: High visibility, zero distractions.
- **Process Controller**: Run multiple services simultaneously with custom working directories.
- **Working Tree Diagram**: Interactive visual node hierarchy of repository folders and files.
- **Document Viewer**: Double-click any file node in the tree diagram to view its contents instantly.

## Development Workflow
\`\`\`bash
# Install dependencies
npm install

# Start Vite preview
npm run dev

# Start native desktop app
npm run tauri dev
\`\`\`
`;
    return { content, isBinary: false, size: content.length, lineCount: content.split('\n').length };
  }

  if (ext === 'rs') {
    const content = `// Rust Source File: ${fileName}
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct ModuleState {
    pub name: String,
    pub is_active: bool,
}

pub fn initialize() -> Result<(), String> {
    println!("Module ${fileName} initialized successfully.");
    Ok(())
}
`;
    return { content, isBinary: false, size: content.length, lineCount: content.split('\n').length };
  }

  if (ext === 'tsx' || ext === 'ts') {
    const content = `// Source Component: ${fileName}
import React from 'react';

export const Component: React.FC = () => {
  return (
    <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)]">
      <h2 className="text-sm font-mono font-semibold text-[var(--text-primary)]">
        ${fileName}
      </h2>
      <p className="text-xs text-[var(--text-secondary)] font-mono mt-1">
        Active file opened via DevHub Working Tree Diagram Viewer.
      </p>
    </div>
  );
};
`;
    return { content, isBinary: false, size: content.length, lineCount: content.split('\n').length };
  }

  const content = `// Document preview for ${fileName}\n// Filesystem Path: ${path}\n// Double-click file nodes in the Working Tree Diagram to inspect documents.`;
  return { content, isBinary: false, size: content.length, lineCount: content.split('\n').length };
};
