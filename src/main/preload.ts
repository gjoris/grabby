import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  download: (url: string, options: any) => ipcRenderer.invoke('download', url, options),
  getInfo: (url: string) => ipcRenderer.invoke('get-info', url),
  checkBinaries: () => ipcRenderer.invoke('check-binaries'),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: any) => ipcRenderer.invoke('save-settings', settings),
  onDownloadPlaylistInfo: (callback: (data: any) => void) => {
    ipcRenderer.on('download-playlist-info', (_, data) => callback(data));
  },
  onDownloadItemStart: (callback: (data: any) => void) => {
    ipcRenderer.on('download-item-start', (_, data) => callback(data));
  },
  onDownloadItemTitle: (callback: (data: any) => void) => {
    ipcRenderer.on('download-item-title', (_, data) => callback(data));
  },
  onDownloadProgressUpdate: (callback: (data: any) => void) => {
    ipcRenderer.on('download-progress-update', (_, data) => callback(data));
  },
  onDownloadItemProcessing: (callback: (data: any) => void) => {
    ipcRenderer.on('download-item-processing', (_, data) => callback(data));
  },
  onDownloadItemComplete: (callback: (data: any) => void) => {
    ipcRenderer.on('download-item-complete', (_, data) => callback(data));
  },
  onDownloadItemError: (callback: (data: any) => void) => {
    ipcRenderer.on('download-item-error', (_, data) => callback(data));
  },
  onDownloadComplete: (callback: () => void) => {
    ipcRenderer.on('download-complete', () => callback());
  },
  onBinaryDownloadProgress: (callback: (data: { binary: string; progress: number; status: string }) => void) => {
    ipcRenderer.on('binary-download-progress', (_, data) => callback(data));
  },
  onBinariesReady: (callback: () => void) => {
    ipcRenderer.on('binaries-ready', () => callback());
  },
  getLogsDirectory: () => ipcRenderer.invoke('get-logs-directory'),
  openLogsDirectory: () => ipcRenderer.invoke('open-logs-directory'),
  getLogStats: () => ipcRenderer.invoke('get-log-stats'),
  clearLogs: () => ipcRenderer.invoke('clear-logs'),
  getBinaryVersions: () => ipcRenderer.invoke('get-binary-versions'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  redownloadBinaries: () => ipcRenderer.invoke('redownload-binaries')
});
