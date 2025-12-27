/**
 * 执行上下文
 */

import type { Context, PublishConfig, PackageInfo } from "../types";

/**
 * 创建执行上下文
 */
export function createContext(
    config: PublishConfig,
    packages: PackageInfo[],
    rootDir: string = process.cwd(),
): Context {
    return {
        config,
        packages,
        rootDir,
    };
}
