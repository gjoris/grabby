import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

interface BinaryVersions {
  ytdlp: string;
  ffmpeg: string;
  ffprobe: string;
  lastChecked: string;
}

const VERSION_CHECK_INTERVAL = 7 * 24 * 60 * 60 * 1000; // 7 days

export class VersionManager {
  private static versionsPath: string;

  static initialize(): void {
    this.versionsPath = path.join(app.getPath('userData'), 'binary-versions.json');
  }

  static getVersionsPath(): string {
    return this.versionsPath;
  }

  static loadVersions(): BinaryVersions | null {
    try {
      if (fs.existsSync(this.versionsPath)) {
        const data = fs.readFileSync(this.versionsPath, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load versions:', error);
    }
    return null;
  }

  static saveVersions(versions: BinaryVersions): void {
    try {
      fs.writeFileSync(this.versionsPath, JSON.stringify(versions, null, 2));
    } catch (error) {
      console.error('Failed to save versions:', error);
    }
  }

  static async getBinaryVersion(binaryPath: string, binaryName: string): Promise<string> {
    try {
      // ffmpeg and ffprobe use -version (single dash), yt-dlp uses --version
      const versionFlag = (binaryName === 'ffmpeg' || binaryName === 'ffprobe') ? '-version' : '--version';
      const { stdout, stderr } = await execFileAsync(binaryPath, [versionFlag]);
      const output = stdout || stderr;
      
      if (binaryName === 'yt-dlp') {
        // yt-dlp outputs version like "2024.01.01"
        const match = output.match(/(\d{4}\.\d{2}\.\d{2})/);
        return match ? match[1] : 'unknown';
      } else if (binaryName === 'ffmpeg' || binaryName === 'ffprobe') {
        // ffmpeg outputs like "ffmpeg version N-113684-g1234abcd" or "ffmpeg version 6.0"
        const match = output.match(/version\s+([^\s]+)/i);
        return match ? match[1] : 'unknown';
      }
      
      return 'unknown';
    } catch (error) {
      console.error(`Failed to get ${binaryName} version:`, error);
      return 'unknown';
    }
  }

  static async getCurrentYtDlpVersion(): Promise<string | null> {
    return new Promise((resolve) => {
      https.get('https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest', {
        headers: { 'User-Agent': 'Grabby' }
      }, (response) => {
        let data = '';
        
        response.on('data', (chunk) => {
          data += chunk;
        });
        
        response.on('end', () => {
          try {
            const release = JSON.parse(data);
            resolve(release.tag_name || null);
          } catch (error) {
            console.error('Failed to parse yt-dlp version:', error);
            resolve(null);
          }
        });
      }).on('error', (error) => {
        console.error('Failed to fetch yt-dlp version:', error);
        resolve(null);
      });
    });
  }

  static async checkForUpdates(): Promise<{
    hasUpdates: boolean;
    ytdlpUpdate?: string;
  }> {
    const currentVersions = this.loadVersions();
    
    // Check if we should check for updates (every 7 days)
    if (currentVersions) {
      const lastChecked = new Date(currentVersions.lastChecked);
      const now = new Date();
      const timeSinceCheck = now.getTime() - lastChecked.getTime();
      
      if (timeSinceCheck < VERSION_CHECK_INTERVAL) {
        return { hasUpdates: false };
      }
    }

    // Check yt-dlp version
    const latestYtDlp = await this.getCurrentYtDlpVersion();
    
    if (!latestYtDlp) {
      return { hasUpdates: false };
    }

    const hasYtDlpUpdate = !currentVersions || currentVersions.ytdlp !== latestYtDlp;

    // Update last checked time
    const newVersions: BinaryVersions = {
      ytdlp: currentVersions?.ytdlp || 'unknown',
      ffmpeg: currentVersions?.ffmpeg || 'unknown',
      ffprobe: currentVersions?.ffprobe || 'unknown',
      lastChecked: new Date().toISOString()
    };
    this.saveVersions(newVersions);

    return {
      hasUpdates: hasYtDlpUpdate,
      ytdlpUpdate: hasYtDlpUpdate ? latestYtDlp : undefined
    };
  }

  static recordInstallation(binary: 'ytdlp' | 'ffmpeg' | 'ffprobe', version: string): void {
    const currentVersions = this.loadVersions() || {
      ytdlp: 'unknown',
      ffmpeg: 'unknown',
      ffprobe: 'unknown',
      lastChecked: new Date().toISOString()
    };

    if (binary === 'ytdlp') {
      currentVersions.ytdlp = version;
    } else if (binary === 'ffmpeg') {
      currentVersions.ffmpeg = version;
    } else if (binary === 'ffprobe') {
      currentVersions.ffprobe = version;
    }

    currentVersions.lastChecked = new Date().toISOString();
    this.saveVersions(currentVersions);
  }

  static getInstalledVersions(): BinaryVersions | null {
    return this.loadVersions();
  }
}
