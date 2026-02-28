import { Settings, DownloadOptions } from '../types';

declare global {
  interface Window {
    electronAPI: {
      download: (url: string, options: DownloadOptions) => Promise<any>;
      getInfo: (url: string) => Promise<any>;
      onDownloadPlaylistInfo: (callback: (data: any) => void) => void;
      onDownloadItemStart: (callback: (data: any) => void) => void;
      onDownloadItemTitle: (callback: (data: any) => void) => void;
      onDownloadProgressUpdate: (callback: (data: any) => void) => void;
      onDownloadItemProcessing: (callback: (data: any) => void) => void;
      onDownloadItemComplete: (callback: (data: any) => void) => void;
      onDownloadItemError: (callback: (data: any) => void) => void;
      onDownloadComplete: (callback: () => void) => void;
      onBinaryDownloadProgress: (callback: (data: { binary: string; progress: number; status: string }) => void) => void;
      onBinariesReady: (callback: () => void) => void;
      checkBinaries: () => Promise<{ ready: boolean; missing: string[] }>;
      selectFolder: () => Promise<string | null>;
      getSettings: () => Promise<Settings>;
      saveSettings: (settings: Settings) => Promise<void>;
      getLogsDirectory: () => Promise<string>;
      openLogsDirectory: () => Promise<void>;
      getLogStats: () => Promise<{ count: number; sizeBytes: number; sizeMB: string }>;
      clearLogs: () => Promise<boolean>;
      getBinaryVersions: () => Promise<any>;
      getAppVersion: () => Promise<string>;
      checkForUpdates: () => Promise<any>;
      redownloadBinaries: () => Promise<boolean>;
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

  static onDownloadPlaylistInfo(callback: (data: any) => void): void {
    window.electronAPI.onDownloadPlaylistInfo(callback);
  }

  static onDownloadItemStart(callback: (data: any) => void): void {
    window.electronAPI.onDownloadItemStart(callback);
  }

  static onDownloadItemTitle(callback: (data: any) => void): void {
    window.electronAPI.onDownloadItemTitle(callback);
  }

  static onDownloadProgressUpdate(callback: (data: any) => void): void {
    window.electronAPI.onDownloadProgressUpdate(callback);
  }

  static onDownloadItemProcessing(callback: (data: any) => void): void {
    window.electronAPI.onDownloadItemProcessing(callback);
  }

  static onDownloadItemComplete(callback: (data: any) => void): void {
    window.electronAPI.onDownloadItemComplete(callback);
  }

  static onDownloadItemError(callback: (data: any) => void): void {
    window.electronAPI.onDownloadItemError(callback);
  }

  static onDownloadComplete(callback: () => void): void {
    window.electronAPI.onDownloadComplete(callback);
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

  static async getLogStats(): Promise<{ count: number; sizeBytes: number; sizeMB: string }> {
    return window.electronAPI.getLogStats();
  }

  static async clearLogs(): Promise<boolean> {
    return window.electronAPI.clearLogs();
  }

  static async getBinaryVersions(): Promise<any> {
    return window.electronAPI.getBinaryVersions();
  }

  static async getAppVersion(): Promise<string> {
    return window.electronAPI.getAppVersion();
  }

  static async checkForUpdates(): Promise<any> {
    return window.electronAPI.checkForUpdates();
  }

  static async redownloadBinaries(): Promise<boolean> {
    return window.electronAPI.redownloadBinaries();
  }
}
