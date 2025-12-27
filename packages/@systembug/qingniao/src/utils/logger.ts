/**
 * 日志工具 - 基于 pino
 */

import pino from 'pino';
import type { Logger as PinoLogger } from 'pino';

export interface Logger {
    info(message: string, ...args: any[]): void;
    success(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
    debug(message: string, ...args: any[]): void;
    child(bindings: Record<string, any>): Logger;
}

/**
 * 创建日志器
 */
export function createLogger(options: {
    verbose?: boolean;
    silent?: boolean;
    pretty?: boolean;
} = {}): Logger {
    const { verbose = false, silent = false, pretty = true } = options;

    // 创建 pino logger
    const pinoLogger = pino({
        level: verbose ? 'debug' : silent ? 'silent' : 'info',
        transport: pretty && !silent
            ? {
                  target: 'pino-pretty',
                  options: {
                      colorize: true,
                      translateTime: 'HH:MM:ss',
                      ignore: 'pid,hostname',
                  },
              }
            : undefined,
    });

    // 包装为统一的 Logger 接口
    const logger: Logger = {
        info: (message: string, ...args: any[]) => {
            pinoLogger.info({ msg: message, args }, message);
        },
        success: (message: string, ...args: any[]) => {
            pinoLogger.info({ msg: message, args, type: 'success' }, `✓ ${message}`);
        },
        warn: (message: string, ...args: any[]) => {
            pinoLogger.warn({ msg: message, args }, message);
        },
        error: (message: string, ...args: any[]) => {
            pinoLogger.error({ msg: message, args }, message);
        },
        debug: (message: string, ...args: any[]) => {
            pinoLogger.debug({ msg: message, args }, message);
        },
        child: (bindings: Record<string, any>) => {
            return createLoggerFromPino(pinoLogger.child(bindings));
        },
    };

    return logger;
}

/**
 * 从 pino logger 创建 Logger 接口
 */
function createLoggerFromPino(pinoLogger: PinoLogger): Logger {
    return {
        info: (message: string, ...args: any[]) => {
            pinoLogger.info({ msg: message, args }, message);
        },
        success: (message: string, ...args: any[]) => {
            pinoLogger.info({ msg: message, args, type: 'success' }, `✓ ${message}`);
        },
        warn: (message: string, ...args: any[]) => {
            pinoLogger.warn({ msg: message, args }, message);
        },
        error: (message: string, ...args: any[]) => {
            pinoLogger.error({ msg: message, args }, message);
        },
        debug: (message: string, ...args: any[]) => {
            pinoLogger.debug({ msg: message, args }, message);
        },
        child: (bindings: Record<string, any>) => {
            return createLoggerFromPino(pinoLogger.child(bindings));
        },
    };
}
