import { useState } from 'react';
import { ThemeProvider, createTheme, CssBaseline, Box, Container } from '@mui/material';
import Settings from './Settings';
import Header from './components/Header';
import BinaryDownloadProgress from './components/BinaryDownloadProgress';
import DownloadForm from './components/DownloadForm';
import DownloadTable from './components/DownloadTable';
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
    background: {
      default: '#f5f7fa',
      paper: '#ffffff',
    }
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    button: {
      textTransform: 'none',
      fontWeight: 600,
    }
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        }
      }
    }
  }
});

function App() {
  const [currentView, setCurrentView] = useState<'main' | 'settings'>('main');
  const [customDownloadPath, setCustomDownloadPath] = useState<string>('');
  
  const { isReady, binaryProgress, hasBinaryDownloads } = useBinarySetup();
  const { settings, loadSettings } = useSettings();
  const downloadPath = customDownloadPath || settings.downloadPath;
  const { isDownloading, startDownload } = useDownload(downloadPath);
  const { items, playlistName, startNewDownload } = useDownloadItems();

  const handleDownload = (url: string, type: DownloadType) => {
    const jobId = startNewDownload();
    startDownload(url, type, jobId);
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

  const handleOpenFolder = (path: string) => {
    // Implement folder opening logic here if needed, 
    // or rely on the main process to handle it via a new IPC event
    console.log('Open folder:', path);
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
        overflow: 'hidden'
      }}>
        <Header onSettingsClick={() => setCurrentView('settings')} />

        {hasBinaryDownloads && !isReady && (
          <Container maxWidth="md" sx={{ mt: 10 }}>
            <BinaryDownloadProgress binaryProgress={binaryProgress} />
          </Container>
        )}

        {isReady && (
          <Container maxWidth="xl" sx={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 3,
            p: 4,
            overflow: 'hidden'
          }}>
            {/* Action Area */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 2,
              animation: 'fadeInDown 0.5s ease-out'
            }}>
              <DownloadForm 
                onDownload={handleDownload}
                isDownloading={false}
              />
              <DownloadLocationSelector onLocationChange={handleLocationChange} />
            </Box>
            
            {/* Data Area */}
            <Box sx={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column',
              minHeight: 0,
              position: 'relative',
              animation: 'fadeInUp 0.5s ease-out'
            }}>
              <DownloadTable 
                items={items} 
                onOpenFolder={handleOpenFolder}
              />
            </Box>
          </Container>
        )}
        <style>
          {`
            @keyframes fadeInDown {
              from { opacity: 0; transform: translateY(-20px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes fadeInUp {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}
        </style>
      </Box>
    </ThemeProvider>
  );
}

export default App;
