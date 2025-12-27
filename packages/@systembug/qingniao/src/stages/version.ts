/**
 * 版本管理
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { exec } from "../utils/exec";
import type { Context, PublishConfig } from "../types";

/**
 * 检测是否使用 changeset
 */
export function hasChangeset(rootDir: string): boolean {
    return existsSync(join(rootDir, ".changeset"));
}

/**
 * 获取当前版本
 */
export function getCurrentVersion(rootDir: string): string {
    const packageJsonPath = join(rootDir, "package.json");
    if (!existsSync(packageJsonPath)) {
        throw new Error("未找到 package.json");
    }

    const pkg = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
    return pkg.version || "0.0.0";
}

/**
 * 手动更新版本号（major, minor, patch）
 */
export function bumpVersion(
    rootDir: string,
    versionType: "major" | "minor" | "patch",
    packages: Array<{ path: string }>,
): string {
    const semver = /^(\d+)\.(\d+)\.(\d+)$/;

    // 读取根目录 package.json
    const rootPackageJsonPath = join(rootDir, "package.json");
    const rootPackageJson = JSON.parse(readFileSync(rootPackageJsonPath, "utf-8"));
    const currentVersion = rootPackageJson.version || "0.0.0";
    const match = currentVersion.match(semver);

    if (!match) {
        throw new Error(`无效的版本号格式: ${currentVersion}`);
    }

    let [, major, minor, patch] = match.map(Number);
    switch (versionType) {
        case "major":
            major++;
            minor = 0;
            patch = 0;
            break;
        case "minor":
            minor++;
            patch = 0;
            break;
        case "patch":
            patch++;
            break;
        default:
            throw new Error(`无效的版本类型: ${versionType}`);
    }

    const newVersion = `${major}.${minor}.${patch}`;

    // 更新根目录 package.json
    rootPackageJson.version = newVersion;
    writeFileSync(rootPackageJsonPath, JSON.stringify(rootPackageJson, null, 2) + "\n", "utf-8");

    // 更新所有包的 package.json
    for (const pkg of packages) {
        const packageJsonPath = join(pkg.path, "package.json");
        if (existsSync(packageJsonPath)) {
            try {
                const pkgJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
                if (pkgJson.version) {
                    pkgJson.version = newVersion;
                    writeFileSync(
                        packageJsonPath,
                        JSON.stringify(pkgJson, null, 2) + "\n",
                        "utf-8",
                    );
                }
            } catch {
                // 忽略无效的 package.json
            }
        }
    }

    return newVersion;
}

/**
 * 使用 changeset 更新版本
 */
export async function bumpVersionWithChangeset(
    rootDir: string,
    config: PublishConfig,
): Promise<string> {
    const pmCommand =
        config.project?.packageManager === "pnpm"
            ? "pnpm"
            : config.project?.packageManager === "yarn"
              ? "yarn"
              : "npm";

    const command = config.changeset?.versionCommand || `${pmCommand} changeset version`;

    exec(command, { cwd: rootDir });

    // 获取更新后的版本
    return getCurrentVersion(rootDir);
}

/**
 * 应用版本更新
 */
export async function applyVersionUpdate(
    config: PublishConfig,
    context: Context,
    versionType?: "major" | "minor" | "patch",
): Promise<string> {
    const rootDir = context.rootDir;
    const strategy = config.version?.strategy || "manual";

    if (strategy === "changeset") {
        return await bumpVersionWithChangeset(rootDir, config);
    } else if (strategy === "manual" && versionType) {
        const newVersion = bumpVersion(rootDir, versionType, context.packages);
        return newVersion;
    } else {
        throw new Error("版本更新策略未指定或无效");
    }
}
