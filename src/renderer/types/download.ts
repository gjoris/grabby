export interface DownloadItem {
  id: string;
  title: string;
  status: 'pending' | 'downloading' | 'processing' | 'completed' | 'error';
  progress: number;
  size?: string;
  speed?: string;
  eta?: string;
  error?: string;
}

export interface DownloadProgress {
  items: DownloadItem[];
  currentItem?: string;
}
