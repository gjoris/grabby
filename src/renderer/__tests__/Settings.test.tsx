import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Settings from '../Settings';
import * as useSettingsHook from '../hooks/useSettings';
import * as ElectronAPIService from '../services/electronAPI';

vi.mock('../hooks/useSettings');
vi.mock('../services/electronAPI');

const mockSelectFolder = vi.fn();
const mockOnBack = vi.fn();
const mockOnRedownloadBinaries = vi.fn();

const defaultBinaryVersions = {
  ytdlp: '2024.01.01',
  ffmpeg: '6.0.0',
  ffprobe: '6.0.0',
  lastChecked: new Date().toISOString(),
};

const defaultLogStats = {
  count: 5,
  sizeBytes: 1024000,
  sizeMB: '1.00',
};

describe('Settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(window, 'open').mockImplementation(() => null);

    vi.mocked(useSettingsHook.useSettings).mockReturnValue({
      settings: { downloadPath: '/home/user/Downloads' },
      selectFolder: mockSelectFolder,
    });

    vi.mocked(ElectronAPIService.ElectronAPIService.getBinaryVersions).mockResolvedValue(
      defaultBinaryVersions
    );
    vi.mocked(ElectronAPIService.ElectronAPIService.getLogStats).mockResolvedValue(
      defaultLogStats
    );
    vi.mocked(ElectronAPIService.ElectronAPIService.getAppVersion).mockResolvedValue('1.1.2');
    vi.mocked(ElectronAPIService.ElectronAPIService.openLogsDirectory).mockResolvedValue();
    vi.mocked(ElectronAPIService.ElectronAPIService.clearLogs).mockResolvedValue(true);
    vi.mocked(ElectronAPIService.ElectronAPIService.checkForUpdates).mockResolvedValue({
      hasUpdates: false,
    });
    vi.mocked(ElectronAPIService.ElectronAPIService.redownloadBinaries).mockResolvedValue();
  });

  it('renders settings page with all sections', async () => {
    render(<Settings onBack={mockOnBack} onRedownloadBinaries={mockOnRedownloadBinaries} />);

    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Download Location')).toBeInTheDocument();
    expect(screen.getByText('Binary Versions')).toBeInTheDocument();
    expect(screen.getByText('Logs')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
  });

  it('displays the download path from settings', async () => {
    render(<Settings onBack={mockOnBack} onRedownloadBinaries={mockOnRedownloadBinaries} />);

    await waitFor(() => {
      const input = screen.getByDisplayValue('/home/user/Downloads');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('readonly');
    });
  });

  it('displays "Not set" when download path is empty', async () => {
    vi.mocked(useSettingsHook.useSettings).mockReturnValue({
      settings: { downloadPath: '' },
      selectFolder: mockSelectFolder,
    });

    render(<Settings onBack={mockOnBack} onRedownloadBinaries={mockOnRedownloadBinaries} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Not set')).toBeInTheDocument();
    });
  });

  it('calls selectFolder when browse button is clicked', async () => {
    render(<Settings onBack={mockOnBack} onRedownloadBinaries={mockOnRedownloadBinaries} />);

    const browseButton = screen.getByRole('button', { name: /browse/i });
    await userEvent.click(browseButton);

    expect(mockSelectFolder).toHaveBeenCalled();
  });

  it('loads and displays binary versions on mount', async () => {
    render(<Settings onBack={mockOnBack} onRedownloadBinaries={mockOnRedownloadBinaries} />);

    await waitFor(() => {
      expect(screen.getByText('2024.01.01')).toBeInTheDocument();
      expect(screen.getByText('ffmpeg')).toBeInTheDocument();
    });

    expect(ElectronAPIService.ElectronAPIService.getBinaryVersions).toHaveBeenCalled();
  });

  it('loads and displays app version on mount', async () => {
    render(<Settings onBack={mockOnBack} onRedownloadBinaries={mockOnRedownloadBinaries} />);

    await waitFor(() => {
      expect(screen.getByText(/Grabby v1\.1\.2/)).toBeInTheDocument();
    });

    expect(ElectronAPIService.ElectronAPIService.getAppVersion).toHaveBeenCalled();
  });

  it('loads and displays log statistics on mount', async () => {
    render(<Settings onBack={mockOnBack} onRedownloadBinaries={mockOnRedownloadBinaries} />);

    await waitFor(() => {
      // Check that log stats were loaded by verifying the UI renders
      const logSection = screen.getByText('Logs').closest('div');
      expect(logSection).toBeInTheDocument();
    });

    expect(ElectronAPIService.ElectronAPIService.getLogStats).toHaveBeenCalled();
  });

  it('calls onBack when back button is clicked', async () => {
    render(<Settings onBack={mockOnBack} onRedownloadBinaries={mockOnRedownloadBinaries} />);

    const backButton = screen.getByRole('button', { name: /back/i });
    await userEvent.click(backButton);

    expect(mockOnBack).toHaveBeenCalled();
  });

  it('opens logs directory when "Open Logs Folder" is clicked', async () => {
    render(<Settings onBack={mockOnBack} onRedownloadBinaries={mockOnRedownloadBinaries} />);

    const openLogsButton = screen.getByRole('button', { name: /open logs folder/i });
    await userEvent.click(openLogsButton);

    await waitFor(() => {
      expect(ElectronAPIService.ElectronAPIService.openLogsDirectory).toHaveBeenCalled();
    });
  });

  it('clears logs when confirmed', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<Settings onBack={mockOnBack} onRedownloadBinaries={mockOnRedownloadBinaries} />);

    const clearLogsButton = screen.getByRole('button', { name: /clear all logs/i });
    await userEvent.click(clearLogsButton);

    expect(confirmSpy).toHaveBeenCalled();

    await waitFor(() => {
      expect(ElectronAPIService.ElectronAPIService.clearLogs).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('All logs have been cleared.');
    });
  });

  it('does not clear logs when confirmation is cancelled', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<Settings onBack={mockOnBack} onRedownloadBinaries={mockOnRedownloadBinaries} />);

    const clearLogsButton = screen.getByRole('button', { name: /clear all logs/i });
    await userEvent.click(clearLogsButton);

    expect(confirmSpy).toHaveBeenCalled();
    expect(ElectronAPIService.ElectronAPIService.clearLogs).not.toHaveBeenCalled();
  });

  it('shows alert when clearing logs fails', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.mocked(ElectronAPIService.ElectronAPIService.clearLogs).mockResolvedValue(false);

    render(<Settings onBack={mockOnBack} onRedownloadBinaries={mockOnRedownloadBinaries} />);

    const clearLogsButton = screen.getByRole('button', { name: /clear all logs/i });
    await userEvent.click(clearLogsButton);

    expect(confirmSpy).toHaveBeenCalled();

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Failed to clear logs.');
    });
  });

  it('checks for updates when button is clicked', async () => {
    render(<Settings onBack={mockOnBack} onRedownloadBinaries={mockOnRedownloadBinaries} />);

    const checkUpdatesButton = screen.getByRole('button', { name: /check for updates/i });
    await userEvent.click(checkUpdatesButton);

    await waitFor(() => {
      expect(ElectronAPIService.ElectronAPIService.checkForUpdates).toHaveBeenCalled();
      expect(window.alert).toHaveBeenCalledWith('All binaries are up to date!');
    });
  });

  it('shows update alert when updates are available', async () => {
    vi.mocked(ElectronAPIService.ElectronAPIService.checkForUpdates).mockResolvedValue({
      hasUpdates: true,
      ytdlpUpdate: '2024.02.01',
    });

    render(<Settings onBack={mockOnBack} onRedownloadBinaries={mockOnRedownloadBinaries} />);

    const checkUpdatesButton = screen.getByRole('button', { name: /check for updates/i });
    await userEvent.click(checkUpdatesButton);

    await waitFor(() => {
      expect(ElectronAPIService.ElectronAPIService.checkForUpdates).toHaveBeenCalled();
    }, { timeout: 1000 });

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        expect.stringContaining('Update available for yt-dlp: 2024.02.01')
      );
    }, { timeout: 1000 });
  });

  it('handles update check errors gracefully', async () => {
    vi.mocked(ElectronAPIService.ElectronAPIService.checkForUpdates).mockRejectedValue(
      new Error('Network error')
    );

    render(<Settings onBack={mockOnBack} onRedownloadBinaries={mockOnRedownloadBinaries} />);

    const checkUpdatesButton = screen.getByRole('button', { name: /check for updates/i });
    await userEvent.click(checkUpdatesButton);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Failed to check for updates');
    });
  });

  it('disables check updates button while checking', async () => {
    vi.mocked(ElectronAPIService.ElectronAPIService.checkForUpdates).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ hasUpdates: false }), 100))
    );

    render(<Settings onBack={mockOnBack} onRedownloadBinaries={mockOnRedownloadBinaries} />);

    const checkUpdatesButton = screen.getByRole('button', { name: /check for updates/i });
    await userEvent.click(checkUpdatesButton);

    expect(checkUpdatesButton).toBeDisabled();
    expect(checkUpdatesButton).toHaveTextContent('Checking...');

    await waitFor(() => {
      expect(checkUpdatesButton).not.toBeDisabled();
    });
  });

  it('redownloads binaries when confirmed', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<Settings onBack={mockOnBack} onRedownloadBinaries={mockOnRedownloadBinaries} />);

    const redownloadButton = screen.getByRole('button', { name: /redownload binaries/i });
    await userEvent.click(redownloadButton);

    expect(confirmSpy).toHaveBeenCalled();

    await waitFor(() => {
      expect(mockOnRedownloadBinaries).toHaveBeenCalled();
      expect(ElectronAPIService.ElectronAPIService.redownloadBinaries).toHaveBeenCalled();
    });
  });

  it('does not redownload binaries when confirmation is cancelled', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<Settings onBack={mockOnBack} onRedownloadBinaries={mockOnRedownloadBinaries} />);

    const redownloadButton = screen.getByRole('button', { name: /redownload binaries/i });
    await userEvent.click(redownloadButton);

    expect(confirmSpy).toHaveBeenCalled();
    expect(mockOnRedownloadBinaries).not.toHaveBeenCalled();
    expect(ElectronAPIService.ElectronAPIService.redownloadBinaries).not.toHaveBeenCalled();
  });

  it('shows alert when redownload fails', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.mocked(ElectronAPIService.ElectronAPIService.redownloadBinaries).mockRejectedValue(
      new Error('Download failed')
    );

    render(<Settings onBack={mockOnBack} onRedownloadBinaries={mockOnRedownloadBinaries} />);

    const redownloadButton = screen.getByRole('button', { name: /redownload binaries/i });
    await userEvent.click(redownloadButton);

    expect(confirmSpy).toHaveBeenCalled();

    await waitFor(() => {
      expect(mockOnRedownloadBinaries).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        expect.stringContaining('Failed to redownload binaries')
      );
    });
  });

  it('displays developer info', async () => {
    render(<Settings onBack={mockOnBack} onRedownloadBinaries={mockOnRedownloadBinaries} />);

    await waitFor(() => {
      expect(screen.getByText('Geroen Joris')).toBeInTheDocument();
    });
  });

  it('displays about section with project links', async () => {
    render(<Settings onBack={mockOnBack} onRedownloadBinaries={mockOnRedownloadBinaries} />);

    await waitFor(() => {
      expect(screen.getByText('GitHub Repository')).toBeInTheDocument();
      expect(screen.getByText('Report Issue')).toBeInTheDocument();
    });
  });

  it('opens GitHub repository link when clicked', async () => {
    render(<Settings onBack={mockOnBack} onRedownloadBinaries={mockOnRedownloadBinaries} />);

    const githubLink = screen.getByText('GitHub Repository');
    await userEvent.click(githubLink);

    await waitFor(() => {
      expect(window.open).toHaveBeenCalledWith('https://github.com/gjoris/grabby', '_blank');
    });
  });

  it('opens report issue link when clicked', async () => {
    render(<Settings onBack={mockOnBack} onRedownloadBinaries={mockOnRedownloadBinaries} />);

    const reportLink = screen.getByText('Report Issue');
    await userEvent.click(reportLink);

    await waitFor(() => {
      expect(window.open).toHaveBeenCalledWith('https://github.com/gjoris/grabby/issues', '_blank');
    });
  });

  it('displays built with section with all credits', async () => {
    render(<Settings onBack={mockOnBack} onRedownloadBinaries={mockOnRedownloadBinaries} />);

    await waitFor(() => {
      expect(screen.getByText('Built with:')).toBeInTheDocument();
      expect(screen.getByText('yt-dlp')).toBeInTheDocument();
      expect(screen.getByText('FFmpeg')).toBeInTheDocument();
      expect(screen.getByText('Electron')).toBeInTheDocument();
      expect(screen.getByText('React')).toBeInTheDocument();
    });
  });

  it('opens yt-dlp link when clicked', async () => {
    render(<Settings onBack={mockOnBack} onRedownloadBinaries={mockOnRedownloadBinaries} />);

    const ytdlpLink = screen.getByText('yt-dlp');
    await userEvent.click(ytdlpLink);

    await waitFor(() => {
      expect(window.open).toHaveBeenCalledWith('https://github.com/yt-dlp/yt-dlp', '_blank');
    });
  });

  it('shows loading text when versions are loading', () => {
    vi.mocked(ElectronAPIService.ElectronAPIService.getBinaryVersions).mockImplementation(
      () => new Promise(() => {})
    );

    render(<Settings onBack={mockOnBack} onRedownloadBinaries={mockOnRedownloadBinaries} />);

    expect(screen.getByText('Loading versions...')).toBeInTheDocument();
  });

  it('displays license info', async () => {
    render(<Settings onBack={mockOnBack} onRedownloadBinaries={mockOnRedownloadBinaries} />);

    await waitFor(() => {
      expect(screen.getByText('Licensed under MIT License')).toBeInTheDocument();
    });
  });
});
