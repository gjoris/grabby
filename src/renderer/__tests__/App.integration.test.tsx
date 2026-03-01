import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { useBinarySetup } from '../hooks/useBinarySetup';

// Mock hooks
vi.mock('../hooks/useBinarySetup');

// Mock Electron API
const mockGetSettings = vi.fn().mockResolvedValue({ downloadPath: '/test/path' });
const mockSelectFolder = vi.fn().mockResolvedValue('/new/path');
const mockDownload = vi.fn().mockResolvedValue({ success: true });
const mockCheckBinaries = vi.fn().mockResolvedValue({ ready: true, missing: [] });
const mockGetBinaryVersions = vi.fn().mockResolvedValue({ ytdlp: '1', ffmpeg: '1', ffprobe: '1', lastChecked: new Date().toISOString() });
const mockGetLogStats = vi.fn().mockResolvedValue({ count: 0, sizeBytes: 0, sizeMB: '0' });
const mockGetAppVersion = vi.fn().mockResolvedValue('1.2.0');

let readyHandler: any;

Object.defineProperty(window, 'electronAPI', {
  value: {
    getSettings: mockGetSettings,
    selectFolder: mockSelectFolder,
    download: mockDownload,
    getInfo: vi.fn(),
    checkBinaries: mockCheckBinaries,
    onBinariesReady: (cb: any) => { readyHandler = cb; },
    onBinaryDownloadProgress: vi.fn(),
    onDownloadPlaylistInfo: vi.fn(),
    onDownloadItemStart: vi.fn(),
    onDownloadItemTitle: vi.fn(),
    onDownloadProgressUpdate: vi.fn(),
    onDownloadItemProcessing: vi.fn(),
    onDownloadItemComplete: vi.fn(),
    onDownloadItemError: vi.fn(),
    onDownloadComplete: vi.fn(),
    getLogsDirectory: vi.fn().mockResolvedValue('/logs'),
    openLogsDirectory: vi.fn(),
    getLogStats: mockGetLogStats,
    clearLogs: vi.fn(),
    getBinaryVersions: mockGetBinaryVersions,
    getAppVersion: mockGetAppVersion,
    checkForUpdates: vi.fn().mockResolvedValue({ hasUpdates: false }),
    redownloadBinaries: vi.fn(),
  },
  writable: true,
});

describe('App Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.confirm = vi.fn().mockReturnValue(true);
    vi.mocked(useBinarySetup).mockReturnValue({
      isReady: true,
      binaryProgress: {},
      hasBinaryDownloads: false
    });
  });

  it('renders main view by default', async () => {
    await act(async () => { render(<App />); });
    expect(screen.getByText('Grabby')).toBeInTheDocument();
  });

  it('shows binary download progress when binaries are not ready', async () => {
    vi.mocked(useBinarySetup).mockReturnValue({
      isReady: false,
      binaryProgress: { 'yt-dlp': { progress: 50, status: 'Downloading' } },
      hasBinaryDownloads: true
    });
    
    await act(async () => { render(<App />); });
    expect(screen.getByText(/Setting up dependencies/i)).toBeInTheDocument();
  });

  it('navigates to settings and back', async () => {
    await act(async () => { render(<App />); });
    const settingsButton = await screen.findByLabelText(/settings/i);
    await userEvent.click(settingsButton);
    expect(screen.getByText('Settings')).toBeInTheDocument();

    const backButton = screen.getByRole('button', { name: /back/i });
    await userEvent.click(backButton);
    expect(screen.getByPlaceholderText(/paste.*url/i)).toBeInTheDocument();
  });

  it('triggers redownload binaries from settings', async () => {
    await act(async () => { render(<App />); });
    const settingsButton = await screen.findByLabelText(/settings/i);
    await userEvent.click(settingsButton);
    
    const redownloadButton = screen.getByRole('button', { name: /reinstall tools/i });
    await userEvent.click(redownloadButton);
    
    expect(window.confirm).toHaveBeenCalled();
  });

  it('complete download flow', async () => {
    await act(async () => { render(<App />); });
    const input = screen.getByPlaceholderText(/paste.*url/i);
    const downloadButton = screen.getByRole('button', { name: /start download/i });

    await userEvent.type(input, 'https://example.com/video');
    await userEvent.click(downloadButton);

    expect(mockDownload).toHaveBeenCalled();
    expect(screen.getByText('Initializing...')).toBeInTheDocument();
  });
});
