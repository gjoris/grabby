import { useState } from 'react';
import Settings from './Settings';
import Header from './components/Header';
import BinaryDownloadProgress from './components/BinaryDownloadProgress';
import DownloadForm from './components/DownloadForm';
import DownloadItemsList from './components/DownloadItemsList';
import DownloadLocationSelector from './components/DownloadLocationSelector';
import { useBinarySetup } from './hooks/useBinarySetup';
import { useDownload } from './hooks/useDownload';
import { useDownloadItems } from './hooks/useDownloadItems';
import { useSettings } from './hooks/useSettings';
import { DownloadType } from './types';

function App() {
  const [currentView, setCurrentView] = useState<'main' | 'settings'>('main');
  const [customDownloadPath, setCustomDownloadPath] = useState<string>('');
  
  const { isReady, binaryProgress, hasBinaryDownloads } = useBinarySetup();
  const { settings, loadSettings } = useSettings();
  const downloadPath = customDownloadPath || settings.downloadPath;
  const { isDownloading, startDownload } = useDownload(downloadPath);
  const { items, playlistName, reset } = useDownloadItems();

  const handleDownload = (url: string, type: DownloadType) => {
    reset();
    startDownload(url, type);
  };

  const handleLocationChange = (path: string) => {
    setCustomDownloadPath(path);
  };

  const handleBackFromSettings = () => {
    setCurrentView('main');
    loadSettings();
    setCustomDownloadPath(''); // Reset to default after settings change
  };

  const handleRedownloadBinaries = () => {
    setCurrentView('main');
  };

  if (currentView === 'settings') {
    return <Settings onBack={handleBackFromSettings} onRedownloadBinaries={handleRedownloadBinaries} />;
  }

  return (
    <div className="app">
      <Header onSettingsClick={() => setCurrentView('settings')} />

      {hasBinaryDownloads && !isReady && (
        <BinaryDownloadProgress binaryProgress={binaryProgress} />
      )}

      {isReady && (
        <main>
          <DownloadForm 
            onDownload={handleDownload}
            isDownloading={isDownloading}
          />
          <DownloadLocationSelector onLocationChange={handleLocationChange} />
          <DownloadItemsList 
            items={items}
            playlistName={playlistName}
          />
        </main>
      )}
    </div>
  );
}

export default App;
