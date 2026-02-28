import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { spawn } from 'child_process';
import { checkAndDownloadBinaries, getBinaryPath } from './binaryManager';
import { LogService } from './services/logService';
import { DownloadParser } from './services/downloadParser';
import { VersionManager } from './services/versionManager';

let mainWindow: BrowserWindow | null = null;

interface Settings {
  downloadPath: string;
}

function getSettingsPath(): string {
  return path.join(app.getPath('userData'), 'settings.json');
}

function loadSettings(): Settings {
  const settingsPath = getSettingsPath();
  try {
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
  
  // Default settings
  return {
    downloadPath: app.getPath('downloads')
  };
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
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

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
  
  createWindow();
  
  const binariesReady = await checkAndDownloadBinaries((binary, progress, status) => {
    mainWindow?.webContents.send('binary-download-progress', { binary, progress, status });
  });
  
  if (!binariesReady) {
    app.quit();
    return;
  }
  
  mainWindow?.webContents.send('binaries-ready');
  
  // Check for updates in the background
  setTimeout(async () => {
    const updateCheck = await VersionManager.checkForUpdates();
    if (updateCheck.hasUpdates && updateCheck.ytdlpUpdate) {
      mainWindow?.webContents.send('update-available', {
        binary: 'yt-dlp',
        version: updateCheck.ytdlpUpdate
      });
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

// Get binary versions
ipcMain.handle('get-binary-versions', async () => {
  return VersionManager.getInstalledVersions();
});

// Check for updates
ipcMain.handle('check-for-updates', async () => {
  return VersionManager.checkForUpdates();
});
