<div align="center">

# 🎬 Grabby

### A modern, cross-platform GUI for yt-dlp

[![Build Status](https://github.com/gjoris/grabby/workflows/Build%20and%20Release/badge.svg)](https://github.com/gjoris/grabby/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue)](https://github.com/gjoris/grabby/releases)

A user-friendly desktop application for downloading videos and audio from YouTube and thousands of other websites, built with Electron and React.

[Download](https://github.com/gjoris/grabby/releases) • [Features](#-features) • [Installation](#-installation) • [Development](#-development)

</div>

---

## ✨ Features

- 🎥 Download videos from YouTube
- 🎵 Supports video or audio-only downloads
- 📊 Real-time download progress with detailed logs
- 🎯 Automatic quality selection (best available quality)
- 🔄 Automatic yt-dlp and ffmpeg binary management
- 🌐 Fully cross-platform (Windows, macOS, Linux)
- 💾 Portable builds available
- 🎨 Modern and intuitive user interface
- 📝 Detailed download history

## 📥 Installation

### Download Releases

Download the latest version for your platform:

- **Windows**: `Grabby-Setup-x.x.x.exe` (installer) or `Grabby-x.x.x.exe` (portable)
- **macOS**: `Grabby-x.x.x.dmg` or `Grabby-x.x.x-mac.zip`
- **Linux**: `Grabby-x.x.x.AppImage` or `Grabby-x.x.x.tar.gz`

👉 [Download the latest release](https://github.com/gjoris/grabby/releases/latest)

### Installation Instructions

#### Windows
1. Download the installer or portable version
2. Run the file
3. Follow the installation wizard (installer version only)

#### macOS
1. Download the `.dmg` file
2. Open the file and drag Grabby to your Applications folder
3. On first launch: right-click → Open (due to Gatekeeper)

#### Linux
1. Download the `.AppImage` file
2. Make it executable: `chmod +x Grabby-x.x.x.AppImage`
3. Run: `./Grabby-x.x.x.AppImage`

## 🚀 Usage

1. Launch Grabby
2. Paste a video URL in the input field
3. Choose your download location (optional)
4. Click "Download"
5. Follow the progress in real-time

The application automatically downloads the required binaries (yt-dlp and ffmpeg) on first use.

## 🛠️ Development

### Requirements

- Node.js 20 or higher
- npm or yarn

### Setup

```bash
# Clone the repository
git clone https://github.com/gjoris/grabby.git
cd grabby

# Install dependencies
npm install

# Start in development mode
npm run dev
```

### Project Structure

```
grabby/
├── src/
│   ├── main/              # Electron main process
│   │   ├── services/      # Backend services
│   │   └── binaryManager.ts
│   └── renderer/          # React frontend
│       ├── components/    # UI components
│       ├── hooks/         # Custom React hooks
│       └── services/      # Frontend services
├── resources/             # Application resources
│   └── bin/              # Platform binaries
└── dist/                 # Build output
```

### Build Commands

```bash
# Build for development
npm run build

# Package for current platform
npm run package

# Output in release/ folder
```

## 🤝 Contributing

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📋 Tech Stack

- **Frontend**: React 19, TypeScript
- **Backend**: Electron 40, Node.js
- **Build**: Vite, electron-builder
- **Dependencies**: yt-dlp, ffmpeg

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Credits

- [yt-dlp](https://github.com/yt-dlp/yt-dlp) - The powerful video downloader
- [ffmpeg](https://ffmpeg.org/) - Multimedia framework
- [Electron](https://www.electronjs.org/) - Cross-platform desktop apps

## 📧 Contact

Have questions or suggestions? Open an [issue](https://github.com/gjoris/grabby/issues) on GitHub!

---

<div align="center">

Made with ❤️ for the community

</div>
