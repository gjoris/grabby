import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  download: (url: string, options: any) => ipcRenderer.invoke('download', url, options),
  getInfo: (url: string) => ipcRenderer.invoke('get-info', url),
  checkBinaries: () => ipcRenderer.invoke('check-binaries'),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: any) => ipcRenderer.invoke('save-settings', settings),
  onDownloadProgress: (callback: (data: string) => void) => {
    ipcRenderer.on('download-progress', (_, data) => callback(data));
  },
  onDownloadError: (callback: (error: string) => void) => {
    ipcRenderer.on('download-error', (_, error) => callback(error));
  },
  onBinaryDownloadProgress: (callback: (data: { binary: string; progress: number; status: string }) => void) => {
    ipcRenderer.on('binary-download-progress', (_, data) => callback(data));
  },
  onBinariesReady: (callback: () => void) => {
    ipcRenderer.on('binaries-ready', () => callback());
  }
});
