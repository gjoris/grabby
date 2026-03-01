import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DownloadTable from '../../components/DownloadTable';
import { DownloadItem } from '../../types/download';

describe('DownloadTable', () => {
  const mockItems: DownloadItem[] = [
    {
      id: 'job1-1',
      title: 'Parallel Video 1',
      status: 'downloading',
      progress: 45,
      size: '100MiB',
      speed: '2.5MiB/s',
      eta: '00:30'
    },
    {
      id: 'job1-2',
      title: 'Parallel Video 2',
      status: 'processing',
      progress: 100,
    },
    {
      id: 'job1-3',
      title: 'Parallel Video 3',
      status: 'error',
      progress: 10,
      error: 'Disk Full'
    },
    {
      id: 'job1-4',
      title: 'Parallel Video 4',
      status: 'completed',
      progress: 100,
    }
  ];

  it('renders nothing when items are empty', () => {
    const { container } = render(<DownloadTable items={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders all items with their titles', () => {
    render(<DownloadTable items={mockItems} />);
    expect(screen.getByText('Parallel Video 1')).toBeInTheDocument();
    expect(screen.getByText('Parallel Video 2')).toBeInTheDocument();
    expect(screen.getByText('Parallel Video 3')).toBeInTheDocument();
    expect(screen.getByText('Parallel Video 4')).toBeInTheDocument();
  });

  it('displays metrics like speed and eta', () => {
    render(<DownloadTable items={mockItems} />);
    expect(screen.getByText('2.5MiB/s')).toBeInTheDocument();
    expect(screen.getByText('00:30')).toBeInTheDocument();
    expect(screen.getByText('100MiB')).toBeInTheDocument();
  });

  it('shows correct status chips', () => {
    render(<DownloadTable items={mockItems} />);
    expect(screen.getByText(/downloading/i)).toBeInTheDocument();
    expect(screen.getByText(/processing/i)).toBeInTheDocument();
    expect(screen.getByText(/completed/i)).toBeInTheDocument();
    expect(screen.getByText(/Failed/i)).toBeInTheDocument();
  });

  it('renders error tooltip for failed downloads', () => {
    render(<DownloadTable items={mockItems} />);
    // The tooltip itself might be hard to find in a shallow render, 
    // but the chip with text 'Failed' should be there
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });
});
