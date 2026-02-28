import { useState } from 'react';
import { DownloadType } from '../types';
import { DownloadService } from '../services/downloadService';

export function useDownload(downloadPath: string) {
  const [isDownloading, setIsDownloading] = useState(false);

  const startDownload = async (url: string, downloadType: DownloadType) => {
    if (!url) return;

    setIsDownloading(true);

    try {
      await DownloadService.download(url, downloadType, downloadPath);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return {
    isDownloading,
    startDownload
  };
}
