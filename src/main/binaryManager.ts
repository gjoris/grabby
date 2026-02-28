import { app, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as https from 'https';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';
import { VersionManager } from './services/versionManager';

const DOWNLOAD_URLS = {
  darwin: {
    ytdlp: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos',
    // BtbN doesn't provide macOS builds, use evermeet.cx (trusted source)
    ffmpeg: 'https://evermeet.cx/ffmpeg/getrelease/zip',
    ffprobe: 'https://evermeet.cx/ffmpeg/getrelease/ffprobe/zip'
  },
  win32: {
    ytdlp: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe',
    ffmpeg: 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip',
    ffprobe: 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip'
  },
  linux: {
    ytdlp: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp',
    ffmpeg: 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-linux64-gpl.tar.xz',
    ffprobe: 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-linux64-gpl.tar.xz'
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

async function extractArchive(archivePath: string, destDir: string, binaryName: string, platform: 'darwin' | 'win32' | 'linux'): Promise<void> {
  const ext = platform === 'win32' ? '.exe' : '';
  const finalPath = path.join(destDir, `${binaryName}${ext}`);
  
  if (archivePath.endsWith('.zip')) {
    const AdmZip = require('adm-zip');
    const zip = new AdmZip(archivePath);
    const entries = zip.getEntries();
    
    // Find the binary in the zip (might be in a subdirectory)
    for (const entry of entries) {
      const entryName = entry.entryName.toLowerCase();
      if (entryName.endsWith(`${binaryName}${ext}`) || entryName.endsWith(`${binaryName}${ext.toLowerCase()}`)) {
        zip.extractEntryTo(entry, destDir, false, true, false, `${binaryName}${ext}`);
        fs.chmodSync(finalPath, 0o755);
        break;
      }
    }
    
    fs.unlinkSync(archivePath);
  } else if (archivePath.endsWith('.tar.xz')) {
    // For Linux tar.xz files, we need to extract differently
    const { execSync } = require('child_process');
    execSync(`tar -xJf "${archivePath}" -C "${destDir}" --strip-components=2 --wildcards "*/bin/${binaryName}"`, {
      stdio: 'ignore'
    });
    fs.chmodSync(finalPath, 0o755);
    fs.unlinkSync(archivePath);
  }
}

async function downloadBinary(
  name: 'ytdlp' | 'ffmpeg' | 'ffprobe', 
  platform: 'darwin' | 'win32' | 'linux',
  onProgress?: (progress: number, status: string) => void
): Promise<void> {
  const url = DOWNLOAD_URLS[platform][name];
  const binaryName = name === 'ytdlp' ? 'yt-dlp' : name;
  const dest = getBinaryPath(binaryName);
  const destDir = path.dirname(dest);
  
  fs.mkdirSync(destDir, { recursive: true });
  
  // Check if we need to extract an archive
  const needsExtraction = (name === 'ffmpeg' || name === 'ffprobe');
  
  if (needsExtraction) {
    const ext = url.endsWith('.tar.xz') ? '.tar.xz' : '.zip';
    const tempArchive = path.join(destDir, `${name}${ext}`);
    
    onProgress?.(0, 'Downloading...');
    await downloadFile(url, tempArchive, (progress) => {
      onProgress?.(Math.round(progress * 0.9), 'Downloading...');
    });
    
    onProgress?.(90, 'Extracting...');
    await extractArchive(tempArchive, destDir, name, platform);
    onProgress?.(100, 'Complete');
  } else {
    onProgress?.(0, 'Downloading...');
    await downloadFile(url, dest, (progress) => {
      onProgress?.(progress, 'Downloading...');
    });
    onProgress?.(100, 'Complete');
  }

  // Record version for yt-dlp
  if (name === 'ytdlp') {
    const version = await VersionManager.getCurrentYtDlpVersion();
    if (version) {
      VersionManager.recordInstallation('ytdlp', version);
    }
  } else {
    // For ffmpeg/ffprobe, get actual version from binary
    const version = await VersionManager.getBinaryVersion(dest, name);
    VersionManager.recordInstallation(name, version);
  }
}

export async function checkAndDownloadBinaries(
  onProgress?: (binary: string, progress: number, status: string) => void
): Promise<boolean> {
  const platform = process.platform as 'darwin' | 'win32' | 'linux';
  const ytdlpPath = getBinaryPath('yt-dlp');
  const ffmpegPath = getBinaryPath('ffmpeg');
  const ffprobePath = getBinaryPath('ffprobe');
  
  const ytdlpExists = binaryExists(ytdlpPath);
  const ffmpegExists = binaryExists(ffmpegPath);
  const ffprobeExists = binaryExists(ffprobePath);
  
  if (ytdlpExists && ffmpegExists && ffprobeExists) {
    return true;
  }
  
  const missing = [];
  if (!ytdlpExists) missing.push('yt-dlp');
  if (!ffmpegExists) missing.push('ffmpeg');
  if (!ffprobeExists) missing.push('ffprobe');
  
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
    if (!ffprobeExists) {
      await downloadBinary('ffprobe', platform, (progress, status) => {
        onProgress?.('ffprobe', progress, status);
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

export async function redownloadAllBinaries(
  onProgress?: (binary: string, progress: number, status: string) => void
): Promise<boolean> {
  const platform = process.platform as 'darwin' | 'win32' | 'linux';
  
  // Delete existing binaries
  const ytdlpPath = getBinaryPath('yt-dlp');
  const ffmpegPath = getBinaryPath('ffmpeg');
  const ffprobePath = getBinaryPath('ffprobe');
  
  try {
    if (fs.existsSync(ytdlpPath)) fs.unlinkSync(ytdlpPath);
    if (fs.existsSync(ffmpegPath)) fs.unlinkSync(ffmpegPath);
    if (fs.existsSync(ffprobePath)) fs.unlinkSync(ffprobePath);
  } catch (error) {
    console.error('Failed to delete binaries:', error);
  }
  
  // Download all binaries
  try {
    await downloadBinary('ytdlp', platform, (progress, status) => {
      onProgress?.('yt-dlp', progress, status);
    });
    await downloadBinary('ffmpeg', platform, (progress, status) => {
      onProgress?.('ffmpeg', progress, status);
    });
    await downloadBinary('ffprobe', platform, (progress, status) => {
      onProgress?.('ffprobe', progress, status);
    });
    
    return true;
  } catch (error) {
    console.error('Failed to redownload binaries:', error);
    return false;
  }
}
