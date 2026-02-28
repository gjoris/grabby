import { useSettings } from './hooks/useSettings';

interface SettingsProps {
  onBack: () => void;
}

function Settings({ onBack }: SettingsProps) {
  const { settings, selectFolder } = useSettings();

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
            <button onClick={selectFolder}>Browse</button>
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
