/**
 * 配置加载器
 * 支持多种配置文件格式和零配置自动推断
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import type { PublishConfig } from "../types";
import {
    detectPackageManager,
    detectWorkspace,
    detectChangeset,
    detectTurbo,
    detectGitBranch,
} from "../utils/auto-detect";

/**
 * 查找配置文件
 */
export function findConfigFile(rootDir: string): string | null {
    const configNames = [
        "qingniao.config.ts",
        "qingniao.config.mjs",
        "qingniao.config.js",
        "qingniao.config.json",
        "publish.config.ts",
        "publish.config.mjs",
        "publish.config.js",
        "publish.config.json",
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
    const packageJsonPath = join(rootDir, "package.json");
    if (!existsSync(packageJsonPath)) {
        return null;
    }

    try {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
        return packageJson.qingniao || null;
    } catch {
        return null;
    }
}

/**
 * 自动检测并填充配置
 */
function autoDetectConfig(rootDir: string): Partial<PublishConfig> {
    const packageManager = detectPackageManager(rootDir);
    const workspace = detectWorkspace(rootDir);
    const hasChangeset = detectChangeset(rootDir);
    const hasTurbo = detectTurbo(rootDir);
    const gitBranch = detectGitBranch();

    const config: Partial<PublishConfig> = {
        project: {
            packageManager,
        },
        git: {
            branch: gitBranch || "main",
            tagPrefix: "v",
        },
        version: {
            strategy: hasChangeset ? "changeset" : "manual",
            syncAll: true,
            syncWorkspaceDeps: true,
        },
        build: {
            useTurbo: hasTurbo,
            turboTasks: hasTurbo ? ["build"] : undefined,
        },
        workspace: workspace.type
            ? {
                  enabled: true,
                  configPath: workspace.configPath,
              }
            : undefined,
    };

    if (hasChangeset) {
        const pmCommand =
            packageManager === "pnpm" ? "pnpm" : packageManager === "yarn" ? "yarn" : "npm";
        config.changeset = {
            enabled: true,
            versionCommand: `${pmCommand} changeset:version`,
            publishCommand: `${pmCommand} changeset:publish`,
        };
    }

    return config;
}

/**
 * 深度合并配置
 */
function deepMerge(target: any, source: any): any {
    const output = { ...target };
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach((key) => {
            if (isObject(source[key])) {
                if (!(key in target)) {
                    Object.assign(output, { [key]: source[key] });
                } else {
                    output[key] = deepMerge(target[key], source[key]);
                }
            } else {
                Object.assign(output, { [key]: source[key] });
            }
        });
    }
    return output;
}

function isObject(item: any): boolean {
    return item && typeof item === "object" && !Array.isArray(item);
}

/**
 * 加载配置文件
 */
export async function loadConfig(configPath?: string): Promise<PublishConfig> {
    const rootDir = process.cwd();
    let config: Partial<PublishConfig> = {};

    // 1. 零配置自动检测（基础配置）
    config = deepMerge(config, autoDetectConfig(rootDir));

    // 2. 从 package.json 加载配置（覆盖自动检测）
    const packageConfig = loadConfigFromPackageJson(rootDir);
    if (packageConfig) {
        config = deepMerge(config, packageConfig);
    }

    // 3. 查找配置文件（覆盖 package.json）
    const foundConfigPath = configPath || findConfigFile(rootDir);
    if (foundConfigPath && existsSync(foundConfigPath)) {
        try {
            if (foundConfigPath.endsWith(".json")) {
                const fileConfig = JSON.parse(readFileSync(foundConfigPath, "utf-8"));
                config = deepMerge(config, fileConfig);
            }
            // TODO: 支持 .js/.mjs/.ts 配置文件
        } catch (error) {
            throw new Error(`无法加载配置文件 ${foundConfigPath}: ${error}`);
        }
    }

    return config as PublishConfig;
}
