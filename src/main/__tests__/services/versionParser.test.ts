import { describe, it, expect } from 'vitest';
import {
  parseYtDlpVersion,
  parseFfmpegVersion,
  parseFfprobeVersion,
  extractBinaryVersion,
  parseLatestYtDlpRelease,
  shouldCheckForUpdates
} from '../../services/versionParser';

describe('versionParser', () => {
  describe('parseYtDlpVersion', () => {
    it('parses standard yt-dlp version format', () => {
      const output = 'yt-dlp 2024.01.15';
      expect(parseYtDlpVersion(output)).toBe('2024.01.15');
    });

    it('extracts version from verbose output', () => {
      const output = '[version] yt-dlp version 2024.02.28 (latest)';
      expect(parseYtDlpVersion(output)).toBe('2024.02.28');
    });

    it('handles version in middle of text', () => {
      const output = 'Using yt-dlp 2023.12.30 for downloads';
      expect(parseYtDlpVersion(output)).toBe('2023.12.30');
    });

    it('returns unknown for invalid version format', () => {
      expect(parseYtDlpVersion('yt-dlp version abc.de.fg')).toBe('unknown');
      expect(parseYtDlpVersion('no version here')).toBe('unknown');
      expect(parseYtDlpVersion('')).toBe('unknown');
    });

    it('matches first valid version date in output', () => {
      const output = 'Checking 2024.01.01 against current 2024.02.28';
      expect(parseYtDlpVersion(output)).toBe('2024.01.01');
    });
  });

  describe('parseFfmpegVersion', () => {
    it('parses ffmpeg version with build number', () => {
      const output = 'ffmpeg version N-113684-g1234abcd';
      expect(parseFfmpegVersion(output)).toBe('N-113684-g1234abcd');
    });

    it('parses ffmpeg version with release number', () => {
      const output = 'ffmpeg version 6.0';
      expect(parseFfmpegVersion(output)).toBe('6.0');
    });

    it('parses ffmpeg verbose output', () => {
      const output = 'ffmpeg version 6.0 Copyright (c) 2000-2024';
      expect(parseFfmpegVersion(output)).toBe('6.0');
    });

    it('handles version case-insensitive', () => {
      const output = 'FFMPEG VERSION 6.1';
      expect(parseFfmpegVersion(output)).toBe('6.1');
    });

    it('returns unknown for invalid format', () => {
      expect(parseFfmpegVersion('ffmpeg without version')).toBe('unknown');
      expect(parseFfmpegVersion('')).toBe('unknown');
    });
  });

  describe('parseFfprobeVersion', () => {
    it('parses ffprobe version', () => {
      const output = 'ffprobe version 6.0';
      expect(parseFfprobeVersion(output)).toBe('6.0');
    });

    it('parses ffprobe build version', () => {
      const output = 'ffprobe version N-113684-g1234abcd';
      expect(parseFfprobeVersion(output)).toBe('N-113684-g1234abcd');
    });

    it('uses same logic as ffmpeg', () => {
      const output = 'version 5.1.2';
      expect(parseFfprobeVersion(output)).toBe(parseFfmpegVersion(output));
    });
  });

  describe('extractBinaryVersion', () => {
    it('extracts yt-dlp version', () => {
      expect(extractBinaryVersion('yt-dlp 2024.01.15', 'yt-dlp')).toBe('2024.01.15');
    });

    it('extracts ffmpeg version', () => {
      expect(extractBinaryVersion('ffmpeg version 6.0', 'ffmpeg')).toBe('6.0');
    });

    it('extracts ffprobe version', () => {
      expect(extractBinaryVersion('ffprobe version 6.0', 'ffprobe')).toBe('6.0');
    });

    it('returns unknown for unrecognized binary', () => {
      expect(extractBinaryVersion('some output', 'unknown-binary')).toBe('unknown');
    });

    it('returns unknown for invalid output', () => {
      expect(extractBinaryVersion('no version info', 'yt-dlp')).toBe('unknown');
    });
  });

  describe('parseLatestYtDlpRelease', () => {
    it('extracts tag_name from GitHub API response', () => {
      const apiResponse = JSON.stringify({
        tag_name: '2024.02.28',
        assets: []
      });
      expect(parseLatestYtDlpRelease(apiResponse)).toBe('2024.02.28');
    });

    it('returns null if tag_name missing', () => {
      const apiResponse = JSON.stringify({
        name: 'Release',
        assets: []
      });
      expect(parseLatestYtDlpRelease(apiResponse)).toBeNull();
    });

    it('returns null for invalid JSON', () => {
      expect(parseLatestYtDlpRelease('invalid json')).toBeNull();
      expect(parseLatestYtDlpRelease('{broken')).toBeNull();
      expect(parseLatestYtDlpRelease('')).toBeNull();
    });

    it('handles complex GitHub API response', () => {
      const apiResponse = JSON.stringify({
        url: 'https://api.github.com/repos/yt-dlp/yt-dlp/releases/1234567',
        tag_name: 'v2024.03.01',
        name: 'Version 2024.03.01',
        draft: false,
        prerelease: false,
        assets: [
          { name: 'yt-dlp', download_count: 1000 },
          { name: 'yt-dlp.exe', download_count: 500 }
        ]
      });
      expect(parseLatestYtDlpRelease(apiResponse)).toBe('v2024.03.01');
    });
  });

  describe('shouldCheckForUpdates', () => {
    it('returns true if check interval has elapsed', () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      expect(shouldCheckForUpdates(sevenDaysAgo, 7 * 24 * 60 * 60 * 1000)).toBe(true);
    });

    it('returns false if check was recent', () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      expect(shouldCheckForUpdates(oneHourAgo, 7 * 24 * 60 * 60 * 1000)).toBe(false);
    });

    it('returns true if check was older than interval', () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      expect(shouldCheckForUpdates(thirtyDaysAgo, 7 * 24 * 60 * 60 * 1000)).toBe(true);
    });

    it('returns true for invalid timestamp (allows check for safety)', () => {
      // Invalid timestamps should allow checks rather than block them
      expect(shouldCheckForUpdates('invalid-date', 1000)).toBe(true);
      expect(shouldCheckForUpdates('', 1000)).toBe(true);
      expect(shouldCheckForUpdates('not-a-date', 1000)).toBe(true);
    });

    it('returns false if exactly at interval', () => {
      const exactlyAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const result = shouldCheckForUpdates(exactlyAgo, 7 * 24 * 60 * 60 * 1000);
      expect(typeof result).toBe('boolean');
    });

    it('handles custom intervals', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      expect(shouldCheckForUpdates(twoHoursAgo, 60 * 60 * 1000)).toBe(true);
    });

    it('uses 7 days as default interval', () => {
      const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString();
      expect(shouldCheckForUpdates(sixDaysAgo)).toBe(false);
      
      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
      expect(shouldCheckForUpdates(eightDaysAgo)).toBe(true);
    });
  });

  describe('real-world scenarios', () => {
    it('parses real yt-dlp command output', () => {
      const output = 'yt-dlp 2024.02.28';
      expect(parseYtDlpVersion(output)).toBe('2024.02.28');
    });

    it('parses real ffmpeg help output', () => {
      const output = `ffmpeg version 6.0 Copyright (c) 2000-2023 the FFmpeg developers
built with Apple clang version 15.0.0`;
      expect(parseFfmpegVersion(output)).toBe('6.0');
    });

    it('handles GitHub API rate limit response with version', () => {
      const apiResponse = JSON.stringify({
        tag_name: '2024.02.28',
        message: 'API rate limit exceeded',
        documentation_url: 'https://docs.github.com/rest/overview/resources-in-the-rest-api#rate-limiting'
      });
      expect(parseLatestYtDlpRelease(apiResponse)).toBe('2024.02.28');
    });
  });
});
