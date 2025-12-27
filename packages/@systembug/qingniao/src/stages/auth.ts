/**
 * NPM 认证检查
 */

import { execSilent } from "../utils/exec";

/**
 * 检查 NPM 认证状态
 */
export async function checkNpmAuth(): Promise<{ username: string; registry: string } | null> {
    const username = execSilent("npm whoami");
    if (!username) {
        return null;
    }

    const registry = execSilent("npm config get registry") || "https://registry.npmjs.org/";

    return {
        username,
        registry,
    };
}
