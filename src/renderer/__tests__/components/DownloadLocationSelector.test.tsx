import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DownloadLocationSelector from '../../components/DownloadLocationSelector';

// Mock electronAPI
const mockGetSettings = vi.fn().mockResolvedValue({ downloadPath: '/test/path' });
const mockSelectFolder = vi.fn().mockResolvedValue('/new/path');

Object.defineProperty(window, 'electronAPI', {
  value: {
    getSettings: mockGetSettings,
    selectFolder: mockSelectFolder,
  },
  writable: true,
});

describe('DownloadLocationSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders destination label and current path', async () => {
    await act(async () => {
      render(<DownloadLocationSelector onLocationChange={vi.fn()} />);
    });
    
    expect(screen.getByText(/destination/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('/test/path')).toBeInTheDocument();
    });
  });

  it('loads and displays current path on mount', async () => {
    await act(async () => {
      render(<DownloadLocationSelector onLocationChange={vi.fn()} />);
    });
    expect(mockGetSettings).toHaveBeenCalled();
  });

  it('opens folder selector when change button is clicked', async () => {
    await act(async () => {
      render(<DownloadLocationSelector onLocationChange={vi.fn()} />);
    });
    const changeButton = screen.getByRole('button', { name: /change/i });
    await userEvent.click(changeButton);
    expect(mockSelectFolder).toHaveBeenCalled();
  });

  it('updates path when folder is selected', async () => {
    const onLocationChange = vi.fn();
    await act(async () => {
      render(<DownloadLocationSelector onLocationChange={onLocationChange} />);
    });
    const changeButton = screen.getByRole('button', { name: /change/i });
    await userEvent.click(changeButton);
    
    await waitFor(() => {
      expect(onLocationChange).toHaveBeenCalledWith('/new/path');
      expect(screen.getByText('/new/path')).toBeInTheDocument();
    });
  });

  it('does not update path when selection is cancelled', async () => {
    mockSelectFolder.mockResolvedValueOnce(null);
    const onLocationChange = vi.fn();
    await act(async () => {
      render(<DownloadLocationSelector onLocationChange={onLocationChange} />);
    });
    const changeButton = screen.getByRole('button', { name: /change/i });
    await userEvent.click(changeButton);
    
    expect(onLocationChange).not.toHaveBeenCalled();
    expect(screen.getByText('/test/path')).toBeInTheDocument();
  });
});
