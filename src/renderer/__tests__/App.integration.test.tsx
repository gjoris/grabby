import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

describe('App Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(window.electronAPI.checkBinaries).mockResolvedValue({ ready: true, missing: [] });
  });

  it('renders main view by default', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('Grabby')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/paste.*url/i)).toBeInTheDocument();
    });
  });

  it('navigates to settings and back', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('Grabby')).toBeInTheDocument();
    });
    
    // Click settings button
    const settingsButton = screen.getByRole('button', { name: /settings/i });
    await userEvent.click(settingsButton);
    
    // Should show settings view
    await waitFor(() => {
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Download Location')).toBeInTheDocument();
    });
    
    // Click back button
    const backButton = screen.getByRole('button', { name: /back/i });
    await userEvent.click(backButton);
    
    // Should return to main view
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/paste.*url/i)).toBeInTheDocument();
    });
  });

  it('shows binary download progress when binaries are not ready', async () => {
    vi.mocked(window.electronAPI.checkBinaries).mockResolvedValue({ 
      ready: false, 
      missing: ['yt-dlp', 'ffmpeg'] 
    });
    
    render(<App />);
    
    // Simulate binary download progress
    const progressCallback = vi.mocked(window.electronAPI.onBinaryDownloadProgress).mock.calls[0][0];
    progressCallback({ binary: 'yt-dlp', progress: 50, status: 'Downloading...' });
    
    await waitFor(() => {
      expect(screen.getByText(/setting up dependencies/i)).toBeInTheDocument();
    });
  });

  it('shows main UI when binaries are ready', async () => {
    render(<App />);
    
    // Simulate binaries ready event
    const readyCallback = vi.mocked(window.electronAPI.onBinariesReady).mock.calls[0][0];
    readyCallback();
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/paste.*url/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();
    });
  });

  it('complete download flow', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/paste.*url/i)).toBeInTheDocument();
    });
    
    // Enter URL
    const input = screen.getByPlaceholderText(/paste.*url/i);
    await userEvent.type(input, 'https://example.com/video');
    
    // Click download button
    const downloadButton = screen.getByRole('button', { name: /download/i });
    await userEvent.click(downloadButton);
    
    // Verify download was initiated
    expect(window.electronAPI.download).toHaveBeenCalledWith(
      'https://example.com/video',
      expect.objectContaining({
        format: expect.any(String),
        output: expect.any(String),
      })
    );
  });

  it('changes download location', async () => {
    vi.mocked(window.electronAPI.selectFolder).mockResolvedValue('/custom/path');
    
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText(/save to:/i)).toBeInTheDocument();
    });
    
    // Click change button
    const changeButton = screen.getByRole('button', { name: /change/i });
    await userEvent.click(changeButton);
    
    await waitFor(() => {
      expect(window.electronAPI.selectFolder).toHaveBeenCalled();
    });
  });

  it('switches between MP3 and video format', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/mp3/i)).toBeInTheDocument();
    });
    
    // MP3 should be selected by default
    const mp3Radio = screen.getByLabelText(/mp3/i) as HTMLInputElement;
    expect(mp3Radio.checked).toBe(true);
    
    // Switch to video
    const videoRadio = screen.getByLabelText(/video/i);
    await userEvent.click(videoRadio);
    
    // Video should now be selected
    expect((videoRadio as HTMLInputElement).checked).toBe(true);
    expect(mp3Radio.checked).toBe(false);
  });

  it('displays download items when download starts', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/paste.*url/i)).toBeInTheDocument();
    });
    
    // Simulate download item events
    const itemStartCallback = vi.mocked(window.electronAPI.onDownloadItemStart).mock.calls[0][0];
    const itemTitleCallback = vi.mocked(window.electronAPI.onDownloadItemTitle).mock.calls[0][0];
    
    itemStartCallback({ index: 1, total: 1 });
    itemTitleCallback({ index: 1, title: 'Test Video' });
    
    await waitFor(() => {
      expect(screen.getByText('Test Video')).toBeInTheDocument();
    });
  });
});
