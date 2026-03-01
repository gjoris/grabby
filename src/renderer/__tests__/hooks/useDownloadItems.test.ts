import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDownloadItems } from '../../hooks/useDownloadItems';

// Mock handlers
let itemStartHandler: any;
let progressUpdateHandler: any;
let itemTitleHandler: any;
let itemProcessingHandler: any;
let itemCompleteHandler: any;
let itemErrorHandler: any;
let playlistInfoHandler: any;
let downloadCompleteHandler: any;

Object.defineProperty(window, 'electronAPI', {
  value: {
    onDownloadPlaylistInfo: (cb: any) => { playlistInfoHandler = cb; },
    onDownloadItemStart: (cb: any) => { itemStartHandler = cb; },
    onDownloadItemTitle: (cb: any) => { itemTitleHandler = cb; },
    onDownloadProgressUpdate: (cb: any) => { progressUpdateHandler = cb; },
    onDownloadItemProcessing: (cb: any) => { itemProcessingHandler = cb; },
    onDownloadItemComplete: (cb: any) => { itemCompleteHandler = cb; },
    onDownloadItemError: (cb: any) => { itemErrorHandler = cb; },
    onDownloadComplete: (cb: any) => { downloadCompleteHandler = cb; },
  },
  writable: true,
});

describe('useDownloadItems', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles the full lifecycle of a download session', () => {
    const { result } = renderHook(() => useDownloadItems());
    let jobId: string;
    
    // 1. Reset/Start
    act(() => { jobId = result.current.startNewDownload(); });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].title).toBe('Initializing...');

    // 2. Playlist Info
    act(() => { playlistInfoHandler({ jobId, name: 'My Collection' }); });
    expect(result.current.playlistName).toBe('My Collection');

    // 3. Item Start (replaces placeholder)
    act(() => { itemStartHandler({ jobId, index: 1, total: 2 }); });
    expect(result.current.items).toHaveLength(2);
    expect(result.current.items[0].status).toBe('downloading');

    // 4. Item Title
    act(() => { itemTitleHandler({ jobId, index: 1, title: 'Video One' }); });
    expect(result.current.items[0].title).toBe('Video One');

    // 5. Progress
    act(() => { progressUpdateHandler({ jobId, index: 1, progress: 25, speed: '1MB/s' }); });
    expect(result.current.items[0].progress).toBe(25);

    // 6. Processing
    act(() => { itemProcessingHandler({ jobId, index: 1 }); });
    expect(result.current.items[0].status).toBe('processing');

    // 7. Complete
    act(() => { itemCompleteHandler({ jobId, index: 1 }); });
    expect(result.current.items[0].status).toBe('completed');

    // 8. Global complete signal
    act(() => { downloadCompleteHandler(); });
    // Verify reset works too
    act(() => { result.current.reset(); });
    expect(result.current.items).toHaveLength(0);
  });

  it('auto-creates items if events arrive out of order', () => {
    const { result } = renderHook(() => useDownloadItems());
    const jobId = 'rogue-job';
    
    // Event for index 1 arrives but startNewDownload wasn't called
    act(() => { itemTitleHandler({ jobId, index: 1, title: 'Surprise Video' }); });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].title).toBe('Surprise Video');
  });

  it('handles item errors correctly', () => {
    const { result } = renderHook(() => useDownloadItems());
    let jobId: string;
    act(() => { jobId = result.current.startNewDownload(); });
    // First trigger a start to establish the item index
    act(() => { itemStartHandler({ jobId, index: 1, total: 1 }); });
    act(() => { itemErrorHandler({ jobId, index: 1, error: 'Network fail' }); });
    expect(result.current.items[0].status).toBe('error');
    expect(result.current.items[0].error).toBe('Network fail');
  });
});