import { useState, useEffect } from 'react';
import { Paper, Box, Typography, Button, Tooltip, IconButton } from '@mui/material';
import FolderIcon from '@mui/icons-material/FolderOpen';
import EditIcon from '@mui/icons-material/Edit';

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
    <Paper 
      elevation={0} 
      sx={{ 
        p: '6px 16px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        bgcolor: 'rgba(255, 255, 255, 0.7)', 
        backdropFilter: 'blur(10px)',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'rgba(255, 255, 255, 0.3)',
        boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.05)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, overflow: 'hidden' }}>
        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Destination
        </Typography>
        <Typography variant="body2" noWrap sx={{ color: 'primary.main', fontWeight: 500, opacity: 0.9 }}>
          {currentPath || 'Default downloads folder'}
        </Typography>
      </Box>
      <Tooltip title="Change Download Location">
        <Button
          size="small"
          startIcon={<FolderIcon fontSize="small" />}
          onClick={handleSelectFolder}
          sx={{ 
            textTransform: 'none', 
            fontSize: '0.75rem', 
            py: 0.5,
            px: 1.5,
            borderRadius: 1.5,
            fontWeight: 700,
            color: 'primary.main',
            '&:hover': {
              bgcolor: 'rgba(102, 126, 234, 0.1)',
            }
          }}
        >
          Change
        </Button>
      </Tooltip>
    </Paper>
  );
}

export default DownloadLocationSelector;