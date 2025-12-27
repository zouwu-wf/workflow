#!/usr/bin/env node

/**
 * WSXJS 发布脚本
 * 使用专业的 CLI 库构建，提供更好的用户体验
 */

import { execSync } from "child_process";
import {
    readFileSync,
    writeFileSync,
    existsSync,
    readdirSync,
    readdir,
} from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import chalk from "chalk";
import inquirer from "inquirer";
import ora from "ora";
import { Listr } from "listr2";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, "..");

function exec(command, options = {}) {
    try {
        return execSync(command, {
            stdio: options.silent ? "pipe" : "inherit",
            cwd: ROOT_DIR,
            encoding: "utf-8",
            ...options,
        });
    } catch (error) {
        throw new Error(`命令执行失败: ${command} ${error.message}`);
    }
}

function execSilent(command) {
    try {
        return execSync(command, {
            stdio: "pipe",
            cwd: ROOT_DIR,
            encoding: "utf-8",
        }).trim();
    } catch {
        return null;
    }
}

function getVersion() {
    const packageJson = JSON.parse(
        readFileSync(join(ROOT_DIR, "package.json"), "utf-8")
    );
    return packageJson.version;
}

/**
 * 手动更新版本号（major, minor, patch）
 */
function bumpVersion(versionType) {
    const semver = /^(\d+)\.(\d+)\.(\d+)$/;
    const packagesDir = join(ROOT_DIR, "packages");

    // 读取根目录 package.json
    const rootPackageJsonPath = join(ROOT_DIR, "package.json");
    const rootPackageJson = JSON.parse(
        readFileSync(rootPackageJsonPath, "utf-8")
    );
    const currentVersion = rootPackageJson.version;
    const match = currentVersion.match(semver);

    if (!match) {
        throw new Error(`无效的版本号格式: ${currentVersion}`);
    }

    let [, major, minor, patch] = match.map(Number);
    switch (versionType) {
        case "major":
            major++;
            minor = 0;
            patch = 0;
            break;
        case "minor":
            minor++;
            patch = 0;
            break;
        case "patch":
            patch++;
            break;
        default:
            throw new Error(`无效的版本类型: ${versionType}`);
    }

    const newVersion = `${major}.${minor}.${patch}`;

    // 更新根目录 package.json
    rootPackageJson.version = newVersion;
    writeFileSync(
        rootPackageJsonPath,
        JSON.stringify(rootPackageJson, null, 2) + "\n",
        "utf-8"
    );

    // 更新所有包的 package.json
    const dirs = readdirSync(packagesDir, { withFileTypes: true });
    for (const dir of dirs) {
        if (dir.isDirectory()) {
            const packageJsonPath = join(packagesDir, dir.name, "package.json");
            if (existsSync(packageJsonPath)) {
                try {
                    const pkg = JSON.parse(
                        readFileSync(packageJsonPath, "utf-8")
                    );
                    if (pkg.version) {
                        pkg.version = newVersion;
                        writeFileSync(
                            packageJsonPath,
                            JSON.stringify(pkg, null, 2) + "\n",
                            "utf-8"
                        );
                    }
                } catch {
                    // 忽略无效的 package.json
                }
            }
        }
    }

    return newVersion;
}

function checkBuild(pkg, distPath) {
    const fullPath = join(ROOT_DIR, distPath);
    if (!existsSync(fullPath)) {
        return { success: false, message: `构建产物不存在 (${distPath})` };
    }

    try {
        const files = readdirSync(fullPath);
        if (files.length === 0) {
            return { success: false, message: `构建产物为空 (${distPath})` };
        }
    } catch (error) {
        return { success: false, message: `无法读取构建产物 (${distPath})` };
    }

    return { success: true };
}

async function checkGitStatus() {
    const currentBranch = execSilent("git branch --show-current");
    if (currentBranch !== "main") {
        const { continue: shouldContinue } = await inquirer.prompt([
            {
                type: "confirm",
                name: "continue",
                message: chalk.yellow(
                    `当前不在 main 分支 (${currentBranch})，是否继续?`
                ),
                default: false,
            },
        ]);
        if (!shouldContinue) {
            process.exit(1);
        }
    }

    const hasUncommitted = execSilent("git status --porcelain");
    if (hasUncommitted) {
        console.error(chalk.red("❌ 错误: 存在未提交的更改"));
        console.error(chalk.red("请先提交或暂存所有更改"));
        process.exit(1);
    }

    // 先获取远程更新，避免检查过时的信息
    execSilent("git fetch origin main 2>/dev/null");
    const unpushedCommits = execSilent("git log origin/main..HEAD 2>/dev/null");
    if (unpushedCommits) {
        const { continue: shouldContinue } = await inquirer.prompt([
            {
                type: "confirm",
                name: "continue",
                message: chalk.yellow("存在未推送的提交，是否继续?"),
                default: true,
            },
        ]);
        if (!shouldContinue) {
            process.exit(1);
        }
    }
}

function hasChangesets() {
    const changesetDir = join(ROOT_DIR, ".changeset");
    if (!existsSync(changesetDir)) {
        return false;
    }
    try {
        const files = readdirSync(changesetDir);
        // 排除 config.json 和 README.md
        const changesetFiles = files.filter(
            (f) => f.endsWith(".md") && f !== "README.md"
        );
        return changesetFiles.length > 0;
    } catch {
        return false;
    }
}

/**
 * 检查 npm 登录状态和 registry 配置
 */
async function checkNpmAuth() {
    const npmWhoami = execSilent("npm whoami");
    if (!npmWhoami) {
        throw new Error("未登录 NPM，请先运行: npm login");
    }

    const registry =
        execSilent("npm config get registry") || "https://registry.npmjs.org/";
    if (!registry.includes("npmjs.org")) {
        console.log(chalk.yellow(`⚠️  当前 registry: ${registry}`));
        const { continue: shouldContinue } = await inquirer.prompt([
            {
                type: "confirm",
                name: "continue",
                message: "是否继续使用此 registry?",
                default: false,
            },
        ]);
        if (!shouldContinue) {
            process.exit(1);
        }
    }

    return { username: npmWhoami, registry };
}

/**
 * 获取所有要发布的包信息
 */
function getPublishablePackages() {
    const packagesDir = join(ROOT_DIR, "packages");
    if (!existsSync(packagesDir)) {
        return [];
    }

    const packages = [];
    const dirs = readdirSync(packagesDir, { withFileTypes: true });

    for (const dir of dirs) {
        if (dir.isDirectory()) {
            const packageJsonPath = join(packagesDir, dir.name, "package.json");
            if (existsSync(packageJsonPath)) {
                try {
                    const pkg = JSON.parse(
                        readFileSync(packageJsonPath, "utf-8")
                    );
                    // 跳过 private 包和 examples
                    if (
                        !pkg.private &&
                        pkg.name &&
                        !pkg.name.includes("examples")
                    ) {
                        packages.push({
                            name: pkg.name,
                            version: pkg.version,
                            path: join(packagesDir, dir.name),
                        });
                    }
                } catch {
                    // 忽略无效的 package.json
                }
            }
        }
    }

    return packages;
}

/**
 * 检查包是否已在 npm 上发布
 */
function checkPackageExists(packageName, version) {
    try {
        const info = execSilent(
            `npm view ${packageName}@${version} version 2>/dev/null`
        );
        return info === version;
    } catch {
        return false;
    }
}

/**
 * 检查远程分支是否最新
 */
async function checkRemoteUpToDate() {
    try {
        // 获取远程更新
        execSilent("git fetch origin main 2>/dev/null");
        const localCommit = execSilent("git rev-parse HEAD");
        const remoteCommit = execSilent(
            "git rev-parse origin/main 2>/dev/null"
        );

        if (remoteCommit && localCommit !== remoteCommit) {
            const { pull } = await inquirer.prompt([
                {
                    type: "confirm",
                    name: "pull",
                    message: chalk.yellow("远程分支有更新，是否先拉取? (推荐)"),
                    default: true,
                },
            ]);

            if (pull) {
                const pullSpinner = ora("拉取远程更新").start();
                try {
                    // 使用 --no-edit 避免在 rebase 时打开编辑器
                    exec("git pull origin main --rebase --no-edit", {
                        silent: true,
                    });
                    pullSpinner.succeed("已拉取远程更新");
                } catch (error) {
                    pullSpinner.fail("拉取失败，请手动解决冲突");
                    throw error;
                }
            } else {
                console.log(chalk.yellow("⚠️  跳过拉取，继续使用本地版本"));
            }
        }
    } catch (error) {
        // 如果无法连接到远程，继续执行
        console.log(chalk.yellow("⚠️  无法检查远程状态，继续执行"));
    }
}

async function main() {
    console.log(chalk.blue.bold("\n🚀 WSXJS 发布流程\n"));

    // 检查 npm 认证
    const npmCheckSpinner = ora("检查 NPM 认证").start();
    try {
        const npmAuth = await checkNpmAuth();
        npmCheckSpinner.succeed(`已登录 NPM: ${chalk.cyan(npmAuth.username)}`);
    } catch (error) {
        npmCheckSpinner.fail(`NPM 认证检查失败: ${error.message}`);
        throw error;
    }

    // 检查 Git 状态
    const gitCheckSpinner = ora("检查 Git 状态").start();
    try {
        gitCheckSpinner.stop(); // 停止 spinner 以便显示交互式提示
        await checkGitStatus();
        gitCheckSpinner.succeed("Git 状态检查通过");
    } catch (error) {
        gitCheckSpinner.fail(`Git 状态检查失败: ${error.message}`);
        throw error;
    }

    // 检查远程分支是否最新
    await checkRemoteUpToDate();

    // 阶段 1: 询问是否要 bump version
    console.log(chalk.yellow("\n📦 阶段 1: 版本管理"));
    let shouldBumpVersion = false;
    const { shouldBump: shouldBumpVersionInput } = await inquirer.prompt([
        {
            type: "confirm",
            name: "shouldBump",
            message: "是否要更新版本号?",
            default: true,
        },
    ]);

    shouldBumpVersion = shouldBumpVersionInput;

    if (shouldBumpVersion) {
        // 询问使用哪种版本更新方式
        const { versionUpdateMethod } = await inquirer.prompt([
            {
                type: "list",
                name: "versionUpdateMethod",
                message: "选择版本更新方式:",
                choices: [
                    { name: "使用 changeset (推荐)", value: "changeset" },
                    {
                        name: "手动选择版本类型 (major/minor/patch)",
                        value: "manual",
                    },
                ],
                default: "changeset",
            },
        ]);

        let newVersion;

        if (versionUpdateMethod === "manual") {
            // 手动版本更新
            const { versionType } = await inquirer.prompt([
                {
                    type: "list",
                    name: "versionType",
                    message: "选择版本类型:",
                    choices: [
                        {
                            name: "Major (主版本号，不兼容的 API 修改)",
                            value: "major",
                        },
                        {
                            name: "Minor (次版本号，向后兼容的功能新增)",
                            value: "minor",
                        },
                        {
                            name: "Patch (修订号，向后兼容的问题修复)",
                            value: "patch",
                        },
                    ],
                },
            ]);

            const currentVersion = getVersion();
            const bumpSpinner = ora("更新版本号").start();
            try {
                newVersion = bumpVersion(versionType);
                bumpSpinner.succeed(
                    `版本已更新: v${currentVersion} → v${newVersion}`
                );
            } catch (error) {
                bumpSpinner.fail(`版本更新失败: ${error.message}`);
                throw error;
            }
        } else {
            // 使用 changeset
            const hasChangesetFiles = hasChangesets();
            if (!hasChangesetFiles) {
                console.log(chalk.yellow("\n⚠️  未找到 changeset 文件"));
                const { createChangeset } = await inquirer.prompt([
                    {
                        type: "confirm",
                        name: "createChangeset",
                        message: "是否创建 changeset?",
                        default: true,
                    },
                ]);

                if (createChangeset) {
                    const createSpinner = ora("创建 changeset").start();
                    try {
                        // 运行 changeset 命令（交互式）
                        exec("pnpm changeset");
                        createSpinner.succeed("Changeset 已创建");
                    } catch (error) {
                        createSpinner.fail("创建 changeset 失败");
                        throw error;
                    }
                } else {
                    console.log(chalk.yellow("已跳过创建 changeset"));
                    process.exit(0);
                }
            }

            // 应用 changeset 版本更新
            const applySpinner = ora("应用 changeset 版本更新").start();
            try {
                exec("pnpm changeset:version", { silent: true });
                applySpinner.succeed("Changeset 版本更新已应用");
            } catch (error) {
                applySpinner.fail("应用 changeset 版本更新失败");
                throw error;
            }

            newVersion = getVersion();
            console.log(chalk.green(`\n新版本: v${newVersion}`));
        }

        // 版本管理任务
        const versionTasks = new Listr(
            [
                {
                    title: "格式化代码（版本更新后）",
                    task: () => exec("pnpm format", { silent: true }),
                },
                {
                    title: "提交版本更新到 Git",
                    task: (ctx) => {
                        ctx.version = newVersion;
                        try {
                            exec(
                                "git add package.json packages/*/package.json CHANGELOG.md .changeset/",
                                {
                                    silent: true,
                                }
                            );
                        } catch {
                            // 可能没有需要添加的文件
                        }

                        const hasChanges = execSilent("git status --porcelain");
                        if (hasChanges) {
                            // 使用 --no-verify 跳过 hooks，避免交互式询问
                            exec(
                                `git commit --no-verify -m "chore: release v${ctx.version}\n\n[skip ci]"`,
                                {
                                    silent: true,
                                }
                            );
                        }
                    },
                },
                {
                    title: "创建 Git 标签",
                    task: (ctx) => {
                        ctx.version = newVersion;
                        const tagExists = execSilent(
                            `git rev-parse v${ctx.version} 2>/dev/null`
                        );
                        if (!tagExists) {
                            // 使用 -f 强制覆盖已存在的标签，避免询问
                            exec(
                                `git tag -f -a v${ctx.version} -m "Release v${ctx.version}"`,
                                {
                                    silent: true,
                                }
                            );
                        }
                    },
                },
                {
                    title: "推送到远程仓库",
                    task: () => {
                        // git push 本身不会询问，除非需要认证（通过环境变量处理）
                        exec("git push origin main", { silent: true });
                        exec("git push --follow-tags", { silent: true });
                    },
                },
            ],
            {
                concurrent: false,
                exitOnError: true,
            }
        );

        let versionContext = { version: newVersion };
        try {
            await versionTasks.run(versionContext);
            console.log(
                chalk.green(
                    `\n✅ 版本更新完成! 新版本: v${versionContext.version}`
                )
            );
        } catch (error) {
            console.error(chalk.red(`\n❌ 版本更新失败: ${error.message}`));
            process.exit(1);
        }
    }

    // 阶段 2: 发布到 NPM
    console.log(chalk.yellow("\n📤 阶段 2: 发布到 NPM"));

    // 预检查任务
    const prePublishTasks = new Listr(
        [
            {
                title: "清理旧的构建产物",
                task: () => {
                    try {
                        exec("pnpm clean", { silent: true });
                    } catch {
                        // 某些包可能没有 clean 脚本，忽略错误
                    }
                },
            },
            {
                title: "安装依赖",
                task: () =>
                    exec("pnpm install --frozen-lockfile", { silent: true }),
            },
            {
                title: "构建 ESLint 插件（lint 依赖）",
                task: () => {
                    // eslint-plugin-wsx 需要先构建，因为其他包的 lint 会依赖它
                    exec("pnpm --filter @wsxjs/eslint-plugin-wsx build", {
                        silent: true,
                    });
                },
            },
            {
                title: "代码质量检查 (ESLint)",
                task: () => exec("pnpm lint", { silent: true }),
            },
            {
                title: "代码格式检查 (Prettier)",
                task: () => exec("pnpm format:check", { silent: true }),
            },
            {
                title: "TypeScript 类型检查",
                task: () => exec("pnpm typecheck", { silent: true }),
            },
            {
                title: "运行测试",
                task: () => exec("pnpm test", { silent: true }),
            },
            {
                title: "构建所有包 (Turbo)",
                task: () => exec("turbo build", { silent: true }),
            },
            {
                title: "验证构建产物",
                task: () => {
                    const builds = [
                        ["@wsxjs/wsx-core", "packages/core/dist"],
                        ["@wsxjs/wsx-vite-plugin", "packages/vite-plugin/dist"],
                        [
                            "@wsxjs/eslint-plugin-wsx",
                            "packages/eslint-plugin/dist",
                        ],
                        ["@wsxjs/wsx-router", "packages/router/dist"],
                        [
                            "@wsxjs/wsx-base-components",
                            "packages/base-components/dist",
                        ],
                        ["@wsxjs/wsx-press", "packages/wsx-press/dist"],
                        [
                            "@wsxjs/wsx-marked-components",
                            "packages/marked-components/dist",
                        ],
                    ];

                    for (const [pkg, path] of builds) {
                        const result = checkBuild(pkg, path);
                        if (!result.success) {
                            throw new Error(`${pkg}: ${result.message}`);
                        }
                    }
                },
            },
        ],
        {
            concurrent: false,
            exitOnError: true,
        }
    );

    try {
        await prePublishTasks.run();
    } catch (error) {
        console.error(chalk.red(`\n❌ 预检查失败: ${error.message}`));
        process.exit(1);
    }

    // 显示将要发布的包列表
    const publishablePackages = getPublishablePackages();
    if (publishablePackages.length === 0) {
        console.error(chalk.red("❌ 未找到可发布的包"));
        process.exit(1);
    }

    console.log(chalk.cyan("\n📦 将要发布的包:"));
    for (const pkg of publishablePackages) {
        const exists = checkPackageExists(pkg.name, pkg.version);
        const status = exists
            ? chalk.yellow(`(已存在 v${pkg.version})`)
            : chalk.green(`(新版本 v${pkg.version})`);
        console.log(`  • ${chalk.bold(pkg.name)} ${status}`);
    }

    // 检查是否有已存在的包
    const existingPackages = publishablePackages.filter((pkg) =>
        checkPackageExists(pkg.name, pkg.version)
    );
    if (existingPackages.length > 0) {
        console.log(chalk.yellow("\n⚠️  以下包版本已存在于 NPM:"));
        existingPackages.forEach((pkg) => {
            console.log(chalk.yellow(`  • ${pkg.name}@${pkg.version}`));
        });
        const { continue: shouldContinue } = await inquirer.prompt([
            {
                type: "confirm",
                name: "continue",
                message: "是否继续? (将跳过已存在的包)",
                default: false,
            },
        ]);
        if (!shouldContinue) {
            console.log(chalk.yellow("已取消发布"));
            process.exit(0);
        }
    }

    // 确认发布
    console.log(chalk.yellow("\n⚠️  准备发布到 NPM"));
    const { confirm: shouldPublish } = await inquirer.prompt([
        {
            type: "confirm",
            name: "confirm",
            message: `确认发布 ${publishablePackages.length} 个包到 NPM?`,
            default: false,
        },
    ]);

    if (!shouldPublish) {
        console.log(chalk.yellow("已取消发布"));
        process.exit(0);
    }

    // 询问是否先进行 dry-run
    const { dryRun } = await inquirer.prompt([
        {
            type: "confirm",
            name: "dryRun",
            message: "是否先进行 dry-run 测试? (推荐)",
            default: true,
        },
    ]);

    if (dryRun) {
        const dryRunSpinner = ora("执行 dry-run 测试").start();
        try {
            exec("pnpm changeset:publish --dry-run", {
                silent: false,
            });
            dryRunSpinner.succeed("dry-run 测试通过");
        } catch (error) {
            dryRunSpinner.fail("dry-run 测试失败");
            console.error(chalk.red(`错误: ${error.message}`));
            process.exit(1);
        }

        const { continueAfterDryRun } = await inquirer.prompt([
            {
                type: "confirm",
                name: "continueAfterDryRun",
                message: "dry-run 通过，是否继续正式发布?",
                default: true,
            },
        ]);

        if (!continueAfterDryRun) {
            console.log(chalk.yellow("已取消发布"));
            process.exit(0);
        }
    }

    // 发布到 NPM（支持交互式 OTP 输入）
    console.log(chalk.cyan("\n📱 准备发布到 NPM"));
    console.log(
        chalk.gray("如果启用了 NPM 2FA，发布时会提示输入 OTP（一次性密码）")
    );
    console.log(chalk.gray("请准备好您的认证器应用以获取 OTP\n"));

    // 询问是否准备好发布
    const { ready } = await inquirer.prompt([
        {
            type: "confirm",
            name: "ready",
            message: "准备好发布到 NPM?（如果启用 2FA，请准备好 OTP）",
            default: true,
        },
    ]);

    if (!ready) {
        console.log(chalk.yellow("已取消发布"));
        process.exit(0);
    }

    const publishSpinner = ora("发布到 NPM").start();
    try {
        publishSpinner.text = "正在发布包...";
        publishSpinner.stop(); // 停止 spinner 以便显示交互式提示

        // 使用非静默模式，允许交互式输入 OTP
        // changeset:publish 会自动处理 OTP 提示
        exec("pnpm changeset:publish", {
            silent: false, // 显示输出，允许交互式输入 OTP
        });

        // 发布成功：使用 console.log 因为 spinner 已停止
        console.log(chalk.green("✅ 所有包已发布到 NPM"));
    } catch (error) {
        // 发布失败：使用 console.error 因为 spinner 已停止
        console.error(chalk.red("❌ 发布失败"));
        const errorMessage = error.message || String(error);
        if (
            errorMessage.includes("OTP") ||
            errorMessage.includes("one-time") ||
            errorMessage.includes("Enter one-time password") ||
            errorMessage.includes("one-time pass")
        ) {
            console.log(chalk.yellow("\n💡 提示: 发布需要 OTP 验证"));
            console.log(chalk.gray("   请重新运行: pnpm release"));
            console.log(chalk.gray("   或者在发布时准备好 OTP 并输入"));
        } else {
            console.error(chalk.red(`错误: ${errorMessage}`));
        }
        throw error;
    }

    // 完成
    const currentVersion = getVersion();
    console.log(chalk.green.bold("\n✅ 发布流程成功完成!"));
    console.log(chalk.green(`📦 所有包已发布到 NPM (v${currentVersion})`));
    if (shouldBumpVersion) {
        console.log(chalk.green(`🏷️  Git 标签已创建 (v${currentVersion})`));
        console.log(chalk.green("📝 版本更新已提交并推送"));
    }
}

main().catch((error) => {
    console.error(chalk.red(`\n❌ 发布流程失败: ${error.message}`));
    process.exit(1);
});
