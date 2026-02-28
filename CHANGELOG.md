# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-02-28

### Added
- Complete UI overhaul with modern "Glassmorphism" aesthetic and vibrant gradient backgrounds
- High-density dashboard layout maximizing screen real estate
- Interactive data table for downloads with columns for status, size, speed, and ETA
- Compact "Action Bar" for URL input and format selection
- Streaming metadata discovery: downloads now start immediately as items are found in a playlist
- Parallel downloads: support for up to 3 concurrent video downloads
- Enhanced per-file performance with 5 concurrent download fragments
- Real-time download metrics: transfer speed and estimated time remaining (ETA)
- Robust "job" tracking system allowing multiple independent download sessions simultaneously

### Improved
- Video output format: changed default container to MKV for better codec compatibility and quality
- More responsive and professional Settings interface with two-column layout
- Instant UI feedback when clicking the download button via placeholder items
- Better handling of already-downloaded files with automatic title detection

### Fixed
- Fixed height alignment of URL input box in the action bar
- Resolved issues where single video downloads would sometimes not show up in the progress list
- Corrected FFmpeg location configuration to ensure post-processing works reliably on all platforms

## [1.1.5] - 2026-02-28

### Fixed
- macOS certificate encryption: converted from legacy RC2-40-CBC to AES-256 for compatibility with modern macOS/OpenSSL versions
- Certificate import now works correctly in GitHub Actions CI/CD pipeline

## [1.1.4] - 2026-02-28

### Fixed
- electron-builder macOS configuration to use correct cscLink and cscKeyPassword properties for v26.8.1

## [1.1.3] - 2026-02-28

### Added
- Comprehensive test suite for download parsing with 32 tests covering yt-dlp output parsing
- Version parser utilities with 32 tests for extracting version info from CLI tools
- Refactored main process with testable pure utility functions

### Improved
- Test coverage: 96.78% overall (100% for pure utilities, 91.35% for renderer)

## [1.1.2] - 2026-02-28

### Fixed
- macOS code signing with self-signed certificate for app verification
- Windows header logo display issue by importing icon as ES module for cross-platform compatibility

## [1.1.1] - 2026-02-28

### Fixed
- macOS builds now use universal binaries for Apple Silicon (M1/M2/M3) and Intel Mac support
- Resolved "application not supported on this Mac" error

## [1.1.0] - 2026-02-28

### Added
- Material Design UI with Material-UI components for a cleaner, more modern interface
- Application icon support across all platforms (window, dock, taskbar)
- Comprehensive logging system with automatic log rotation (30-day retention)
- Log management in Settings: view log statistics and clear all logs
- Binary version detection for yt-dlp, ffmpeg, and ffprobe
- Application version display in Settings
- "Redownload Binaries" feature with progress UI
- "Check for Updates" button for yt-dlp
- Automatic default downloads folder selection on first startup
- Content Security Policy for enhanced security
- Comprehensive test suite with 63 tests and ~70% coverage
- CI/CD pipeline with automated testing before builds

### Changed
- Switched to BtbN/FFmpeg-Builds for Windows/Linux binaries (more reliable)
- Improved binary download UI with better progress indicators
- More compact and organized Settings interface
- Generic video URL placeholder (not YouTube-specific)
- Enhanced About section with developer info and project links

### Fixed
- Binary download progress now shows correctly when redownloading
- FFmpeg/FFprobe version detection using correct command flags
- Accessibility improvements with proper ARIA labels

## [1.0.0] - Initial Release

### Added
- Cross-platform video downloader (Windows, macOS, Linux)
- MP3 audio extraction support
- Video download with best quality selection
- Custom download location selector
- Automatic binary management (yt-dlp, ffmpeg, ffprobe)
- Download progress tracking
- Playlist support with individual item progress
- Dark theme interface

[1.1.2]: https://github.com/gjoris/grabby/releases/tag/v1.1.2
[1.1.1]: https://github.com/gjoris/grabby/releases/tag/v1.1.1
[1.1.0]: https://github.com/gjoris/grabby/releases/tag/v1.1.0
[1.0.0]: https://github.com/gjoris/grabby/releases/tag/v1.0.0
