import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ElectronAPIService } from '../../services/electronAPI';

describe('ElectronAPIService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('download', () => {
    it('calls electronAPI.download with correct parameters', async () => {
      const url = 'https://example.com/video';
      const options = { format: 'mp3', output: '/path/to/file' };
      
      await ElectronAPIService.download(url, options);
      
      expect(window.electronAPI.download).toHaveBeenCalledWith(url, options);
    });
  });

  describe('getSettings', () => {
    it('returns settings from electronAPI', async () => {
      const mockSettings = { downloadPath: '/test/path' };
      vi.mocked(window.electronAPI.getSettings).mockResolvedValue(mockSettings);
      
      const result = await ElectronAPIService.getSettings();
      
      expect(result).toEqual(mockSettings);
      expect(window.electronAPI.getSettings).toHaveBeenCalled();
    });
  });

  describe('saveSettings', () => {
    it('saves settings via electronAPI', async () => {
      const settings = { downloadPath: '/new/path' };
      
      await ElectronAPIService.saveSettings(settings);
      
      expect(window.electronAPI.saveSettings).toHaveBeenCalledWith(settings);
    });
  });

  describe('selectFolder', () => {
    it('returns selected folder path', async () => {
      vi.mocked(window.electronAPI.selectFolder).mockResolvedValue('/selected/path');
      
      const result = await ElectronAPIService.selectFolder();
      
      expect(result).toBe('/selected/path');
      expect(window.electronAPI.selectFolder).toHaveBeenCalled();
    });

    it('returns null when selection is cancelled', async () => {
      vi.mocked(window.electronAPI.selectFolder).mockResolvedValue(null);
      
      const result = await ElectronAPIService.selectFolder();
      
      expect(result).toBeNull();
    });
  });

  describe('checkBinaries', () => {
    it('returns binary check result', async () => {
      const mockResult = { ready: true, missing: [] };
      vi.mocked(window.electronAPI.checkBinaries).mockResolvedValue(mockResult);
      
      const result = await ElectronAPIService.checkBinaries();
      
      expect(result).toEqual(mockResult);
    });

    it('returns missing binaries', async () => {
      const mockResult = { ready: false, missing: ['yt-dlp', 'ffmpeg'] };
      vi.mocked(window.electronAPI.checkBinaries).mockResolvedValue(mockResult);
      
      const result = await ElectronAPIService.checkBinaries();
      
      expect(result.ready).toBe(false);
      expect(result.missing).toEqual(['yt-dlp', 'ffmpeg']);
    });
  });

  describe('getBinaryVersions', () => {
    it('returns binary versions', async () => {
      const mockVersions = {
        ytdlp: '2024.01.01',
        ffmpeg: '6.0',
        ffprobe: '6.0',
        lastChecked: '2024-01-01T00:00:00.000Z',
      };
      vi.mocked(window.electronAPI.getBinaryVersions).mockResolvedValue(mockVersions);
      
      const result = await ElectronAPIService.getBinaryVersions();
      
      expect(result).toEqual(mockVersions);
    });
  });

  describe('getAppVersion', () => {
    it('returns app version', async () => {
      vi.mocked(window.electronAPI.getAppVersion).mockResolvedValue('1.1.0');
      
      const result = await ElectronAPIService.getAppVersion();
      
      expect(result).toBe('1.1.0');
    });
  });

  describe('getLogStats', () => {
    it('returns log statistics', async () => {
      const mockStats = { count: 5, sizeBytes: 1024000, sizeMB: '1.02' };
      vi.mocked(window.electronAPI.getLogStats).mockResolvedValue(mockStats);
      
      const result = await ElectronAPIService.getLogStats();
      
      expect(result).toEqual(mockStats);
    });
  });

  describe('clearLogs', () => {
    it('returns true when logs are cleared successfully', async () => {
      vi.mocked(window.electronAPI.clearLogs).mockResolvedValue(true);
      
      const result = await ElectronAPIService.clearLogs();
      
      expect(result).toBe(true);
    });

    it('returns false when clearing logs fails', async () => {
      vi.mocked(window.electronAPI.clearLogs).mockResolvedValue(false);
      
      const result = await ElectronAPIService.clearLogs();
      
      expect(result).toBe(false);
    });
  });

  describe('openLogsDirectory', () => {
    it('calls electronAPI to open logs directory', async () => {
      await ElectronAPIService.openLogsDirectory();
      
      expect(window.electronAPI.openLogsDirectory).toHaveBeenCalled();
    });
  });

  describe('checkForUpdates', () => {
    it('returns update check result', async () => {
      const mockResult = { hasUpdates: true, ytdlpUpdate: '2024.02.01' };
      vi.mocked(window.electronAPI.checkForUpdates).mockResolvedValue(mockResult);
      
      const result = await ElectronAPIService.checkForUpdates();
      
      expect(result).toEqual(mockResult);
    });
  });

  describe('redownloadBinaries', () => {
    it('returns true when redownload succeeds', async () => {
      vi.mocked(window.electronAPI.redownloadBinaries).mockResolvedValue(true);
      
      const result = await ElectronAPIService.redownloadBinaries();
      
      expect(result).toBe(true);
    });
  });
});
