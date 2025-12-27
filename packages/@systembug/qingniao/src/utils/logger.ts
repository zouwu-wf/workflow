/**
 * 日志工具 - 基于 ink
 * 使用 ink 统一所有输出，包括日志消息
 */

import { Box, Text } from "ink";
import React from "react";
import { render } from "ink";

export interface Logger {
    info(message: string, ...args: any[]): void;
    success(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string | Error, ...args: any[]): void;
    debug(message: string, ...args: any[]): void;
    child(bindings: Record<string, any>): Logger;
}

/**
 * 创建日志器
 */
export function createLogger(
    options: {
        verbose?: boolean;
        silent?: boolean;
        pretty?: boolean;
    } = {},
): Logger {
    const { verbose = false, silent = false } = options;

    // 简单的控制台输出（非交互式场景）
    const logger: Logger = {
        info: (message: string, ...args: any[]) => {
            if (silent) return;
            console.log(`ℹ ${message}`, ...args);
        },
        success: (message: string, ...args: any[]) => {
            if (silent) return;
            console.log(`✓ ${message}`, ...args);
        },
        warn: (message: string, ...args: any[]) => {
            if (silent) return;
            console.warn(`⚠ ${message}`, ...args);
        },
        error: (message: string | Error, ...args: any[]) => {
            if (silent) return;
            if (message instanceof Error) {
                const error = message;
                console.error(`✗ ${error.message}`);
                if (verbose && error.stack) {
                    console.error(error.stack);
                }
            } else {
                console.error(`✗ ${message}`, ...args);
            }
        },
        debug: (message: string, ...args: any[]) => {
            if (silent || !verbose) return;
            console.debug(`🐛 ${message}`, ...args);
        },
        child: (bindings: Record<string, any>) => {
            // 子 logger 继承父 logger 的配置
            return createLogger(options);
        },
    };

    return logger;
}
