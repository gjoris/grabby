import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import BinaryDownloadProgress from '../../components/BinaryDownloadProgress';
import { BinaryProgress } from '../../types';

describe('BinaryDownloadProgress', () => {
  const mockProgress: Record<string, BinaryProgress> = {
    'yt-dlp': {
      binary: 'yt-dlp',
      progress: 50,
      status: 'Downloading...',
    },
    'ffmpeg': {
      binary: 'ffmpeg',
      progress: 75,
      status: 'Downloading...',
    },
    'ffprobe': {
      binary: 'ffprobe',
      progress: 100,
      status: 'Complete',
    },
  };

  it('renders setup message', () => {
    render(<BinaryDownloadProgress binaryProgress={mockProgress} />);
    
    expect(screen.getByText(/setting up dependencies/i)).toBeInTheDocument();
    expect(screen.getByText(/one-time setup/i)).toBeInTheDocument();
  });

  it('renders all binary progress items', () => {
    render(<BinaryDownloadProgress binaryProgress={mockProgress} />);
    
    expect(screen.getByText('yt-dlp')).toBeInTheDocument();
    expect(screen.getByText('ffmpeg')).toBeInTheDocument();
    expect(screen.getByText('ffprobe')).toBeInTheDocument();
  });

  it('displays progress percentages', () => {
    render(<BinaryDownloadProgress binaryProgress={mockProgress} />);
    
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('displays status for each binary', () => {
    render(<BinaryDownloadProgress binaryProgress={mockProgress} />);
    
    const downloadingChips = screen.getAllByText('Downloading...');
    expect(downloadingChips).toHaveLength(2);
    expect(screen.getByText('Complete')).toBeInTheDocument();
  });

  it('renders progress bars', () => {
    render(<BinaryDownloadProgress binaryProgress={mockProgress} />);
    
    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars).toHaveLength(3);
  });

  it('renders with empty progress object', () => {
    render(<BinaryDownloadProgress binaryProgress={{}} />);
    
    expect(screen.getByText(/setting up dependencies/i)).toBeInTheDocument();
  });
});
