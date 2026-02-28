import { useState } from 'react';
import Settings from './Settings';
import Header from './components/Header';
import BinaryDownloadProgress from './components/BinaryDownloadProgress';
import DownloadForm from './components/DownloadForm';
import DownloadItemsList from './components/DownloadItemsList';
import { useBinarySetup } from './hooks/useBinarySetup';
import { useDownload } from './hooks/useDownload';
import { useDownloadItems } from './hooks/useDownloadItems';
import { useSettings } from './hooks/useSettings';
import { DownloadType } from './types';

function App() {
  const [currentView, setCurrentView] = useState<'main' | 'settings'>('main');
  
  const { isReady, binaryProgress, hasBinaryDownloads } = useBinarySetup();
  const { settings, loadSettings } = useSettings();
  const { isDownloading, startDownload } = useDownload(settings.downloadPath);
  const { items, playlistName, reset } = useDownloadItems();

  const handleDownload = (url: string, type: DownloadType) => {
    reset();
    startDownload(url, type);
  };

  const handleBackFromSettings = () => {
    setCurrentView('main');
    loadSettings();
  };

  if (currentView === 'settings') {
    return <Settings onBack={handleBackFromSettings} />;
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
