import { useState, useEffect } from 'react';
import { Paper, TextField, Button, Box, Typography } from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';

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
    <Paper elevation={2} sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="body2" sx={{ minWidth: 60, fontWeight: 500 }}>
          Save to:
        </Typography>
        <TextField
          fullWidth
          value={currentPath || 'Not set'}
          size="small"
          InputProps={{
            readOnly: true,
          }}
        />
        <Button
          variant="outlined"
          startIcon={<FolderIcon />}
          onClick={handleSelectFolder}
          sx={{ minWidth: 120 }}
        >
          Change
        </Button>
      </Box>
    </Paper>
  );
}

export default DownloadLocationSelector;
