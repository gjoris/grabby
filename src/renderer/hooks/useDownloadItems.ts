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
        const jobPrefix = data.jobId;
        
        // Find existing initializing item for this job or create new items
        const existingInitIndex = newItems.findIndex(item => item.id === `${jobPrefix}-init`);
        
        if (existingInitIndex !== -1 && data.index === 1) {
          // Replace the init placeholder with the first real item
          newItems[existingInitIndex] = {
            id: `${jobPrefix}-${data.index}`,
            title: `Item ${data.index}`,
            status: 'downloading',
            progress: 0
          };
        }

        // Ensure we have enough items for this job
        for (let i = 1; i <= data.total; i++) {
          const itemId = `${jobPrefix}-${i}`;
          if (!newItems.find(item => item.id === itemId)) {
            newItems.push({
              id: itemId,
              title: `Item ${i}`,
              status: 'pending',
              progress: 0
            });
          }
        }

        // Set current item to downloading
        const currentItem = newItems.find(item => item.id === `${jobPrefix}-${data.index}`);
        if (currentItem) {
          currentItem.status = 'downloading';
        }
        
        return newItems;
      });
    });

    // Item title
    window.electronAPI.onDownloadItemTitle((data: any) => {
      setItems(prev => {
        const newItems = [...prev];
        const itemId = `${data.jobId}-${data.index || 1}`;
        let item = newItems.find(i => i.id === itemId);

        // Fallback for initializing item
        if (!item) {
          const initItem = newItems.find(i => i.id === `${data.jobId}-init`);
          if (initItem) {
            initItem.id = itemId;
            item = initItem;
          }
        }

        if (item) {
          item.title = data.title;
          if (item.status === 'pending') {
            item.status = 'downloading';
          }
        } else {
          // Auto-create if not found
          newItems.push({
            id: itemId,
            title: data.title,
            status: 'downloading',
            progress: 0
          });
        }
        return newItems;
      });
    });

    // Progress update
    window.electronAPI.onDownloadProgressUpdate((data: any) => {
      setItems(prev => {
        const newItems = [...prev];
        const itemId = `${data.jobId}-${data.index || 1}`;
        const item = newItems.find(i => i.id === itemId);

        if (item) {
          item.progress = data.progress;
          item.size = data.size;
          item.speed = data.speed;
          item.eta = data.eta;
          if (item.status === 'pending') {
            item.status = 'downloading';
          }
        }
        return newItems;
      });
    });

    // Processing
    window.electronAPI.onDownloadItemProcessing((data: any) => {
      setItems(prev => {
        const newItems = [...prev];
        const itemId = `${data.jobId}-${data.index || 1}`;
        const item = newItems.find(i => i.id === itemId);

        if (item) {
          item.status = 'processing';
          item.progress = 100;
        }
        return newItems;
      });
    });

    // Complete
    window.electronAPI.onDownloadItemComplete((data: any) => {
      setItems(prev => {
        const newItems = [...prev];
        const itemId = `${data.jobId}-${data.index || 1}`;
        const item = newItems.find(i => i.id === itemId);

        if (item) {
          item.status = 'completed';
          item.progress = 100;
        }
        return newItems;
      });
    });

    // Error
    window.electronAPI.onDownloadItemError((data: any) => {
      setItems(prev => {
        const newItems = [...prev];
        const itemId = `${data.jobId}-${data.index || 1}`;
        const item = newItems.find(i => i.id === itemId);

        if (item) {
          item.status = 'error';
          item.error = data.error;
        }
        return newItems;
      });
    });

    // Download complete
    window.electronAPI.onDownloadComplete(() => {
      // Job done
    });
  }, []);

  const reset = () => {
    setItems([]);
    setPlaylistName('');
  };

  const startNewDownload = () => {
    const jobId = Math.random().toString(36).substring(2, 9);
    setItems(prev => [
      {
        id: `${jobId}-init`,
        title: 'Initializing...',
        status: 'pending',
        progress: 0
      },
      ...prev
    ]);
    return jobId;
  };

  return {
    items,
    playlistName,
    reset,
    startNewDownload
  };
}
