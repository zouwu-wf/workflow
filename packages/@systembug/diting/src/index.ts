/**
 * @systembug/diting
 * 谛听 - 平台中立的日志库
 *
 * 春眠不觉晓，处处闻啼鸟。
 * 夜来风雨声，花落知多少。
 * —— 孟浩然《春晓》
 *
 * 生产环境下自动禁用日志输出
 */

import chalk from "chalk";
import pino from "pino";

/**
 * 日志级别
 */
export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    NONE = 4,
}

/**
 * 日志条目
 */
export interface LogEntry {
    level: LogLevel;
    message: string;
    timestamp: number;
    args?: any[];
    context?: string;
}

/**
 * 日志传输器接口
 */
export interface LogTransport {
    log(entry: LogEntry): void;
}

/**
 * Logger配置
 */
export interface LoggerConfig {
    /** 最小日志级别 */
    level?: LogLevel;
    /** 日志上下文（如模块名） */
    context?: string;
    /** 日志传输器 */
    transports?: LogTransport[];
    /** 是否启用时间戳 */
    enableTimestamp?: boolean;
    /** 是否为生产环境（生产环境下禁用日志） */
    isProduction?: boolean;
}

/**
 * 检测是否为生产环境
 */
function detectProduction(): boolean {
    // Node.js环境
    if (typeof process !== "undefined" && process.env) {
        return process.env.NODE_ENV === "production";
    }

    return false;
}

/**
 * Logger类
 */
export class Logger {
    private config: Required<LoggerConfig>;

    constructor(config: LoggerConfig = {}) {
        this.config = {
            level: LogLevel.INFO,
            context: "",
            transports: [new ConsoleTransport()],
            enableTimestamp: true,
            isProduction: config.isProduction ?? detectProduction(),
            ...config,
        };
    }

    /**
     * 记录debug日志
     */
    debug(message: string, ...args: any[]): void {
        this.log(LogLevel.DEBUG, message, ...args);
    }

    /**
     * 记录info日志
     */
    info(message: string, ...args: any[]): void {
        this.log(LogLevel.INFO, message, ...args);
    }

    /**
     * 记录warn日志
     */
    warn(message: string, ...args: any[]): void {
        this.log(LogLevel.WARN, message, ...args);
    }

    /**
     * 记录error日志
     */
    error(message: string, ...args: any[]): void {
        this.log(LogLevel.ERROR, message, ...args);
    }

    /**
     * 记录日志
     */
    private log(level: LogLevel, message: string, ...args: any[]): void {
        // 生产环境下禁用所有日志
        if (this.config.isProduction) {
            return;
        }

        if (level < this.config.level) {
            return;
        }

        const entry: LogEntry = {
            level,
            message,
            timestamp: this.config.enableTimestamp ? Date.now() : 0,
            args: args.length > 0 ? args : undefined,
            context: this.config.context || undefined,
        };

        for (const transport of this.config.transports) {
            transport.log(entry);
        }
    }

    /**
     * 设置日志级别
     */
    setLevel(level: LogLevel): void {
        this.config.level = level;
    }

    /**
     * 获取日志级别
     */
    getLevel(): LogLevel {
        return this.config.level;
    }

    /**
     * 检查是否为生产环境
     */
    isProduction(): boolean {
        return this.config.isProduction;
    }

    /**
     * 创建子Logger（带上下文）
     */
    child(context: string): Logger {
        return new Logger({
            ...this.config,
            context: this.config.context ? `${this.config.context}:${context}` : context,
        });
    }
}

/**
 * 控制台传输器（使用 chalk 进行彩色输出）
 */
export class ConsoleTransport implements LogTransport {
    /**
     * 获取日志级别的颜色
     */
    private getLevelColor(level: LogLevel): (text: string) => string {
        switch (level) {
            case LogLevel.DEBUG:
                return chalk.gray;
            case LogLevel.INFO:
                return chalk.blue;
            case LogLevel.WARN:
                return chalk.yellow;
            case LogLevel.ERROR:
                return chalk.red;
            default:
                return chalk.white;
        }
    }

    /**
     * 格式化日志级别名称
     */
    private formatLevelName(level: LogLevel): string {
        const levelName = LogLevel[level];
        const color = this.getLevelColor(level);
        return color(levelName.padEnd(5));
    }

    /**
     * 格式化时间戳
     */
    private formatTimestamp(timestamp: number): string {
        if (!timestamp) return "";
        const date = new Date(timestamp);
        return chalk.gray(date.toISOString());
    }

    /**
     * 格式化上下文
     */
    private formatContext(context?: string): string {
        if (!context) return "";
        return chalk.cyan(`[${context}]`);
    }

    log(entry: LogEntry): void {
        const levelName = this.formatLevelName(entry.level);
        const timestamp = this.formatTimestamp(entry.timestamp);
        const context = this.formatContext(entry.context);
        const parts = [timestamp, levelName, context].filter(Boolean);
        const prefix = parts.length > 0 ? parts.join(" ") + " " : "";

        const logFn = this.getLogFunction(entry.level);

        if (entry.args && entry.args.length > 0) {
            logFn(prefix + entry.message, ...entry.args);
        } else {
            logFn(prefix + entry.message);
        }
    }

    /**
     * 获取对应的 console 方法
     */
    private getLogFunction(level: LogLevel): (...args: any[]) => void {
        switch (level) {
            case LogLevel.DEBUG:
                return console.debug.bind(console);
            case LogLevel.INFO:
                return console.info.bind(console);
            case LogLevel.WARN:
                return console.warn.bind(console);
            case LogLevel.ERROR:
                return console.error.bind(console);
            default:
                return console.log.bind(console);
        }
    }
}

/**
 * Pino 传输器（用于结构化日志记录）
 */
export class PinoTransport implements LogTransport {
    private pinoLogger: pino.Logger;
    // 将 LogLevel 映射到 pino 的日志级别
    private readonly levelMap: Partial<Record<LogLevel, pino.Level>> = {
        [LogLevel.DEBUG]: "debug",
        [LogLevel.INFO]: "info",
        [LogLevel.WARN]: "warn",
        [LogLevel.ERROR]: "error",
    };

    constructor(options?: pino.LoggerOptions) {
        this.pinoLogger = pino({
            level: "debug", // 默认最低级别，由 Logger 类控制过滤
            ...options,
        });
    }

    log(entry: LogEntry): void {
        // NONE 级别不记录
        if (entry.level === LogLevel.NONE) {
            return;
        }

        const pinoLevel = this.levelMap[entry.level];
        if (!pinoLevel) {
            return;
        }
        const logData: any = {
            msg: entry.message,
        };

        if (entry.context) {
            logData.context = entry.context;
        }

        if (entry.timestamp) {
            logData.time = entry.timestamp;
        }

        // 合并额外的参数
        if (entry.args && entry.args.length > 0) {
            entry.args.forEach((arg, index) => {
                if (typeof arg === "object" && arg !== null && !Array.isArray(arg)) {
                    Object.assign(logData, arg);
                } else {
                    logData[`arg${index}`] = arg;
                }
            });
        }

        this.pinoLogger[pinoLevel](logData);
    }

    /**
     * 获取底层的 pino logger 实例
     */
    getPinoLogger(): pino.Logger {
        return this.pinoLogger;
    }
}

/**
 * 内存传输器（用于测试）
 */
export class MemoryTransport implements LogTransport {
    private entries: LogEntry[] = [];

    log(entry: LogEntry): void {
        this.entries.push(entry);
    }

    getEntries(): LogEntry[] {
        return this.entries;
    }

    clear(): void {
        this.entries = [];
    }
}

/**
 * 创建默认Logger
 */
export function createLogger(config?: LoggerConfig): Logger {
    return new Logger(config);
}

/**
 * 默认Logger实例
 */
export const defaultLogger = createLogger();
