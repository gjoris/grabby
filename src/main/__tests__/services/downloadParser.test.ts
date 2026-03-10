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
  });

  describe('parse - item detection', () => {
    it('parses item count within playlist', () => {
      const result = DownloadParser.parse('Downloading item 5 of 10');
      expect(result).toEqual({
        type: 'item',
        data: { current: 5, total: 10 }
      });
    });
  });

  describe('parse - download progress', () => {
    it('parses percentage progress with speed and eta', () => {
      const result = DownloadParser.parse('[download] 45.2% of 5.23MiB at 1.2MiB/s ETA 00:05');
      expect(result).toEqual({
        type: 'download',
        data: { 
          progress: 45.2, 
          size: '5.23MiB',
          speed: '1.2MiB/s',
          eta: '00:05',
          index: undefined
        }
      });
    });

    it('parses parallel download progress with index', () => {
      const result = DownloadParser.parse('[download] [001]  10.5% of 100.00MiB at  2.5MiB/s ETA 00:35');
      expect(result).toEqual({
        type: 'download',
        data: {
          index: 1,
          progress: 10.5,
          size: '100.00MiB',
          speed: '2.5MiB/s',
          eta: '00:35'
        }
      });
    });
  });

  describe('parse - file destination', () => {
    it('parses Destination line', () => {
      const result = DownloadParser.parse('[download] Destination: /path/to/my-video.mkv');
      expect(result).toEqual({
        type: 'item',
        data: { title: 'my-video' }
      });
    });

    it('parses ExtractAudio destination', () => {
      const result = DownloadParser.parse('[ExtractAudio] Destination: song.mp3');
      expect(result).toEqual({
        type: 'destination',
        data: { fileName: 'song.mp3', stage: 'extracting' }
      });
    });
  });

  describe('parse - completion and processing', () => {
    it('parses already downloaded signal', () => {
      const result = DownloadParser.parse('[download] song.mp3 has already been downloaded');
      expect(result?.data.reason).toBe('already_downloaded');
    });

    it('parses successful completion cleanup', () => {
      expect(DownloadParser.parse('Deleting original file vid.webm')).toEqual({ type: 'complete', data: { reason: 'cleanup' } });
    });

    it('parses generic processing stages', () => {
      expect(DownloadParser.parse('[Merger] Merging formats')).toEqual({ type: 'processing', data: {} });
    });
  });

  describe('parse - errors and ignored lines', () => {
    it('parses error messages', () => {
      const result = DownloadParser.parse('ERROR: Video not available');
      expect(result?.data.message).toBe('Video not available');
    });

    it('returns null for unrecognized lines', () => {
      expect(DownloadParser.parse('Random log info')).toBeNull();
    });
  });
});
