interface HeaderProps {
  onSettingsClick: () => void;
}

function Header({ onSettingsClick }: HeaderProps) {
  return (
    <header>
      <div className="header-title">
        <img src="/icon.png" alt="Grabby" className="app-icon" />
        <div>
          <h1>Grabby</h1>
          <p>Download from YouTube with ease</p>
        </div>
      </div>
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
