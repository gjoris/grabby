import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DownloadLocationSelector from '../../components/DownloadLocationSelector';

describe('DownloadLocationSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders location label and input', () => {
    render(<DownloadLocationSelector onLocationChange={vi.fn()} />);
    
    expect(screen.getByText(/save to:/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /change/i })).toBeInTheDocument();
  });

  it('loads and displays current path on mount', async () => {
    render(<DownloadLocationSelector onLocationChange={vi.fn()} />);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('/test/path')).toBeInTheDocument();
    });
  });

  it('displays "Not set" when path is empty', async () => {
    vi.mocked(window.electronAPI.getSettings).mockResolvedValue({ downloadPath: '' });
    
    render(<DownloadLocationSelector onLocationChange={vi.fn()} />);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Not set')).toBeInTheDocument();
    });
  });

  it('opens folder selector when change button is clicked', async () => {
    vi.mocked(window.electronAPI.selectFolder).mockResolvedValue('/new/path');
    const onLocationChange = vi.fn();
    
    render(<DownloadLocationSelector onLocationChange={onLocationChange} />);
    
    const changeButton = screen.getByRole('button', { name: /change/i });
    await userEvent.click(changeButton);
    
    expect(window.electronAPI.selectFolder).toHaveBeenCalled();
  });

  it('updates path and calls onLocationChange when folder is selected', async () => {
    vi.mocked(window.electronAPI.selectFolder).mockResolvedValue('/new/path');
    const onLocationChange = vi.fn();
    
    render(<DownloadLocationSelector onLocationChange={onLocationChange} />);
    
    const changeButton = screen.getByRole('button', { name: /change/i });
    await userEvent.click(changeButton);
    
    await waitFor(() => {
      expect(onLocationChange).toHaveBeenCalledWith('/new/path');
      expect(screen.getByDisplayValue('/new/path')).toBeInTheDocument();
    });
  });

  it('does not update path when folder selection is cancelled', async () => {
    vi.mocked(window.electronAPI.selectFolder).mockResolvedValue(null);
    const onLocationChange = vi.fn();
    
    render(<DownloadLocationSelector onLocationChange={onLocationChange} />);
    
    const changeButton = screen.getByRole('button', { name: /change/i });
    await userEvent.click(changeButton);
    
    await waitFor(() => {
      expect(onLocationChange).not.toHaveBeenCalled();
    });
  });

  it('input is read-only', () => {
    render(<DownloadLocationSelector onLocationChange={vi.fn()} />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('readonly');
  });
});
