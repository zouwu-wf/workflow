/**
 * 初始化配置文件生成器
 * 基于自动检测结果生成配置文件模板
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

/**
 * 检测包管理器
 */
function detectPackageManager(rootDir: string): "npm" | "pnpm" | "yarn" {
    // 检测 packageManager 字段
    const packageJsonPath = join(rootDir, "package.json");
    if (existsSync(packageJsonPath)) {
        try {
            const pkg = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
            if (pkg.packageManager) {
                if (pkg.packageManager.startsWith("pnpm")) return "pnpm";
                if (pkg.packageManager.startsWith("yarn")) return "yarn";
                if (pkg.packageManager.startsWith("npm")) return "npm";
            }
        } catch {
            // 忽略解析错误
        }
    }

    // 检测 lockfile
    if (existsSync(join(rootDir, "pnpm-lock.yaml"))) return "pnpm";
    if (existsSync(join(rootDir, "yarn.lock"))) return "yarn";
    if (existsSync(join(rootDir, "package-lock.json"))) return "npm";

    return "pnpm"; // 默认
}

/**
 * 检测 workspace 类型
 */
function detectWorkspace(rootDir: string): {
    type: "pnpm" | "yarn" | "npm" | null;
    configPath?: string;
} {
    // 检测 pnpm workspace
    const pnpmWorkspacePath = join(rootDir, "pnpm-workspace.yaml");
    if (existsSync(pnpmWorkspacePath)) {
        return { type: "pnpm", configPath: "pnpm-workspace.yaml" };
    }

    // 检测 package.json workspaces
    const packageJsonPath = join(rootDir, "package.json");
    if (existsSync(packageJsonPath)) {
        try {
            const pkg = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
            if (pkg.workspaces) {
                return { type: "yarn", configPath: "package.json" };
            }
        } catch {
            // 忽略解析错误
        }
    }

    return { type: null };
}

/**
 * 检测 changeset
 */
function detectChangeset(rootDir: string): boolean {
    return existsSync(join(rootDir, ".changeset"));
}

/**
 * 检测 Turbo
 */
function detectTurbo(rootDir: string): boolean {
    return existsSync(join(rootDir, "turbo.json"));
}

/**
 * 检测 Git 分支
 */
function detectGitBranch(): string | null {
    try {
        // 使用同步方式检测，避免异步问题
        const result = execSync("git branch --show-current", {
            encoding: "utf-8",
            stdio: "pipe",
        });
        return result.toString().trim() || null;
    } catch {
        return null;
    }
}

/**
 * 从 package.json 读取项目名称
 */
function getProjectName(rootDir: string): string {
    const packageJsonPath = join(rootDir, "package.json");
    if (existsSync(packageJsonPath)) {
        try {
            const pkg = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
            return pkg.name || "My Project";
        } catch {
            // 忽略解析错误
        }
    }
    return "My Project";
}

/**
 * 从 package.json scripts 检测构建步骤
 */
function detectBuildSteps(rootDir: string): string[] {
    const packageJsonPath = join(rootDir, "package.json");
    if (!existsSync(packageJsonPath)) return [];

    try {
        const pkg = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
        const scripts = pkg.scripts || {};
        const steps: string[] = [];

        if (scripts.clean) steps.push("clean");
        if (scripts.lint) steps.push("lint");
        if (scripts.typecheck) steps.push("typecheck");
        if (scripts.test) steps.push("test");
        if (scripts.build) steps.push("build");

        return steps;
    } catch {
        return [];
    }
}

/**
 * 生成配置文件模板
 */
export function generateConfigTemplate(format: "ts" | "js" | "json" = "ts"): string {
    const rootDir = process.cwd();
    const packageManager = detectPackageManager(rootDir);
    const workspace = detectWorkspace(rootDir);
    const hasChangeset = detectChangeset(rootDir);
    const hasTurbo = detectTurbo(rootDir);
    const gitBranch = detectGitBranch();
    const projectName = getProjectName(rootDir);
    const buildSteps = detectBuildSteps(rootDir);

    if (format === "json") {
        return generateJsonConfig(
            projectName,
            packageManager,
            workspace,
            hasChangeset,
            hasTurbo,
            gitBranch,
        );
    }

    if (format === "js") {
        return generateJsConfig(
            projectName,
            packageManager,
            workspace,
            hasChangeset,
            hasTurbo,
            gitBranch,
            buildSteps,
        );
    }

    return generateTsConfig(
        projectName,
        packageManager,
        workspace,
        hasChangeset,
        hasTurbo,
        gitBranch,
        buildSteps,
    );
}

/**
 * 生成 TypeScript 配置
 */
function generateTsConfig(
    projectName: string,
    packageManager: string,
    workspace: { type: string | null; configPath?: string },
    hasChangeset: boolean,
    hasTurbo: boolean,
    gitBranch: string | null,
    buildSteps: string[],
): string {
    const versionStrategy = hasChangeset ? "changeset" : "manual";
    const pmCommand =
        packageManager === "pnpm" ? "pnpm" : packageManager === "yarn" ? "yarn" : "npm";

    return `/**
 * 青鸟发布工具配置
 * 
 * 相见时难别亦难，东风无力百花残。
 * 春蚕到死丝方尽，蜡炬成灰泪始干。
 * 晓镜但愁云鬓改，夜吟应觉月光寒。
 * 蓬山此去无多路，青鸟殷勤为探看。
 * —— 李商隐《无题》
 * 
 * 注意：此配置文件完全可选！
 * 青鸟支持零配置，会自动从项目结构推断所有信息。
 * 只需取消注释需要覆盖自动检测的部分。
 */

import type { PublishConfig } from '@systembug/qingniao';

const config: PublishConfig = {
  // 项目信息（自动检测：从 package.json 读取）
  // project: {
  //   name: '${projectName}', // 自动检测：${projectName}
  //   packageManager: '${packageManager}', // 自动检测：${packageManager}
  // },

  // Git 配置（自动检测：当前分支 ${gitBranch || "未知"}）
  // git: {
  //   branch: '${gitBranch || "main"}', // 自动检测：当前分支
  //   tagPrefix: 'v', // 默认：'v'
  //   commitMessage: (version) => \`chore: release v\${version}\\n\\n[skip ci]\`,
  // },

  // 版本管理（自动检测：${hasChangeset ? "检测到 .changeset 目录，使用 changeset" : "未检测到 changeset，使用 manual"}）
  // version: {
  //   strategy: '${versionStrategy}', // 自动检测：${hasChangeset ? "changeset" : "manual"}
  //   syncAll: true, // 默认：true
  //   syncWorkspaceDeps: true, // 默认：true
  // },

${
    hasChangeset
        ? `  // Changeset 配置（自动检测：检测到 .changeset 目录）
  // changeset: {
  //   enabled: true, // 自动检测：true
  //   versionCommand: '${pmCommand} changeset version', // 自动生成
  //   publishCommand: '${pmCommand} changeset publish', // 自动生成
  // },`
        : ""
}

  // 构建配置（自动检测：${hasTurbo ? "检测到 turbo.json，使用 Turbo" : "未检测到 Turbo"}）
  // build: {
  //   // 在 lint 之前构建特定包（如 eslint-plugin）
  //   // preLintBuild: ['@wsxjs/eslint-plugin-wsx'],
  //   // 构建步骤（自动生成：从 package.json scripts 检测）
  //   // 检测到的脚本：${buildSteps.length > 0 ? buildSteps.join(", ") : "无"}
  //   steps: [
${buildSteps
    .map((step) => {
        const skipOnError = step === "clean" ? ", skipOnError: true" : "";
        return `  //     { name: '${step}', command: '${pmCommand} ${step}'${skipOnError} },`;
    })
    .join("\n")}
  //     // 其他步骤会自动从 package.json scripts 生成
  //   ],
  //   // 构建产物验证（自动推断：从每个包的 package.json 字段）
  //   verifyArtifacts: [
  //     // 工具会自动从每个包的 package.json 的 main/module/types 字段推断
  //   ],
${
    hasTurbo
        ? `  //   useTurbo: true, // 自动检测：检测到 turbo.json
  //   turboTasks: ['build'], // 自动检测：从 turbo.json 读取`
        : ""
}
  // },

${
    workspace.type
        ? `  // Workspace 配置（自动检测：${workspace.type} workspace）
  // workspace: {
  //   enabled: true, // 自动检测：true
  //   configPath: '${workspace.configPath}', // 自动检测
  // },

  // 包发现（自动检测：使用 ${workspace.type} workspace 命令）
  // packages: {
  //   // 使用 ${workspace.type} list 命令自动发现包
  //   // 自动排除：private 包、examples、test 等
  //   pattern: [], // 自动检测：从 workspace 配置读取
  //   exclude: ['**/examples/**', '**/test/**'], // 默认排除
  // },`
        : ""
}

  // 发布配置
  // publish: {
  //   skipExisting: true, // 默认：false
  //   replaceWorkspaceProtocols: true, // 默认：true
  //   protocolReplacement: 'version', // 默认：'version'
  // },

  // 交互式提示配置
  // prompts: {
  //   confirmVersion: true, // 默认：true
  //   confirmPublish: true, // 默认：true
  //   dryRunFirst: true, // 默认：true
  // },

  // 钩子函数（可选，添加自定义逻辑）
  // hooks: {
  //   beforeVersion: async (ctx) => {
  //     console.log(\`准备更新版本到 \${ctx.version}\`);
  //   },
  //   afterPublish: async (ctx) => {
  //     console.log(\`发布完成: \${ctx.version}\`);
  //   },
  // },
};

export default config;
`;
}

/**
 * 生成 JavaScript 配置
 */
function generateJsConfig(
    projectName: string,
    packageManager: string,
    workspace: { type: string | null; configPath?: string },
    hasChangeset: boolean,
    hasTurbo: boolean,
    gitBranch: string | null,
    buildSteps: string[],
): string {
    const versionStrategy = hasChangeset ? "changeset" : "manual";
    const pmCommand =
        packageManager === "pnpm" ? "pnpm" : packageManager === "yarn" ? "yarn" : "npm";

    return `/**
 * 青鸟发布工具配置
 * 
 * 注意：此配置文件完全可选！
 * 青鸟支持零配置，会自动从项目结构推断所有信息。
 * 只需取消注释需要覆盖自动检测的部分。
 */

export default {
  // 项目信息（自动检测：从 package.json 读取）
  // project: {
  //   name: '${projectName}',
  //   packageManager: '${packageManager}',
  // },

  // Git 配置（自动检测：当前分支 ${gitBranch || "未知"}）
  // git: {
  //   branch: '${gitBranch || "main"}',
  //   tagPrefix: 'v',
  // },

  // 版本管理（自动检测：${hasChangeset ? "changeset" : "manual"}）
  // version: {
  //   strategy: '${versionStrategy}',
  //   syncAll: true,
  // },

${
    hasChangeset
        ? `  // Changeset 配置（自动检测）
  // changeset: {
  //   versionCommand: '${pmCommand} changeset:version',
  //   publishCommand: '${pmCommand} changeset:publish',
  // },`
        : ""
}

  // 构建配置（自动检测：${hasTurbo ? "Turbo" : "普通构建"}）
  // build: {
  //   steps: [
${buildSteps
    .map((step) => {
        const skipOnError = step === "clean" ? ", skipOnError: true" : "";
        return `  //     { name: '${step}', command: '${pmCommand} ${step}'${skipOnError} },`;
    })
    .join("\n")}
  //   ],
${
    hasTurbo
        ? `  //   useTurbo: true,
  //   turboTasks: ['build'],`
        : ""
}
  // },
};
`;
}

/**
 * 生成 JSON 配置
 */
function generateJsonConfig(
    projectName: string,
    packageManager: string,
    workspace: { type: string | null; configPath?: string },
    hasChangeset: boolean,
    hasTurbo: boolean,
    gitBranch: string | null,
): string {
    const versionStrategy = hasChangeset ? "changeset" : "manual";

    return `{
  "_comment": "青鸟发布工具配置 - 此配置文件完全可选，青鸟支持零配置",
  "_autoDetected": {
    "projectName": "${projectName}",
    "packageManager": "${packageManager}",
    "workspace": "${workspace.type || "none"}",
    "changeset": ${hasChangeset},
    "turbo": ${hasTurbo},
    "gitBranch": "${gitBranch || "unknown"}"
  },
  "project": {
    "name": "${projectName}"
  },
  "git": {
    "branch": "${gitBranch || "main"}",
    "tagPrefix": "v"
  },
  "version": {
    "strategy": "${versionStrategy}",
    "syncAll": true,
    "syncWorkspaceDeps": true
  }${
      hasChangeset
          ? `,
  "changeset": {
    "enabled": true
  }`
          : ""
  }${
      hasTurbo
          ? `,
  "build": {
    "useTurbo": true,
    "turboTasks": ["build"]
  }`
          : ""
  },
  "publish": {
    "skipExisting": true,
    "replaceWorkspaceProtocols": true
  }
}
`;
}
