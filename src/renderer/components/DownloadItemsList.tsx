import { Paper, Box, Typography, LinearProgress, Chip, List, ListItem, ListItemIcon, ListItemText, Alert } from '@mui/material';
import PendingIcon from '@mui/icons-material/HourglassEmpty';
import DownloadingIcon from '@mui/icons-material/Download';
import ProcessingIcon from '@mui/icons-material/Settings';
import CompletedIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import PlaylistPlayIcon from '@mui/icons-material/PlaylistPlay';
import { DownloadItem } from '../types/download';

interface DownloadItemsListProps {
  items: DownloadItem[];
  playlistName?: string;
}

function DownloadItemsList({ items, playlistName }: DownloadItemsListProps) {
  if (items.length === 0) return null;

  const getStatusIcon = (status: DownloadItem['status']) => {
    switch (status) {
      case 'pending': return <PendingIcon fontSize="small" />;
      case 'downloading': return <DownloadingIcon fontSize="small" color="primary" />;
      case 'processing': return <ProcessingIcon fontSize="small" color="secondary" />;
      case 'completed': return <CompletedIcon fontSize="small" color="success" />;
      case 'error': return <ErrorIcon fontSize="small" color="error" />;
    }
  };

  const getStatusText = (status: DownloadItem['status']) => {
    switch (status) {
      case 'pending': return 'Waiting...';
      case 'downloading': return 'Downloading';
      case 'processing': return 'Converting';
      case 'completed': return 'Complete';
      case 'error': return 'Failed';
    }
  };

  const getStatusColor = (status: DownloadItem['status']) => {
    switch (status) {
      case 'pending': return 'default';
      case 'downloading': return 'primary';
      case 'processing': return 'secondary';
      case 'completed': return 'success';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  return (
    <Paper elevation={3} sx={{ overflow: 'hidden' }}>
      {playlistName && (
        <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
          <PlaylistPlayIcon />
          <Typography variant="h6" sx={{ flex: 1 }}>
            {playlistName}
          </Typography>
          <Chip label={`${items.length} items`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
        </Box>
      )}
      
      <List sx={{ maxHeight: 400, overflow: 'auto' }}>
        {items.map((item) => (
          <ListItem 
            key={item.id}
            sx={{ 
              flexDirection: 'column', 
              alignItems: 'stretch',
              borderBottom: '1px solid',
              borderColor: 'divider',
              '&:last-child': { borderBottom: 0 }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                {getStatusIcon(item.status)}
              </ListItemIcon>
              <ListItemText 
                primary={item.title}
                primaryTypographyProps={{ 
                  noWrap: true,
                  sx: { flex: 1 }
                }}
              />
              <Chip 
                label={getStatusText(item.status)} 
                size="small" 
                color={getStatusColor(item.status) as any}
                variant="outlined"
              />
            </Box>
            
            {(item.status === 'downloading' || item.status === 'processing') && (
              <Box sx={{ width: '100%', mt: 1 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={item.progress} 
                  sx={{ height: 6, borderRadius: 3 }}
                />
              </Box>
            )}
            
            {item.error && (
              <Alert severity="error" sx={{ mt: 1, width: '100%' }}>
                {item.error}
              </Alert>
            )}
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}

export default DownloadItemsList;
