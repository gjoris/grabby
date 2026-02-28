import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

export class LogService {
  private static logDir: string;
  private static currentLogFile: string | null = null;

  static initialize(): void {
    this.logDir = path.join(app.getPath('userData'), 'logs');
    
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }

    // Clean up old logs (keep last 30 days)
    this.cleanOldLogs();
  }

  static startDownloadLog(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logFileName = `download-${timestamp}.log`;
    this.currentLogFile = path.join(this.logDir, logFileName);
    
    const header = this.formatLogLine('INFO', '='.repeat(80));
    const startLine = this.formatLogLine('INFO', `Download session started`);
    const separator = this.formatLogLine('INFO', '='.repeat(80));
    
    fs.writeFileSync(this.currentLogFile, `${header}${startLine}${separator}`);
    
    return this.currentLogFile;
  }

  static log(message: string, type: 'info' | 'error' = 'info'): void {
    if (!this.currentLogFile) {
      this.startDownloadLog();
    }

    // Split multi-line messages and format each line
    const lines = message.split('\n');
    const formattedLines = lines
      .filter(line => line.trim())
      .map(line => this.formatLogLine(type.toUpperCase(), line))
      .join('');
    
    try {
      fs.appendFileSync(this.currentLogFile!, formattedLines);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  static endDownloadLog(success: boolean): void {
    if (!this.currentLogFile) return;

    const separator = this.formatLogLine('INFO', '='.repeat(80));
    const endLine = this.formatLogLine('INFO', `Download session ${success ? 'completed successfully' : 'failed'}`);
    const footer = this.formatLogLine('INFO', '='.repeat(80));
    
    fs.appendFileSync(this.currentLogFile, `${separator}${endLine}${footer}\n`);
    
    this.currentLogFile = null;
  }

  private static formatLogLine(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    const paddedLevel = level.padEnd(5, ' ');
    return `${timestamp} [${paddedLevel}] ${message}\n`;
  }

  static getLogDirectory(): string {
    return this.logDir;
  }

  private static cleanOldLogs(): void {
    try {
      const files = fs.readdirSync(this.logDir);
      const now = Date.now();
      const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

      files.forEach(file => {
        const filePath = path.join(this.logDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtimeMs < thirtyDaysAgo) {
          fs.unlinkSync(filePath);
        }
      });
    } catch (error) {
      console.error('Failed to clean old logs:', error);
    }
  }

  static getRecentLogs(limit: number = 10): string[] {
    try {
      const files = fs.readdirSync(this.logDir);
      
      return files
        .filter(file => file.startsWith('download-') && file.endsWith('.log'))
        .map(file => ({
          name: file,
          path: path.join(this.logDir, file),
          mtime: fs.statSync(path.join(this.logDir, file)).mtimeMs
        }))
        .sort((a, b) => b.mtime - a.mtime)
        .slice(0, limit)
        .map(file => file.path);
    } catch (error) {
      console.error('Failed to get recent logs:', error);
      return [];
    }
  }
}
