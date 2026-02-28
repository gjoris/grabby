import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

export class LogService {
  private static logDir: string;
  private static currentLogFile: string | null = null;
  private static appLogFile: string | null = null;

  static initialize(): void {
    this.logDir = path.join(app.getPath('userData'), 'logs');
    
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }

    // Initialize application log
    this.initializeAppLog();

    // Clean up old logs (keep last 30 days)
    this.cleanOldLogs();
  }

  private static initializeAppLog(): void {
    const date = new Date().toISOString().split('T')[0];
    const logFileName = `app-${date}.log`;
    this.appLogFile = path.join(this.logDir, logFileName);
    
    // Get app version
    const packageJson = require('../../../package.json');
    const appVersion = packageJson.version;
    
    // Only write header if file doesn't exist
    if (!fs.existsSync(this.appLogFile)) {
      const header = this.formatLogLine('INFO', '='.repeat(80));
      const startLine = this.formatLogLine('INFO', `Application started - Grabby v${appVersion}`);
      const separator = this.formatLogLine('INFO', '='.repeat(80));
      
      fs.writeFileSync(this.appLogFile, `${header}${startLine}${separator}`);
    } else {
      // Append session start to existing log
      const sessionStart = this.formatLogLine('INFO', `New session started (v${appVersion})`);
      fs.appendFileSync(this.appLogFile, sessionStart);
    }

    // Redirect console.log and console.error to app log
    const originalLog = console.log;
    const originalError = console.error;

    console.log = (...args: any[]) => {
      originalLog(...args);
      this.appLog(args.join(' '), 'info');
    };

    console.error = (...args: any[]) => {
      originalError(...args);
      this.appLog(args.join(' '), 'error');
    };

    // Log uncaught exceptions
    process.on('uncaughtException', (error) => {
      this.appLog(`Uncaught Exception: ${error.message}\n${error.stack}`, 'error');
    });

    process.on('unhandledRejection', (reason) => {
      this.appLog(`Unhandled Rejection: ${reason}`, 'error');
    });
  }

  static appLog(message: string, type: 'info' | 'error' | 'warn' = 'info'): void {
    if (!this.appLogFile) {
      this.initializeAppLog();
    }

    const formattedLine = this.formatLogLine(type.toUpperCase(), message);
    
    try {
      fs.appendFileSync(this.appLogFile!, formattedLine);
    } catch (error) {
      // Fallback to console if file write fails
      console.error('Failed to write to app log file:', error);
    }
  }

  static startDownloadLog(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logFileName = `download-${timestamp}.log`;
    this.currentLogFile = path.join(this.logDir, logFileName);
    
    const header = this.formatLogLine('INFO', '='.repeat(80));
    const startLine = this.formatLogLine('INFO', `Download session started`);
    const separator = this.formatLogLine('INFO', '='.repeat(80));
    
    fs.writeFileSync(this.currentLogFile, `${header}${startLine}${separator}`);
    
    // Also log to app log
    this.appLog(`Download session started: ${logFileName}`, 'info');
    
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
    
    // Also log to app log
    this.appLog(`Download session ${success ? 'completed' : 'failed'}`, success ? 'info' : 'error');
    
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
          this.appLog(`Deleted old log file: ${file}`, 'info');
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

  static getLogStats(): { count: number; sizeBytes: number; sizeMB: string } {
    try {
      const files = fs.readdirSync(this.logDir);
      let totalSize = 0;
      let count = 0;

      files.forEach(file => {
        const filePath = path.join(this.logDir, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
        count++;
      });

      return {
        count,
        sizeBytes: totalSize,
        sizeMB: (totalSize / (1024 * 1024)).toFixed(2)
      };
    } catch (error) {
      console.error('Failed to get log stats:', error);
      return { count: 0, sizeBytes: 0, sizeMB: '0.00' };
    }
  }

  static clearAllLogs(): boolean {
    try {
      const files = fs.readdirSync(this.logDir);
      
      files.forEach(file => {
        const filePath = path.join(this.logDir, file);
        fs.unlinkSync(filePath);
      });

      this.appLog('All logs cleared by user', 'info');
      
      // Reinitialize app log after clearing
      this.appLogFile = null;
      this.initializeAppLog();
      
      return true;
    } catch (error) {
      console.error('Failed to clear logs:', error);
      return false;
    }
  }
}
