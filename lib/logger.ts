/**
 * Structured Logger with Audit Trail Support
 * Supports multiple log levels and optional external logging services
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'audit';
type LogContext = Record<string, unknown>;

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private logLevel: LogLevel;
  private logtailToken?: string;

  constructor() {
    this.logLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
    this.logtailToken = process.env.LOGTAIL_SOURCE_TOKEN;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'audit'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const requestedLevelIndex = levels.indexOf(level);
    
    return requestedLevelIndex >= currentLevelIndex;
  }

  private formatLog(entry: LogEntry): string {
    return JSON.stringify(entry, null, 2);
  }

  private async sendToLogtail(entry: LogEntry): Promise<void> {
    if (!this.logtailToken) {
      return;
    }

    try {
      await fetch('https://in.logtail.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.logtailToken}`,
        },
        body: JSON.stringify(entry),
      });
    } catch (error) {
      // Fail silently to not interrupt app flow
      console.error('Failed to send log to Logtail:', error);
    }
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...(context && { context }),
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      }),
    };

    const formatted = this.formatLog(entry);

    switch (level) {
      case 'error':
        console.error(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      default:
        console.log(formatted);
    }

    // Send to external logging service
    void this.sendToLogtail(entry);
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, error: Error, context?: LogContext): void {
    this.log('error', message, context, error);
  }

  audit(action: string, entity: string, details: LogContext): void {
    this.log('audit', `${action} on ${entity}`, details);
  }
}

export const logger = new Logger();

