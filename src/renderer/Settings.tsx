import { useState, useEffect } from 'react';
import { useSettings } from './hooks/useSettings';
import { ElectronAPIService } from './services/electronAPI';

interface SettingsProps {
  onBack: () => void;
}

interface BinaryVersions {
  ytdlp: string;
  ffmpeg: string;
  ffprobe: string;
  lastChecked: string;
}

function Settings({ onBack }: SettingsProps) {
  const { settings, selectFolder } = useSettings();
  const [versions, setVersions] = useState<BinaryVersions | null>(null);
  const [checkingUpdates, setCheckingUpdates] = useState(false);

  useEffect(() => {
    loadVersions();
  }, []);

  const loadVersions = async () => {
    const result = await ElectronAPIService.getBinaryVersions();
    setVersions(result);
  };

  const handleOpenLogs = async () => {
    await ElectronAPIService.openLogsDirectory();
  };

  const handleCheckUpdates = async () => {
    setCheckingUpdates(true);
    try {
      const result = await ElectronAPIService.checkForUpdates();
      if (result.hasUpdates && result.ytdlpUpdate) {
        alert(`Update available for yt-dlp: ${result.ytdlpUpdate}\n\nPlease download the latest version from the releases page.`);
      } else {
        alert('All binaries are up to date!');
      }
      await loadVersions();
    } catch (error) {
      alert('Failed to check for updates');
    } finally {
      setCheckingUpdates(false);
    }
  };

  const handleRedownloadBinaries = async () => {
    const confirmed = confirm(
      'This will delete and re-download all binaries (yt-dlp, ffmpeg, ffprobe).\n\n' +
      'The application will restart after the download.\n\n' +
      'Continue?'
    );
    
    if (confirmed) {
      try {
        await ElectronAPIService.redownloadBinaries();
      } catch (error) {
        alert('Failed to redownload binaries: ' + error);
      }
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
            Set the default location where your downloaded files will be saved. You can change this per download in the main screen.
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
          <h2>Binary Versions</h2>
          <p className="setting-description">
            Installed versions of yt-dlp and ffmpeg tools
          </p>
          {versions ? (
            <div className="versions-list">
              <div className="version-item">
                <span className="version-label">yt-dlp:</span>
                <span className="version-value">{versions.ytdlp}</span>
              </div>
              <div className="version-item">
                <span className="version-label">ffmpeg:</span>
                <span className="version-value">{versions.ffmpeg}</span>
              </div>
              <div className="version-item">
                <span className="version-label">ffprobe:</span>
                <span className="version-value">{versions.ffprobe}</span>
              </div>
              <div className="version-item">
                <span className="version-label">Last checked:</span>
                <span className="version-value">
                  {new Date(versions.lastChecked).toLocaleDateString()}
                </span>
              </div>
            </div>
          ) : (
            <p>Loading versions...</p>
          )}
          <button 
            onClick={handleCheckUpdates} 
            className="secondary-btn"
            disabled={checkingUpdates}
            style={{ marginRight: '0.5rem' }}
          >
            {checkingUpdates ? 'Checking...' : 'Check for Updates'}
          </button>
          <button 
            onClick={handleRedownloadBinaries} 
            className="danger-btn"
          >
            Redownload Binaries
          </button>
        </div>

        <div className="setting-group">
          <h2>Logs</h2>
          <p className="setting-description">
            Download logs are automatically saved for troubleshooting. Logs older than 30 days are automatically deleted.
          </p>
          <button onClick={handleOpenLogs} className="secondary-btn">
            Open Logs Folder
          </button>
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
