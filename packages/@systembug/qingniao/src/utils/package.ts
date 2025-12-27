/**
 * 包管理工具
 */

import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";
import { execSilent } from "./exec";
import type { PackageInfo } from "../types";

/**
 * 读取 package.json
 */
export function readPackageJson(path: string): any {
    const packageJsonPath = join(path, "package.json");
    if (!existsSync(packageJsonPath)) {
        return null;
    }

    try {
        return JSON.parse(readFileSync(packageJsonPath, "utf-8"));
    } catch {
        return null;
    }
}

/**
 * 发现所有包（使用 pnpm list，包括私有包）
 */
export async function discoverAllPackagesWithPnpm(rootDir: string): Promise<PackageInfo[]> {
    try {
        const output = execSilent("pnpm list -r --depth -1 --json");
        if (!output) return [];

        const packages: PackageInfo[] = [];
        const list = JSON.parse(output);

        // pnpm list 返回的是数组或对象，需要处理
        const processItem = (item: any) => {
            if (item.name && item.path) {
                const pkgJson = readPackageJson(item.path);
                if (pkgJson) {
                    packages.push({
                        name: item.name,
                        version: pkgJson.version || "0.0.0",
                        path: item.path,
                        private: pkgJson.private || false,
                    });
                }
            }
        };

        if (Array.isArray(list)) {
            list.forEach(processItem);
        } else if (list) {
            processItem(list);
        }

        return packages;
    } catch {
        return [];
    }
}

/**
 * 发现包（使用 pnpm list，仅可发布的包）
 */
export async function discoverPackagesWithPnpm(rootDir: string): Promise<PackageInfo[]> {
    const allPackages = await discoverAllPackagesWithPnpm(rootDir);
    // 过滤掉私有包
    return allPackages.filter((pkg) => !pkg.private);
}

/**
 * 发现所有包（使用模式匹配，包括私有包）
 */
export async function discoverAllPackagesWithPattern(
    rootDir: string,
    patterns: string[],
): Promise<PackageInfo[]> {
    const packages: PackageInfo[] = [];
    const packagesDir = join(rootDir, "packages");

    if (!existsSync(packagesDir)) {
        return [];
    }

    const dirs = readdirSync(packagesDir, { withFileTypes: true });

    for (const dir of dirs) {
        if (dir.isDirectory()) {
            const packagePath = join(packagesDir, dir.name);
            const pkgJson = readPackageJson(packagePath);

            if (pkgJson && pkgJson.name) {
                // 检查是否匹配模式
                const matches = patterns.some((pattern) => {
                    // 简单的 glob 匹配
                    const regex = new RegExp(pattern.replace(/\*/g, ".*").replace(/\//g, "\\/"));
                    return regex.test(pkgJson.name) || regex.test(packagePath);
                });

                if (matches || patterns.length === 0) {
                    packages.push({
                        name: pkgJson.name,
                        version: pkgJson.version || "0.0.0",
                        path: packagePath,
                        private: pkgJson.private || false,
                    });
                }
            }
        }
    }

    return packages;
}

/**
 * 发现包（使用模式匹配，仅可发布的包）
 */
export async function discoverPackagesWithPattern(
    rootDir: string,
    patterns: string[],
): Promise<PackageInfo[]> {
    const allPackages = await discoverAllPackagesWithPattern(rootDir, patterns);
    // 过滤掉私有包
    return allPackages.filter((pkg) => !pkg.private);
}
