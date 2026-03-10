/**
 * Pure version parsing utilities
 * No Electron dependencies - fully testable
 */

/**
 * Parse yt-dlp version from command output
 * yt-dlp outputs version like "2024.01.01"
 */
export function parseYtDlpVersion(output: string): string {
  const match = output.match(/(\d{4}\.\d{2}\.\d{2})/);
  return match ? match[1] : 'unknown';
}

/**
 * Parse ffmpeg version from command output
 * ffmpeg outputs like "ffmpeg version N-113684-g1234abcd" or "ffmpeg version 6.0"
 */
export function parseFfmpegVersion(output: string): string {
  const match = output.match(/version\s+([^\s]+)/i);
  return match ? match[1] : 'unknown';
}

/**
 * Parse ffprobe version from command output
 * Same format as ffmpeg
 */
export function parseFfprobeVersion(output: string): string {
  const match = output.match(/version\s+([^\s]+)/i);
  return match ? match[1] : 'unknown';
}

/**
 * Extract binary version based on binary name
 */
export function extractBinaryVersion(output: string, binaryName: string): string {
  if (binaryName === 'yt-dlp') {
    return parseYtDlpVersion(output);
  } else if (binaryName === 'ffmpeg' || binaryName === 'ffprobe') {
    return parseFfmpegVersion(output);
  }
  return 'unknown';
}

/**
 * Parse GitHub API response for latest yt-dlp release
 */
export function parseLatestYtDlpRelease(jsonData: string): string | null {
  try {
    const release = JSON.parse(jsonData);
    return release.tag_name || null;
  } catch (error) {
    return null;
  }
}

/**
 * Check if version check interval has elapsed
 * @param lastCheckedTime ISO string of last check
 * @param intervalMs interval in milliseconds (default: 7 days)
 */
export function shouldCheckForUpdates(lastCheckedTime: string, intervalMs: number = 7 * 24 * 60 * 60 * 1000): boolean {
  try {
    const lastChecked = new Date(lastCheckedTime);
    const timeSinceCheck = Date.now() - lastChecked.getTime();
    // If parsing resulted in NaN or negative time, allow check (return true)
    if (isNaN(timeSinceCheck) || timeSinceCheck < 0) {
      return true;
    }
    return timeSinceCheck >= intervalMs;
  } catch (error) {
    return true; // If parsing fails, allow check
  }
}
