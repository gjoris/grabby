import { app, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as https from 'https';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';

const DOWNLOAD_URLS = {
  darwin: {
    ytdlp: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos',
    ffmpeg: 'https://evermeet.cx/ffmpeg/getrelease/ffmpeg/zip'
  },
  win32: {
    ytdlp: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe',
    ffmpeg: 'https://github.com/GyanD/codexffmpeg/releases/download/7.1/ffmpeg-7.1-essentials_build.zip'
  },
  linux: {
    ytdlp: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp',
    ffmpeg: 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz'
  }
};

export function getBinaryPath(binaryName: string): string {
  const platform = process.platform as 'darwin' | 'win32' | 'linux';
  const ext = platform === 'win32' ? '.exe' : '';
  
  // Store binaries in user data directory
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'bin', platform, `${binaryName}${ext}`);
}

function binaryExists(binaryPath: string): boolean {
  return fs.existsSync(binaryPath);
}

async function downloadFile(url: string, dest: string, onProgress?: (progress: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        downloadFile(response.headers.location!, dest, onProgress).then(resolve).catch(reject);
        return;
      }
      
      const totalSize = parseInt(response.headers['content-length'] || '0', 10);
      let downloadedSize = 0;
      
      const file = createWriteStream(dest);
      
      response.on('data', (chunk) => {
        downloadedSize += chunk.length;
        if (totalSize > 0 && onProgress) {
          const progress = Math.round((downloadedSize / totalSize) * 100);
          onProgress(progress);
        }
      });
      
      pipeline(response, file)
        .then(() => {
          fs.chmodSync(dest, 0o755);
          resolve();
        })
        .catch(reject);
    }).on('error', reject);
  });
}

async function extractZip(zipPath: string, destDir: string, fileName: string): Promise<void> {
  const AdmZip = require('adm-zip');
  const zip = new AdmZip(zipPath);
  const entries = zip.getEntries();
  
  for (const entry of entries) {
    if (entry.entryName.endsWith(fileName) || entry.entryName === fileName) {
      zip.extractEntryTo(entry, destDir, false, true, false, fileName);
      break;
    }
  }
  
  fs.unlinkSync(zipPath);
}

async function downloadBinary(
  name: 'ytdlp' | 'ffmpeg', 
  platform: 'darwin' | 'win32' | 'linux',
  onProgress?: (progress: number, status: string) => void
): Promise<void> {
  const url = DOWNLOAD_URLS[platform][name];
  const binaryName = name === 'ytdlp' ? 'yt-dlp' : 'ffmpeg';
  const dest = getBinaryPath(binaryName);
  const destDir = path.dirname(dest);
  
  fs.mkdirSync(destDir, { recursive: true });
  
  if (name === 'ffmpeg' && platform === 'darwin') {
    const tempZip = path.join(destDir, 'ffmpeg.zip');
    onProgress?.(0, 'Downloading...');
    await downloadFile(url, tempZip, (progress) => {
      onProgress?.(Math.round(progress * 0.9), 'Downloading...');
    });
    onProgress?.(90, 'Extracting...');
    await extractZip(tempZip, destDir, 'ffmpeg');
    onProgress?.(100, 'Complete');
  } else if (name === 'ffmpeg' && platform === 'win32') {
    const tempZip = path.join(destDir, 'ffmpeg.zip');
    onProgress?.(0, 'Downloading...');
    await downloadFile(url, tempZip, (progress) => {
      onProgress?.(Math.round(progress * 0.9), 'Downloading...');
    });
    onProgress?.(90, 'Extracting...');
    await extractZip(tempZip, destDir, 'ffmpeg.exe');
    onProgress?.(100, 'Complete');
  } else {
    onProgress?.(0, 'Downloading...');
    await downloadFile(url, dest, (progress) => {
      onProgress?.(progress, 'Downloading...');
    });
    onProgress?.(100, 'Complete');
  }
}

export async function checkAndDownloadBinaries(
  onProgress?: (binary: string, progress: number, status: string) => void
): Promise<boolean> {
  const platform = process.platform as 'darwin' | 'win32' | 'linux';
  const ytdlpPath = getBinaryPath('yt-dlp');
  const ffmpegPath = getBinaryPath('ffmpeg');
  
  const ytdlpExists = binaryExists(ytdlpPath);
  const ffmpegExists = binaryExists(ffmpegPath);
  
  if (ytdlpExists && ffmpegExists) {
    return true;
  }
  
  const missing = [];
  if (!ytdlpExists) missing.push('yt-dlp');
  if (!ffmpegExists) missing.push('ffmpeg');
  
  const response = await dialog.showMessageBox({
    type: 'warning',
    title: 'Missing Dependencies',
    message: `Grabby needs to download required components: ${missing.join(', ')}`,
    detail: 'This is a one-time download (~100-150MB). Continue?',
    buttons: ['Download', 'Cancel'],
    defaultId: 0,
    cancelId: 1
  });
  
  if (response.response !== 0) {
    return false;
  }
  
  try {
    if (!ytdlpExists) {
      await downloadBinary('ytdlp', platform, (progress, status) => {
        onProgress?.('yt-dlp', progress, status);
      });
    }
    if (!ffmpegExists) {
      await downloadBinary('ffmpeg', platform, (progress, status) => {
        onProgress?.('ffmpeg', progress, status);
      });
    }
    
    return true;
  } catch (error) {
    await dialog.showMessageBox({
      type: 'error',
      title: 'Download Failed',
      message: `Failed to download dependencies: ${error}`,
      buttons: ['OK']
    });
    
    return false;
  }
}
