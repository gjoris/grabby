import { useState } from 'react';

declare global {
  interface Window {
    electronAPI: {
      download: (url: string, options: any) => Promise<any>;
      getInfo: (url: string) => Promise<any>;
      onDownloadProgress: (callback: (data: string) => void) => void;
      onDownloadError: (callback: (error: string) => void) => void;
      onBinaryDownloadProgress: (callback: (data: { binary: string; progress: number; status: string }) => void) => void;
      onBinariesReady: (callback: () => void) => void;
      checkBinaries: () => Promise<{ ready: boolean; missing: string[] }>;
      selectFolder: () => Promise<string | null>;
      getSettings: () => Promise<{ downloadPath: string }>;
      saveSettings: (settings: { downloadPath: string }) => Promise<void>;
    };
  }
}

type DownloadType = 'mp3' | 'video';

interface BinaryProgress {
  binary: string;
  progress: number;
  status: string;
}

interface Settings {
  downloadPath: string;
}

function App() {
  const [url, setUrl] = useState('');
  const [progress, setProgress] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadType, setDownloadType] = useState<DownloadType>('mp3');
  const [binaryProgress, setBinaryProgress] = useState<Record<string, BinaryProgress>>({});
  const [isReady, setIsReady] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<Settings>({ downloadPath: '' });

  // Check binaries on mount
  useState(() => {
    window.electronAPI.checkBinaries().then(result => {
      setIsReady(result.ready);
    });
    window.electronAPI.getSettings().then(result => {
      setSettings(result);
    });
  });

  // Listen for binary download progress
  window.electronAPI.onBinaryDownloadProgress((data) => {
    setBinaryProgress(prev => ({
      ...prev,
      [data.binary]: data
    }));
  });

  // Listen for binaries ready
  window.electronAPI.onBinariesReady(() => {
    setIsReady(true);
  });

  const handleDownload = async () => {
    if (!url) return;
    
    setIsDownloading(true);
    setProgress('Starting download...');

    try {
      const options = downloadType === 'mp3' 
        ? {
            format: 'bestaudio/best',
            extractAudio: true,
            audioFormat: 'mp3',
            output: `${settings.downloadPath}/%(title)s.%(ext)s`
          }
        : {
            format: 'bestvideo+bestaudio/best',
            output: `${settings.downloadPath}/%(title)s.%(ext)s`
          };

      await window.electronAPI.download(url, options);
      setProgress('Download complete!');
    } catch (error) {
      setProgress(`Error: ${error}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSelectFolder = async () => {
    const result = await window.electronAPI.selectFolder();
    if (result) {
      setSettings({ downloadPath: result });
      await window.electronAPI.saveSettings({ downloadPath: result });
    }
  };

  // Listen for progress updates
  window.electronAPI.onDownloadProgress((data) => {
    setProgress(data);
  });

  window.electronAPI.onDownloadError((error) => {
    setProgress(`Error: ${error}`);
  });

  const hasBinaryDownloads = Object.keys(binaryProgress).length > 0;

  return (
    <div className="app">
      <header>
        <h1>🎯 Grabby</h1>
        <p>Download videos with ease</p>
        <button 
          className="settings-btn"
          onClick={() => setShowSettings(!showSettings)}
        >
          ⚙️
        </button>
      </header>

      {showSettings && (
        <div className="settings-panel">
          <h2>Settings</h2>
          <div className="setting-item">
            <label>Download Location</label>
            <div className="folder-selector">
              <input 
                type="text" 
                value={settings.downloadPath || 'Not set'} 
                readOnly 
              />
              <button onClick={handleSelectFolder}>Browse</button>
            </div>
          </div>
          <button 
            className="close-settings"
            onClick={() => setShowSettings(false)}
          >
            Close
          </button>
        </div>
      )}

      {hasBinaryDownloads && !isReady && (
        <div className="binary-download">
          <h2>Setting up dependencies...</h2>
          <p>Downloading required components (one-time setup)</p>
          {Object.values(binaryProgress).map((item) => (
            <div key={item.binary} className="binary-item">
              <div className="binary-header">
                <span className="binary-name">{item.binary}</span>
                <span className="binary-status">{item.status}</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${item.progress}%` }}
                />
              </div>
              <div className="progress-text">{item.progress}%</div>
            </div>
          ))}
        </div>
      )}

      {isReady && (
        <main>
        <div className="input-group">
          <input
            type="text"
            placeholder="Paste YouTube URL or playlist here..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isDownloading}
          />
        </div>

        <div className="format-selector">
          <label>
            <input
              type="radio"
              value="mp3"
              checked={downloadType === 'mp3'}
              onChange={(e) => setDownloadType(e.target.value as DownloadType)}
              disabled={isDownloading}
            />
            MP3 (audio only)
          </label>
          <label>
            <input
              type="radio"
              value="video"
              checked={downloadType === 'video'}
              onChange={(e) => setDownloadType(e.target.value as DownloadType)}
              disabled={isDownloading}
            />
            Video (best quality)
          </label>
        </div>

        <button 
          onClick={handleDownload}
          disabled={isDownloading || !url}
          className="download-btn"
        >
          {isDownloading ? 'Downloading...' : 'Download'}
        </button>

        {progress && (
          <div className="progress">
            <pre>{progress}</pre>
          </div>
        )}
      </main>
      )}
    </div>
  );
}

export default App;
