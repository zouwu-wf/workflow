/**
 * NPM 发布
 */

import { exec, execSilent } from "../utils/exec";
import type { Context, PublishConfig } from "../types";

/**
 * 检查包是否已存在
 */
export function checkPackageExists(packageName: string, version: string): boolean {
    try {
        const info = execSilent(`npm view ${packageName}@${version} version 2>/dev/null`);
        return info === version;
    } catch {
        return false;
    }
}

/**
 * 发布包到 NPM（dry-run）
 */
export async function publishPackagesDryRun(
    config: PublishConfig,
    context: Context,
): Promise<void> {
    const pmCommand =
        config.project?.packageManager === "pnpm"
            ? "pnpm"
            : config.project?.packageManager === "yarn"
              ? "yarn"
              : "npm";

    if (config.changeset?.enabled) {
        // 使用 changeset publish --dry-run
        const command =
            config.changeset.publishCommand?.replace("publish", "publish --dry-run") ||
            `${pmCommand} changeset publish --dry-run`;
        exec(command, { cwd: context.rootDir });
    } else {
        // 对每个包执行 npm publish --dry-run
        for (const pkg of context.packages) {
            try {
                exec("npm publish --dry-run", { cwd: pkg.path });
            } catch (error: any) {
                throw new Error(`包 ${pkg.name} dry-run 失败: ${error.message}`);
            }
        }
    }
}

/**
 * 发布包到 NPM
 */
export async function publishPackages(config: PublishConfig, context: Context): Promise<void> {
    const pmCommand =
        config.project?.packageManager === "pnpm"
            ? "pnpm"
            : config.project?.packageManager === "yarn"
              ? "yarn"
              : "npm";

    // 检查已存在的包
    const existingPackages: Array<{ name: string; version: string }> = [];
    for (const pkg of context.packages) {
        if (checkPackageExists(pkg.name, pkg.version)) {
            existingPackages.push({ name: pkg.name, version: pkg.version });
        }
    }

    if (existingPackages.length > 0) {
        if (config.publish?.skipExisting) {
            // 跳过已存在的包
        } else {
            throw new Error("存在已发布的包版本，请更新版本号或设置 skipExisting: true");
        }
    }

    if (config.changeset?.enabled) {
        // 使用 changeset publish
        const command = config.changeset.publishCommand || `${pmCommand} changeset publish`;

        // 非静默模式，允许交互式输入 OTP
        exec(command, {
            cwd: context.rootDir,
            silent: false, // 显示输出，允许交互式输入
        });
    } else {
        // 逐个发布包
        for (const pkg of context.packages) {
            // 跳过已存在的包
            if (config.publish?.skipExisting && checkPackageExists(pkg.name, pkg.version)) {
                continue;
            }

            try {
                // 替换 workspace 协议
                if (config.publish?.replaceWorkspaceProtocols) {
                    // TODO: 实现 workspace 协议替换
                    // const pkgJsonPath = `${pkg.path}/package.json`;
                }

                exec("npm publish", {
                    cwd: pkg.path,
                    silent: false, // 允许交互式输入 OTP
                });
            } catch (error: any) {
                const errorMessage = error.message || String(error);
                if (
                    errorMessage.includes("OTP") ||
                    errorMessage.includes("one-time") ||
                    errorMessage.includes("Enter one-time password")
                ) {
                    throw error;
                } else {
                    throw new Error(`包 ${pkg.name} 发布失败: ${errorMessage}`);
                }
            }
        }
    }
}
