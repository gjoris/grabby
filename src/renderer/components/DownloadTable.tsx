import React from 'react';
import { 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  LinearProgress, 
  Typography, 
  Box, 
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Downloading as DownloadingIcon,
  HourglassEmpty as PendingIcon,
  Settings as ProcessingIcon,
  FolderOpen as FolderIcon,
  MusicNote as AudioIcon,
  Movie as VideoIcon
} from '@mui/icons-material';
import { DownloadItem } from '../types/download';

interface DownloadTableProps {
  items: DownloadItem[];
  onOpenFolder?: (path: string) => void;
}

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'completed': return <CheckCircleIcon color="success" fontSize="small" />;
    case 'error': return <ErrorIcon color="error" fontSize="small" />;
    case 'downloading': return <DownloadingIcon color="primary" fontSize="small" />;
    case 'processing': return <ProcessingIcon color="secondary" fontSize="small" sx={{ animation: 'spin 2s linear infinite' }} />;
    default: return <PendingIcon color="action" fontSize="small" />;
  }
};

const StatusChip = ({ status, error }: { status: string, error?: string }) => {
  if (status === 'error' && error) {
    return (
      <Tooltip title={error}>
        <Chip 
          label="Failed" 
          size="small" 
          color="error" 
          variant="outlined" 
          sx={{ height: 20, fontSize: '0.7rem' }} 
        />
      </Tooltip>
    );
  }

  const colors: Record<string, "default" | "primary" | "secondary" | "success" | "error"> = {
    pending: 'default',
    downloading: 'primary',
    processing: 'secondary',
    completed: 'success',
    error: 'error'
  };

  return (
    <Chip 
      label={status} 
      size="small" 
      color={colors[status] || 'default'} 
      variant="filled" 
      sx={{ height: 20, fontSize: '0.7rem', textTransform: 'capitalize' }} 
    />
  );
};

export default function DownloadTable({ items, onOpenFolder }: DownloadTableProps) {
  if (items.length === 0) return null;

  return (
    <TableContainer 
      component={Paper} 
      elevation={0} 
      sx={{ 
        flex: 1, 
        bgcolor: 'rgba(255, 255, 255, 0.8)', 
        backdropFilter: 'blur(10px)',
        borderRadius: 3, 
        border: '1px solid', 
        borderColor: 'rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
        overflow: 'auto'
      }}
    >
      <Table stickyHeader size="small" sx={{ minWidth: 650 }}>
        <TableHead>
          <TableRow>
            <TableCell width={50} align="center" sx={{ bgcolor: 'rgba(255, 255, 255, 0.8)', fontWeight: 700, borderBottom: '2px solid rgba(0,0,0,0.05)' }}>#</TableCell>
            <TableCell sx={{ bgcolor: 'rgba(255, 255, 255, 0.8)', fontWeight: 700, borderBottom: '2px solid rgba(0,0,0,0.05)' }}>Name</TableCell>
            <TableCell width={120} sx={{ bgcolor: 'rgba(255, 255, 255, 0.8)', fontWeight: 700, borderBottom: '2px solid rgba(0,0,0,0.05)' }}>Status</TableCell>
            <TableCell width={250} sx={{ bgcolor: 'rgba(255, 255, 255, 0.8)', fontWeight: 700, borderBottom: '2px solid rgba(0,0,0,0.05)' }}>Progress</TableCell>
            <TableCell width={100} align="right" sx={{ bgcolor: 'rgba(255, 255, 255, 0.8)', fontWeight: 700, borderBottom: '2px solid rgba(0,0,0,0.05)' }}>Size</TableCell>
            <TableCell width={100} align="right" sx={{ bgcolor: 'rgba(255, 255, 255, 0.8)', fontWeight: 700, borderBottom: '2px solid rgba(0,0,0,0.05)' }}>Speed</TableCell>
            <TableCell width={100} align="right" sx={{ bgcolor: 'rgba(255, 255, 255, 0.8)', fontWeight: 700, borderBottom: '2px solid rgba(0,0,0,0.05)' }}>ETA</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item, index) => (
            <TableRow 
              key={item.id}
              sx={{ 
                '&:last-child td, &:last-child th': { border: 0 }, 
                '&:hover': { bgcolor: 'rgba(102, 126, 234, 0.05)' },
                transition: 'background-color 0.2s ease'
              }}
            >
              <TableCell align="center" component="th" scope="row">
                <StatusIcon status={item.status} />
              </TableCell>
              <TableCell>
                <Typography variant="body2" noWrap sx={{ maxWidth: 300, fontWeight: 500 }}>
                  {item.title}
                </Typography>
              </TableCell>
              <TableCell>
                <StatusChip status={item.status} error={item.error} />
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: '100%', mr: 1 }}>
                    <LinearProgress 
                      variant={item.status === 'pending' ? 'indeterminate' : 'determinate'} 
                      value={item.progress} 
                      color={item.status === 'completed' ? 'success' : item.status === 'error' ? 'error' : 'primary'}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>
                  <Box sx={{ minWidth: 35 }}>
                    <Typography variant="caption" color="text.secondary">{Math.round(item.progress)}%</Typography>
                  </Box>
                </Box>
              </TableCell>
              <TableCell align="right">
                <Typography variant="caption">{item.size || '-'}</Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="caption">{item.speed || '-'}</Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{item.eta || '-'}</Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </TableContainer>
  );
}
