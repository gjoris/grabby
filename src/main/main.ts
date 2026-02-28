import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { spawn } from 'child_process';
import { checkAndDownloadBinaries, getBinaryPath } from './binaryManager';

let mainWindow: BrowserWindow | null = null;

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
  createWindow();
  
  const binariesReady = await checkAndDownloadBinaries((binary, progress, status) => {
    mainWindow?.webContents.send('binary-download-progress', { binary, progress, status });
  });
  
  if (!binariesReady) {
    app.quit();
    return;
  }
  
  mainWindow?.webContents.send('binaries-ready');
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
    
    const args = [
      url,
      '--ffmpeg-location', ffmpegPath,
      '--progress',
      '--newline',
      '--yes-playlist'  // Enable playlist downloads
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

    const ytdlp = spawn(ytdlpPath, args);
    
    ytdlp.stdout.on('data', (data) => {
      event.sender.send('download-progress', data.toString());
    });

    ytdlp.stderr.on('data', (data) => {
      event.sender.send('download-error', data.toString());
    });

    ytdlp.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true });
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
  
  const ytdlpExists = require('fs').existsSync(ytdlpPath);
  const ffmpegExists = require('fs').existsSync(ffmpegPath);
  
  const missing = [];
  if (!ytdlpExists) missing.push('yt-dlp');
  if (!ffmpegExists) missing.push('ffmpeg');
  
  return {
    ready: ytdlpExists && ffmpegExists,
    missing
  };
});
