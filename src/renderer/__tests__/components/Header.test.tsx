import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Header from '../../components/Header';

describe('Header', () => {
  it('renders app name and tagline', () => {
    render(<Header onSettingsClick={vi.fn()} />);
    
    expect(screen.getByText('Grabby')).toBeInTheDocument();
    expect(screen.getByText('Download videos with ease')).toBeInTheDocument();
  });

  it('calls onSettingsClick when settings button is clicked', async () => {
    const onSettingsClick = vi.fn();
    render(<Header onSettingsClick={onSettingsClick} />);
    
    const settingsButton = screen.getByRole('button');
    await userEvent.click(settingsButton);
    
    expect(onSettingsClick).toHaveBeenCalledTimes(1);
  });

  it('displays app icon', () => {
    render(<Header onSettingsClick={vi.fn()} />);
    
    const icon = screen.getByAltText('Grabby');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('src', '/icon.png');
  });
});
