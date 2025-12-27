/**
 * 执行引擎
 */

import type { Context, PublishConfig } from "../types";
import { checkNpmAuth } from "../stages/auth";
import { getCurrentBranch, hasUncommittedChanges, hasUnpushedCommits } from "../stages/git";
import { discoverPackagesWithPnpm, discoverPackagesWithPattern } from "../utils/package";
import { exec } from "../utils/exec";
import { applyVersionUpdate } from "../stages/version";
import { executeBuildSteps, verifyArtifacts } from "../stages/build";
import { publishPackages, publishPackagesDryRun, checkPackageExists } from "../stages/publish";
import React from "react";
import { render } from "ink";
import { VersionSelector } from "../components/VersionSelector";
import { confirm, select } from "../utils/prompts.js";
import {
    checkRemoteUpToDate,
    pullRemoteUpdates,
    commitVersionUpdate,
    createGitTag,
    pushToRemote,
} from "../stages/git";
import { hasChangesetFiles } from "../utils/auto-detect";
import { getCurrentVersion, discoverAllWorkspacePackages } from "../stages/version";
import { PackageList } from "../components/PackageList";

/**
 * 执行发布流程
 */
export async function executePublish(
    config: PublishConfig,
    context: Context,
    options: {
        dryRun?: boolean;
        skipVersion?: boolean;
        skipBuild?: boolean;
        skipPublish?: boolean;
        yes?: boolean;
    },
): Promise<void> {
    const rootDir = context.rootDir;

    // 1. 检查 NPM 认证
    if (config.checks?.auth !== false) {
        const npmAuth = await checkNpmAuth();
        if (!npmAuth) {
            throw new Error("未登录 NPM，请先运行: npm login");
        }
    }

    // 2. 检查 Git 状态
    if (config.checks?.git !== false && config.git?.enabled !== false) {
        const branch = getCurrentBranch() || "main";
        const allowedBranches = Array.isArray(config.git?.branch)
            ? config.git.branch
            : config.git?.branch
              ? [config.git.branch]
              : ["main", "master"];

        if (branch && !allowedBranches.includes(branch)) {
            if (!options.yes) {
                const shouldContinue = await confirm(
                    `当前不在 ${allowedBranches.join(" 或 ")} 分支 (${branch})，是否继续?`,
                    false,
                );
                if (!shouldContinue) {
                    throw new Error("已取消发布");
                }
            }
        }

        if (config.git?.requireClean !== false && hasUncommittedChanges()) {
            throw new Error("存在未提交的更改，请先提交或暂存所有更改");
        }

        if (config.git?.requireUpToDate !== false && branch) {
            const unpushed = hasUnpushedCommits(branch);
            if (unpushed && !options.yes) {
                const shouldContinue = await confirm("存在未推送的提交，是否继续?", true);
                if (!shouldContinue) {
                    throw new Error("已取消发布");
                }
            }
        }
    }

    // 2.5 检查远程分支是否最新
    if (config.git?.enabled !== false && !options.yes) {
        const branch = getCurrentBranch() || "main";
        const remoteStatus = checkRemoteUpToDate(branch);

        if (!remoteStatus.isUpToDate && remoteStatus.remoteCommit) {
            const shouldPull = await confirm("远程分支有更新，是否先拉取? (推荐)", true);
            if (shouldPull) {
                try {
                    pullRemoteUpdates(branch);
                } catch (error: any) {
                    throw new Error(`拉取失败，请手动解决冲突: ${error.message}`);
                }
            }
        }
    }

    // 3. 发现包
    let packages = context.packages;

    if (packages.length === 0) {
        const workspace = config.workspace;
        if (workspace?.enabled) {
            packages = await discoverPackagesWithPnpm(rootDir);
        } else if (config.packages?.pattern) {
            const patterns = Array.isArray(config.packages.pattern)
                ? config.packages.pattern
                : [config.packages.pattern];
            packages = await discoverPackagesWithPattern(rootDir, patterns);
        } else {
            packages = await discoverPackagesWithPnpm(rootDir);
        }

        // 应用过滤
        if (config.packages?.filter) {
            packages = packages.filter(config.packages.filter);
        }

        // 排除私有包
        packages = packages.filter((pkg) => !pkg.private);
    }

    if (packages.length === 0) {
        throw new Error("未找到可发布的包");
    }

    // 4. 版本管理（如果未跳过）
    let newVersion: string | undefined;
    if (!options.skipVersion) {
        // 询问是否要更新版本
        let shouldBumpVersion = true;
        if (!options.yes && config.prompts?.confirmVersion !== false) {
            shouldBumpVersion = await confirm("是否要更新版本号?", true);
        }

        if (shouldBumpVersion) {
            // 步骤 1: 显示所有将被更新的包
            const allPackagesForVersion = await discoverAllWorkspacePackages(rootDir, config);
            if (allPackagesForVersion.length > 0) {
                // 显示包列表
                const { unmount: unmountList } = render(
                    <PackageList packages={allPackagesForVersion} title="📦 将被更新版本的包:" />,
                );
                await new Promise((resolve) => setTimeout(resolve, 1500)); // 显示 1.5 秒
                unmountList();

                // 确认是否继续
                if (!options.yes) {
                    const shouldContinue = await confirm(
                        `确认更新以上 ${allPackagesForVersion.length} 个包的版本号?`,
                        true,
                    );
                    if (!shouldContinue) {
                        throw new Error("已取消版本更新");
                    }
                }
            }

            // 选择版本更新方式
            let versionUpdateMethod: "changeset" | "manual" = "changeset";
            if (!options.yes) {
                versionUpdateMethod = await select(
                    "选择版本更新方式:",
                    [
                        { label: "使用 changeset (推荐)", value: "changeset" as const },
                        { label: "手动选择版本类型 (major/minor/patch)", value: "manual" as const },
                    ],
                    "changeset",
                );
            } else {
                // 非交互模式，根据配置选择
                versionUpdateMethod =
                    config.version?.strategy === "changeset" ? "changeset" : "manual";
            }

            if (versionUpdateMethod === "manual") {
                // 手动版本更新
                let versionType: "major" | "minor" | "patch" | undefined;
                if (!options.yes) {
                    versionType = await new Promise<"major" | "minor" | "patch">((resolve) => {
                        const { unmount } = render(
                            <VersionSelector
                                onSelect={(selected) => {
                                    resolve(selected);
                                    unmount();
                                }}
                            />,
                        );
                    });
                } else {
                    versionType = "patch"; // 默认值
                }

                const currentVersion = getCurrentVersion(rootDir);
                newVersion = await applyVersionUpdate(config, context, versionType);
            } else {
                // 使用 changeset
                const hasChangeset = hasChangesetFiles(rootDir);
                if (!hasChangeset) {
                    if (!options.yes) {
                        const createChangeset = await confirm("是否创建 changeset?", true);
                        if (createChangeset) {
                            const pmCommand =
                                config.project?.packageManager === "pnpm"
                                    ? "pnpm"
                                    : config.project?.packageManager === "yarn"
                                      ? "yarn"
                                      : "npm";
                            exec(`${pmCommand} changeset`, { cwd: rootDir });
                        } else {
                            throw new Error("已跳过创建 changeset");
                        }
                    } else {
                        throw new Error("未找到 changeset 文件，且非交互模式");
                    }
                }

                // 应用 changeset 版本更新
                newVersion = await applyVersionUpdate(config, context);
            }

            // 版本更新后的 Git 操作
            if (newVersion && config.git?.enabled !== false) {
                // 格式化代码
                try {
                    const pmCommand =
                        config.project?.packageManager === "pnpm"
                            ? "pnpm"
                            : config.project?.packageManager === "yarn"
                              ? "yarn"
                              : "npm";
                    exec(`${pmCommand} format`, { cwd: rootDir, silent: true });
                } catch {
                    // 可能没有 format 脚本
                }

                // 提交版本更新
                const commitMessage =
                    typeof config.git?.commitMessage === "function"
                        ? config.git.commitMessage(newVersion)
                        : config.git?.commitMessage;
                commitVersionUpdate(newVersion, commitMessage);

                // 创建 Git 标签
                const tagPrefix = config.git?.tagPrefix || "v";
                createGitTag(newVersion, tagPrefix);

                // 推送到远程
                const currentBranch = getCurrentBranch() || "main";
                if (!options.yes) {
                    const shouldPush = await confirm("是否推送到远程仓库?", true);
                    if (shouldPush) {
                        pushToRemote(currentBranch, true);
                    }
                } else {
                    pushToRemote(currentBranch, true);
                }
            }
        }
    }

    // 5. 构建验证（如果未跳过）
    if (!options.skipBuild && config.build?.enabled !== false) {
        const pmCommand =
            config.project?.packageManager === "pnpm"
                ? "pnpm"
                : config.project?.packageManager === "yarn"
                  ? "yarn"
                  : "npm";

        // 清理旧的构建产物
        try {
            exec(`${pmCommand} clean`, { cwd: rootDir, silent: true });
        } catch {
            // 某些包可能没有 clean 脚本，忽略错误
        }

        // 安装依赖
        exec(`${pmCommand} install --frozen-lockfile`, { cwd: rootDir, silent: true });

        // 代码质量检查
        if (config.checks?.lint !== false) {
            try {
                exec(`${pmCommand} lint`, { cwd: rootDir, silent: true });
            } catch {
                // 可能没有 lint 脚本
            }
        }

        if (config.checks?.typecheck !== false) {
            try {
                exec(`${pmCommand} typecheck`, { cwd: rootDir, silent: true });
            } catch {
                // 可能没有 typecheck 脚本
            }
        }

        if (config.checks?.tests !== false) {
            try {
                exec(`${pmCommand} test`, { cwd: rootDir, silent: true });
            } catch {
                // 可能没有 test 脚本
            }
        }

        // 执行构建步骤
        await executeBuildSteps(config, context);

        // 验证构建产物
        await verifyArtifacts(config, context);
    }

    // 6. 发布（如果未跳过）
    if (!options.skipPublish && config.publish?.enabled !== false) {
        // 检查是否有已存在的包
        const existingPackages = packages.filter((pkg) =>
            checkPackageExists(pkg.name, pkg.version),
        );

        if (existingPackages.length > 0) {
            if (!options.yes) {
                const shouldContinue = await confirm("是否继续? (将跳过已存在的包)", false);
                if (!shouldContinue) {
                    throw new Error("已取消发布");
                }
            }
        }

        // 确认发布
        if (!options.yes && config.prompts?.confirmPublish !== false) {
            const shouldPublish = await confirm(`确认发布 ${packages.length} 个包到 NPM?`, false);
            if (!shouldPublish) {
                throw new Error("已取消发布");
            }
        }

        // 询问是否先进行 dry-run
        let shouldDryRun = options.dryRun || false;
        if (!options.yes && !options.dryRun && config.prompts?.dryRunFirst !== false) {
            shouldDryRun = await confirm("是否先进行 dry-run 测试? (推荐)", true);
        }

        if (shouldDryRun) {
            await publishPackagesDryRun(config, context);

            if (!options.yes) {
                const continueAfterDryRun = await confirm("dry-run 通过，是否继续正式发布?", true);
                if (!continueAfterDryRun) {
                    throw new Error("已取消发布");
                }
            }
        }

        // 发布前提示（OTP）
        if (!options.yes) {
            const ready = await confirm("准备好发布到 NPM?（如果启用 2FA，请准备好 OTP）", true);
            if (!ready) {
                throw new Error("已取消发布");
            }
        }

        // 发布到 NPM
        await publishPackages(config, context);
    }
}
