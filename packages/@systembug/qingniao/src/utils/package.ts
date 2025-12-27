/**
 * 包管理工具
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import type { PackageInfo } from '../types';

/**
 * 读取 package.json
 */
export function readPackageJson(path: string): any {
    const packageJsonPath = join(path, 'package.json');
    if (!existsSync(packageJsonPath)) {
        return null;
    }

    try {
        return JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    } catch {
        return null;
    }
}

/**
 * 发现包（使用 pnpm list）
 */
export async function discoverPackagesWithPnpm(rootDir: string): Promise<PackageInfo[]> {
    // TODO: 实现 pnpm list 命令调用
    return [];
}

/**
 * 发现包（使用模式匹配）
 */
export async function discoverPackagesWithPattern(
    rootDir: string,
    patterns: string[]
): Promise<PackageInfo[]> {
    // TODO: 实现模式匹配包发现
    return [];
}

