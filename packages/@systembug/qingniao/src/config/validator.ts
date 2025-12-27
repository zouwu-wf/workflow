/**
 * 配置验证器
 */

import type { PublishConfig } from "../types";

/**
 * 验证配置
 */
export function validateConfig(_config: PublishConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // TODO: 实现配置验证逻辑

    return {
        valid: errors.length === 0,
        errors,
    };
}
