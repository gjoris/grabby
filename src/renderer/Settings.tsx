import { useState, useEffect } from 'react';
import { useSettings } from './hooks/useSettings';
import { ElectronAPIService } from './services/electronAPI';

interface SettingsProps {
  onBack: () => void;
  onRedownloadBinaries: () => void;
}

interface BinaryVersions {
  ytdlp: string;
  ffmpeg: string;
  ffprobe: string;
  lastChecked: string;
}

interface LogStats {
  count: number;
  sizeBytes: number;
  sizeMB: string;
}

function Settings({ onBack, onRedownloadBinaries }: SettingsProps) {
  const { settings, selectFolder } = useSettings();
  const [versions, setVersions] = useState<BinaryVersions | null>(null);
  const [checkingUpdates, setCheckingUpdates] = useState(false);
  const [logStats, setLogStats] = useState<LogStats | null>(null);

  useEffect(() => {
    loadVersions();
    loadLogStats();
  }, []);

  const loadVersions = async () => {
    const result = await ElectronAPIService.getBinaryVersions();
    setVersions(result);
  };

  const loadLogStats = async () => {
    const result = await ElectronAPIService.getLogStats();
    setLogStats(result);
  };

  const handleOpenLogs = async () => {
    await ElectronAPIService.openLogsDirectory();
  };

  const handleClearLogs = async () => {
    const confirmed = confirm(
      'This will delete all log files.\n\n' +
      'This action cannot be undone.\n\n' +
      'Continue?'
    );
    
    if (confirmed) {
      const success = await ElectronAPIService.clearLogs();
      if (success) {
        alert('All logs have been cleared.');
        await loadLogStats();
      } else {
        alert('Failed to clear logs.');
      }
    }
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
        onRedownloadBinaries();
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
          {logStats && (
            <div className="log-stats">
              <p>
                <strong>{logStats.count}</strong> log files • <strong>{logStats.sizeMB} MB</strong> total
              </p>
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={handleOpenLogs} className="secondary-btn">
              Open Logs Folder
            </button>
            <button onClick={handleClearLogs} className="danger-btn">
              Clear All Logs
            </button>
          </div>
        </div>

        <div className="setting-group">
          <h2>About</h2>
          <div className="about-content">
            <p className="about-app">
              <strong>Grabby v1.0.0</strong><br />
              A cross-platform video downloader powered by yt-dlp
            </p>
            <p className="about-developer">
              <strong>Developer:</strong> Geroen Joris
            </p>
            <p className="about-links">
              <a 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  window.open('https://github.com/gjoris/grabby', '_blank');
                }}
              >
                GitHub Repository
              </a>
              {' • '}
              <a 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  window.open('https://github.com/gjoris/grabby/issues', '_blank');
                }}
              >
                Report Issue
              </a>
            </p>
            <p className="about-license">
              Licensed under MIT License
            </p>
            <div className="about-dependencies">
              <p><strong>Built with:</strong></p>
              <ul>
                <li>
                  <a 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      window.open('https://github.com/yt-dlp/yt-dlp', '_blank');
                    }}
                  >
                    yt-dlp
                  </a>
                  {' - Video downloader'}
                </li>
                <li>
                  <a 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      window.open('https://ffmpeg.org/', '_blank');
                    }}
                  >
                    FFmpeg
                  </a>
                  {' - Multimedia framework'}
                </li>
                <li>
                  <a 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      window.open('https://www.electronjs.org/', '_blank');
                    }}
                  >
                    Electron
                  </a>
                  {' - Desktop framework'}
                </li>
                <li>
                  <a 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      window.open('https://react.dev/', '_blank');
                    }}
                  >
                    React
                  </a>
                  {' - UI library'}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
