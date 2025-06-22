/**
 * Simple logger utility for eQMS system
 * Logs messages with timestamp and severity level
 */
export class Logger {
  static info(message: string): void {
    console.log(`${new Date().toISOString()} [INFO]: ${message}`);
  }

  static warn(message: string): void {
    console.warn(`${new Date().toISOString()} [WARN]: ${message}`);
  }

  static error(message: string): void {
    console.error(`${new Date().toISOString()} [ERROR]: ${message}`);
  }

  static debug(message: string): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`${new Date().toISOString()} [DEBUG]: ${message}`);
    }
  }
}

export const logger = new Logger();