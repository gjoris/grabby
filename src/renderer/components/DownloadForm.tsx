import { useState } from 'react';
import { Paper, TextField, RadioGroup, FormControlLabel, Radio, Button, Box } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { DownloadType } from '../types';

interface DownloadFormProps {
  onDownload: (url: string, type: DownloadType) => void;
  isDownloading: boolean;
}

function DownloadForm({ onDownload, isDownloading }: DownloadFormProps) {
  const [url, setUrl] = useState('');
  const [downloadType, setDownloadType] = useState<DownloadType>('mp3');

  const handleSubmit = () => {
    onDownload(url, downloadType);
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          fullWidth
          placeholder="Paste YouTube URL or playlist here..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={isDownloading}
          variant="outlined"
          size="medium"
        />

        <RadioGroup
          row
          value={downloadType}
          onChange={(e) => setDownloadType(e.target.value as DownloadType)}
        >
          <FormControlLabel 
            value="mp3" 
            control={<Radio />} 
            label="MP3 (audio only)" 
            disabled={isDownloading}
          />
          <FormControlLabel 
            value="video" 
            control={<Radio />} 
            label="Video (best quality)" 
            disabled={isDownloading}
          />
        </RadioGroup>

        <Button
          variant="contained"
          size="large"
          onClick={handleSubmit}
          disabled={isDownloading || !url}
          startIcon={<DownloadIcon />}
          fullWidth
        >
          {isDownloading ? 'Downloading...' : 'Download'}
        </Button>
      </Box>
    </Paper>
  );
}

export default DownloadForm;
