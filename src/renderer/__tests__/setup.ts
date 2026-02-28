import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Electron API
global.window.electronAPI = {
  download: vi.fn(),
  getInfo: vi.fn(),
  checkBinaries: vi.fn(),
  selectFolder: vi.fn(),
  getSettings: vi.fn().mockResolvedValue({ downloadPath: '/test/path' }),
  saveSettings: vi.fn(),
  onDownloadPlaylistInfo: vi.fn(),
  onDownloadItemStart: vi.fn(),
  onDownloadItemTitle: vi.fn(),
  onDownloadProgressUpdate: vi.fn(),
  onDownloadItemProcessing: vi.fn(),
  onDownloadItemComplete: vi.fn(),
  onDownloadItemError: vi.fn(),
  onDownloadComplete: vi.fn(),
  onBinaryDownloadProgress: vi.fn(),
  onBinariesReady: vi.fn(),
  getLogsDirectory: vi.fn(),
  openLogsDirectory: vi.fn(),
  getLogStats: vi.fn().mockResolvedValue({ count: 0, sizeBytes: 0, sizeMB: '0.00' }),
  clearLogs: vi.fn(),
  getBinaryVersions: vi.fn().mockResolvedValue({
    ytdlp: '2024.01.01',
    ffmpeg: '6.0',
    ffprobe: '6.0',
    lastChecked: new Date().toISOString(),
  }),
  getAppVersion: vi.fn().mockResolvedValue('1.1.0'),
  checkForUpdates: vi.fn(),
  redownloadBinaries: vi.fn(),
};
