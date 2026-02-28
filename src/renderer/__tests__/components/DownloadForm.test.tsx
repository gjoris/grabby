import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DownloadForm from '../../components/DownloadForm';

describe('DownloadForm', () => {
  it('renders input field and download button', () => {
    render(<DownloadForm onDownload={vi.fn()} isDownloading={false} />);
    
    expect(screen.getByPlaceholderText(/paste.*url/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();
  });

  it('renders format options', () => {
    render(<DownloadForm onDownload={vi.fn()} isDownloading={false} />);
    
    expect(screen.getByLabelText(/mp3.*audio only/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/video.*best quality/i)).toBeInTheDocument();
  });

  it('disables button when no URL is entered', () => {
    render(<DownloadForm onDownload={vi.fn()} isDownloading={false} />);
    
    const button = screen.getByRole('button', { name: /download/i });
    expect(button).toBeDisabled();
  });

  it('enables button when URL is entered', async () => {
    render(<DownloadForm onDownload={vi.fn()} isDownloading={false} />);
    
    const input = screen.getByPlaceholderText(/paste.*url/i);
    await userEvent.type(input, 'https://example.com/video');
    
    const button = screen.getByRole('button', { name: /download/i });
    expect(button).not.toBeDisabled();
  });

  it('calls onDownload with URL and format when submitted', async () => {
    const onDownload = vi.fn();
    render(<DownloadForm onDownload={onDownload} isDownloading={false} />);
    
    const input = screen.getByPlaceholderText(/paste.*url/i);
    await userEvent.type(input, 'https://example.com/video');
    
    const button = screen.getByRole('button', { name: /download/i });
    await userEvent.click(button);
    
    expect(onDownload).toHaveBeenCalledWith('https://example.com/video', 'mp3');
  });

  it('changes format when radio button is clicked', async () => {
    const onDownload = vi.fn();
    render(<DownloadForm onDownload={onDownload} isDownloading={false} />);
    
    const input = screen.getByPlaceholderText(/paste.*url/i);
    await userEvent.type(input, 'https://example.com/video');
    
    const videoRadio = screen.getByLabelText(/video.*best quality/i);
    await userEvent.click(videoRadio);
    
    const button = screen.getByRole('button', { name: /download/i });
    await userEvent.click(button);
    
    expect(onDownload).toHaveBeenCalledWith('https://example.com/video', 'video');
  });

  it('shows "Downloading..." when isDownloading is true', () => {
    render(<DownloadForm onDownload={vi.fn()} isDownloading={true} />);
    
    expect(screen.getByText(/downloading\.\.\./i)).toBeInTheDocument();
  });

  it('disables all inputs when downloading', () => {
    render(<DownloadForm onDownload={vi.fn()} isDownloading={true} />);
    
    const input = screen.getByPlaceholderText(/paste.*url/i);
    const button = screen.getByRole('button');
    const mp3Radio = screen.getByLabelText(/mp3/i);
    const videoRadio = screen.getByLabelText(/video/i);
    
    expect(input).toBeDisabled();
    expect(button).toBeDisabled();
    expect(mp3Radio).toBeDisabled();
    expect(videoRadio).toBeDisabled();
  });
});
