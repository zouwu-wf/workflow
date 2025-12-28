/**
 * 版本管理
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { exec, execSilent } from "../utils/exec";
import type { Context, PublishConfig } from "../types";
import { discoverAllPackagesWithPnpm, discoverAllPackagesWithPattern } from "../utils/package";

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

    // 更新所有包的 package.json（包括所有 workspace 包，无论是否有 version 字段）
    for (const pkg of packages) {
        const packageJsonPath = join(pkg.path, "package.json");
        if (existsSync(packageJsonPath)) {
            try {
                const pkgJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
                // 更新版本号（即使原来没有 version 字段，也添加它）
                pkgJson.version = newVersion;
                writeFileSync(packageJsonPath, JSON.stringify(pkgJson, null, 2) + "\n", "utf-8");
            } catch {
                // 忽略无效的 package.json
            }
        }
    }

    return newVersion;
}

/**
 * 基于 Conventional Commits 自动检测版本类型
 * 从上次 tag 到当前 HEAD 的 commits 中分析版本类型
 */
export function detectVersionTypeFromCommits(_rootDir: string): "major" | "minor" | "patch" {
    // 获取最新的 tag
    const latestTag = execSilent("git describe --tags --abbrev=0 2>/dev/null");
    const since = latestTag ? `${latestTag}..HEAD` : "HEAD";

    // 获取所有 commits
    const commits = execSilent(`git log ${since} --pretty=format:"%s%n%b" 2>/dev/null`) || "";

    if (!commits.trim()) {
        // 没有新的 commits，返回 patch
        return "patch";
    }

    let hasBreaking = false;
    let hasFeature = false;
    let hasFix = false;

    // 分析每个 commit
    const commitLines = commits.split("\n");
    for (const line of commitLines) {
        const trimmed = line.trim();

        // 检查 BREAKING CHANGE
        if (
            trimmed.includes("BREAKING CHANGE") ||
            trimmed.includes("BREAKING:") ||
            trimmed.match(/^[^:]+!:/) // 例如: feat!: breaking change
        ) {
            hasBreaking = true;
            break; // 一旦发现 breaking change，直接返回 major
        }

        // 检查 feature (feat:)
        if (trimmed.match(/^feat(\(.+\))?:/i)) {
            hasFeature = true;
        }

        // 检查 fix (fix:)
        if (trimmed.match(/^fix(\(.+\))?:/i)) {
            hasFix = true;
        }
    }

    // 优先级：breaking > feature > fix > patch
    if (hasBreaking) {
        return "major";
    } else if (hasFeature) {
        return "minor";
    } else if (hasFix) {
        return "patch";
    } else {
        // 默认返回 patch
        return "patch";
    }
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
            ? "pnpm exec"
            : config.project?.packageManager === "yarn"
              ? "yarn"
              : "npx";

    const command = config.changeset?.versionCommand || `${pmCommand} changeset version`;

    exec(command, { cwd: rootDir });

    // 获取更新后的版本
    return getCurrentVersion(rootDir);
}

/**
 * 使用 semver 策略自动更新版本（基于 Conventional Commits）
 */
export async function bumpVersionWithSemver(
    rootDir: string,
    config: PublishConfig,
): Promise<string> {
    // 自动检测版本类型
    const versionType = detectVersionTypeFromCommits(rootDir);

    // 发现所有 workspace 包
    const allPackages = await discoverAllWorkspacePackages(rootDir, config);

    // 执行版本更新
    return bumpVersion(rootDir, versionType, allPackages);
}

/**
 * 发现所有 workspace 包（包括私有包，但排除根目录），用于版本更新
 */
export async function discoverAllWorkspacePackages(
    rootDir: string,
    config: PublishConfig,
): Promise<Array<{ name: string; version: string; path: string; private: boolean }>> {
    const workspace = config.workspace;
    let allPackages: Array<{ name: string; version: string; path: string; private: boolean }> = [];

    let rawPackages;
    if (workspace?.enabled) {
        rawPackages = await discoverAllPackagesWithPnpm(rootDir);
    } else if (config.packages?.pattern) {
        const patterns = Array.isArray(config.packages.pattern)
            ? config.packages.pattern
            : [config.packages.pattern];
        rawPackages = await discoverAllPackagesWithPattern(rootDir, patterns);
    } else {
        // 默认使用 pnpm workspace
        rawPackages = await discoverAllPackagesWithPnpm(rootDir);
    }

    // 转换为正确的类型，确保 private 字段是 boolean
    allPackages = rawPackages.map((pkg) => ({
        name: pkg.name,
        version: pkg.version,
        path: pkg.path,
        private: pkg.private || false,
    }));

    // 排除根目录的包（根目录的 package.json 会单独更新）
    return allPackages.filter((pkg) => {
        // 标准化路径进行比较
        const normalizedPkgPath = pkg.path.replace(/\/$/, "");
        const normalizedRootDir = rootDir.replace(/\/$/, "");
        return normalizedPkgPath !== normalizedRootDir;
    });
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

    // 如果提供了 versionType，优先使用手动更新（无论配置中的策略是什么）
    if (versionType) {
        // 发现所有 workspace 包（包括私有包）用于版本更新
        const allPackages = await discoverAllWorkspacePackages(rootDir, config);
        const newVersion = bumpVersion(rootDir, versionType, allPackages);
        return newVersion;
    }

    // 如果没有提供 versionType，则根据配置的策略执行
    if (strategy === "changeset") {
        return await bumpVersionWithChangeset(rootDir, config);
    } else if (strategy === "semver") {
        return await bumpVersionWithSemver(rootDir, config);
    } else if (strategy === "manual") {
        throw new Error("手动更新策略需要提供版本类型 (major/minor/patch)");
    } else {
        throw new Error("版本更新策略未指定或无效");
    }
}
