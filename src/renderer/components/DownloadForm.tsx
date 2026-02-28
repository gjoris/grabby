import { useState } from 'react';
import { DownloadType } from '../types';

interface DownloadFormProps {
  onDownload: (url: string, type: DownloadType) => void;
  isDownloading: boolean;
}

function DownloadForm({ onDownload, isDownloading }: DownloadFormProps) {
  const [url, setUrl] = useState('');
  const [downloadType, setDownloadType] = useState<DownloadType>('mp3');

  const handleSubmit = () => {
    onDownload(url, downloadType);
  };

  return (
    <>
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
        onClick={handleSubmit}
        disabled={isDownloading || !url}
        className="download-btn"
      >
        {isDownloading ? 'Downloading...' : 'Download'}
      </button>
    </>
  );
}

export default DownloadForm;
