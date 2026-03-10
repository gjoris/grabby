import { useState } from 'react';
import { DownloadType } from '../types';
import { DownloadService } from '../services/downloadService';

export function useDownload(downloadPath: string) {
  const startDownload = async (url: string, downloadType: DownloadType, jobId: string) => {
    if (!url) return;

    try {
      await DownloadService.download(url, downloadType, downloadPath, jobId);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return {
    startDownload
  };
}
