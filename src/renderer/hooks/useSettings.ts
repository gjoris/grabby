import { useState, useEffect } from 'react';
import { Settings } from '../types';
import { ElectronAPIService } from '../services/electronAPI';

export function useSettings() {
  const [settings, setSettings] = useState<Settings>({ downloadPath: '' });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const result = await ElectronAPIService.getSettings();
    setSettings(result);
  };

  const updateDownloadPath = async (path: string) => {
    const newSettings = { downloadPath: path };
    setSettings(newSettings);
    await ElectronAPIService.saveSettings(newSettings);
  };

  const selectFolder = async () => {
    const result = await ElectronAPIService.selectFolder();
    if (result) {
      await updateDownloadPath(result);
    }
  };

  return {
    settings,
    loadSettings,
    updateDownloadPath,
    selectFolder
  };
}
