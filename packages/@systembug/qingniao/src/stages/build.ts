/**
 * 构建验证
 */

import { existsSync, readdirSync } from "fs";
import { join } from "path";
import { exec } from "../utils/exec";
import { readPackageJson } from "../utils/package";
import type { Context, PublishConfig } from "../types";

/**
 * 检查构建产物
 */
export function checkBuildArtifact(
    pkgPath: string,
    distPath?: string,
): {
    success: boolean;
    message?: string;
} {
    if (!distPath) {
        // 尝试从 package.json 推断
        const pkgJson = readPackageJson(pkgPath);
        if (pkgJson.main) {
            distPath = pkgJson.main;
        } else if (pkgJson.module) {
            distPath = pkgJson.module;
        } else if (pkgJson.exports) {
            // 尝试从 exports 推断
            const exports =
                typeof pkgJson.exports === "string"
                    ? pkgJson.exports
                    : pkgJson.exports["."] || pkgJson.exports["./"] || pkgJson.exports.default;
            if (typeof exports === "string") {
                distPath = exports;
            }
        }
    }

    if (!distPath) {
        // 默认检查 dist 目录
        distPath = "dist";
    }

    const fullPath = join(pkgPath, distPath);
    if (!existsSync(fullPath)) {
        return {
            success: false,
            message: `构建产物不存在: ${distPath}`,
        };
    }

    try {
        const stats = readdirSync(fullPath);
        if (stats.length === 0) {
            return {
                success: false,
                message: `构建产物为空: ${distPath}`,
            };
        }
    } catch (error: any) {
        return {
            success: false,
            message: `无法读取构建产物: ${distPath} - ${error.message}`,
        };
    }

    return { success: true };
}

/**
 * 执行构建步骤
 */
export async function executeBuildSteps(config: PublishConfig, context: Context): Promise<void> {
    const rootDir = context.rootDir;
    const buildSteps = config.build?.steps || [];

    if (buildSteps.length > 0) {
        for (const step of buildSteps) {
            if (step.condition && !step.condition(context)) {
                continue;
            }

            try {
                exec(step.command, {
                    cwd: step.cwd || rootDir,
                    silent: step.silent,
                });
            } catch (error: any) {
                if (step.skipOnError) {
                    // 跳过错误，继续执行
                } else {
                    throw new Error(`构建步骤失败: ${step.name} - ${error.message}`);
                }
            }
        }
    } else if (config.build?.useTurbo) {
        const turboTasks = config.build.turboTasks || ["build"];
        exec(`turbo build ${turboTasks.join(" ")}`, { cwd: rootDir });
    } else {
        const pmCommand =
            config.project?.packageManager === "pnpm"
                ? "pnpm"
                : config.project?.packageManager === "yarn"
                  ? "yarn"
                  : "npm";
        exec(`${pmCommand} run build`, { cwd: rootDir });
    }
}

/**
 * 验证构建产物
 */
export async function verifyArtifacts(config: PublishConfig, context: Context): Promise<void> {
    for (const pkg of context.packages) {
        const distPath = config.build?.artifactPaths?.[pkg.name];
        const result = checkBuildArtifact(pkg.path, distPath);

        if (!result.success) {
            if (config.build?.skipMissingArtifacts) {
                continue;
            } else {
                throw new Error(`包 ${pkg.name} 构建验证失败: ${result.message}`);
            }
        }
    }
}
