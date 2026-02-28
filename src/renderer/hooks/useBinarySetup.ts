import { useState, useEffect } from 'react';
import { BinaryProgress } from '../types';
import { ElectronAPIService } from '../services/electronAPI';

export function useBinarySetup() {
  const [isReady, setIsReady] = useState(false);
  const [binaryProgress, setBinaryProgress] = useState<Record<string, BinaryProgress>>({});

  useEffect(() => {
    // Check if binaries are ready
    ElectronAPIService.checkBinaries().then(result => {
      setIsReady(result.ready);
    });

    // Listen for binary download progress
    ElectronAPIService.onBinaryDownloadProgress((data) => {
      setBinaryProgress(prev => ({
        ...prev,
        [data.binary]: data
      }));
    });

    // Listen for binaries ready
    ElectronAPIService.onBinariesReady(() => {
      setIsReady(true);
    });
  }, []);

  return {
    isReady,
    binaryProgress,
    hasBinaryDownloads: Object.keys(binaryProgress).length > 0
  };
}
