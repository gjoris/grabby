import { useState, useEffect } from 'react';

interface DownloadLocationSelectorProps {
  onLocationChange: (path: string) => void;
}

function DownloadLocationSelector({ onLocationChange }: DownloadLocationSelectorProps) {
  const [currentPath, setCurrentPath] = useState<string>('');

  useEffect(() => {
    loadCurrentPath();
  }, []);

  const loadCurrentPath = async () => {
    const settings = await window.electronAPI.getSettings();
    setCurrentPath(settings.downloadPath);
  };

  const handleSelectFolder = async () => {
    const result = await window.electronAPI.selectFolder();
    if (result) {
      setCurrentPath(result);
      onLocationChange(result);
    }
  };

  return (
    <div className="download-location">
      <label className="location-label">Save to:</label>
      <div className="location-selector">
        <input 
          type="text" 
          value={currentPath || 'Not set'} 
          readOnly 
          className="location-input"
        />
        <button onClick={handleSelectFolder} className="location-btn">
          📁 Change
        </button>
      </div>
    </div>
  );
}

export default DownloadLocationSelector;
