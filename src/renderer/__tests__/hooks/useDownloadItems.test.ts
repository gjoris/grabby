import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDownloadItems } from '../../hooks/useDownloadItems';

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
    
    expect(window.electronAPI.onDownloadPlaylistInfo).toHaveBeenCalled();
    expect(window.electronAPI.onDownloadItemStart).toHaveBeenCalled();
    expect(window.electronAPI.onDownloadItemTitle).toHaveBeenCalled();
    expect(window.electronAPI.onDownloadProgressUpdate).toHaveBeenCalled();
    expect(window.electronAPI.onDownloadItemProcessing).toHaveBeenCalled();
    expect(window.electronAPI.onDownloadItemComplete).toHaveBeenCalled();
    expect(window.electronAPI.onDownloadItemError).toHaveBeenCalled();
  });
});
