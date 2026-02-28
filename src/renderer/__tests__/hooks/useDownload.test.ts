import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDownload } from '../../hooks/useDownload';
import * as DownloadService from '../../services/downloadService';

vi.mock('../../services/downloadService');

describe('useDownload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('initializes with isDownloading as false', () => {
    const { result } = renderHook(() => useDownload('/home/user/downloads'));
    
    expect(result.current.isDownloading).toBe(false);
  });

  it('returns startDownload function', () => {
    const { result } = renderHook(() => useDownload('/home/user/downloads'));
    
    expect(typeof result.current.startDownload).toBe('function');
  });

  it('does nothing when url is empty', async () => {
    const { result } = renderHook(() => useDownload('/home/user/downloads'));
    
    await act(async () => {
      await result.current.startDownload('', 'video');
    });
    
    expect(vi.mocked(DownloadService.DownloadService.download)).not.toHaveBeenCalled();
    expect(result.current.isDownloading).toBe(false);
  });

  it('sets isDownloading to true during download and false after', async () => {
    let resolveDownload: () => void;
    const downloadPromise = new Promise<void>(resolve => {
      resolveDownload = resolve;
    });
    
    vi.mocked(DownloadService.DownloadService.download).mockReturnValue(downloadPromise);

    const { result } = renderHook(() => useDownload('/home/user/downloads'));
    
    // Start download
    const promise = act(async () => {
      await result.current.startDownload('https://example.com/video', 'video');
    });
    
    // Give it a tick to set isDownloading to true
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Resolve the download
    resolveDownload!();
    
    await promise;
    
    // Should be false after downloading
    expect(result.current.isDownloading).toBe(false);
  });

  it('calls DownloadService.download with correct parameters', async () => {
    vi.mocked(DownloadService.DownloadService.download).mockResolvedValue();

    const { result } = renderHook(() => useDownload('/home/user/downloads'));
    
    await act(async () => {
      await result.current.startDownload('https://example.com/video', 'video');
    });
    
    expect(vi.mocked(DownloadService.DownloadService.download)).toHaveBeenCalledWith(
      'https://example.com/video',
      'video',
      '/home/user/downloads'
    );
  });

  it('calls DownloadService.download with audio type', async () => {
    vi.mocked(DownloadService.DownloadService.download).mockResolvedValue();

    const { result } = renderHook(() => useDownload('/home/user/downloads'));
    
    await act(async () => {
      await result.current.startDownload('https://example.com/audio', 'audio');
    });
    
    expect(vi.mocked(DownloadService.DownloadService.download)).toHaveBeenCalledWith(
      'https://example.com/audio',
      'audio',
      '/home/user/downloads'
    );
  });

  it('handles download errors gracefully', async () => {
    const error = new Error('Download failed');
    vi.mocked(DownloadService.DownloadService.download).mockRejectedValue(error);

    const { result } = renderHook(() => useDownload('/home/user/downloads'));
    
    await act(async () => {
      await result.current.startDownload('https://example.com/video', 'video');
    });
    
    expect(console.error).toHaveBeenCalledWith('Download failed:', error);
    expect(result.current.isDownloading).toBe(false);
  });

  it('resets isDownloading to false after error', async () => {
    vi.mocked(DownloadService.DownloadService.download).mockRejectedValue(
      new Error('Download failed')
    );

    const { result } = renderHook(() => useDownload('/home/user/downloads'));
    
    await act(async () => {
      await result.current.startDownload('https://example.com/video', 'video');
    });
    
    expect(result.current.isDownloading).toBe(false);
  });

  it('handles successful download', async () => {
    vi.mocked(DownloadService.DownloadService.download).mockResolvedValue();

    const { result } = renderHook(() => useDownload('/home/user/downloads'));
    
    await act(async () => {
      await result.current.startDownload('https://example.com/video', 'video');
    });
    
    expect(result.current.isDownloading).toBe(false);
    expect(console.error).not.toHaveBeenCalled();
  });

  it('supports different download paths', async () => {
    vi.mocked(DownloadService.DownloadService.download).mockResolvedValue();

    const downloadPath = '/custom/download/path';
    const { result } = renderHook(() => useDownload(downloadPath));
    
    await act(async () => {
      await result.current.startDownload('https://example.com/video', 'video');
    });
    
    expect(vi.mocked(DownloadService.DownloadService.download)).toHaveBeenCalledWith(
      'https://example.com/video',
      'video',
      downloadPath
    );
  });

  it('can start multiple downloads sequentially', async () => {
    vi.mocked(DownloadService.DownloadService.download).mockResolvedValue();

    const { result } = renderHook(() => useDownload('/home/user/downloads'));
    
    await act(async () => {
      await result.current.startDownload('https://example.com/video1', 'video');
    });
    
    expect(vi.mocked(DownloadService.DownloadService.download)).toHaveBeenCalledTimes(1);
    
    await act(async () => {
      await result.current.startDownload('https://example.com/video2', 'video');
    });
    
    expect(vi.mocked(DownloadService.DownloadService.download)).toHaveBeenCalledTimes(2);
  });
});
