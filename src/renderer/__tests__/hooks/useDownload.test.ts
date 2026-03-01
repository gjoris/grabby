import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDownload } from '../../hooks/useDownload';
import * as DownloadService from '../../services/downloadService';

vi.mock('../../services/downloadService', () => ({
  DownloadService: {
    download: vi.fn(),
  },
}));

describe('useDownload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns startDownload function', () => {
    const { result } = renderHook(() => useDownload('/home/user/downloads'));
    expect(typeof result.current.startDownload).toBe('function');
  });

  it('calls DownloadService.download with correct parameters', async () => {
    const { result } = renderHook(() => useDownload('/home/user/downloads'));
    await result.current.startDownload('https://link', 'video', 'job-1');
    expect(DownloadService.DownloadService.download).toHaveBeenCalledWith(
      'https://link', 'video', '/home/user/downloads', 'job-1'
    );
  });

  it('does nothing when url is empty', async () => {
    const { result } = renderHook(() => useDownload('/home/user/downloads'));
    await result.current.startDownload('', 'video', 'job');
    expect(DownloadService.DownloadService.download).not.toHaveBeenCalled();
  });

  it('handles download errors gracefully', async () => {
    const error = new Error('Network error');
    vi.mocked(DownloadService.DownloadService.download).mockRejectedValue(error);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const { result } = renderHook(() => useDownload('/home/user/downloads'));
    await result.current.startDownload('https://link', 'video', 'job');
    
    expect(consoleSpy).toHaveBeenCalledWith('Download failed:', error);
    consoleSpy.mockRestore();
  });
});
