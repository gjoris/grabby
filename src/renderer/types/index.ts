export type DownloadType = 'mp3' | 'video';

export interface BinaryProgress {
  binary: string;
  progress: number;
  status: string;
}

export interface Settings {
  downloadPath: string;
}

export interface DownloadOptions {
  format: string;
  extractAudio?: boolean;
  audioFormat?: string;
  mergeOutputFormat?: string;
  output: string;
}
