import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DownloadForm from '../../components/DownloadForm';

describe('DownloadForm', () => {
  const mockOnDownload = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders input field and download button', () => {
    render(<DownloadForm onDownload={mockOnDownload} isDownloading={false} />);
    
    expect(screen.getByPlaceholderText(/paste.*url/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start download/i })).toBeInTheDocument();
  });

  it('enables button when URL is entered', async () => {
    render(<DownloadForm onDownload={mockOnDownload} isDownloading={false} />);
    
    const input = screen.getByPlaceholderText(/paste.*url/i);
    const button = screen.getByRole('button', { name: /start download/i });
    
    expect(button).toBeDisabled();
    
    await userEvent.type(input, 'https://youtube.com/watch?v=123');
    expect(button).not.toBeDisabled();
  });

  it('calls onDownload with URL and default format when submitted', async () => {
    render(<DownloadForm onDownload={mockOnDownload} isDownloading={false} />);
    
    const input = screen.getByPlaceholderText(/paste.*url/i);
    const button = screen.getByRole('button', { name: /start download/i });
    
    await userEvent.type(input, 'https://youtube.com/watch?v=123');
    await userEvent.click(button);
    
    expect(mockOnDownload).toHaveBeenCalledWith('https://youtube.com/watch?v=123', 'video');
  });

  it('shows downloading state when isDownloading is true', () => {
    render(<DownloadForm onDownload={mockOnDownload} isDownloading={true} />);
    
    expect(screen.getByText(/downloading\.\.\./i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /downloading/i })).toBeDisabled();
  });
});