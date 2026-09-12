/**
 * Monitoring Module
 * 
 * Centralizes logging, metrics collection, and error handling across the application.
 * This provides a unified interface for:
 * 1. Logging (structured JSON logs)
 * 2. Performance metrics and instrumentation
 * 3. Error tracking
 * 4. Alert notifications
 */

// Define log levels
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';

// Define log entry structure
export interface LogEntry {
  timestamp?: string;
  level: LogLevel;
  message: string;
  traceId?: string;
  component?: string;
  [key: string]: any; // Additional context fields
}

/**
 * Custom logger with structured output
 */
class Logger {
  private env: string;
  
  constructor() {
    this.env = process.env.NODE_ENV || 'development';
  }
  
  /**
   * Log a message at the specified level
   */
  private log(level: LogLevel, message: string, context: Record<string, any> = {}): void {
    const timestamp = new Date().toISOString();
    const logEntry: LogEntry = {
      timestamp,
      level,
      message,
      ...context
    };
    
    // In production, we might use a more sophisticated logging service
    if (this.env === 'production') {
      // Send logs to a service like DataDog, Sentry, or CloudWatch
      // For now, just stringify the JSON nicely for console
      console[level === 'critical' ? 'error' : level](JSON.stringify(logEntry));
    } else {
      // In development, make logs more readable
      console[level === 'critical' ? 'error' : level](`[${level.toUpperCase()}] ${message}`, context);
    }
  }
  
  debug(messageOrEntry: string | Omit<LogEntry, 'level'>, context: Record<string, any> = {}): void {
    if (typeof messageOrEntry === 'string') {
      this.log('debug', messageOrEntry, context);
    } else {
      this.log('debug', messageOrEntry.message, { ...messageOrEntry, message: undefined });
    }
  }
  
  info(messageOrEntry: string | Omit<LogEntry, 'level'>, context: Record<string, any> = {}): void {
    if (typeof messageOrEntry === 'string') {
      this.log('info', messageOrEntry, context);
    } else {
      this.log('info', messageOrEntry.message, { ...messageOrEntry, message: undefined });
    }
  }
  
  warn(messageOrEntry: string | Omit<LogEntry, 'level'>, context: Record<string, any> = {}): void {
    if (typeof messageOrEntry === 'string') {
      this.log('warn', messageOrEntry, context);
    } else {
      this.log('warn', messageOrEntry.message, { ...messageOrEntry, message: undefined });
    }
  }
  
  error(messageOrEntry: string | Omit<LogEntry, 'level'>, context: Record<string, any> = {}): void {
    if (typeof messageOrEntry === 'string') {
      this.log('error', messageOrEntry, context);
    } else {
      this.log('error', messageOrEntry.message, { ...messageOrEntry, message: undefined });
    }
  }
  
  critical(messageOrEntry: string | Omit<LogEntry, 'level'>, context: Record<string, any> = {}): void {
    if (typeof messageOrEntry === 'string') {
      this.log('critical', messageOrEntry, context);
    } else {
      this.log('critical', messageOrEntry.message, { ...messageOrEntry, message: undefined });
    }
    
    // For critical errors, we might want to send immediate notifications
    this.sendAlert(typeof messageOrEntry === 'string' ? messageOrEntry : messageOrEntry.message, context);
  }
  
  /**
   * Send an immediate alert for critical issues
   */
  private sendAlert(message: string, context: Record<string, any> = {}): void {
    // In a real system, this would send alerts to Slack, email, PagerDuty, etc.
    // For now, just log the alert
    console.error('🚨 CRITICAL ALERT:', message, context);
  }
}

// Metrics tracking
export interface Metric {
  name: string;
  value: number;
  tags?: Record<string, string>;
  timestamp?: number;
}

/**
 * Track and report metrics
 */
class MetricsCollector {
  private metrics: Metric[] = [];
  
  /**
   * Record a metric
   */
  record(name: string, value: number, tags: Record<string, string> = {}): void {
    this.metrics.push({
      name,
      value,
      tags,
      timestamp: Date.now()
    });
    
    // If we have too many metrics, flush them
    if (this.metrics.length > 100) {
      this.flush();
    }
  }
  
  /**
   * Flush metrics to monitoring system
   */
  flush(): void {
    if (this.metrics.length === 0) return;
    
    // In production, send metrics to a monitoring system
    // For now, just log them
    if (process.env.NODE_ENV === 'production') {
      // Send to monitoring system
      console.debug(`Flushing ${this.metrics.length} metrics...`);
    }
    
    this.metrics = [];
  }
  
  /**
   * Track timing for a function
   */
  async time<T>(name: string, fn: () => Promise<T>, tags: Record<string, string> = {}): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.record(`${name}_duration_ms`, duration, tags);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.record(`${name}_error_duration_ms`, duration, { ...tags, status: 'error' });
      throw error;
    }
  }
}

// Error tracking
export async function logError(component: string, error: any, context: Record<string, any> = {}): Promise<void> {
  logger.error({
    message: error?.message || 'Unknown error',
    component,
    stack: error?.stack,
    ...context
  });
  
  // In production, we'd also send to an error tracking service like Sentry
  if (process.env.NODE_ENV === 'production') {
    // Send to error tracking service
  }
}

// Performance instrumentation
export async function instrumentStep<T>(fn: () => Promise<T>, name: string): Promise<T> {
  return metrics.time(name, fn);
}

// Export singleton instances
export const logger = new Logger();
export const metrics = new MetricsCollector();

// Auto-flush metrics on exit
if (typeof process !== 'undefined') {
  process.on('beforeExit', () => {
    metrics.flush();
  });
}
