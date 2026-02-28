export interface ParsedProgress {
  type: 'playlist' | 'item' | 'download' | 'processing' | 'complete' | 'error';
  data: any;
}

export class DownloadParser {
  static parse(line: string): ParsedProgress | null {
    // Playlist detection
    if (line.includes('Downloading playlist:')) {
      const match = line.match(/Downloading playlist: (.+)/);
      return {
        type: 'playlist',
        data: { name: match?.[1] || 'Unknown' }
      };
    }

    // Item detection (e.g., "Downloading item 1 of 10")
    if (line.includes('Downloading item')) {
      const match = line.match(/Downloading item (\d+) of (\d+)/);
      return {
        type: 'item',
        data: {
          current: parseInt(match?.[1] || '0'),
          total: parseInt(match?.[2] || '0')
        }
      };
    }

    // Video title extraction
    if (line.includes('Downloading 1 format(s):') || line.includes('Extracting URL:')) {
      return null; // Skip these, we'll get title from filename
    }

    // Download progress (e.g., "[download] 45.2% of 5.23MiB")
    if (line.includes('[download]') && line.includes('%')) {
      const percentMatch = line.match(/(\d+\.?\d*)%/);
      const sizeMatch = line.match(/of\s+([0-9.]+\s*[KMG]iB)/);
      
      return {
        type: 'download',
        data: {
          progress: parseFloat(percentMatch?.[1] || '0'),
          size: sizeMatch?.[1] || ''
        }
      };
    }

    // File download path (e.g., "[download] /path/to/file.webm")
    if (line.includes('[download]') && (line.includes('.webm') || line.includes('.mp4') || line.includes('.mp3'))) {
      const pathMatch = line.match(/\[download\]\s+(.+)/);
      const fullPath = pathMatch?.[1] || '';
      const fileName = fullPath.split('/').pop()?.replace(/\.(webm|mp4|m4a)$/, '') || 'Unknown';
      
      return {
        type: 'item',
        data: { title: fileName }
      };
    }

    // Processing (e.g., "[ExtractAudio] Destination: file.mp3")
    if (line.includes('ExtractAudio') || line.includes('Merger') || line.includes('Postprocessing')) {
      return {
        type: 'processing',
        data: {}
      };
    }

    // Completion
    if (line.includes('Finished downloading playlist') || line.includes('has already been downloaded')) {
      return {
        type: 'complete',
        data: {}
      };
    }

    // Errors
    if (line.includes('ERROR:')) {
      return {
        type: 'error',
        data: { message: line.replace('ERROR:', '').trim() }
      };
    }

    return null;
  }
}
