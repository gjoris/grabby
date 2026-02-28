import { useState } from 'react';
import Settings from './Settings';
import Header from './components/Header';
import BinaryDownloadProgress from './components/BinaryDownloadProgress';
import DownloadForm from './components/DownloadForm';
import ProgressLog from './components/ProgressLog';
import { useBinarySetup } from './hooks/useBinarySetup';
import { useDownload } from './hooks/useDownload';
import { useSettings } from './hooks/useSettings';
import { DownloadType } from './types';

function App() {
  const [currentView, setCurrentView] = useState<'main' | 'settings'>('main');
  
  const { isReady, binaryProgress, hasBinaryDownloads } = useBinarySetup();
  const { settings, loadSettings } = useSettings();
  const { isDownloading, progress, startDownload } = useDownload(settings.downloadPath);

  const handleDownload = (url: string, type: DownloadType) => {
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
          <ProgressLog progress={progress} />
        </main>
      )}
    </div>
  );
}

export default App;
