import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ElectronAPIService } from '../../services/electronAPI';

// Mock electronAPI
const mockDownload = vi.fn();
const mockGetInfo = vi.fn();
const mockCheckBinaries = vi.fn();
const mockSelectFolder = vi.fn();
const mockGetSettings = vi.fn();
const mockSaveSettings = vi.fn();
const mockOnDownloadPlaylistInfo = vi.fn();
const mockOnDownloadItemStart = vi.fn();
const mockOnDownloadItemTitle = vi.fn();
const mockOnDownloadProgressUpdate = vi.fn();
const mockOnDownloadItemProcessing = vi.fn();
const mockOnDownloadItemComplete = vi.fn();
const mockOnDownloadItemError = vi.fn();
const mockOnDownloadComplete = vi.fn();
const mockOnBinaryDownloadProgress = vi.fn();
const mockOnBinariesReady = vi.fn();
const mockGetLogsDirectory = vi.fn();
const mockOpenLogsDirectory = vi.fn();
const mockGetLogStats = vi.fn();
const mockClearLogs = vi.fn();
const mockGetBinaryVersions = vi.fn();
const mockGetAppVersion = vi.fn();
const mockCheckForUpdates = vi.fn();
const mockRedownloadBinaries = vi.fn();

Object.defineProperty(window, 'electronAPI', {
  value: {
    download: mockDownload,
    getInfo: mockGetInfo,
    checkBinaries: mockCheckBinaries,
    selectFolder: mockSelectFolder,
    getSettings: mockGetSettings,
    saveSettings: mockSaveSettings,
    onDownloadPlaylistInfo: mockOnDownloadPlaylistInfo,
    onDownloadItemStart: mockOnDownloadItemStart,
    onDownloadItemTitle: mockOnDownloadItemTitle,
    onDownloadProgressUpdate: mockOnDownloadProgressUpdate,
    onDownloadItemProcessing: mockOnDownloadItemProcessing,
    onDownloadItemComplete: mockOnDownloadItemComplete,
    onDownloadItemError: mockOnDownloadItemError,
    onDownloadComplete: mockOnDownloadComplete,
    onBinaryDownloadProgress: mockOnBinaryDownloadProgress,
    onBinariesReady: mockOnBinariesReady,
    getLogsDirectory: mockGetLogsDirectory,
    openLogsDirectory: mockOpenLogsDirectory,
    getLogStats: mockGetLogStats,
    clearLogs: mockClearLogs,
    getBinaryVersions: mockGetBinaryVersions,
    getAppVersion: mockGetAppVersion,
    checkForUpdates: mockCheckForUpdates,
    redownloadBinaries: mockRedownloadBinaries,
  },
  writable: true,
});

describe('ElectronAPIService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls download with correct parameters', async () => {
    const url = 'url';
    const options = { format: 'mp3', output: 'out' } as any;
    const jobId = 'job';
    await ElectronAPIService.download(url, options, jobId);
    expect(mockDownload).toHaveBeenCalledWith(url, options, jobId);
  });

  it('calls getInfo with url', async () => {
    const url = 'url';
    await ElectronAPIService.getInfo(url);
    expect(mockGetInfo).toHaveBeenCalledWith(url);
  });

  it('calls checkBinaries', async () => {
    await ElectronAPIService.checkBinaries();
    expect(mockCheckBinaries).toHaveBeenCalled();
  });

  it('calls selectFolder', async () => {
    await ElectronAPIService.selectFolder();
    expect(mockSelectFolder).toHaveBeenCalled();
  });

  it('calls getSettings', async () => {
    await ElectronAPIService.getSettings();
    expect(mockGetSettings).toHaveBeenCalled();
  });

  it('calls saveSettings', async () => {
    const settings = { downloadPath: 'p' };
    await ElectronAPIService.saveSettings(settings);
    expect(mockSaveSettings).toHaveBeenCalledWith(settings);
  });

  it('registers all event listeners', () => {
    const cb = vi.fn();
    ElectronAPIService.onDownloadPlaylistInfo(cb);
    expect(mockOnDownloadPlaylistInfo).toHaveBeenCalledWith(cb);
    ElectronAPIService.onDownloadItemStart(cb);
    expect(mockOnDownloadItemStart).toHaveBeenCalledWith(cb);
    ElectronAPIService.onDownloadItemTitle(cb);
    expect(mockOnDownloadItemTitle).toHaveBeenCalledWith(cb);
    ElectronAPIService.onDownloadProgressUpdate(cb);
    expect(mockOnDownloadProgressUpdate).toHaveBeenCalledWith(cb);
    ElectronAPIService.onDownloadItemProcessing(cb);
    expect(mockOnDownloadItemProcessing).toHaveBeenCalledWith(cb);
    ElectronAPIService.onDownloadItemComplete(cb);
    expect(mockOnDownloadItemComplete).toHaveBeenCalledWith(cb);
    ElectronAPIService.onDownloadItemError(cb);
    expect(mockOnDownloadItemError).toHaveBeenCalledWith(cb);
    ElectronAPIService.onDownloadComplete(cb);
    expect(mockOnDownloadComplete).toHaveBeenCalledWith(cb);
    ElectronAPIService.onBinaryDownloadProgress(cb);
    expect(mockOnBinaryDownloadProgress).toHaveBeenCalledWith(cb);
    ElectronAPIService.onBinariesReady(cb);
    expect(mockOnBinariesReady).toHaveBeenCalledWith(cb);
  });

  it('calls logs and maintenance methods', async () => {
    await ElectronAPIService.getLogsDirectory();
    expect(mockGetLogsDirectory).toHaveBeenCalled();
    await ElectronAPIService.openLogsDirectory();
    expect(mockOpenLogsDirectory).toHaveBeenCalled();
    await ElectronAPIService.getLogStats();
    expect(mockGetLogStats).toHaveBeenCalled();
    await ElectronAPIService.clearLogs();
    expect(mockClearLogs).toHaveBeenCalled();
    await ElectronAPIService.getBinaryVersions();
    expect(mockGetBinaryVersions).toHaveBeenCalled();
    await ElectronAPIService.getAppVersion();
    expect(mockGetAppVersion).toHaveBeenCalled();
    await ElectronAPIService.checkForUpdates();
    expect(mockCheckForUpdates).toHaveBeenCalled();
    await ElectronAPIService.redownloadBinaries();
    expect(mockRedownloadBinaries).toHaveBeenCalled();
  });
});
