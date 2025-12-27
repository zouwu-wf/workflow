/**
 * 钩子系统
 */

import type { Context, PublishConfig } from '../types';

/**
 * 执行钩子函数
 */
export async function executeHook(
    hookName: keyof NonNullable<PublishConfig['hooks']>,
    context: Context
): Promise<void> {
    const hook = context.config.hooks?.[hookName];
    if (hook) {
        await hook(context);
    }
}

