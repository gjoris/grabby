import { DownloadType, DownloadOptions } from '../types';
import { ElectronAPIService } from './electronAPI';

export class DownloadService {
  static buildDownloadOptions(
    downloadType: DownloadType,
    downloadPath: string
  ): DownloadOptions {
    const baseOutput = `${downloadPath}/%(title)s.%(ext)s`;

    if (downloadType === 'mp3') {
      return {
        format: 'bestaudio/best',
        extractAudio: true,
        audioFormat: 'mp3',
        output: baseOutput
      };
    }

    return {
      format: 'bestvideo+bestaudio/best',
      output: baseOutput
    };
  }

  static async download(
    url: string,
    downloadType: DownloadType,
    downloadPath: string
  ): Promise<void> {
    const options = this.buildDownloadOptions(downloadType, downloadPath);
    await ElectronAPIService.download(url, options);
  }
}
