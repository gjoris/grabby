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

function App() {
  const [url, setUrl] = useState('');
  const [progress, setProgress] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!url) return;
    
    setIsDownloading(true);
    setProgress('Starting download...');

    try {
      await window.electronAPI.download(url, {
        format: 'bestvideo+bestaudio/best',
        output: '~/Downloads/%(title)s.%(ext)s'
      });
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
            placeholder="Paste video URL here..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isDownloading}
          />
          <button 
            onClick={handleDownload}
            disabled={isDownloading || !url}
          >
            {isDownloading ? 'Downloading...' : 'Download'}
          </button>
        </div>

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
