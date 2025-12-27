/**
 * Git 状态检查
 */

import { execSilent, exec } from "../utils/exec";

/**
 * 检查当前 Git 分支
 */
export function getCurrentBranch(): string | null {
    return execSilent("git branch --show-current");
}

/**
 * 检查是否有未提交的更改
 */
export function hasUncommittedChanges(): boolean {
    const status = execSilent("git status --porcelain");
    return status !== null && status.length > 0;
}

/**
 * 检查是否有未推送的提交
 */
export function hasUnpushedCommits(branch = "main"): boolean {
    execSilent(`git fetch origin ${branch} 2>/dev/null`);
    const unpushed = execSilent(`git log origin/${branch}..HEAD 2>/dev/null`);
    return unpushed !== null && unpushed.length > 0;
}

/**
 * 检查远程分支是否最新
 */
export function checkRemoteUpToDate(branch = "main"): {
    isUpToDate: boolean;
    localCommit: string | null;
    remoteCommit: string | null;
} {
    execSilent(`git fetch origin ${branch} 2>/dev/null`);
    const localCommit = execSilent("git rev-parse HEAD");
    const remoteCommit = execSilent(`git rev-parse origin/${branch} 2>/dev/null`);

    return {
        isUpToDate: !remoteCommit || localCommit === remoteCommit,
        localCommit,
        remoteCommit,
    };
}

/**
 * 拉取远程更新
 */
export function pullRemoteUpdates(branch = "main"): void {
    exec(`git pull origin ${branch} --rebase --no-edit`, { silent: true });
}

/**
 * 提交版本更新
 */
export function commitVersionUpdate(version: string, message?: string): void {
    const commitMessage = message || `chore: release v${version}\n\n[skip ci]`;

    // 添加文件：根目录 package.json 和所有子包的 package.json
    try {
        // 添加根目录 package.json
        exec("git add package.json", { silent: true });
        
        // 添加所有 packages 目录下的 package.json（包括嵌套目录）
        exec("git add packages/**/package.json", { silent: true });
        
        // 添加 CHANGELOG 和 changeset 文件
        exec("git add CHANGELOG.md .changeset/", { silent: true });
    } catch {
        // 可能没有需要添加的文件
    }

    const hasChanges = execSilent("git status --porcelain");
    if (hasChanges) {
        exec(`git commit --no-verify -m "${commitMessage}"`, { silent: true });
    }
}

/**
 * 创建 Git 标签
 */
export function createGitTag(version: string, tagPrefix = "v"): void {
    const tag = `${tagPrefix}${version}`;
    const tagExists = execSilent(`git rev-parse ${tag} 2>/dev/null`);

    if (!tagExists) {
        exec(`git tag -f -a ${tag} -m "Release ${tag}"`, { silent: true });
    }
}

/**
 * 推送到远程仓库
 */
export function pushToRemote(branch = "main", followTags = true): void {
    exec(`git push origin ${branch}`, { silent: true });
    if (followTags) {
        exec("git push --follow-tags", { silent: true });
    }
}
