/**
 * Logger Utility
 * Provides standardized logging with environment-based log levels
 */

enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

class Logger {
  private level: LogLevel;
  private prefix: string;

  constructor(level: LogLevel = LogLevel.INFO, prefix: string = '') {
    this.level = level;
    this.prefix = prefix ? `[${prefix}] ` : '';
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.level;
  }

  private formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `${timestamp} ${level} ${this.prefix}${message}`;
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.formatMessage('[DEBUG]', message), ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage('[INFO]', message), ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage('[WARN]', message), ...args);
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage('[ERROR]', message), ...args);
    }
  }

  // Create a child logger with a specific prefix
  child(prefix: string): Logger {
    return new Logger(this.level, prefix);
  }
}

// Create default logger instance
// In development, show all logs. In production, only show warnings and errors.
const defaultLogLevel = import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.WARN;

export const logger = new Logger(defaultLogLevel);

// Named loggers for different modules
export const authLogger = logger.child('Auth');
export const facilityLogger = logger.child('Facility');
export const mapLogger = logger.child('Map');
export const apiLogger = logger.child('API');

// Re-export LogLevel for configuration
export { LogLevel };

// Default export
export default logger;
