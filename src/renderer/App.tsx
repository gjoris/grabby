import { useState } from 'react';
import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material';
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

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#667eea',
    },
    secondary: {
      main: '#764ba2',
    },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  shape: {
    borderRadius: 8,
  },
});

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
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Settings onBack={handleBackFromSettings} onRedownloadBinaries={handleRedownloadBinaries} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}>
        <Header onSettingsClick={() => setCurrentView('settings')} />

        {hasBinaryDownloads && !isReady && (
          <BinaryDownloadProgress binaryProgress={binaryProgress} />
        )}

        {isReady && (
          <>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 2,
              maxWidth: 900,
              width: '100%',
              mx: 'auto',
              px: 3,
              pt: 3,
              flexShrink: 0,
            }}>
              <DownloadForm 
                onDownload={handleDownload}
                isDownloading={isDownloading}
              />
              <DownloadLocationSelector onLocationChange={handleLocationChange} />
            </Box>
            
            <Box sx={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column',
              maxWidth: 900,
              width: '100%',
              mx: 'auto',
              px: 3,
              pb: 3,
              overflow: 'hidden',
              minHeight: 0,
            }}>
              <DownloadItemsList 
                items={items}
                playlistName={playlistName}
              />
            </Box>
          </>
        )}
      </Box>
    </ThemeProvider>
  );
}

export default App;
