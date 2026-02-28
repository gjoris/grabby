import { useState, useEffect } from 'react';
import { DownloadType } from '../types';
import { DownloadService } from '../services/downloadService';
import { ElectronAPIService } from '../services/electronAPI';

export function useDownload(downloadPath: string) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState<string[]>([]);

  useEffect(() => {
    // Listen for progress updates
    ElectronAPIService.onDownloadProgress((data) => {
      setProgress(prev => [...prev, data]);
    });

    // Listen for errors
    ElectronAPIService.onDownloadError((error) => {
      setProgress(prev => [...prev, `Error: ${error}`]);
    });
  }, []);

  const startDownload = async (url: string, downloadType: DownloadType) => {
    if (!url) return;

    setIsDownloading(true);
    setProgress(['Starting download...']);

    try {
      await DownloadService.download(url, downloadType, downloadPath);
      setProgress(prev => [...prev, 'Download complete!']);
    } catch (error) {
      setProgress(prev => [...prev, `Error: ${error}`]);
    } finally {
      setIsDownloading(false);
    }
  };

  return {
    isDownloading,
    progress,
    startDownload
  };
}
