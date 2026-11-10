import { invoke } from '@tauri-apps/api/core';

export const isTauriEnvironment = (): boolean => {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
};

export interface LaunchResult {
  success: boolean;
  message: string;
}

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

  // Browser preview mode fallback
  console.info(`[DevHub Preview] Invoking IDE (${ide}) for path: ${path}`);
  return {
    success: true,
    message: `[Preview Mode] Simulated launch of ${ide.toUpperCase()} at "${path}"`,
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

  console.info(`[DevHub Preview] Invoking Terminal for path: ${path}`);
  return {
    success: true,
    message: `[Preview Mode] Simulated launch of Terminal at "${path}"`,
  };
};

export const openInFileManager = async (path: string): Promise<LaunchResult> => {
  if (isTauriEnvironment()) {
    try {
      await invoke('open_in_file_manager', { path });
      return { success: true, message: 'Opened folder in explorer' };
    } catch (err) {
      console.error('Tauri invoke open_in_file_manager failed:', err);
      return { success: false, message: String(err) };
    }
  }

  console.info(`[DevHub Preview] Invoking File Manager for path: ${path}`);
  return {
    success: true,
    message: `[Preview Mode] Simulated opening folder "${path}"`,
  };
};
