import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import DownloadItemsList from '../../components/DownloadItemsList';
import { DownloadItem } from '../../types/download';

describe('DownloadItemsList', () => {
  const mockItems: DownloadItem[] = [
    { id: '1', title: 'V1', status: 'pending', progress: 0 },
    { id: '2', title: 'V2', status: 'downloading', progress: 50 },
    { id: '3', title: 'V3', status: 'processing', progress: 90 },
    { id: '4', title: 'V4', status: 'completed', progress: 100 },
    { id: '5', title: 'V5', status: 'error', progress: 0, error: 'Err' }
  ];

  it('renders nothing when items are empty', () => {
    const { container } = render(<DownloadItemsList items={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders all statuses correctly', () => {
    render(<DownloadItemsList items={mockItems} />);
    expect(screen.getByText('Waiting...')).toBeInTheDocument();
    expect(screen.getByText('Downloading')).toBeInTheDocument();
    expect(screen.getByText('Converting')).toBeInTheDocument();
    expect(screen.getByText('Complete')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByText('Err')).toBeInTheDocument();
  });

  it('shows playlist header', () => {
    render(<DownloadItemsList items={mockItems} playlistName="List" />);
    expect(screen.getByText('List')).toBeInTheDocument();
    expect(screen.getByText('5 items')).toBeInTheDocument();
  });
});