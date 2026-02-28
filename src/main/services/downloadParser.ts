export interface ParsedProgress {
  type: 'playlist' | 'item' | 'download' | 'processing' | 'complete' | 'error' | 'destination';
  data: any;
}

export class DownloadParser {
  static parse(line: string): ParsedProgress | null {
    // Already downloaded
    if (line.includes('has already been downloaded')) {
      const match = line.match(/\[download\]\s+(.+)\s+has already been downloaded/);
      const fullPath = match?.[1] || '';
      const fileName = fullPath.split(/[/\\]/).pop()?.replace(/\.(webm|mp4|m4a|mkv|mp3|flv)$/, '') || 'Unknown';

      return {
        type: 'complete',
        data: { 
          reason: 'already_downloaded',
          title: fileName 
        }
      };
    }

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

    // Download progress (e.g., "[download] 45.2% of 5.23MiB at 1.2MiB/s ETA 00:05")
    // Or parallel: "[download] [001]  45.2% of 5.23MiB ..."
    if (line.includes('[download]') && line.includes('%')) {
      const indexMatch = line.match(/\[download\]\s+\[(\d+)\]/);
      const percentMatch = line.match(/(\d+\.?\d*)%/);
      const sizeMatch = line.match(/of\s+([0-9.]+\s*[KMG]iB)/);
      const speedMatch = line.match(/at\s+([0-9.]+\s*[KMG]iB\/s)/);
      const etaMatch = line.match(/ETA\s+([\d:]+)/);
      
      return {
        type: 'download',
        data: {
          index: indexMatch ? parseInt(indexMatch[1]) : undefined,
          progress: parseFloat(percentMatch?.[1] || '0'),
          size: sizeMatch?.[1] || '',
          speed: speedMatch?.[1] || '',
          eta: etaMatch?.[1] || ''
        }
      };
    }

    // File download path (e.g., "[download] Destination: /path/to/file.webm")
    if (line.includes('[download]') && (line.includes('Destination:') || line.includes('.webm') || line.includes('.mp4') || line.includes('.m4a') || line.includes('.mkv') || line.includes('.mp3') || line.includes('.flv'))) {
      const pathMatch = line.match(/\[download\]\s+(?:Destination:\s+)?(.+)/);
      const fullPath = pathMatch?.[1] || '';
      const fileName = fullPath.split(/[/\\]/).pop()?.replace(/\.(webm|mp4|m4a|mkv|mp3|flv)$/, '') || 'Unknown';
      
      return {
        type: 'item',
        data: { title: fileName }
      };
    }

    // Processing - ExtractAudio with destination
    if (line.includes('[ExtractAudio] Destination:')) {
      const match = line.match(/\[ExtractAudio\] Destination: (.+)/);
      const fullPath = match?.[1] || '';
      const fileName = fullPath.split('/').pop() || 'Unknown';
      
      return {
        type: 'destination',
        data: { 
          fileName: fileName,
          stage: 'extracting'
        }
      };
    }

    // Processing - Merger with destination
    if (line.includes('[Merger] Merging formats into')) {
      const match = line.match(/\[Merger\] Merging formats into "(.+)"/);
      const fullPath = match?.[1] || '';
      const fileName = fullPath.split('/').pop() || 'Unknown';
      
      return {
        type: 'destination',
        data: { 
          fileName: fileName,
          stage: 'merging'
        }
      };
    }

    // Processing stages
    if (line.includes('[ExtractAudio]') || line.includes('[Merger]') || line.includes('[Postprocessor]')) {
      return {
        type: 'processing',
        data: {}
      };
    }

    // Deleting original file - means conversion is complete
    if (line.includes('Deleting original file')) {
      return {
        type: 'complete',
        data: { reason: 'cleanup' }
      };
    }

    // Already downloaded
    if (line.includes('has already been downloaded')) {
      return {
        type: 'complete',
        data: { reason: 'already_downloaded' }
      };
    }

    // Completion
    if (line.includes('Finished downloading playlist')) {
      return {
        type: 'complete',
        data: { reason: 'playlist_complete' }
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
