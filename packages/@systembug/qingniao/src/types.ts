/**
 * 青鸟工具类型定义
 */

/**
 * 包信息
 */
export interface PackageInfo {
    name: string;
    version: string;
    path: string;
    private?: boolean;
}

/**
 * 执行上下文
 */
export interface Context {
    version?: string;
    packages: PackageInfo[];
    config: PublishConfig;
    rootDir: string;
    [key: string]: any;
}

/**
 * 构建步骤
 */
export interface BuildStep {
    name: string;
    command: string;
    cwd?: string;
    silent?: boolean;
    skipOnError?: boolean;
    condition?: (ctx: Context) => boolean;
}

/**
 * 构建产物检查
 */
export interface ArtifactCheck {
    package: string;
    path: string;
    required?: boolean;
    minFiles?: number;
}

/**
 * 发布配置
 */
export interface PublishConfig {
    // 项目元信息（可选，覆盖自动检测）
    project?: {
        name?: string;
        rootDir?: string;
        packageManager?: "npm" | "pnpm" | "yarn";
    };

    // Git 配置（可选，覆盖自动检测）
    git?: {
        enabled?: boolean;
        branch?: string | string[];
        requireClean?: boolean;
        requireUpToDate?: boolean;
        autoPull?: boolean;
        tagPrefix?: string;
        commitMessage?: string | ((version: string) => string);
    };

    // 版本管理配置（可选，覆盖自动检测）
    version?: {
        strategy?: "changeset" | "manual" | "semver" | "custom";
        bumpTypes?: ("major" | "minor" | "patch")[];
        syncAll?: boolean;
        syncWorkspaceDeps?: boolean;
        files?: string[];
    };

    // Changeset 配置（可选，覆盖自动检测）
    changeset?: {
        enabled?: boolean;
        configPath?: string;
        createCommand?: string;
        versionCommand?: string;
        publishCommand?: string;
        autoCreate?: boolean;
        skipVersion?: boolean;
        skipPublish?: boolean;
        readConfig?: boolean;
    };

    // 构建和验证配置（可选，覆盖自动检测）
    build?: {
        enabled?: boolean;
        steps?: BuildStep[];
        verifyArtifacts?: ArtifactCheck[];
        useTurbo?: boolean;
        turboConfigPath?: string;
        turboTasks?: string[];
        artifactPaths?: Record<string, string>;
        skipMissingArtifacts?: boolean;
    };

    // pnpm workspace 配置（可选，覆盖自动检测）
    workspace?: {
        enabled?: boolean;
        configPath?: string;
        autoDetect?: boolean;
    };

    // 包发现配置（可选，覆盖自动检测）
    packages?: {
        root?: string;
        pattern?: string | string[];
        exclude?: string[];
        filter?: (pkg: PackageInfo) => boolean;
        usePnpmList?: boolean;
    };

    // 依赖关系处理配置（可选，覆盖自动检测）
    dependencies?: {
        respectDependencyOrder?: boolean;
        buildOrder?: "topological" | "parallel" | "custom";
        customOrder?: (packages: PackageInfo[]) => PackageInfo[];
    };

    // NPM 发布配置（可选，覆盖自动检测）
    publish?: {
        enabled?: boolean;
        registry?: string;
        access?: "public" | "restricted";
        dryRun?: boolean;
        skipExisting?: boolean;
        otpRequired?: boolean;
        replaceWorkspaceProtocols?: boolean;
        protocolReplacement?: "version" | "range" | "custom";
        customProtocolReplacer?: (pkg: PackageInfo, dep: string) => string;
    };

    // 预发布检查配置（可选，覆盖自动检测）
    checks?: {
        auth?: boolean;
        git?: boolean;
        build?: boolean;
        tests?: boolean;
        lint?: boolean;
        typecheck?: boolean;
        format?: boolean;
    };

    // 钩子函数（可选，添加自定义逻辑）
    hooks?: {
        // 版本管理钩子
        beforeVersion?: (ctx: Context) => Promise<void>;
        afterVersion?: (ctx: Context) => Promise<void>;
        // Changeset 钩子
        beforeChangesetCreate?: (ctx: Context) => Promise<void>;
        afterChangesetCreate?: (ctx: Context) => Promise<void>;
        beforeChangesetVersion?: (ctx: Context) => Promise<void>;
        afterChangesetVersion?: (ctx: Context) => Promise<void>;
        beforeChangesetPublish?: (ctx: Context) => Promise<void>;
        afterChangesetPublish?: (ctx: Context) => Promise<void>;
        // 构建钩子
        beforeBuild?: (ctx: Context) => Promise<void>;
        afterBuild?: (ctx: Context) => Promise<void>;
        // 发布钩子
        beforePublish?: (ctx: Context) => Promise<void>;
        afterPublish?: (ctx: Context) => Promise<void>;
    };

    // 交互式提示配置（可选，覆盖默认行为）
    prompts?: {
        confirmVersion?: boolean;
        confirmPublish?: boolean;
        dryRunFirst?: boolean;
    };
}
