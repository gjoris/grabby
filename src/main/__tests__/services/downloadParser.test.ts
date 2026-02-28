import { describe, it, expect } from 'vitest';
import { DownloadParser } from '../../services/downloadParser';

describe('DownloadParser', () => {
  describe('parse - playlist detection', () => {
    it('parses playlist download start', () => {
      const result = DownloadParser.parse('Downloading playlist: My Playlist');
      expect(result).toEqual({
        type: 'playlist',
        data: { name: 'My Playlist' }
      });
    });

    it('extracts playlist name correctly', () => {
      const result = DownloadParser.parse('Downloading playlist: Rock Classics 2024');
      expect(result?.data.name).toBe('Rock Classics 2024');
    });

    it('handles playlist with special characters', () => {
      const result = DownloadParser.parse('Downloading playlist: My | Playlist (2024)');
      expect(result?.type).toBe('playlist');
      expect(result?.data.name).toBeDefined();
    });
  });

  describe('parse - item detection', () => {
    it('parses item count within playlist', () => {
      const result = DownloadParser.parse('Downloading item 5 of 10');
      expect(result).toEqual({
        type: 'item',
        data: { current: 5, total: 10 }
      });
    });

    it('handles item 1 of 1', () => {
      const result = DownloadParser.parse('Downloading item 1 of 1');
      expect(result?.data).toEqual({ current: 1, total: 1 });
    });

    it('handles large item counts', () => {
      const result = DownloadParser.parse('Downloading item 999 of 5000');
      expect(result?.data).toEqual({ current: 999, total: 5000 });
    });
  });

  describe('parse - download progress', () => {
    it('parses percentage progress', () => {
      const result = DownloadParser.parse('[download] 45.2% of 5.23MiB');
      expect(result).toEqual({
        type: 'download',
        data: { progress: 45.2, size: '5.23MiB' }
      });
    });

    it('parses whole number percentage', () => {
      const result = DownloadParser.parse('[download] 100% of 10.50MiB');
      expect(result?.data.progress).toBe(100);
    });

    it('parses different size units', () => {
      const result1 = DownloadParser.parse('[download] 50% of 250KiB');
      const result2 = DownloadParser.parse('[download] 25% of 1.5GiB');
      expect(result1?.data.size).toBe('250KiB');
      expect(result2?.data.size).toBe('1.5GiB');
    });

    it('handles very small percentages', () => {
      const result = DownloadParser.parse('[download] 0.1% of 100MiB');
      expect(result?.data.progress).toBe(0.1);
    });
  });

  describe('parse - file destination (download)', () => {
    it('parses downloaded file path and extracts filename', () => {
      const result = DownloadParser.parse('[download] /path/to/video.webm');
      expect(result).toEqual({
        type: 'item',
        data: { title: 'video' }
      });
    });

    it('extracts filename from mp4 files', () => {
      const result = DownloadParser.parse('[download] /Users/user/Downloads/my-video.mp4');
      expect(result?.data.title).toBe('my-video');
    });

    it('extracts filename from m4a files', () => {
      const result = DownloadParser.parse('[download] /home/user/music.m4a');
      expect(result?.data.title).toBe('music');
    });

    it('handles complex filenames with multiple dots', () => {
      const result = DownloadParser.parse('[download] /path/to/file.name.with.dots.webm');
      expect(result?.data.title).toBe('file.name.with.dots');
    });
  });

  describe('parse - processing stages', () => {
    it('parses ExtractAudio destination', () => {
      const result = DownloadParser.parse('[ExtractAudio] Destination: /path/to/audio.m4a');
      expect(result).toEqual({
        type: 'destination',
        data: { fileName: 'audio.m4a', stage: 'extracting' }
      });
    });

    it('parses Merger destination', () => {
      const result = DownloadParser.parse('[Merger] Merging formats into "/path/to/merged.mp4"');
      expect(result).toEqual({
        type: 'destination',
        data: { fileName: 'merged.mp4', stage: 'merging' }
      });
    });

    it('parses generic processing stages', () => {
      expect(DownloadParser.parse('[ExtractAudio] Deleting intermediate files')).toEqual({
        type: 'processing',
        data: {}
      });
      expect(DownloadParser.parse('[Merger] Handling streams')).toEqual({
        type: 'processing',
        data: {}
      });
      expect(DownloadParser.parse('[Postprocessor] Processing')).toEqual({
        type: 'processing',
        data: {}
      });
    });
  });

  describe('parse - completion signals', () => {
    it('parses successful completion via file cleanup', () => {
      const result = DownloadParser.parse('Deleting original file /path/to/file.webm');
      expect(result).toEqual({
        type: 'complete',
        data: { reason: 'cleanup' }
      });
    });

    it('parses already downloaded signal', () => {
      const result = DownloadParser.parse('[download] video-id has already been downloaded');
      expect(result).toEqual({
        type: 'complete',
        data: { reason: 'already_downloaded' }
      });
    });

    it('parses playlist completion', () => {
      const result = DownloadParser.parse('Finished downloading playlist: My Playlist');
      expect(result).toEqual({
        type: 'complete',
        data: { reason: 'playlist_complete' }
      });
    });
  });

  describe('parse - errors', () => {
    it('parses error messages', () => {
      const result = DownloadParser.parse('ERROR: Video not available');
      expect(result).toEqual({
        type: 'error',
        data: { message: 'Video not available' }
      });
    });

    it('trims error message', () => {
      const result = DownloadParser.parse('ERROR:   Network timeout   ');
      expect(result?.data.message).toBe('Network timeout');
    });

    it('preserves error details', () => {
      const result = DownloadParser.parse('ERROR: [generic] Unable to connect (HTTP Error 403)');
      expect(result?.data.message).toContain('403');
    });
  });

  describe('parse - ignored lines', () => {
    it('ignores format extraction lines', () => {
      expect(DownloadParser.parse('Downloading 1 format(s):')).toBeNull();
    });

    it('ignores URL extraction lines', () => {
      expect(DownloadParser.parse('Extracting URL: youtube.com/...')).toBeNull();
    });

    it('returns null for unrecognized lines', () => {
      expect(DownloadParser.parse('Some random log line')).toBeNull();
      expect(DownloadParser.parse('[info] Processing...')).toBeNull();
      expect(DownloadParser.parse('')).toBeNull();
    });
  });

  describe('parse - edge cases', () => {
    it('handles malformed progress without percentage', () => {
      const result = DownloadParser.parse('[download] no percentage here');
      expect(result).toBeNull();
    });

    it('handles malformed item count', () => {
      const result = DownloadParser.parse('Downloading item abc of xyz');
      expect(result?.type).toBe('item');
      expect(result?.data.current).toBe(0);
      expect(result?.data.total).toBe(0);
    });

    it('ignores paths without recognized file extensions', () => {
      const result = DownloadParser.parse('[download] /path/to/webm');
      expect(result).toBeNull();
    });

    it('handles Merger with single quotes (alternative format)', () => {
      const result = DownloadParser.parse("[Merger] Merging formats into '/path/to/file.mp4'");
      expect(result?.type).toBe('destination');
      expect(result?.data.stage).toBe('merging');
    });
  });

  describe('parse - real world scenarios', () => {
    it('parses real yt-dlp playlist download flow', () => {
      const lines = [
        'Downloading playlist: Learning Electron',
        'Downloading item 1 of 3',
        '[download] 25.5% of 120.45MiB',
        '[ExtractAudio] Destination: /path/to/video-1.m4a',
        '[Postprocessor] Processing audio',
        'Deleting original file',
        'Downloading item 2 of 3',
        '[download] 50% of 98.20MiB',
        'Finished downloading playlist: Learning Electron'
      ];

      const results = lines.map(line => DownloadParser.parse(line));
      
      expect(results[0]?.type).toBe('playlist');
      expect(results[1]?.type).toBe('item');
      expect(results[2]?.type).toBe('download');
      expect(results[3]?.type).toBe('destination');
      expect(results[4]?.type).toBe('processing');
      expect(results[5]?.type).toBe('complete');
      expect(results[8]?.type).toBe('complete');
    });

    it('parses real single video download with audio extraction', () => {
      const lines = [
        '[download] 45% of 5.23MiB',
        '[download] 100% of 5.23MiB',
        '[ExtractAudio] Destination: /path/to/audio.m4a',
        'Deleting original file /path/to/video.webm'
      ];

      const results = lines.map(line => DownloadParser.parse(line));
      expect(results.filter(r => r !== null)).toHaveLength(4);
    });
  });
});
