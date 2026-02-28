import { AppBar, Toolbar, Typography, IconButton, Box } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';

interface HeaderProps {
  onSettingsClick: () => void;
}

function Header({ onSettingsClick }: HeaderProps) {
  return (
    <AppBar position="static" elevation={0} sx={{ background: 'transparent' }}>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
          <img src="/icon.png" alt="Grabby" style={{ width: 48, height: 48 }} />
          <Box>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 600, color: 'white' }}>
              Grabby
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
              Download videos with ease
            </Typography>
          </Box>
        </Box>
        <IconButton 
          onClick={onSettingsClick}
          sx={{ color: 'white' }}
          size="large"
          aria-label="Settings"
        >
          <SettingsIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}

export default Header;
