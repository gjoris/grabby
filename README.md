# Grabby

Cross-platform GUI for yt-dlp

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# In another terminal, start Electron
NODE_ENV=development npm start
```

## Building

```bash
# Build for current platform
npm run package

# Output will be in the `release` folder
```

## Bundling Binaries

Before building, you need to download the platform-specific binaries:

### macOS (darwin)
```bash
# yt-dlp
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos -o resources/bin/darwin/yt-dlp
chmod +x resources/bin/darwin/yt-dlp

# ffmpeg (download from https://evermeet.cx/ffmpeg/ or use homebrew)
# Place ffmpeg binary in resources/bin/darwin/
```

### Windows (win32)
```bash
# Download yt-dlp.exe from https://github.com/yt-dlp/yt-dlp/releases
# Download ffmpeg.exe from https://www.gyan.dev/ffmpeg/builds/
# Place both in resources/bin/win32/
```

### Linux
```bash
# yt-dlp
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o resources/bin/linux/yt-dlp
chmod +x resources/bin/linux/yt-dlp

# ffmpeg (download static build from https://johnvansickle.com/ffmpeg/)
# Place ffmpeg binary in resources/bin/linux/
```

## Features

- Download videos from YouTube and other supported sites
- Automatic format selection (best quality)
- Progress tracking
- Cross-platform (macOS, Windows, Linux)
- Portable builds available

## License

MIT
