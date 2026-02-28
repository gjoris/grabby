interface HeaderProps {
  onSettingsClick: () => void;
}

function Header({ onSettingsClick }: HeaderProps) {
  return (
    <header>
      <h1>🎯 Grabby</h1>
      <p>Download videos with ease</p>
      <button 
        className="settings-btn"
        onClick={onSettingsClick}
      >
        ⚙️
      </button>
    </header>
  );
}

export default Header;
