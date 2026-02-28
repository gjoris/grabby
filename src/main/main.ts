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
  
  // Log binary versions to file
  const versions = await VersionManager.getInstalledVersions();
  if (versions) {
    LogService.appLog(`Installed versions: yt-dlp ${versions.ytdlp}, ffmpeg ${versions.ffmpeg}`, 'info');
  }

  // Test if --concurrent-items is supported
  const ytdlpPath = getBinaryPath('yt-dlp');
  const check = spawn(ytdlpPath, ['--help']);
  let helpOutput = '';
  check.stdout.on('data', (data) => helpOutput += data.toString());
  check.on('close', () => {
    const supported = helpOutput.includes('--concurrent-items');
    LogService.appLog(`Support for --concurrent-items: ${supported}`, 'info');
  });
  
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
ipcMain.handle('download', async (event, url: string, options: any, jobId: string) => {
  const ytdlpPath = getBinaryPath('yt-dlp');
  const ffmpegPath = getBinaryPath('ffmpeg');
  const binaryDir = path.dirname(ffmpegPath);
  
  const logFile = LogService.startDownloadLog();
  LogService.log(`Download task started [Job: ${jobId}] for: ${url}`);

  const MAX_CONCURRENT = 3;
  let activeProcesses = 0;
  let finishedItems = 0;
  let totalDiscovered = 0;
  let metadataFinished = false;
  const queue: any[] = [];
  const allEntries: any[] = [];

  return new Promise((resolve, reject) => {
    const runNext = () => {
      // Resolve only if metadata fetch is done AND all discovered items are finished
      if (metadataFinished && finishedItems === totalDiscovered && totalDiscovered > 0) {
        event.sender.send('download-complete', { jobId });
        LogService.endDownloadLog(true);
        resolve({ success: true, logFile });
        return;
      }

      while (activeProcesses < MAX_CONCURRENT && queue.length > 0) {
        const entry = queue.shift();
        const entryIndex = allEntries.indexOf(entry) + 1;
        activeProcesses++;

        let entryUrl = entry.url || entry.webpage_url || entry.id;
        if (entryUrl && !entryUrl.startsWith('http') && (url.includes('youtube.com') || url.includes('youtu.be'))) {
          entryUrl = `https://www.youtube.com/watch?v=${entryUrl}`;
        }
        
        if (!entryUrl) {
          activeProcesses--;
          finishedItems++;
          runNext();
          continue;
        }

        const entryArgs = [
          entryUrl,
          '--ffmpeg-location', binaryDir,
          '--progress', '--newline', '--no-warnings', '--no-playlist',
          '--concurrent-fragments', '5'
        ];

        if (options.format) entryArgs.push('-f', options.format);
        if (options.extractAudio) entryArgs.push('-x');
        if (options.audioFormat) entryArgs.push('--audio-format', options.audioFormat);
        if (options.mergeOutputFormat) entryArgs.push('--merge-output-format', options.mergeOutputFormat);
        if (options.output) entryArgs.push('-o', options.output);

        const child = spawn(ytdlpPath, entryArgs);
        
        event.sender.send('download-item-start', { jobId, index: entryIndex, total: totalDiscovered || 1 });
        if (entry.title) {
          event.sender.send('download-item-title', { jobId, index: entryIndex, title: entry.title });
        }

        child.stdout.on('data', (data) => {
          data.toString().split('\n').filter((l: string) => l.trim()).forEach((line: string) => {
            LogService.log(line, 'info');
            const parsed = DownloadParser.parse(line);
            if (parsed) {
              if (parsed.type === 'download') {
                event.sender.send('download-progress-update', {
                  jobId, index: entryIndex, progress: parsed.data.progress,
                  size: parsed.data.size, speed: parsed.data.speed, eta: parsed.data.eta
                });
              } else if (parsed.type === 'destination' || parsed.type === 'processing') {
                if (parsed.data?.fileName) {
                  event.sender.send('download-item-title', { jobId, index: entryIndex, title: parsed.data.fileName });
                }
                event.sender.send('download-item-processing', { jobId, index: entryIndex });
              }
            }
          });
        });

        child.on('close', (code) => {
          activeProcesses--;
          finishedItems++;
          if (code === 0) {
            event.sender.send('download-item-complete', { jobId, index: entryIndex });
          } else {
            event.sender.send('download-item-error', { jobId, index: entryIndex, error: `Exit code ${code}` });
          }
          runNext();
        });
      }
    };

    // Start metadata discovery process
    LogService.log(`Discovering metadata...`);
    const infoProcess = spawn(ytdlpPath, [url, '--dump-json', '--flat-playlist', '--no-warnings']);
    
    let buffer = '';
    infoProcess.stdout.on('data', (data) => {
      buffer += data.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep partial line in buffer

      lines.filter(l => l.trim()).forEach(line => {
        LogService.log(line, 'info');
        try {
          const entry = JSON.parse(line);
          if (entry._type === 'playlist') {
            event.sender.send('download-playlist-info', { jobId, name: entry.title || 'Playlist' });
          } else {
            totalDiscovered++;
            queue.push(entry);
            allEntries.push(entry);
            // Notify UI about the total changing
            event.sender.send('download-item-start', { jobId, index: allEntries.length, total: totalDiscovered });
            runNext();
          }
        } catch (e) { /* ignore parse errors for partial lines */ }
      });
    });

    infoProcess.on('close', () => {
      metadataFinished = true;
      LogService.log(`Metadata discovery finished. Total: ${totalDiscovered}`);
      if (totalDiscovered === 0) {
        // Fallback for single videos where metadata might not follow the playlist pattern
        reject(new Error('No videos found at this URL'));
      }
      runNext();
    });

    infoProcess.on('error', (err) => {
      LogService.log(`Metadata process error: ${err}`, 'error');
      reject(err);
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
