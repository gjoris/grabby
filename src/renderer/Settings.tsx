import { useState, useEffect } from 'react';

interface SettingsProps {
  onBack: () => void;
}

interface Settings {
  downloadPath: string;
}

function Settings({ onBack }: SettingsProps) {
  const [settings, setSettings] = useState<Settings>({ downloadPath: '' });

  useEffect(() => {
    window.electronAPI.getSettings().then(result => {
      setSettings(result);
    });
  }, []);

  const handleSelectFolder = async () => {
    const result = await window.electronAPI.selectFolder();
    if (result) {
      setSettings({ downloadPath: result });
      await window.electronAPI.saveSettings({ downloadPath: result });
    }
  };

  return (
    <div className="settings-view">
      <div className="settings-header">
        <button className="back-btn" onClick={onBack}>
          ← Back
        </button>
        <h1>Settings</h1>
      </div>

      <div className="settings-content">
        <div className="setting-group">
          <h2>Download Location</h2>
          <p className="setting-description">
            Choose where your downloaded files will be saved
          </p>
          <div className="folder-selector">
            <input 
              type="text" 
              value={settings.downloadPath || 'Not set'} 
              readOnly 
            />
            <button onClick={handleSelectFolder}>Browse</button>
          </div>
        </div>

        <div className="setting-group">
          <h2>About</h2>
          <p className="setting-description">
            Grabby - A simple YouTube downloader powered by yt-dlp
          </p>
        </div>
      </div>
    </div>
  );
}

export default Settings;
