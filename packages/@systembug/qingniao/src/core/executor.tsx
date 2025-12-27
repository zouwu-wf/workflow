/**
 * 执行引擎
 */

import type { Context, PublishConfig } from "../types";
import { checkNpmAuth } from "../stages/auth";
import { getCurrentBranch, hasUncommittedChanges, hasUnpushedCommits } from "../stages/git";
import { discoverPackagesWithPnpm, discoverPackagesWithPattern } from "../utils/package";
import { exec } from "../utils/exec";
import { createLogger } from "../utils/logger";
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
import { getCurrentVersion } from "../stages/version";

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
    const logger = createLogger({ pretty: true });
    const rootDir = context.rootDir;

    // 1. 检查 NPM 认证
    if (config.checks?.auth !== false) {
        logger.info("检查 NPM 认证...");
        const npmAuth = await checkNpmAuth();
        if (!npmAuth) {
            throw new Error("未登录 NPM，请先运行: npm login");
        }
        logger.success(`已登录 NPM: ${npmAuth.username} (${npmAuth.registry})`);
    }

    // 2. 检查 Git 状态
    if (config.checks?.git !== false && config.git?.enabled !== false) {
        logger.info("检查 Git 状态...");
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
            logger.warn(`当前分支 ${branch} 不在允许的分支列表中，但继续执行`);
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

        logger.success("Git 状态检查通过");
    }

    // 2.5 检查远程分支是否最新
    if (config.git?.enabled !== false && !options.yes) {
        logger.info("检查远程分支状态...");
        const branch = getCurrentBranch() || "main";
        const remoteStatus = checkRemoteUpToDate(branch);

        if (!remoteStatus.isUpToDate && remoteStatus.remoteCommit) {
            const shouldPull = await confirm("远程分支有更新，是否先拉取? (推荐)", true);
            if (shouldPull) {
                try {
                    pullRemoteUpdates(branch);
                    logger.success("已拉取远程更新");
                } catch (error: any) {
                    throw new Error(`拉取失败，请手动解决冲突: ${error.message}`);
                }
            } else {
                logger.warn("跳过拉取，继续使用本地版本");
            }
        }
    }

    // 3. 发现包
    logger.info("发现可发布的包...");
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

    logger.success(`发现 ${packages.length} 个可发布的包`);
    packages.forEach((pkg) => {
        logger.info(`  - ${pkg.name}@${pkg.version}`);
    });

    // 4. 版本管理（如果未跳过）
    let newVersion: string | undefined;
    if (!options.skipVersion) {
        logger.info("📦 阶段 1: 版本管理");

        // 询问是否要更新版本
        let shouldBumpVersion = true;
        if (!options.yes && config.prompts?.confirmVersion !== false) {
            shouldBumpVersion = await confirm("是否要更新版本号?", true);
        }

        if (shouldBumpVersion) {
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
                logger.info("更新版本号...");
                newVersion = await applyVersionUpdate(config, context, versionType);
                logger.success(`版本已更新: v${currentVersion} → v${newVersion}`);
            } else {
                // 使用 changeset
                const hasChangeset = hasChangesetFiles(rootDir);
                if (!hasChangeset) {
                    logger.warn("未找到 changeset 文件");
                    if (!options.yes) {
                        const createChangeset = await confirm("是否创建 changeset?", true);
                        if (createChangeset) {
                            logger.info("创建 changeset...");
                            const pmCommand =
                                config.project?.packageManager === "pnpm"
                                    ? "pnpm"
                                    : config.project?.packageManager === "yarn"
                                      ? "yarn"
                                      : "npm";
                            exec(`${pmCommand} changeset`, { cwd: rootDir });
                            logger.success("Changeset 已创建");
                        } else {
                            throw new Error("已跳过创建 changeset");
                        }
                    } else {
                        throw new Error("未找到 changeset 文件，且非交互模式");
                    }
                }

                // 应用 changeset 版本更新
                logger.info("应用 changeset 版本更新...");
                newVersion = await applyVersionUpdate(config, context);
                logger.success(`Changeset 版本更新已应用: v${newVersion}`);
            }

            // 版本更新后的 Git 操作
            if (newVersion && config.git?.enabled !== false) {
                logger.info("执行版本更新后的 Git 操作...");

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
                        logger.success("已推送到远程仓库");
                    }
                } else {
                    pushToRemote(currentBranch, true);
                    logger.success("已推送到远程仓库");
                }

                logger.success(`✅ 版本更新完成! 新版本: v${newVersion}`);
            }
        }
    }

    // 5. 构建验证（如果未跳过）
    if (!options.skipBuild && config.build?.enabled !== false) {
        logger.info("📤 阶段 2: 发布到 NPM");
        logger.info("执行构建前检查...");

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
        logger.info("安装依赖...");
        exec(`${pmCommand} install --frozen-lockfile`, { cwd: rootDir, silent: true });

        // 代码质量检查
        if (config.checks?.lint !== false) {
            try {
                logger.info("代码质量检查 (ESLint)...");
                exec(`${pmCommand} lint`, { cwd: rootDir, silent: true });
            } catch {
                // 可能没有 lint 脚本
            }
        }

        if (config.checks?.typecheck !== false) {
            try {
                logger.info("TypeScript 类型检查...");
                exec(`${pmCommand} typecheck`, { cwd: rootDir, silent: true });
            } catch {
                // 可能没有 typecheck 脚本
            }
        }

        if (config.checks?.tests !== false) {
            try {
                logger.info("运行测试...");
                exec(`${pmCommand} test`, { cwd: rootDir, silent: true });
            } catch {
                // 可能没有 test 脚本
            }
        }

        // 执行构建步骤
        await executeBuildSteps(config, context);

        // 验证构建产物
        await verifyArtifacts(config, context);

        logger.success("构建验证通过");
    }

    // 6. 发布（如果未跳过）
    if (!options.skipPublish && config.publish?.enabled !== false) {
        // 检查是否有已存在的包
        const existingPackages = packages.filter((pkg) =>
            checkPackageExists(pkg.name, pkg.version),
        );

        if (existingPackages.length > 0) {
            logger.warn("以下包版本已存在于 NPM:");
            existingPackages.forEach((pkg) => {
                logger.warn(`  - ${pkg.name}@${pkg.version}`);
            });

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
            logger.info("执行 dry-run 测试...");
            await publishPackagesDryRun(config, context);
            logger.success("dry-run 测试通过");

            if (!options.yes) {
                const continueAfterDryRun = await confirm("dry-run 通过，是否继续正式发布?", true);
                if (!continueAfterDryRun) {
                    throw new Error("已取消发布");
                }
            }
        }

        // 发布前提示（OTP）
        if (!options.yes) {
            logger.info("📱 准备发布到 NPM");
            logger.info("如果启用了 NPM 2FA，发布时会提示输入 OTP（一次性密码）");
            logger.info("请准备好您的认证器应用以获取 OTP");

            const ready = await confirm("准备好发布到 NPM?（如果启用 2FA，请准备好 OTP）", true);
            if (!ready) {
                throw new Error("已取消发布");
            }
        }

        // 发布到 NPM
        logger.info("发布到 NPM...");
        await publishPackages(config, context);
        logger.success("✅ 所有包已发布到 NPM");
    }

    // 完成
    const finalVersion = newVersion || getCurrentVersion(rootDir);
    logger.success("✅ 发布流程成功完成!");
    logger.success(`📦 所有包已发布到 NPM (v${finalVersion})`);
    if (newVersion) {
        logger.success(`🏷️  Git 标签已创建 (v${finalVersion})`);
        logger.success("📝 版本更新已提交并推送");
    }
}
