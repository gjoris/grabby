import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDownloadItems } from '../../hooks/useDownloadItems';

// Mock electronAPI
const mockOnDownloadPlaylistInfo = vi.fn();
const mockOnDownloadItemStart = vi.fn();
const mockOnDownloadItemTitle = vi.fn();
const mockOnDownloadProgressUpdate = vi.fn();
const mockOnDownloadItemProcessing = vi.fn();
const mockOnDownloadItemComplete = vi.fn();
const mockOnDownloadItemError = vi.fn();
const mockOnDownloadComplete = vi.fn();

Object.defineProperty(window, 'electronAPI', {
  value: {
    onDownloadPlaylistInfo: mockOnDownloadPlaylistInfo,
    onDownloadItemStart: mockOnDownloadItemStart,
    onDownloadItemTitle: mockOnDownloadItemTitle,
    onDownloadProgressUpdate: mockOnDownloadProgressUpdate,
    onDownloadItemProcessing: mockOnDownloadItemProcessing,
    onDownloadItemComplete: mockOnDownloadItemComplete,
    onDownloadItemError: mockOnDownloadItemError,
    onDownloadComplete: mockOnDownloadComplete,
  },
  writable: true,
});

describe('useDownloadItems', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with empty items', () => {
    const { result } = renderHook(() => useDownloadItems());
    
    expect(result.current.items).toEqual([]);
    expect(result.current.playlistName).toBe('');
  });

  it('resets items and playlist name', () => {
    const { result } = renderHook(() => useDownloadItems());
    
    act(() => {
      result.current.reset();
    });
    
    expect(result.current.items).toEqual([]);
    expect(result.current.playlistName).toBe('');
  });

  it('registers event listeners on mount', () => {
    renderHook(() => useDownloadItems());
    
    expect(mockOnDownloadPlaylistInfo).toHaveBeenCalled();
    expect(mockOnDownloadItemStart).toHaveBeenCalled();
    expect(mockOnDownloadItemTitle).toHaveBeenCalled();
    expect(mockOnDownloadProgressUpdate).toHaveBeenCalled();
    expect(mockOnDownloadItemProcessing).toHaveBeenCalled();
    expect(mockOnDownloadItemComplete).toHaveBeenCalled();
    expect(mockOnDownloadItemError).toHaveBeenCalled();
    expect(mockOnDownloadComplete).toHaveBeenCalled();
  });

  it('handles playlist info event', () => {
    const { result } = renderHook(() => useDownloadItems());
    
    const callback = mockOnDownloadPlaylistInfo.mock.calls[0][0];
    
    act(() => {
      callback({ name: 'My Playlist' });
    });
    
    expect(result.current.playlistName).toBe('My Playlist');
  });

  it('handles download item start event', () => {
    const { result } = renderHook(() => useDownloadItems());
    
    const callback = mockOnDownloadItemStart.mock.calls[0][0];
    
    act(() => {
      callback({ index: 1, total: 3 });
    });
    
    expect(result.current.items).toHaveLength(3);
    expect(result.current.items[0]).toEqual({
      id: 'item-1',
      title: 'Item 1',
      status: 'downloading',
      progress: 0
    });
    expect(result.current.items[1]).toEqual({
      id: 'item-2',
      title: 'Item 2',
      status: 'pending',
      progress: 0
    });
  });

  it('handles item title update', () => {
    const { result } = renderHook(() => useDownloadItems());
    
    // First, initialize items
    const startCallback = mockOnDownloadItemStart.mock.calls[0][0];
    act(() => {
      startCallback({ index: 1, total: 2 });
    });
    
    // Then update title
    const titleCallback = mockOnDownloadItemTitle.mock.calls[0][0];
    act(() => {
      titleCallback({ index: 1, title: 'Updated Title' });
    });
    
    expect(result.current.items[0].title).toBe('Updated Title');
  });

  it('handles progress update', () => {
    const { result } = renderHook(() => useDownloadItems());
    
    // Initialize items
    const startCallback = mockOnDownloadItemStart.mock.calls[0][0];
    act(() => {
      startCallback({ index: 1, total: 2 });
    });
    
    // Update progress
    const progressCallback = mockOnDownloadProgressUpdate.mock.calls[0][0];
    act(() => {
      progressCallback({ index: 1, progress: 50 });
    });
    
    expect(result.current.items[0].progress).toBe(50);
  });

  it('handles item processing event', () => {
    const { result } = renderHook(() => useDownloadItems());
    
    // Initialize items
    const startCallback = mockOnDownloadItemStart.mock.calls[0][0];
    act(() => {
      startCallback({ index: 1, total: 2 });
    });
    
    // Mark as processing
    const processingCallback = mockOnDownloadItemProcessing.mock.calls[0][0];
    act(() => {
      processingCallback({ index: 1 });
    });
    
    expect(result.current.items[0].status).toBe('processing');
    expect(result.current.items[0].progress).toBe(100);
  });

  it('handles item complete event', () => {
    const { result } = renderHook(() => useDownloadItems());
    
    // Initialize items
    const startCallback = mockOnDownloadItemStart.mock.calls[0][0];
    act(() => {
      startCallback({ index: 1, total: 2 });
    });
    
    // Mark as completed
    const completeCallback = mockOnDownloadItemComplete.mock.calls[0][0];
    act(() => {
      completeCallback({ index: 1 });
    });
    
    expect(result.current.items[0].status).toBe('completed');
    expect(result.current.items[0].progress).toBe(100);
  });

  it('handles item error event', () => {
    const { result } = renderHook(() => useDownloadItems());
    
    // Initialize items
    const startCallback = mockOnDownloadItemStart.mock.calls[0][0];
    act(() => {
      startCallback({ index: 1, total: 2 });
    });
    
    // Mark as error
    const errorCallback = mockOnDownloadItemError.mock.calls[0][0];
    act(() => {
      errorCallback({ index: 1, error: 'Network error' });
    });
    
    expect(result.current.items[0].status).toBe('error');
    expect(result.current.items[0].error).toBe('Network error');
  });

  it('handles multiple item updates in sequence', () => {
    const { result } = renderHook(() => useDownloadItems());
    
    const startCallback = mockOnDownloadItemStart.mock.calls[0][0];
    const titleCallback = mockOnDownloadItemTitle.mock.calls[0][0];
    const progressCallback = mockOnDownloadProgressUpdate.mock.calls[0][0];
    const completeCallback = mockOnDownloadItemComplete.mock.calls[0][0];
    
    act(() => {
      startCallback({ index: 1, total: 3 });
    });
    
    act(() => {
      titleCallback({ index: 1, title: 'Video 1' });
      progressCallback({ index: 1, progress: 25 });
    });
    
    expect(result.current.items[0]).toEqual({
      id: 'item-1',
      title: 'Video 1',
      status: 'downloading',
      progress: 25
    });
    
    act(() => {
      progressCallback({ index: 1, progress: 75 });
      progressCallback({ index: 1, progress: 100 });
      completeCallback({ index: 1 });
    });
    
    expect(result.current.items[0]).toEqual({
      id: 'item-1',
      title: 'Video 1',
      status: 'completed',
      progress: 100
    });
  });

  it('handles updates for items at different indices', () => {
    const { result } = renderHook(() => useDownloadItems());
    
    const startCallback = mockOnDownloadItemStart.mock.calls[0][0];
    const titleCallback = mockOnDownloadItemTitle.mock.calls[0][0];
    const progressCallback = mockOnDownloadProgressUpdate.mock.calls[0][0];
    
    act(() => {
      startCallback({ index: 1, total: 3 });
    });
    
    act(() => {
      titleCallback({ index: 1, title: 'Video 1' });
      titleCallback({ index: 2, title: 'Video 2' });
      titleCallback({ index: 3, title: 'Video 3' });
    });
    
    expect(result.current.items[0].title).toBe('Video 1');
    expect(result.current.items[1].title).toBe('Video 2');
    expect(result.current.items[2].title).toBe('Video 3');
    
    act(() => {
      progressCallback({ index: 2, progress: 50 });
    });
    
    expect(result.current.items[1].progress).toBe(50);
  });

  it('ignores updates for invalid indices', () => {
    const { result } = renderHook(() => useDownloadItems());
    
    const startCallback = mockOnDownloadItemStart.mock.calls[0][0];
    const titleCallback = mockOnDownloadItemTitle.mock.calls[0][0];
    
    act(() => {
      startCallback({ index: 1, total: 2 });
    });
    
    // Try to update non-existent item at index 5
    act(() => {
      titleCallback({ index: 5, title: 'Should not update' });
    });
    
    expect(result.current.items[0].title).toBe('Item 1');
    expect(result.current.items).toHaveLength(2);
  });

  it('handles download complete event', () => {
    const { result } = renderHook(() => useDownloadItems());
    
    const completeCallback = mockOnDownloadComplete.mock.calls[0][0];
    
    // Should not throw an error
    expect(() => {
      act(() => {
        completeCallback();
      });
    }).not.toThrow();
  });

  it('preserves item state across multiple updates', () => {
    const { result } = renderHook(() => useDownloadItems());
    
    const startCallback = mockOnDownloadItemStart.mock.calls[0][0];
    const titleCallback = mockOnDownloadItemTitle.mock.calls[0][0];
    const progressCallback = mockOnDownloadProgressUpdate.mock.calls[0][0];
    const processingCallback = mockOnDownloadItemProcessing.mock.calls[0][0];
    
    act(() => {
      startCallback({ index: 1, total: 1 });
      titleCallback({ index: 1, title: 'My Video' });
    });
    
    const initialItem = result.current.items[0];
    
    act(() => {
      progressCallback({ index: 1, progress: 50 });
    });
    
    // Title should be preserved
    expect(result.current.items[0].title).toBe('My Video');
    expect(result.current.items[0].progress).toBe(50);
    
    act(() => {
      processingCallback({ index: 1 });
    });
    
    // Title should still be preserved
    expect(result.current.items[0].title).toBe('My Video');
    expect(result.current.items[0].status).toBe('processing');
  });
});
