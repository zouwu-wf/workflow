/**
 * Git 状态检查
 */

import { execSilent } from '../utils/exec';

/**
 * 检查当前 Git 分支
 */
export function getCurrentBranch(): string | null {
    return execSilent('git branch --show-current');
}

/**
 * 检查是否有未提交的更改
 */
export function hasUncommittedChanges(): boolean {
    const status = execSilent('git status --porcelain');
    return status !== null && status.length > 0;
}

/**
 * 检查是否有未推送的提交
 */
export function hasUnpushedCommits(branch: string = 'main'): boolean {
    execSilent(`git fetch origin ${branch} 2>/dev/null`);
    const unpushed = execSilent(`git log origin/${branch}..HEAD 2>/dev/null`);
    return unpushed !== null && unpushed.length > 0;
}

