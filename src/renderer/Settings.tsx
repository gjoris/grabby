import { useState, useEffect } from 'react';
import { 
  Box, Container, AppBar, Toolbar, IconButton, Typography, Paper, 
  TextField, Button, Divider, List, ListItem, ListItemText, Link,
  Alert
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FolderIcon from '@mui/icons-material/Folder';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import { useSettings } from './hooks/useSettings';
import { ElectronAPIService } from './services/electronAPI';

interface SettingsProps {
  onBack: () => void;
  onRedownloadBinaries: () => void;
}

interface BinaryVersions {
  ytdlp: string;
  ffmpeg: string;
  ffprobe: string;
  lastChecked: string;
}

interface LogStats {
  count: number;
  sizeBytes: number;
  sizeMB: string;
}

function Settings({ onBack, onRedownloadBinaries }: SettingsProps) {
  const { settings, selectFolder } = useSettings();
  const [versions, setVersions] = useState<BinaryVersions | null>(null);
  const [checkingUpdates, setCheckingUpdates] = useState(false);
  const [logStats, setLogStats] = useState<LogStats | null>(null);
  const [appVersion, setAppVersion] = useState<string>('');

  useEffect(() => {
    loadVersions();
    loadLogStats();
    loadAppVersion();
  }, []);

  const loadVersions = async () => {
    const result = await ElectronAPIService.getBinaryVersions();
    setVersions(result);
  };

  const loadLogStats = async () => {
    const result = await ElectronAPIService.getLogStats();
    setLogStats(result);
  };

  const loadAppVersion = async () => {
    const version = await ElectronAPIService.getAppVersion();
    setAppVersion(version);
  };

  const handleOpenLogs = async () => {
    await ElectronAPIService.openLogsDirectory();
  };

  const handleClearLogs = async () => {
    const confirmed = confirm(
      'This will delete all log files.\n\nThis action cannot be undone.\n\nContinue?'
    );
    
    if (confirmed) {
      const success = await ElectronAPIService.clearLogs();
      if (success) {
        alert('All logs have been cleared.');
        await loadLogStats();
      } else {
        alert('Failed to clear logs.');
      }
    }
  };

  const handleCheckUpdates = async () => {
    setCheckingUpdates(true);
    try {
      const result = await ElectronAPIService.checkForUpdates();
      if (result.hasUpdates && result.ytdlpUpdate) {
        alert(`Update available for yt-dlp: ${result.ytdlpUpdate}\n\nPlease download the latest version from the releases page.`);
      } else {
        alert('All binaries are up to date!');
      }
      await loadVersions();
    } catch (error) {
      alert('Failed to check for updates');
    } finally {
      setCheckingUpdates(false);
    }
  };

  const handleRedownloadBinaries = async () => {
    const confirmed = confirm(
      'This will delete and re-download all binaries (yt-dlp, ffmpeg, ffprobe).\n\nThe application will restart after the download.\n\nContinue?'
    );
    
    if (confirmed) {
      try {
        onRedownloadBinaries();
        await ElectronAPIService.redownloadBinaries();
      } catch (error) {
        alert('Failed to redownload binaries: ' + error);
      }
    }
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={onBack} aria-label="Back">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ ml: 2 }}>
            Settings
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 4, flex: 1, overflow: 'auto' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          
          {/* Download Location */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Download Location
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Set the default location where your downloaded files will be saved.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                value={settings.downloadPath || 'Not set'}
                InputProps={{ readOnly: true }}
                size="small"
              />
              <Button variant="outlined" startIcon={<FolderIcon />} onClick={selectFolder}>
                Browse
              </Button>
            </Box>
          </Paper>

          {/* Binary Versions */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Binary Versions
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Installed versions of yt-dlp and ffmpeg tools
            </Typography>
            {versions ? (
              <List dense>
                <ListItem>
                  <ListItemText primary="yt-dlp" secondary={versions.ytdlp} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="ffmpeg" secondary={versions.ffmpeg} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="ffprobe" secondary={versions.ffprobe} />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Last checked" 
                    secondary={new Date(versions.lastChecked).toLocaleDateString()} 
                  />
                </ListItem>
              </List>
            ) : (
              <Typography>Loading versions...</Typography>
            )}
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleCheckUpdates}
                disabled={checkingUpdates}
              >
                {checkingUpdates ? 'Checking...' : 'Check for Updates'}
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleRedownloadBinaries}
              >
                Redownload Binaries
              </Button>
            </Box>
          </Paper>

          {/* Logs */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Logs
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Download logs are automatically saved for troubleshooting. Logs older than 30 days are automatically deleted.
            </Typography>
            {logStats && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <strong>{logStats.count}</strong> log files • <strong>{logStats.sizeMB} MB</strong> total
              </Alert>
            )}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="outlined" startIcon={<FolderOpenIcon />} onClick={handleOpenLogs}>
                Open Logs Folder
              </Button>
              <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={handleClearLogs}>
                Clear All Logs
              </Button>
            </Box>
          </Paper>

          {/* About */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              About
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  Grabby v{appVersion}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  A cross-platform video downloader powered by yt-dlp
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2">
                  <strong>Developer:</strong> Geroen Joris
                </Typography>
              </Box>

              <Box>
                <Link href="#" onClick={(e) => { e.preventDefault(); window.open('https://github.com/gjoris/grabby', '_blank'); }} sx={{ mr: 2 }}>
                  GitHub Repository
                </Link>
                <Link href="#" onClick={(e) => { e.preventDefault(); window.open('https://github.com/gjoris/grabby/issues', '_blank'); }}>
                  Report Issue
                </Link>
              </Box>

              <Typography variant="caption" color="text.secondary">
                Licensed under MIT License
              </Typography>

              <Divider />

              <Box>
                <Typography variant="body2" fontWeight={500} gutterBottom>
                  Built with:
                </Typography>
                <List dense>
                  <ListItem disablePadding>
                    <ListItemText 
                      primary={
                        <Link href="#" onClick={(e) => { e.preventDefault(); window.open('https://github.com/yt-dlp/yt-dlp', '_blank'); }}>
                          yt-dlp
                        </Link>
                      }
                      secondary="Video downloader"
                    />
                  </ListItem>
                  <ListItem disablePadding>
                    <ListItemText 
                      primary={
                        <Link href="#" onClick={(e) => { e.preventDefault(); window.open('https://ffmpeg.org/', '_blank'); }}>
                          FFmpeg
                        </Link>
                      }
                      secondary="Multimedia framework"
                    />
                  </ListItem>
                  <ListItem disablePadding>
                    <ListItemText 
                      primary={
                        <Link href="#" onClick={(e) => { e.preventDefault(); window.open('https://www.electronjs.org/', '_blank'); }}>
                          Electron
                        </Link>
                      }
                      secondary="Desktop framework"
                    />
                  </ListItem>
                  <ListItem disablePadding>
                    <ListItemText 
                      primary={
                        <Link href="#" onClick={(e) => { e.preventDefault(); window.open('https://react.dev/', '_blank'); }}>
                          React
                        </Link>
                      }
                      secondary="UI library"
                    />
                  </ListItem>
                </List>
              </Box>
            </Box>
          </Paper>

        </Box>
      </Container>
    </Box>
  );
}

export default Settings;
