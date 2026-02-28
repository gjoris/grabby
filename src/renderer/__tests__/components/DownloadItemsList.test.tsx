import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import DownloadItemsList from '../../components/DownloadItemsList';
import { DownloadItem } from '../../types/download';

describe('DownloadItemsList', () => {
  const mockItems: DownloadItem[] = [
    {
      id: '1',
      title: 'Video 1',
      status: 'downloading',
      progress: 50,
    },
    {
      id: '2',
      title: 'Video 2',
      status: 'completed',
      progress: 100,
    },
    {
      id: '3',
      title: 'Video 3',
      status: 'error',
      progress: 0,
      error: 'Download failed',
    },
  ];

  it('renders nothing when items array is empty', () => {
    const { container } = render(<DownloadItemsList items={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders all download items', () => {
    render(<DownloadItemsList items={mockItems} />);
    
    expect(screen.getByText('Video 1')).toBeInTheDocument();
    expect(screen.getByText('Video 2')).toBeInTheDocument();
    expect(screen.getByText('Video 3')).toBeInTheDocument();
  });

  it('displays playlist header when playlistName is provided', () => {
    render(<DownloadItemsList items={mockItems} playlistName="My Playlist" />);
    
    expect(screen.getByText('My Playlist')).toBeInTheDocument();
    expect(screen.getByText('3 items')).toBeInTheDocument();
  });

  it('does not display playlist header when playlistName is not provided', () => {
    render(<DownloadItemsList items={mockItems} />);
    
    expect(screen.queryByText(/items/i)).not.toBeInTheDocument();
  });

  it('shows progress bar for downloading items', () => {
    render(<DownloadItemsList items={mockItems} />);
    
    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars.length).toBeGreaterThan(0);
  });

  it('displays status chips for each item', () => {
    render(<DownloadItemsList items={mockItems} />);
    
    expect(screen.getByText('Downloading')).toBeInTheDocument();
    expect(screen.getByText('Complete')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('displays error message for failed items', () => {
    render(<DownloadItemsList items={mockItems} />);
    
    expect(screen.getByText('Download failed')).toBeInTheDocument();
  });

  it('shows correct status for pending items', () => {
    const pendingItems: DownloadItem[] = [
      {
        id: '1',
        title: 'Pending Video',
        status: 'pending',
        progress: 0,
      },
    ];
    
    render(<DownloadItemsList items={pendingItems} />);
    
    expect(screen.getByText('Waiting...')).toBeInTheDocument();
  });

  it('shows correct status for processing items', () => {
    const processingItems: DownloadItem[] = [
      {
        id: '1',
        title: 'Processing Video',
        status: 'processing',
        progress: 90,
      },
    ];
    
    render(<DownloadItemsList items={processingItems} />);
    
    expect(screen.getByText('Converting')).toBeInTheDocument();
  });
});
