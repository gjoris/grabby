import { app, BrowserWindow, ipcMain, dialog, nativeImage } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { spawn } from 'child_process';
import { checkAndDownloadBinaries, getBinaryPath, redownloadAllBinaries } from './binaryManager';
import { LogService } from './services/logService';
import { DownloadParser } from './services/downloadParser';
import { VersionManager } from './services/versionManager';

// Get app version from Electron
const APP_VERSION = app.getVersion();

let mainWindow: BrowserWindow | null = null;

interface Settings {
  downloadPath: string;
}

function getSettingsPath(): string {
  return path.join(app.getPath('userData'), 'settings.json');
}

function loadSettings(): Settings {
  const settingsPath = getSettingsPath();
  const defaultSettings: Settings = {
    downloadPath: app.getPath('downloads')
  };
  
  try {
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf-8');
      const settings = JSON.parse(data);
      
      // If downloadPath is empty or not set, use default
      if (!settings.downloadPath || settings.downloadPath.trim() === '') {
        settings.downloadPath = defaultSettings.downloadPath;
        // Save the updated settings
        saveSettings(settings);
      }
      
      return settings;
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
  
  // Return default settings and save them
  saveSettings(defaultSettings);
  return defaultSettings;
}

function saveSettings(settings: Settings): void {
  const settingsPath = getSettingsPath();
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

function createWindow() {
  const iconPath = process.env.NODE_ENV === 'development'
    ? path.join(__dirname, '../../resources/icon.png')
    : path.join(__dirname, '../resources/icon.png');
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  // Set Content Security Policy (only in production)
  if (process.env.NODE_ENV !== 'development') {
    mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;"
          ]
        }
      });
    });
  }

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(async () => {
  // Initialize services
  LogService.initialize();
  VersionManager.initialize();
  
  LogService.appLog(`Application ready, initializing... (v${APP_VERSION})`, 'info');
  LogService.appLog(`Platform: ${process.platform}`, 'info');
  LogService.appLog(`Electron version: ${process.versions.electron}`, 'info');
  LogService.appLog(`Node version: ${process.versions.node}`, 'info');
  
  // Set dock icon on macOS
  if (process.platform === 'darwin') {
    const iconPath = process.env.NODE_ENV === 'development'
      ? path.join(__dirname, '../../resources/icon.png')
      : path.join(__dirname, '../resources/icon.png');
    
    if (fs.existsSync(iconPath)) {
      const image = nativeImage.createFromPath(iconPath);
      app.dock?.setIcon(image);
      LogService.appLog('Dock icon set successfully', 'info');
    } else {
      LogService.appLog(`Icon not found at: ${iconPath}`, 'warn');
    }
  }
  
  createWindow();
  
  LogService.appLog('Checking binaries...', 'info');
  const binariesReady = await checkAndDownloadBinaries((binary, progress, status) => {
    mainWindow?.webContents.send('binary-download-progress', { binary, progress, status });
  });
  
  if (!binariesReady) {
    LogService.appLog('Binary check failed, quitting application', 'error');
    app.quit();
    return;
  }
  
  LogService.appLog('Binaries ready', 'info');
  mainWindow?.webContents.send('binaries-ready');
  
  // Check for updates in the background
  setTimeout(async () => {
    LogService.appLog('Checking for updates...', 'info');
    const updateCheck = await VersionManager.checkForUpdates();
    if (updateCheck.hasUpdates && updateCheck.ytdlpUpdate) {
      LogService.appLog(`Update available: yt-dlp ${updateCheck.ytdlpUpdate}`, 'info');
      mainWindow?.webContents.send('update-available', {
        binary: 'yt-dlp',
        version: updateCheck.ytdlpUpdate
      });
    } else {
      LogService.appLog('No updates available', 'info');
    }
  }, 5000); // Check 5 seconds after startup
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handler for downloading
ipcMain.handle('download', async (event, url: string, options: any) => {
  return new Promise((resolve, reject) => {
    const ytdlpPath = getBinaryPath('yt-dlp');
    const ffmpegPath = getBinaryPath('ffmpeg');
    const ffprobePath = getBinaryPath('ffprobe');
    
    // Start logging
    const logFile = LogService.startDownloadLog();
    LogService.log(`Download started for URL: ${url}`);
    LogService.log(`Options: ${JSON.stringify(options, null, 2)}`);
    LogService.log(`ffmpeg path: ${ffmpegPath}`);
    LogService.log(`ffprobe path: ${ffprobePath}`);
    
    // Verify binaries exist
    if (!fs.existsSync(ffmpegPath)) {
      const error = `ffmpeg not found at: ${ffmpegPath}`;
      LogService.log(error, 'error');
      reject(new Error(error));
      return;
    }
    if (!fs.existsSync(ffprobePath)) {
      const error = `ffprobe not found at: ${ffprobePath}`;
      LogService.log(error, 'error');
      reject(new Error(error));
      return;
    }
    
    const args = [
      url,
      '--ffmpeg-location', ffmpegPath,
      '--progress',
      '--newline',
      '--yes-playlist',  // Enable playlist downloads
      '--no-warnings'    // Suppress warnings to reduce noise
    ];

    if (options.format) {
      args.push('-f', options.format);
    }
    if (options.extractAudio) {
      args.push('-x');  // Extract audio
    }
    if (options.audioFormat) {
      args.push('--audio-format', options.audioFormat);
    }
    if (options.output) {
      args.push('-o', options.output);
    }

    LogService.log(`Executing: ${ytdlpPath} ${args.join(' ')}`);

    const ytdlp = spawn(ytdlpPath, args);
    
    let lastLine = '';
    let currentItemIndex = 0;
    let currentItemTitle = '';
    
    ytdlp.stdout.on('data', (data) => {
      const lines = data.toString().split('\n').filter((line: string) => line.trim());
      lines.forEach((line: string) => {
        // Log everything to file
        LogService.log(line, 'info');
        
        // Parse and send only relevant progress to UI
        const parsed = DownloadParser.parse(line);
        if (parsed) {
          if (parsed.type === 'playlist') {
            event.sender.send('download-playlist-info', parsed.data);
          } else if (parsed.type === 'item') {
            if (parsed.data.current) {
              currentItemIndex = parsed.data.current;
              event.sender.send('download-item-start', {
                index: parsed.data.current,
                total: parsed.data.total
              });
            } else if (parsed.data.title) {
              currentItemTitle = parsed.data.title;
              event.sender.send('download-item-title', {
                index: currentItemIndex,
                title: parsed.data.title
              });
            }
          } else if (parsed.type === 'download') {
            event.sender.send('download-progress-update', {
              index: currentItemIndex,
              progress: parsed.data.progress,
              size: parsed.data.size
            });
          } else if (parsed.type === 'destination') {
            // Update title with final filename
            event.sender.send('download-item-title', {
              index: currentItemIndex,
              title: parsed.data.fileName
            });
            event.sender.send('download-item-processing', {
              index: currentItemIndex
            });
          } else if (parsed.type === 'processing') {
            event.sender.send('download-item-processing', {
              index: currentItemIndex
            });
          } else if (parsed.type === 'complete') {
            event.sender.send('download-item-complete', {
              index: currentItemIndex
            });
          } else if (parsed.type === 'error') {
            event.sender.send('download-item-error', {
              index: currentItemIndex,
              error: parsed.data.message
            });
          }
        }
      });
    });

    ytdlp.stderr.on('data', (data) => {
      const text = data.toString();
      // Log all stderr to file
      LogService.log(text, 'error');
      
      // Only send actual errors to UI
      if (text.includes('ERROR:')) {
        const parsed = DownloadParser.parse(text);
        if (parsed && parsed.type === 'error') {
          event.sender.send('download-item-error', {
            index: currentItemIndex,
            error: parsed.data.message
          });
        }
      }
    });

    ytdlp.on('close', (code) => {
      LogService.log(`Process exited with code: ${code}`);
      LogService.endDownloadLog(code === 0);
      
      if (code === 0) {
        event.sender.send('download-complete');
        resolve({ success: true, logFile });
      } else {
        reject(new Error(`yt-dlp exited with code ${code}`));
      }
    });
  });
});

// Get video info
ipcMain.handle('get-info', async (event, url: string) => {
  return new Promise((resolve, reject) => {
    const ytdlpPath = getBinaryPath('yt-dlp');
    
    const ytdlp = spawn(ytdlpPath, [url, '--dump-json', '--no-playlist']);
    
    let output = '';
    
    ytdlp.stdout.on('data', (data) => {
      output += data.toString();
    });

    ytdlp.on('close', (code) => {
      if (code === 0) {
        try {
          resolve(JSON.parse(output));
        } catch (e) {
          reject(new Error('Failed to parse video info'));
        }
      } else {
        reject(new Error(`yt-dlp exited with code ${code}`));
      }
    });
  });
});

// Check if binaries are ready
ipcMain.handle('check-binaries', async () => {
  const ytdlpPath = getBinaryPath('yt-dlp');
  const ffmpegPath = getBinaryPath('ffmpeg');
  const ffprobePath = getBinaryPath('ffprobe');
  
  const ytdlpExists = require('fs').existsSync(ytdlpPath);
  const ffmpegExists = require('fs').existsSync(ffmpegPath);
  const ffprobeExists = require('fs').existsSync(ffprobePath);
  
  const missing = [];
  if (!ytdlpExists) missing.push('yt-dlp');
  if (!ffmpegExists) missing.push('ffmpeg');
  if (!ffprobeExists) missing.push('ffprobe');
  
  return {
    ready: ytdlpExists && ffmpegExists && ffprobeExists,
    missing
  };
});

// Settings handlers
ipcMain.handle('get-settings', async () => {
  return loadSettings();
});

ipcMain.handle('save-settings', async (event, settings: Settings) => {
  saveSettings(settings);
});

ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory', 'createDirectory']
  });
  
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  
  return result.filePaths[0];
});

// Get logs directory
ipcMain.handle('get-logs-directory', async () => {
  return LogService.getLogDirectory();
});

// Open logs directory in file explorer
ipcMain.handle('open-logs-directory', async () => {
  const { shell } = require('electron');
  const logsDir = LogService.getLogDirectory();
  shell.openPath(logsDir);
});

// Get log statistics
ipcMain.handle('get-log-stats', async () => {
  return LogService.getLogStats();
});

// Clear all logs
ipcMain.handle('clear-logs', async () => {
  return LogService.clearAllLogs();
});

// Get binary versions
ipcMain.handle('get-binary-versions', async () => {
  const versions = VersionManager.getInstalledVersions();
  
  // If versions don't exist or are 'unknown', try to get them from binaries
  if (!versions || versions.ytdlp === 'unknown' || versions.ffmpeg === 'unknown') {
    const ytdlpPath = getBinaryPath('yt-dlp');
    const ffmpegPath = getBinaryPath('ffmpeg');
    const ffprobePath = getBinaryPath('ffprobe');
    
    const ytdlpVersion = await VersionManager.getBinaryVersion(ytdlpPath, 'yt-dlp');
    const ffmpegVersion = await VersionManager.getBinaryVersion(ffmpegPath, 'ffmpeg');
    const ffprobeVersion = await VersionManager.getBinaryVersion(ffprobePath, 'ffprobe');
    
    const newVersions = {
      ytdlp: ytdlpVersion,
      ffmpeg: ffmpegVersion,
      ffprobe: ffprobeVersion,
      lastChecked: new Date().toISOString()
    };
    
    VersionManager.saveVersions(newVersions);
    return newVersions;
  }
  
  return versions;
});

// Get app version
ipcMain.handle('get-app-version', async () => {
  return APP_VERSION;
});

// Check for updates
ipcMain.handle('check-for-updates', async () => {
  return VersionManager.checkForUpdates();
});

// Redownload binaries
ipcMain.handle('redownload-binaries', async () => {
  const success = await redownloadAllBinaries((binary, progress, status) => {
    mainWindow?.webContents.send('binary-download-progress', { binary, progress, status });
  });
  
  if (success) {
    mainWindow?.webContents.send('binaries-ready');
  }
  
  return success;
});
