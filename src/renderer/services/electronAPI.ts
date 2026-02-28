import { Settings, DownloadOptions } from '../types';

declare global {
  interface Window {
    electronAPI: {
      download: (url: string, options: DownloadOptions) => Promise<any>;
      getInfo: (url: string) => Promise<any>;
      onDownloadProgress: (callback: (data: string) => void) => void;
      onDownloadError: (callback: (error: string) => void) => void;
      onBinaryDownloadProgress: (callback: (data: { binary: string; progress: number; status: string }) => void) => void;
      onBinariesReady: (callback: () => void) => void;
      checkBinaries: () => Promise<{ ready: boolean; missing: string[] }>;
      selectFolder: () => Promise<string | null>;
      getSettings: () => Promise<Settings>;
      saveSettings: (settings: Settings) => Promise<void>;
      getLogsDirectory: () => Promise<string>;
      openLogsDirectory: () => Promise<void>;
    };
  }
}

export class ElectronAPIService {
  static async download(url: string, options: DownloadOptions): Promise<any> {
    return window.electronAPI.download(url, options);
  }

  static async getInfo(url: string): Promise<any> {
    return window.electronAPI.getInfo(url);
  }

  static async checkBinaries(): Promise<{ ready: boolean; missing: string[] }> {
    return window.electronAPI.checkBinaries();
  }

  static async selectFolder(): Promise<string | null> {
    return window.electronAPI.selectFolder();
  }

  static async getSettings(): Promise<Settings> {
    return window.electronAPI.getSettings();
  }

  static async saveSettings(settings: Settings): Promise<void> {
    return window.electronAPI.saveSettings(settings);
  }

  static onDownloadProgress(callback: (data: string) => void): void {
    window.electronAPI.onDownloadProgress(callback);
  }

  static onDownloadError(callback: (error: string) => void): void {
    window.electronAPI.onDownloadError(callback);
  }

  static onBinaryDownloadProgress(callback: (data: { binary: string; progress: number; status: string }) => void): void {
    window.electronAPI.onBinaryDownloadProgress(callback);
  }

  static onBinariesReady(callback: () => void): void {
    window.electronAPI.onBinariesReady(callback);
  }

  static async getLogsDirectory(): Promise<string> {
    return window.electronAPI.getLogsDirectory();
  }

  static async openLogsDirectory(): Promise<void> {
    return window.electronAPI.openLogsDirectory();
  }
}
