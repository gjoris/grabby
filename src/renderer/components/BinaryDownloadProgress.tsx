import { Paper, Box, Typography, LinearProgress, Chip } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { BinaryProgress } from '../types';

interface BinaryDownloadProgressProps {
  binaryProgress: Record<string, BinaryProgress>;
}

function BinaryDownloadProgress({ binaryProgress }: BinaryDownloadProgressProps) {
  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      flex: 1,
      px: 3
    }}>
      <Paper elevation={3} sx={{ p: 4, maxWidth: 500, width: '100%' }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <DownloadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
          <Typography variant="h5" gutterBottom>
            Setting up dependencies...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Downloading required components (one-time setup)
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {Object.values(binaryProgress).map((item) => (
            <Box key={item.binary}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" fontWeight={500}>
                  {item.binary}
                </Typography>
                <Chip label={item.status} size="small" color="primary" variant="outlined" />
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={item.progress} 
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {item.progress}%
              </Typography>
            </Box>
          ))}
        </Box>
      </Paper>
    </Box>
  );
}

export default BinaryDownloadProgress;
