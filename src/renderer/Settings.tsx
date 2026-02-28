import { useState, useEffect } from 'react';
import { 
  Box, Container, IconButton, Typography, Paper, 
  TextField, Button, Divider, List, ListItem, ListItemText, Link,
  Alert, Tooltip, Grid, Stack
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  FolderOpen as FolderIcon,
  Refresh as RefreshIcon,
  DeleteForever as DeleteIcon,
  OpenInNew as OpenIcon,
  Update as UpdateIcon,
  Info as InfoIcon,
  Description as LogIcon,
  GitHub as GitHubIcon,
  BugReport as BugIcon
} from '@mui/icons-material';
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

const GlassCard = ({ children, title, icon }: { children: React.ReactNode, title: string, icon: React.ReactNode }) => (
  <Paper 
    elevation={0} 
    sx={{ 
      p: 3, 
      bgcolor: 'rgba(255, 255, 255, 0.8)', 
      backdropFilter: 'blur(12px)',
      borderRadius: 3,
      border: '1px solid',
      borderColor: 'rgba(255, 255, 255, 0.3)',
      boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.1)',
      mb: 3
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
      <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
      <Typography variant="h6" fontWeight={700} color="text.primary">
        {title}
      </Typography>
    </Box>
    {children}
  </Paper>
);

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
    if (confirm('This will delete all log files. Continue?')) {
      const success = await ElectronAPIService.clearLogs();
      if (success) {
        await loadLogStats();
      }
    }
  };

  const handleCheckUpdates = async () => {
    setCheckingUpdates(true);
    try {
      const result = await ElectronAPIService.checkForUpdates();
      if (result.hasUpdates && result.ytdlpUpdate) {
        alert(`Update available for yt-dlp: ${result.ytdlpUpdate}`);
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

  const handleRedownloadBinariesAction = async () => {
    if (confirm('Delete and re-download all binaries? Grabby will restart.')) {
      try {
        onRedownloadBinaries();
        await ElectronAPIService.redownloadBinaries();
      } catch (error) {
        alert('Failed to redownload binaries: ' + error);
      }
    }
  };

  return (
    <Box sx={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      overflowY: 'auto',
      overflowX: 'hidden'
    }}>
      {/* Settings Header */}
      <Box sx={{ p: 2, px: 4, display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
        <Tooltip title="Back to Main">
          <IconButton 
            onClick={onBack} 
            sx={{ 
              bgcolor: 'rgba(255,255,255,0.2)', 
              color: 'white',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
            }}
          >
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
        <Typography variant="h5" fontWeight={800} color="white">
          Settings
        </Typography>
      </Box>

      <Container maxWidth="xl" sx={{ py: 2, flex: 1, pb: 6 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} lg={6}>
            {/* Download Location */}
            <GlassCard title="Download Location" icon={<FolderIcon />}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Where your downloaded files are saved by default.
              </Typography>
              <Stack direction="row" gap={2}>
                <TextField
                  fullWidth
                  value={settings.downloadPath || 'Not set'}
                  InputProps={{ 
                    readOnly: true,
                    sx: { bgcolor: 'rgba(0,0,0,0.03)', borderRadius: 2 }
                  }}
                  size="small"
                />
                <Button 
                  variant="contained" 
                  startIcon={<RefreshIcon />} 
                  onClick={selectFolder}
                  sx={{ px: 3, borderRadius: 2 }}
                >
                  Browse
                </Button>
              </Stack>
            </GlassCard>

            {/* Maintenance */}
            <GlassCard title="Maintenance & Logs" icon={<LogIcon />}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Manage log files and system reports.
              </Typography>
              {logStats && (
                <Alert severity="info" variant="outlined" sx={{ mb: 2, borderRadius: 2, bgcolor: 'rgba(2, 136, 209, 0.05)' }}>
                  Currently storing <strong>{logStats.count}</strong> logs ({logStats.sizeMB} MB)
                </Alert>
              )}
              <Stack direction="row" gap={1.5}>
                <Button variant="outlined" startIcon={<OpenIcon />} onClick={handleOpenLogs} sx={{ borderRadius: 2, flex: 1 }}>
                  Open Folder
                </Button>
                <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={handleClearLogs} sx={{ borderRadius: 2, flex: 1 }}>
                  Clear Logs
                </Button>
              </Stack>
            </GlassCard>
          </Grid>

          <Grid item xs={12} lg={6}>
            {/* Component Versions */}
            <GlassCard title="Binary Tools" icon={<UpdateIcon />}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Installed versions of core multimedia engines.
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={4}>
                  <Box sx={{ p: 1.5, bgcolor: 'rgba(0,0,0,0.03)', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>YT-DLP</Typography>
                    <Typography variant="body2" fontWeight={600} noWrap>{versions?.ytdlp || 'Loading...'}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ p: 1.5, bgcolor: 'rgba(0,0,0,0.03)', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>FFMPEG</Typography>
                    <Typography variant="body2" fontWeight={600} noWrap>{versions?.ffmpeg || 'Loading...'}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ p: 1.5, bgcolor: 'rgba(0,0,0,0.03)', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>FFPROBE</Typography>
                    <Typography variant="body2" fontWeight={600} noWrap>{versions?.ffprobe || 'Loading...'}</Typography>
                  </Box>
                </Grid>
              </Grid>
              <Stack direction="row" gap={1.5}>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={handleCheckUpdates}
                  disabled={checkingUpdates}
                  sx={{ borderRadius: 2, flex: 1 }}
                >
                  {checkingUpdates ? 'Checking...' : 'Update Tools'}
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleRedownloadBinariesAction}
                  sx={{ borderRadius: 2, flex: 1 }}
                >
                  Reinstall Tools
                </Button>
              </Stack>
            </GlassCard>

            {/* About App */}
            <GlassCard title="About Grabby" icon={<InfoIcon />}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" color="primary.main" fontWeight={800}>
                  Grabby v{appVersion}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  A modern YouTube companion. Developed by Geroen Joris.
                </Typography>
              </Box>
              
              <Divider sx={{ my: 2, opacity: 0.1 }} />
              
              <Stack direction="row" gap={3} sx={{ mb: 2 }}>
                <Link href="#" onClick={(e) => { e.preventDefault(); window.open('https://github.com/gjoris/grabby', '_blank'); }} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 600, textDecoration: 'none' }}>
                  <GitHubIcon fontSize="small" /> GitHub
                </Link>
                <Link href="#" onClick={(e) => { e.preventDefault(); window.open('https://github.com/gjoris/grabby/issues', '_blank'); }} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 600, textDecoration: 'none', color: 'error.main' }}>
                  <BugIcon fontSize="small" /> Report Bug
                </Link>
              </Stack>

              <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1 }}>
                Licensed under MIT • Built with Electron, React & YT-DLP
              </Typography>
            </GlassCard>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default Settings;