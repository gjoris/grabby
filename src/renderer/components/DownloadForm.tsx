import { useState } from 'react';
import { 
  Paper, 
  Button, 
  Box, 
  ToggleButton, 
  ToggleButtonGroup,
  InputBase,
  Tooltip,
  CircularProgress
} from '@mui/material';
import { 
  Download as DownloadIcon, 
  MusicNote as AudioIcon, 
  Movie as VideoIcon,
  Link as LinkIcon
} from '@mui/icons-material';
import { DownloadType } from '../types';

interface DownloadFormProps {
  onDownload: (url: string, type: DownloadType) => void;
  isDownloading: boolean;
}

function DownloadForm({ onDownload, isDownloading }: DownloadFormProps) {
  const [url, setUrl] = useState('');
  const [downloadType, setDownloadType] = useState<DownloadType>('video');

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (url && !isDownloading) {
      onDownload(url, downloadType);
    }
  };

  const handleTypeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newType: DownloadType | null,
  ) => {
    if (newType !== null) {
      setDownloadType(newType);
    }
  };

  return (
    <Paper 
      component="form" 
      onSubmit={handleSubmit} 
      elevation={0} 
      sx={{ 
        p: 2, 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2, 
        width: '100%', 
        bgcolor: 'rgba(255, 255, 255, 0.9)', 
        backdropFilter: 'blur(8px)',
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'rgba(255, 255, 255, 0.3)',
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
      }}
    >
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', height: 40, boxSizing: 'border-box' }}>
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center', 
          bgcolor: 'rgba(255, 255, 255, 0.5)',
          height: 40,
          px: 1.5,
          borderRadius: '8px 0 0 8px',
          border: 'none',
          boxSizing: 'border-box'
        }}>
          <LinkIcon color="action" sx={{ mr: 1, fontSize: 20 }} />
          <InputBase
            fullWidth
            type="url"
            placeholder="Paste YouTube URL here..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isDownloading}
            sx={{ 
              fontSize: '0.9rem',
              flex: 1,
              height: '100%',
              '& input': {
                height: '40px !important',
                padding: '0 !important',
                border: 'none !important',
                boxSizing: 'border-box !important',
              }
            }}
          />
        </Box>
        <ToggleButtonGroup
          value={downloadType}
          exclusive
          onChange={handleTypeChange}
          size="small"
          disabled={isDownloading}
          sx={{ 
            height: 40,
            boxSizing: 'border-box',
            '& .MuiToggleButton-root': {
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
              borderLeft: '1px solid rgba(0, 0, 0, 0.05)',
              px: 2,
              height: 40,
              boxSizing: 'border-box',
              bgcolor: 'rgba(255, 255, 255, 0.5)',
              borderTop: 'none',
              borderBottom: 'none',
              borderRight: 'none',
              '&.Mui-selected': {
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': { bgcolor: 'primary.dark' }
              }
            }
          }}
        >
          <ToggleButton value="video" aria-label="video">
            <Tooltip title="Video (MKV)">
              <VideoIcon fontSize="small" />
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="mp3" aria-label="audio">
            <Tooltip title="Audio (MP3)">
              <AudioIcon fontSize="small" />
            </Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      
      <Button
        type="submit"
        variant="contained"
        color="primary"
        disabled={!url || isDownloading}
        startIcon={isDownloading ? <CircularProgress size={18} color="inherit" /> : <DownloadIcon />}
        sx={{ 
          height: 40, 
          px: 4, 
          textTransform: 'none', 
          fontWeight: 700, 
          borderRadius: 2,
          whiteSpace: 'nowrap',
          minWidth: 160,
          boxShadow: '0 4px 14px 0 rgba(102, 126, 234, 0.39)',
        }}
      >
        {isDownloading ? 'Downloading...' : 'Start Download'}
      </Button>
    </Paper>
  );
}

export default DownloadForm;