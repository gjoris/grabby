import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Settings from '../Settings';
import { ElectronAPIService } from '../services/electronAPI';

// Mock ElectronAPIService
vi.mock('../services/electronAPI', () => ({
  ElectronAPIService: {
    getBinaryVersions: vi.fn(),
    getLogStats: vi.fn(),
    getAppVersion: vi.fn(),
    openLogsDirectory: vi.fn(),
    clearLogs: vi.fn(),
    checkForUpdates: vi.fn(),
    redownloadBinaries: vi.fn(),
  },
}));

// Mock useSettings hook
vi.mock('../hooks/useSettings', () => ({
  useSettings: () => ({
    settings: { downloadPath: '/home/user/Downloads' },
    selectFolder: vi.fn(),
  }),
}));

describe('Settings', () => {
  const mockOnBack = vi.fn();
  const mockOnRedownloadBinaries = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ElectronAPIService.getBinaryVersions).mockResolvedValue({
      ytdlp: '2024.01.01',
      ffmpeg: '6.1',
      ffprobe: '6.1',
      lastChecked: new Date().toISOString(),
    });
    vi.mocked(ElectronAPIService.getLogStats).mockResolvedValue({
      count: 5,
      sizeBytes: 1024 * 1024,
      sizeMB: '1.00',
    });
    vi.mocked(ElectronAPIService.getAppVersion).mockResolvedValue('1.2.0');
    
    // Mock window.open
    window.open = vi.fn();
    // Mock confirm/alert
    window.confirm = vi.fn().mockReturnValue(true);
    window.alert = vi.fn();
  });

  it('renders settings page with all sections', async () => {
    await act(async () => {
      render(<Settings onBack={mockOnBack} onRedownloadBinaries={mockOnRedownloadBinaries} />);
    });
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Download Location')).toBeInTheDocument();
    expect(screen.getByText('Binary Tools')).toBeInTheDocument();
    expect(screen.getByText('Maintenance & Logs')).toBeInTheDocument();
    expect(screen.getByText('About Grabby')).toBeInTheDocument();
  });

  it('loads and displays binary versions on mount', async () => {
    await act(async () => {
      render(<Settings onBack={mockOnBack} onRedownloadBinaries={mockOnRedownloadBinaries} />);
    });
    await waitFor(() => {
      expect(screen.getByText('2024.01.01')).toBeInTheDocument();
      expect(screen.getByText('FFMPEG')).toBeInTheDocument();
    });
  });

  it('loads and displays log statistics on mount', async () => {
    await act(async () => {
      render(<Settings onBack={mockOnBack} onRedownloadBinaries={mockOnRedownloadBinaries} />);
    });
    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText(/1\.00/)).toBeInTheDocument();
    });
  });

  it('opens logs directory when button is clicked', async () => {
    await act(async () => {
      render(<Settings onBack={mockOnBack} onRedownloadBinaries={mockOnRedownloadBinaries} />);
    });
    await userEvent.click(screen.getByRole('button', { name: /open folder/i }));
    expect(ElectronAPIService.openLogsDirectory).toHaveBeenCalled();
  });

  it('clears logs when confirmed', async () => {
    vi.mocked(ElectronAPIService.clearLogs).mockResolvedValue(true);
    await act(async () => {
      render(<Settings onBack={mockOnBack} onRedownloadBinaries={mockOnRedownloadBinaries} />);
    });
    await userEvent.click(screen.getByRole('button', { name: /clear logs/i }));
    expect(window.confirm).toHaveBeenCalled();
    expect(ElectronAPIService.clearLogs).toHaveBeenCalled();
  });

  it('checks for updates when button is clicked', async () => {
    vi.mocked(ElectronAPIService.checkForUpdates).mockResolvedValue({ hasUpdates: false });
    await act(async () => {
      render(<Settings onBack={mockOnBack} onRedownloadBinaries={mockOnRedownloadBinaries} />);
    });
    await userEvent.click(screen.getByRole('button', { name: /update tools/i }));
    expect(ElectronAPIService.checkForUpdates).toHaveBeenCalled();
  });

  it('redownloads binaries when confirmed', async () => {
    await act(async () => {
      render(<Settings onBack={mockOnBack} onRedownloadBinaries={mockOnRedownloadBinaries} />);
    });
    await userEvent.click(screen.getByRole('button', { name: /reinstall tools/i }));
    expect(window.confirm).toHaveBeenCalled();
    expect(ElectronAPIService.redownloadBinaries).toHaveBeenCalled();
  });

  it('opens GitHub repository link when clicked', async () => {
    await act(async () => {
      render(<Settings onBack={mockOnBack} onRedownloadBinaries={mockOnRedownloadBinaries} />);
    });
    await userEvent.click(screen.getByText(/GitHub/i));
    expect(window.open).toHaveBeenCalledWith(expect.stringContaining('github.com'), '_blank');
  });

  it('displays developer info', async () => {
    await act(async () => {
      render(<Settings onBack={mockOnBack} onRedownloadBinaries={mockOnRedownloadBinaries} />);
    });
    expect(screen.getByText(/Geroen Joris/i)).toBeInTheDocument();
  });
});
