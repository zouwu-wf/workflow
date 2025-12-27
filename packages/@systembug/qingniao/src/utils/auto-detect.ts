/**
 * 零配置自动检测工具
 */

import { existsSync, readFileSync, readdirSync } from "fs";
import { join } from "path";
import { execSilent } from "./exec";

/**
 * 检测包管理器
 */
export function detectPackageManager(rootDir: string): "npm" | "pnpm" | "yarn" {
    // 检测 packageManager 字段
    const packageJsonPath = join(rootDir, "package.json");
    if (existsSync(packageJsonPath)) {
        try {
            const pkg = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
            if (pkg.packageManager) {
                if (pkg.packageManager.startsWith("pnpm")) return "pnpm";
                if (pkg.packageManager.startsWith("yarn")) return "yarn";
                if (pkg.packageManager.startsWith("npm")) return "npm";
            }
        } catch {
            // 忽略解析错误
        }
    }

    // 检测 lockfile
    if (existsSync(join(rootDir, "pnpm-lock.yaml"))) return "pnpm";
    if (existsSync(join(rootDir, "yarn.lock"))) return "yarn";
    if (existsSync(join(rootDir, "package-lock.json"))) return "npm";

    return "pnpm"; // 默认
}

/**
 * 检测 workspace 类型
 */
export function detectWorkspace(rootDir: string): {
    type: "pnpm" | "yarn" | "npm" | null;
    configPath?: string;
} {
    // 检测 pnpm workspace
    const pnpmWorkspacePath = join(rootDir, "pnpm-workspace.yaml");
    if (existsSync(pnpmWorkspacePath)) {
        return { type: "pnpm", configPath: "pnpm-workspace.yaml" };
    }

    // 检测 package.json workspaces
    const packageJsonPath = join(rootDir, "package.json");
    if (existsSync(packageJsonPath)) {
        try {
            const pkg = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
            if (pkg.workspaces) {
                return { type: "yarn", configPath: "package.json" };
            }
        } catch {
            // 忽略解析错误
        }
    }

    return { type: null };
}

/**
 * 检测 changeset
 */
export function detectChangeset(rootDir: string): boolean {
    return existsSync(join(rootDir, ".changeset"));
}

/**
 * 检测 Turbo
 */
export function detectTurbo(rootDir: string): boolean {
    return existsSync(join(rootDir, "turbo.json"));
}

/**
 * 检测 Git 分支
 */
export function detectGitBranch(): string | null {
    return execSilent("git branch --show-current");
}

/**
 * 检测是否有 changeset 文件
 */
export function hasChangesetFiles(rootDir: string): boolean {
    const changesetDir = join(rootDir, ".changeset");
    if (!existsSync(changesetDir)) {
        return false;
    }

    try {
        const files = readdirSync(changesetDir);
        // 排除 config.json 和 README.md
        const changesetFiles = files.filter((f) => f.endsWith(".md") && f !== "README.md");
        return changesetFiles.length > 0;
    } catch {
        return false;
    }
}
