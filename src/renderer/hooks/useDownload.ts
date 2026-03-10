import { useState } from 'react';
import { DownloadType } from '../types';
import { DownloadService } from '../services/downloadService';
import { ElectronAPIService } from '../services/electronAPI';

export function useDownload(downloadPath: string) {
  const [isDownloading, setIsDownloading] = useState(false);

  const startDownload = async (url: string, downloadType: DownloadType, jobId: string) => {
    if (!url) return;

    try {
      setIsDownloading(true);
      await DownloadService.download(url, downloadType, downloadPath, jobId);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const cancelDownload = async (jobId: string) => {
    try {
      await ElectronAPIService.cancelDownload(jobId);
      setIsDownloading(false);
    } catch (error) {
      console.error('Cancel failed:', error);
    }
  };

  return {
    isDownloading,
    startDownload,
    cancelDownload
  };
}
