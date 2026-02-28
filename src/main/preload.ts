import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  download: (url: string, options: any) => ipcRenderer.invoke('download', url, options),
  getInfo: (url: string) => ipcRenderer.invoke('get-info', url),
  onDownloadProgress: (callback: (data: string) => void) => {
    ipcRenderer.on('download-progress', (_, data) => callback(data));
  },
  onDownloadError: (callback: (error: string) => void) => {
    ipcRenderer.on('download-error', (_, error) => callback(error));
  }
});
