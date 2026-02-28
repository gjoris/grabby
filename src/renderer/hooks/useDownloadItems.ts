import { useState, useEffect } from 'react';
import { DownloadItem } from '../types/download';

export function useDownloadItems() {
  const [items, setItems] = useState<DownloadItem[]>([]);
  const [playlistName, setPlaylistName] = useState<string>('');

  useEffect(() => {
    // Playlist info
    window.electronAPI.onDownloadPlaylistInfo((data: any) => {
      setPlaylistName(data.name);
    });

    // Item start
    window.electronAPI.onDownloadItemStart((data: any) => {
      setItems(prev => {
        const newItems = [...prev];
        // Ensure we have enough items
        while (newItems.length < data.total) {
          newItems.push({
            id: `item-${newItems.length + 1}`,
            title: `Item ${newItems.length + 1}`,
            status: 'pending',
            progress: 0
          });
        }
        // Set current item to downloading
        if (newItems[data.index - 1]) {
          newItems[data.index - 1].status = 'downloading';
        }
        return newItems;
      });
    });

    // Item title
    window.electronAPI.onDownloadItemTitle((data: any) => {
      setItems(prev => {
        const newItems = [...prev];
        if (newItems[data.index - 1]) {
          newItems[data.index - 1].title = data.title;
        }
        return newItems;
      });
    });

    // Progress update
    window.electronAPI.onDownloadProgressUpdate((data: any) => {
      setItems(prev => {
        const newItems = [...prev];
        if (newItems[data.index - 1]) {
          newItems[data.index - 1].progress = data.progress;
        }
        return newItems;
      });
    });

    // Processing
    window.electronAPI.onDownloadItemProcessing((data: any) => {
      setItems(prev => {
        const newItems = [...prev];
        if (newItems[data.index - 1]) {
          newItems[data.index - 1].status = 'processing';
          newItems[data.index - 1].progress = 100;
        }
        return newItems;
      });
    });

    // Complete
    window.electronAPI.onDownloadItemComplete((data: any) => {
      setItems(prev => {
        const newItems = [...prev];
        if (newItems[data.index - 1]) {
          newItems[data.index - 1].status = 'completed';
          newItems[data.index - 1].progress = 100;
        }
        return newItems;
      });
    });

    // Error
    window.electronAPI.onDownloadItemError((data: any) => {
      setItems(prev => {
        const newItems = [...prev];
        if (newItems[data.index - 1]) {
          newItems[data.index - 1].status = 'error';
          newItems[data.index - 1].error = data.error;
        }
        return newItems;
      });
    });

    // Download complete
    window.electronAPI.onDownloadComplete(() => {
      // All done
    });
  }, []);

  const reset = () => {
    setItems([]);
    setPlaylistName('');
  };

  return {
    items,
    playlistName,
    reset
  };
}
