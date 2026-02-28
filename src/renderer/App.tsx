import { useState } from 'react';

declare global {
  interface Window {
    electronAPI: {
      download: (url: string, options: any) => Promise<any>;
      getInfo: (url: string) => Promise<any>;
      onDownloadProgress: (callback: (data: string) => void) => void;
      onDownloadError: (callback: (error: string) => void) => void;
    };
  }
}

type DownloadType = 'mp3' | 'video';

function App() {
  const [url, setUrl] = useState('');
  const [progress, setProgress] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadType, setDownloadType] = useState<DownloadType>('mp3');

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
            output: '~/Downloads/%(title)s.%(ext)s'
          }
        : {
            format: 'bestvideo+bestaudio/best',
            output: '~/Downloads/%(title)s.%(ext)s'
          };

      await window.electronAPI.download(url, options);
      setProgress('Download complete!');
    } catch (error) {
      setProgress(`Error: ${error}`);
    } finally {
      setIsDownloading(false);
    }
  };

  // Listen for progress updates
  window.electronAPI.onDownloadProgress((data) => {
    setProgress(data);
  });

  window.electronAPI.onDownloadError((error) => {
    setProgress(`Error: ${error}`);
  });

  return (
    <div className="app">
      <header>
        <h1>🎯 Grabby</h1>
        <p>Download videos with ease</p>
      </header>

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
    </div>
  );
}

export default App;
