/**
 * Log levels supported by the logger
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

/**
 * Service for structured logging
 */
export class LoggingService {
  private minLevel: LogLevel;
  
  /**
   * Create a new logging service
   */
  constructor() {
    // Set default log level based on environment
    this.minLevel = process.env.NODE_ENV === 'production' 
      ? LogLevel.INFO 
      : LogLevel.DEBUG;
  }
  
  /**
   * Set the minimum log level
   * 
   * @param level The minimum level to log
   */
  public setLogLevel(level: LogLevel): void {
    this.minLevel = level;
  }
  
  /**
   * Check if a log level should be logged
   * 
   * @param level The log level to check
   * @returns True if the level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }
  
  /**
   * Format a log message
   * 
   * @param level The log level
   * @param message The message to log
   * @param context Optional context object
   * @returns Formatted log message
   */
  private formatLog(level: LogLevel, message: string, context?: any): string {
    const timestamp = new Date().toISOString();
    let formatted = `[${timestamp}] [${level}] ${message}`;
    
    if (context) {
      try {
        const contextStr = typeof context === 'string' 
          ? context 
          : JSON.stringify(context, this.safeStringify, 2);
        formatted += `\n${contextStr}`;
      } catch (e) {
        formatted += '\n[Context serialization failed]';
      }
    }
    
    return formatted;
  }
  
  /**
   * Safe stringify function to handle circular references
   */
  private safeStringify(key: string, value: any): any {
    if (typeof value === 'object' && value !== null) {
      if (this.seen.has(value)) {
        return '[Circular]';
      }
      this.seen.add(value);
    }
    return value;
  }
  
  // Set used to track circular references
  private seen = new Set();
  
  /**
   * Log a debug message
   * 
   * @param message The message to log
   * @param context Optional context object
   */
  public debug(message: string, context?: any): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatLog(LogLevel.DEBUG, message, context));
    }
  }
  
  /**
   * Log an info message
   * 
   * @param message The message to log
   * @param context Optional context object
   */
  public info(message: string, context?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(this.formatLog(LogLevel.INFO, message, context));
    }
  }
  
  /**
   * Log a warning message
   * 
   * @param message The message to log
   * @param context Optional context object
   */
  public warn(message: string, context?: any): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatLog(LogLevel.WARN, message, context));
    }
  }
  
  /**
   * Log an error message
   * 
   * @param message The message to log
   * @param error Optional error object
   * @param context Optional context object
   */
  public error(message: string, error?: any, context?: any): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const errorContext = error ? {
        message: error.message,
        stack: error.stack,
        ...(context || {})
      } : context;
      
      console.error(this.formatLog(LogLevel.ERROR, message, errorContext));
    }
  }
}

// Create a singleton instance
export const logger = new LoggingService();
