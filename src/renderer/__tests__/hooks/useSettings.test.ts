import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSettings } from '../../hooks/useSettings';

describe('useSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads settings on mount', async () => {
    const { result } = renderHook(() => useSettings());
    
    await waitFor(() => {
      expect(result.current.settings.downloadPath).toBe('/test/path');
    });
  });

  it('updates download path', async () => {
    const { result } = renderHook(() => useSettings());
    
    await result.current.updateDownloadPath('/new/path');
    
    expect(window.electronAPI.saveSettings).toHaveBeenCalledWith({
      downloadPath: '/new/path',
    });
  });

  it('selects folder and updates path', async () => {
    vi.mocked(window.electronAPI.selectFolder).mockResolvedValue('/selected/path');
    
    const { result } = renderHook(() => useSettings());
    
    await result.current.selectFolder();
    
    await waitFor(() => {
      expect(window.electronAPI.saveSettings).toHaveBeenCalledWith({
        downloadPath: '/selected/path',
      });
    });
  });

  it('does not update path when folder selection is cancelled', async () => {
    vi.mocked(window.electronAPI.selectFolder).mockResolvedValue(null);
    
    const { result } = renderHook(() => useSettings());
    
    const saveCallsBefore = vi.mocked(window.electronAPI.saveSettings).mock.calls.length;
    await result.current.selectFolder();
    const saveCallsAfter = vi.mocked(window.electronAPI.saveSettings).mock.calls.length;
    
    expect(saveCallsAfter).toBe(saveCallsBefore);
  });
});
