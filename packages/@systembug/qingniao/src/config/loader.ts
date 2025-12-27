/**
 * 配置加载器
 * 支持多种配置文件格式和零配置自动推断
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { PublishConfig } from '../types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 查找配置文件
 */
export function findConfigFile(rootDir: string): string | null {
    const configNames = [
        'qingniao.config.ts',
        'qingniao.config.mjs',
        'qingniao.config.js',
        'qingniao.config.json',
        'publish.config.ts',
        'publish.config.mjs',
        'publish.config.js',
        'publish.config.json',
    ];

    for (const name of configNames) {
        const path = join(rootDir, name);
        if (existsSync(path)) {
            return path;
        }
    }

    return null;
}

/**
 * 从 package.json 加载配置
 */
export function loadConfigFromPackageJson(rootDir: string): Partial<PublishConfig> | null {
    const packageJsonPath = join(rootDir, 'package.json');
    if (!existsSync(packageJsonPath)) {
        return null;
    }

    try {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        return packageJson.qingniao || null;
    } catch {
        return null;
    }
}

/**
 * 加载配置文件
 */
export async function loadConfig(configPath?: string): Promise<PublishConfig> {
    const rootDir = process.cwd();
    
    // 如果指定了配置文件路径，直接加载
    if (configPath) {
        // TODO: 实现配置文件加载
        throw new Error('配置文件加载功能开发中');
    }

    // 查找配置文件
    const foundConfigPath = findConfigFile(rootDir);
    if (foundConfigPath) {
        // TODO: 实现配置文件加载
        throw new Error('配置文件加载功能开发中');
    }

    // 从 package.json 加载
    const packageConfig = loadConfigFromPackageJson(rootDir);
    if (packageConfig) {
        // TODO: 合并配置
    }

    // 零配置：返回空配置，由自动检测填充
    return {} as PublishConfig;
}

