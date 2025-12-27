# RFC 0005: 青鸟(Qing Niao)通用发布工具设计规范

- **开始日期**: 2025-01-XX
- **更新日期**: 2025-01-XX
- **RFC PR**:
- **实现议题**:
- **作者**: AI Assistant
- **状态**: Draft
- **命名空间**: `@systembug/qingniao`

## 摘要

本 RFC 设计一个通用的、可配置的发布工具——**青鸟(Qing Niao)**，用于自动化 monorepo 项目的版本管理、构建验证和 NPM 发布流程。该工具**完全零配置优先**，自动从 `package.json` 和 workspace 配置推断所有必要信息。**配置文件完全可选**，仅用于覆盖自动检测的结果，支持部分覆盖和深度定制。

## 青鸟哲学

青鸟是中国神话中西王母的信使，负责传递消息和物品到人间。发布工具青鸟体现这些原则：

- **信使使命**：将代码包准确、及时地传递到 NPM 仓库
- **可靠传递**：确保版本同步、依赖正确、构建完整
- **优雅流程**：提供流畅的发布体验，如同青鸟优雅的飞行
- **智能导航**：自动处理依赖顺序、版本同步等复杂逻辑

## 动机

当前项目中的 `publish.mjs` 脚本存在以下问题：

1. **硬编码逻辑**：脚本中包含了大量项目特定的逻辑（如包名、构建路径、命令等）
2. **难以重用**：无法直接用于其他项目，需要大量修改
3. **配置分散**：配置信息散布在代码中，难以维护
4. **扩展性差**：添加新功能或修改流程需要修改核心代码

通过设计一个基于配置的通用发布工具，可以：

- **提高可重用性**：通过配置文件适配不同项目
- **降低维护成本**：配置与代码分离，易于更新
- **增强灵活性**：支持多种发布策略和工作流
- **改善开发体验**：统一的 CLI 接口和清晰的错误提示

## 设计目标

1. **配置驱动**：所有项目特定信息通过配置文件定义
2. **可扩展性**：支持自定义钩子函数和插件系统
3. **类型安全**：完整的 TypeScript 类型定义和配置验证
4. **向后兼容**：支持现有项目的迁移路径
5. **开发友好**：清晰的错误消息和详细的日志输出

## 详细设计

### 1. 包结构

```
@systembug/qingniao/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                    # 主入口
│   ├── cli.ts                      # CLI 命令处理
│   ├── config/
│   │   ├── schema.ts               # 配置 Schema 定义
│   │   ├── loader.ts                # 配置加载器
│   │   └── validator.ts             # 配置验证器
│   ├── core/
│   │   ├── executor.ts              # 执行引擎
│   │   ├── hooks.ts                 # 钩子系统
│   │   └── context.ts               # 执行上下文
│   ├── stages/
│   │   ├── auth.ts                  # 认证检查
│   │   ├── git.ts                   # Git 状态检查
│   │   ├── version.ts               # 版本管理
│   │   ├── build.ts                 # 构建验证
│   │   └── publish.ts               # NPM 发布
│   ├── utils/
│   │   ├── exec.ts                  # 命令执行工具
│   │   ├── package.ts               # 包管理工具
│   │   └── logger.ts                # 日志工具
│   └── types.ts                     # 类型定义
├── schemas/
│   └── config.schema.json           # JSON Schema 配置定义
└── README.md
```

### 2. 配置系统

#### 2.1 零配置模式（Zero Config）

青鸟支持**完全零配置**模式，自动从项目结构推断所有必要信息：

**自动检测流程**：

1. **包管理器检测**
   ```typescript
   // 优先级顺序：
   // 1. package.json 中的 packageManager 字段
   // 2. 检测 lockfile: pnpm-lock.yaml -> pnpm, yarn.lock -> yarn, package-lock.json -> npm
   // 3. 检测可执行文件: which pnpm/yarn/npm
   ```

2. **Workspace 类型检测**
   ```typescript
   // pnpm workspace: 检测 pnpm-workspace.yaml
   // yarn workspace: 检测 package.json 中的 workspaces 字段
   // npm workspace: 检测 package.json 中的 workspaces 字段
   ```

3. **包发现（自动）**
   ```typescript
   // pnpm: 使用 'pnpm list -r --depth -1 --json'
   // yarn: 使用 'yarn workspaces list --json'
   // npm: 使用 'npm ls --workspaces --json'
   // 自动过滤: private 包、examples、test 等
   ```

4. **构建命令推断**
   ```typescript
   // 从 package.json scripts 自动推断：
   // - 检测是否有 'build' 脚本 -> 使用 'pnpm build' 或 'turbo build'
   // - 检测 turbo.json -> 使用 turbo 任务
   // - 检测是否有 'lint', 'test', 'typecheck' -> 自动添加到构建步骤
   ```

5. **版本策略检测**
   ```typescript
   // 检测 .changeset 目录 -> 使用 changeset 策略
   // 否则使用 manual 策略（交互式选择）
   ```

6. **Turbo 集成（自动）**
   ```typescript
   // 检测 turbo.json -> 自动使用 turbo 构建
   // 从 turbo.json 读取任务配置
   ```

7. **构建产物路径推断**
   ```typescript
   // 自动检测每个包的构建产物：
   // 1. 检查 package.json 中的 main/module/types 字段
   // 2. 检查是否存在 dist/, build/, lib/ 目录
   // 3. 检查 turbo.json 中的 outputs 配置
   ```

8. **构建步骤自动生成**
   ```typescript
   // 从 package.json scripts 自动生成构建步骤：
   // - 如果有 'clean' -> 添加清理步骤
   // - 如果有 'install' 或检测到 lockfile -> 添加安装步骤
   // - 如果有 'lint' -> 添加代码检查步骤
   // - 如果有 'typecheck' -> 添加类型检查步骤
   // - 如果有 'test' -> 添加测试步骤
   // - 如果有 'build' -> 添加构建步骤
   ```

**零配置示例**：

```bash
# 在 pnpm workspace 项目中，直接运行：
qingniao

# 工具会自动：
# 1. 检测到 pnpm workspace（从 pnpm-workspace.yaml）
# 2. 发现所有非私有包（使用 pnpm list）
# 3. 从 package.json scripts 推断构建步骤
# 4. 检测到 turbo.json，使用 turbo 构建
# 5. 检测到 .changeset，使用 changeset 版本策略
# 6. 自动推断每个包的构建产物路径
```

**实际项目示例（zouwu-workflow）**：

```json
// package.json (根目录)
{
  "name": "@zouwu-wf/zouwu-workflow",
  "packageManager": "pnpm@9.0.0",
  "scripts": {
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck"
  }
}
```

```yaml
# pnpm-workspace.yaml
packages:
  - "packages/*"
  - "packages/@zouwu-wf/*"
```

```json
// turbo.json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    }
  }
}
```

**零配置自动生成的配置**：

```typescript
// 等价于以下配置（自动生成，无需手动编写）
{
  project: {
    name: "@zouwu-wf/zouwu-workflow",
    packageManager: "pnpm"
  },
  workspace: {
    enabled: true,
    autoDetect: true
  },
  packages: {
    usePnpmList: true,
    exclude: ["**/examples/**", "**/test/**"]
  },
  build: {
    useTurbo: true,
    turboTasks: ["build"],
    steps: [
      { name: "安装依赖", command: "pnpm install --frozen-lockfile" },
      { name: "代码检查", command: "pnpm lint" },
      { name: "类型检查", command: "pnpm typecheck" },
      { name: "运行测试", command: "pnpm test" },
      { name: "构建", command: "turbo build" }
    ],
    verifyArtifacts: [
      // 自动从每个包的 package.json 推断
      { package: "@zouwu-wf/workflow", path: "packages/@zouwu-wf/workflow/dist" },
      { package: "@zouwu-wf/cli", path: "packages/@zouwu-wf/cli/dist" },
      // ...
    ]
  },
  version: {
    strategy: "changeset" // 检测到 .changeset 目录
  }
}
```

**自动推断的配置映射**：

| 检测项 | 来源 | 默认行为 |
|--------|------|----------|
| 包管理器 | `packageManager` 字段或 lockfile | 自动选择 |
| Workspace 类型 | `pnpm-workspace.yaml` 或 `package.json.workspaces` | 自动检测 |
| 包列表 | workspace 命令输出 | 过滤私有包和 examples |
| 构建命令 | `package.json.scripts` | 使用 `build`, `lint`, `test`, `typecheck` |
| Turbo 使用 | `turbo.json` 存在 | 自动使用 turbo 任务 |
| 版本策略 | `.changeset` 目录 | changeset 或 manual |
| Git 分支 | 当前分支 | `main` 或 `master` |
| 标签前缀 | 无 | `v` |

#### 2.2 配置文件格式（可选，用于覆盖自动检测）

**配置文件是完全可选的**，仅用于覆盖自动检测的结果。如果项目符合标准结构，**完全不需要配置文件**。

**配置文件的角色**：
- 🎯 **覆盖自动检测**：当自动检测的结果不符合需求时，使用配置文件覆盖
- 🎯 **部分覆盖**：只需覆盖需要自定义的部分，其他保持自动检测
- 🎯 **深度定制**：支持完全自定义的复杂场景

**配置文件格式**（支持多种格式）：

- `qingniao.config.js` (JavaScript)
- `qingniao.config.mjs` (ES Module)
- `qingniao.config.ts` (TypeScript, 需要 ts-node)
- `qingniao.config.json` (JSON)
- `package.json` 中的 `qingniao` 字段
- 也支持旧名称 `publish.config.*`（向后兼容）

**配置合并策略**：

```typescript
// 配置合并顺序（从低到高，后面的覆盖前面的）：
// 1. 零配置自动推断（基础配置）
// 2. package.json 中的 qingniao 字段（覆盖自动推断）
// 3. qingniao.config.* 文件（覆盖 package.json）
// 4. 命令行 --config 指定的文件（最高优先级）

// 合并规则：
// - 对象字段：深度合并（deep merge）
// - 数组字段：完全替换（不合并）
// - 函数字段：完全替换
```

**配置文件优先级**（从高到低）：
1. 命令行 `--config` 指定的文件
2. `qingniao.config.*` 文件
3. `package.json` 中的 `qingniao` 字段
4. **零配置自动推断**（默认，无需配置文件）

**何时需要配置文件**：

- ✅ **零配置足够（推荐）**：标准 monorepo 结构、使用常见工具（turbo、changeset）
- ⚙️ **需要配置文件（覆盖自动检测）**：
  - 覆盖自动检测的构建步骤
  - 覆盖自动检测的包过滤规则
  - 覆盖自动检测的版本策略
  - 覆盖自动检测的构建产物路径
  - 添加自定义钩子函数
  - 非标准的项目结构

**部分覆盖示例**：

```typescript
// qingniao.config.ts
// 只覆盖构建步骤，其他保持自动检测
export default {
  build: {
    steps: [
      { name: '自定义清理', command: 'rm -rf dist' },
      { name: '自定义构建', command: 'pnpm build:custom' }
    ]
  }
  // 其他配置保持自动检测
};
```

```json
// package.json
{
  "qingniao": {
    // 只覆盖 Git 分支配置
    "git": {
      "branch": "develop"
    }
    // 其他配置保持自动检测
  }
}
```

**零配置实现细节**：

1. **智能 Fallback 机制**
   ```typescript
   // 如果自动检测失败，使用合理的默认值
   // 例如：如果检测不到 turbo.json，使用普通的构建命令
   // 如果检测不到 changeset，使用 manual 版本策略
   ```

2. **构建产物路径推断算法**
   ```typescript
   // 优先级顺序：
   // 1. package.json 中的 main/module/types 字段的目录部分
   // 2. 检查常见目录：dist/, build/, lib/, out/
   // 3. turbo.json 中的 outputs 配置
   // 4. 如果都找不到，跳过验证（警告但不失败）
   ```

3. **构建步骤生成规则**
   ```typescript
   // 自动生成的步骤顺序：
   // 1. clean（如果存在）- skipOnError: true
   // 2. install（如果检测到 lockfile 变化或不存在 node_modules）
   // 3. lint（如果存在）
   // 4. typecheck（如果存在）
   // 5. test（如果存在）
   // 6. build（必须存在，否则报错）
   ```

4. **包过滤规则（零配置）**
   ```typescript
   // 自动排除：
   // - private: true 的包
   // - 名称包含 'example', 'demo', 'test', 'sample' 的包
   // - 路径包含 /examples/, /demos/, /tests/ 的包
   // - 没有 version 字段的包
   ```

#### 2.3 配置结构

**所有配置字段都是可选的**，用于覆盖自动检测的结果。如果字段未提供，将使用自动检测的值。

```typescript
interface PublishConfig {
  // 项目元信息（可选，覆盖自动检测）
  project?: {
    name?: string;                    // 项目名称（默认: 从 package.json 读取）
    rootDir?: string;                 // 项目根目录（默认: process.cwd()）
    packageManager?: 'npm' | 'pnpm' | 'yarn'; // 包管理器（默认: 自动检测）
  };

  // Git 配置（可选，覆盖自动检测）
  git?: {
    enabled?: boolean;                // 是否启用 Git 检查（默认: true，自动检测）
    branch?: string | string[];       // 允许的分支（默认: ['main', 'master']，自动检测当前分支）
    requireClean?: boolean;            // 是否需要干净的工作区（默认: true）
    requireUpToDate?: boolean;         // 是否需要与远程同步（默认: true）
    autoPull?: boolean;                // 是否自动拉取更新（默认: true）
    tagPrefix?: string;               // Git 标签前缀（默认: 'v'）
    commitMessage?: string | ((version: string) => string); // 提交消息模板（默认: 自动生成）
  };

  // 版本管理配置（可选，覆盖自动检测）
  version?: {
    strategy?: 'changeset' | 'manual' | 'semver' | 'custom'; // 版本策略（默认: 自动检测 .changeset 目录）
    bumpTypes?: ('major' | 'minor' | 'patch')[]; // 允许的版本类型（manual 模式，默认: 全部）
    syncAll?: boolean;                 // 是否同步所有包的版本（默认: true）
    syncWorkspaceDeps?: boolean;       // 是否同步 workspace 依赖的版本引用（默认: true）
    files?: string[];                  // 需要更新版本的文件（默认: 自动检测所有 package.json）
  };

  // Changeset 配置（可选，覆盖自动检测，当 strategy 为 'changeset' 时）
  changeset?: {
    enabled?: boolean;                 // 是否启用 changeset（默认: 自动检测 .changeset 目录）
    configPath?: string;               // changeset 配置文件路径（默认: '.changeset/config.json'）
    createCommand?: string;            // 创建 changeset 的命令（默认: 根据包管理器自动生成）
    versionCommand?: string;           // 应用版本更新的命令（默认: 根据包管理器自动生成）
    publishCommand?: string;           // 发布命令（默认: 根据包管理器自动生成）
    autoCreate?: boolean;              // 如果没有 changeset 文件，是否自动创建（默认: false，交互式提示）
    skipVersion?: boolean;             // 是否跳过版本更新步骤（默认: false）
    skipPublish?: boolean;             // 是否跳过发布步骤（默认: false）
    readConfig?: boolean;              // 是否读取 .changeset/config.json（默认: true）
  };

  // 构建和验证配置（可选，覆盖自动检测）
  build?: {
    enabled?: boolean;                 // 是否启用构建检查（默认: true）
    steps?: BuildStep[];               // 构建步骤列表（默认: 从 package.json scripts 自动生成）
    verifyArtifacts?: ArtifactCheck[]; // 构建产物验证（默认: 从 package.json 和目录自动推断）
    useTurbo?: boolean;                // 是否使用 Turbo（默认: 自动检测 turbo.json）
    turboConfigPath?: string;          // Turbo 配置文件路径（默认: 'turbo.json'）
    turboTasks?: string[];             // 要执行的 Turbo 任务（默认: ['build']，从 turbo.json 读取）
  };

  // pnpm workspace 配置（可选，覆盖自动检测）
  workspace?: {
    enabled?: boolean;                  // 是否启用 workspace 模式（默认: 自动检测）
    configPath?: string;                // workspace 配置文件路径（默认: 自动检测）
    autoDetect?: boolean;               // 是否自动检测（默认: true）
  };

  // 包发现配置（可选，覆盖自动检测）
  packages?: {
    root?: string;                     // 包根目录（默认: 从 workspace 配置自动检测）
    pattern?: string | string[];       // 包匹配模式（默认: 从 workspace 配置自动检测）
    exclude?: string[];                // 排除的包模式（默认: 自动排除 examples, test 等）
    filter?: (pkg: PackageInfo) => boolean; // 自定义过滤函数（默认: 自动过滤私有包）
    usePnpmList?: boolean;             // 使用 workspace 命令发现包（默认: true，自动检测）
  };

  // 依赖关系处理配置（可选，覆盖自动检测）
  dependencies?: {
    respectDependencyOrder?: boolean;  // 是否考虑依赖顺序（默认: true）
    buildOrder?: 'topological' | 'parallel' | 'custom'; // 构建顺序策略（默认: 'topological'）
    customOrder?: (packages: PackageInfo[]) => PackageInfo[]; // 自定义排序函数
  };

  // NPM 发布配置（可选，覆盖自动检测）
  publish?: {
    enabled?: boolean;                 // 是否启用发布（默认: true）
    registry?: string;                 // NPM registry（默认: 自动检测 npm config）
    access?: 'public' | 'restricted';  // 发布访问级别（默认: 从 package.json 读取）
    dryRun?: boolean;                  // 是否仅执行 dry-run（默认: false）
    skipExisting?: boolean;            // 是否跳过已存在的版本（默认: false）
    otpRequired?: boolean;              // 是否需要 OTP（默认: 自动检测）
    replaceWorkspaceProtocols?: boolean; // 是否替换 workspace 协议（默认: true）
    protocolReplacement?: 'version' | 'range' | 'custom'; // 替换策略（默认: 'version'）
    customProtocolReplacer?: (pkg: PackageInfo, dep: string) => string; // 自定义替换函数
  };

  // 预发布检查配置（可选，覆盖自动检测）
  checks?: {
    auth?: boolean;                    // 检查 NPM 认证（默认: true）
    git?: boolean;                     // 检查 Git 状态（默认: true）
    build?: boolean;                   // 检查构建（默认: true）
    tests?: boolean;                   // 运行测试（默认: 从 package.json scripts 检测）
    lint?: boolean;                    // 代码检查（默认: 从 package.json scripts 检测）
    typecheck?: boolean;               // 类型检查（默认: 从 package.json scripts 检测）
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
    confirmVersion?: boolean;          // 是否确认版本更新（默认: true）
    confirmPublish?: boolean;           // 是否确认发布（默认: true）
    dryRunFirst?: boolean;             // 是否先执行 dry-run（默认: true）
  };
}

// 构建步骤定义
interface BuildStep {
  name: string;                        // 步骤名称
  command: string;                     // 执行的命令
  cwd?: string;                        // 工作目录
  silent?: boolean;                   // 是否静默执行
  skipOnError?: boolean;            // 错误时是否跳过
  condition?: (ctx: Context) => boolean; // 执行条件
}

// 构建产物检查
interface ArtifactCheck {
  package: string;                     // 包名
  path: string;                        // 产物路径（相对于项目根目录）
  required?: boolean;                  // 是否必需（默认: true）
  minFiles?: number;                   // 最小文件数（默认: 1）
}

// 包信息
interface PackageInfo {
  name: string;
  version: string;
  path: string;
  private?: boolean;
}
```

#### 2.4 配置示例

**零配置（推荐，无需配置文件）**：

```bash
# 直接运行，完全依赖自动检测
qingniao
```

**最小配置示例（仅覆盖需要自定义的部分）**：

```json
// qingniao.config.json
// 只覆盖 Git 分支，其他全部自动检测
{
  "git": {
    "branch": "develop"
  }
}
```

```json
// package.json
// 只覆盖构建步骤，其他保持自动检测
{
  "qingniao": {
    "build": {
      "steps": [
        { "name": "自定义构建", "command": "pnpm build:custom" }
      ]
    }
  }
}
```

**完整配置示例（JSON）**：

```json
{
  "project": {
    "name": "Zouwu Workflow"
  },
  "git": {
    "branch": "main"
  },
  "version": {
    "strategy": "changeset"
  },
  "packages": {
    "pattern": ["packages/@zouwu-wf/*"]
  },
  "build": {
    "steps": [
      { "name": "安装依赖", "command": "pnpm install --frozen-lockfile" },
      { "name": "代码检查", "command": "pnpm lint" },
      { "name": "类型检查", "command": "pnpm typecheck" },
      { "name": "运行测试", "command": "pnpm test" },
      { "name": "构建", "command": "turbo build" }
    ],
    "verifyArtifacts": [
      { "package": "@zouwu-wf/workflow", "path": "packages/@zouwu-wf/workflow/dist" },
      { "package": "@zouwu-wf/cli", "path": "packages/@zouwu-wf/cli/dist" }
    ]
  }
}
```

**高级配置（TypeScript，覆盖自动检测）**：

```typescript
import { PublishConfig } from '@systembug/qingniao';

const config: PublishConfig = {
  // 以下配置覆盖自动检测的结果
  // 未配置的字段将使用自动检测的值

  project: {
    name: 'Zouwu Workflow', // 覆盖：默认从 package.json 读取
    packageManager: 'pnpm',  // 覆盖：默认自动检测
  },
  git: {
    branch: 'main',         // 覆盖：默认自动检测当前分支
    tagPrefix: 'v',         // 覆盖：默认 'v'
    commitMessage: (version) => `chore: release v${version}\n\n[skip ci]`, // 覆盖：默认自动生成
  },
  version: {
    strategy: 'changeset',  // 覆盖：默认自动检测 .changeset 目录
    syncAll: true,          // 覆盖：默认 true
  },
  changeset: {
    versionCommand: 'pnpm changeset:version',  // 覆盖：默认根据包管理器自动生成
    publishCommand: 'pnpm changeset:publish',  // 覆盖：默认根据包管理器自动生成
  },
  build: {
    // 覆盖：默认从 package.json scripts 自动生成
    steps: [
      { name: '清理', command: 'pnpm clean', skipOnError: true },
      { name: '安装依赖', command: 'pnpm install --frozen-lockfile' },
      { name: '代码检查', command: 'pnpm lint' },
      { name: '类型检查', command: 'pnpm typecheck' },
      { name: '测试', command: 'pnpm test' },
      { name: '构建', command: 'turbo build' },
    ],
    // 覆盖：默认从 package.json 和目录自动推断
    verifyArtifacts: [
      { package: '@zouwu-wf/workflow', path: 'packages/@zouwu-wf/workflow/dist' },
      { package: '@zouwu-wf/cli', path: 'packages/@zouwu-wf/cli/dist' },
      { package: '@zouwu-wf/expression-parser', path: 'packages/@zouwu-wf/expression-parser/dist' },
      { package: '@zouwu-wf/logger', path: 'packages/@zouwu-wf/logger/dist' },
    ],
  },
  packages: {
    pattern: ['packages/@zouwu-wf/*'],  // 覆盖：默认从 workspace 配置自动检测
    exclude: ['**/examples/**'],        // 覆盖：默认自动排除
  },
  publish: {
    dryRun: false,        // 覆盖：默认 false
    skipExisting: true,   // 覆盖：默认 false
  },
  hooks: {
    // 添加自定义逻辑（零配置不支持）
    beforeVersion: async (ctx) => {
      console.log(`准备更新版本到 ${ctx.version}`);
    },
    afterPublish: async (ctx) => {
      console.log(`发布完成: ${ctx.version}`);
    },
  },
  // 注意：以下配置未提供，将使用自动检测的值：
  // - workspace: 自动检测 pnpm-workspace.yaml
  // - dependencies: 自动分析依赖关系
  // - checks: 自动从 package.json scripts 检测
  // - prompts: 使用默认值
};

export default config;
```

**部分覆盖示例（推荐）**：

```typescript
// qingniao.config.ts
// 只覆盖需要自定义的部分，其他保持自动检测
export default {
  // 只覆盖 Git 分支配置
  git: {
    branch: 'develop'
  },
  // 只覆盖构建步骤
  build: {
    steps: [
      { name: '自定义构建', command: 'pnpm build:custom' }
    ]
  }
  // 其他所有配置保持自动检测
};
```

### 3. pnpm Workspace 集成

#### 3.1 自动检测

工具会自动检测 pnpm workspace 环境：

1. **检测 pnpm-workspace.yaml**：自动读取 workspace 配置
2. **检测 packageManager 字段**：从 `package.json` 读取包管理器版本
3. **检测 workspace 协议**：识别 `workspace:*` 依赖关系

```typescript
interface WorkspaceConfig {
  // pnpm workspace 配置
  workspace?: {
    enabled?: boolean;                  // 是否启用 workspace 模式（默认: 自动检测）
    configPath?: string;                // workspace 配置文件路径（默认: 'pnpm-workspace.yaml'）
    autoDetect?: boolean;                // 是否自动检测（默认: true）
  };

  // 包发现增强（workspace 模式）
  packages?: {
    // 使用 pnpm 的包发现机制
    usePnpmList?: boolean;              // 使用 'pnpm list -r --depth -1' 发现包（默认: true）
    // 或者使用自定义模式
    pattern?: string | string[];        // 包匹配模式（当 usePnpmList 为 false 时使用）
    exclude?: string[];                // 排除的包模式
    filter?: (pkg: PackageInfo) => boolean;
  };

  // 依赖关系处理
  dependencies?: {
    respectDependencyOrder?: boolean;   // 是否考虑依赖顺序（默认: true）
    buildOrder?: 'topological' | 'parallel' | 'custom'; // 构建顺序策略
    customOrder?: (packages: PackageInfo[]) => PackageInfo[]; // 自定义排序函数
  };
}
```

#### 3.2 包发现机制

在 pnpm workspace 模式下，工具提供两种包发现方式：

**方式 1：使用 pnpm 命令（推荐）**

```typescript
// 自动使用 pnpm list 发现所有 workspace 包
const packages = await execPnpmList();
// 等价于: pnpm list -r --depth -1 --json
```

**方式 2：使用配置模式**

```json
{
  "packages": {
    "usePnpmList": false,
    "pattern": ["packages/*", "packages/@zouwu-wf/*"],
    "exclude": ["**/examples/**", "**/test/**"]
  }
}
```

#### 3.3 依赖关系处理

工具会自动分析 workspace 依赖关系，确保正确的构建和发布顺序：

```typescript
// 示例：包依赖关系
// @zouwu-wf/cli -> @zouwu-wf/workflow -> @zouwu-wf/logger
//                -> @zouwu-wf/expression-parser

// 拓扑排序后的构建顺序：
// 1. @zouwu-wf/logger (无依赖)
// 2. @zouwu-wf/expression-parser (无依赖)
// 3. @zouwu-wf/workflow (依赖 logger, expression-parser)
// 4. @zouwu-wf/cli (依赖 workflow)
```

**配置示例**：

```typescript
{
  dependencies: {
    respectDependencyOrder: true,      // 考虑依赖顺序
    buildOrder: 'topological',         // 拓扑排序
  },
  build: {
    steps: [
      // 工具会自动按依赖顺序构建包
      { name: '构建（按依赖顺序）', command: 'pnpm --filter "./packages/**" build' }
    ]
  }
}
```

#### 3.4 pnpm Filter 命令支持

工具提供便捷的 pnpm filter 命令封装：

```typescript
interface PnpmFilterConfig {
  // 使用 pnpm filter 执行命令
  useFilter?: boolean;                 // 是否使用 pnpm filter（默认: true）
  filterPattern?: string;               // filter 模式
  recursive?: boolean;                  // 是否递归（默认: true）
}

// 示例配置
{
  build: {
    steps: [
      {
        name: '构建特定包',
        command: 'pnpm --filter @zouwu-wf/workflow build',
        // 或者使用配置
        pnpmFilter: {
          pattern: '@zouwu-wf/workflow',
          recursive: false
        }
      },
      {
        name: '构建所有包',
        command: 'turbo build',
        // 或者
        pnpmFilter: {
          pattern: './packages/**',
          recursive: true
        }
      }
    ]
  }
}
```

#### 3.5 Workspace 协议处理

工具会自动处理 `workspace:*` 协议，在发布前替换为实际版本号：

```typescript
// 发布前：package.json
{
  "dependencies": {
    "@zouwu-wf/logger": "workspace:*"
  }
}

// 发布后：package.json（自动替换）
{
  "dependencies": {
    "@zouwu-wf/logger": "^1.0.0"
  }
}
```

**配置选项**：

```typescript
{
  publish: {
    replaceWorkspaceProtocols?: boolean; // 是否替换 workspace 协议（默认: true）
    protocolReplacement?: 'version' | 'range' | 'custom'; // 替换策略
    customProtocolReplacer?: (pkg: PackageInfo, dep: string) => string; // 自定义替换函数
  }
}
```

#### 3.6 版本同步策略

在 pnpm workspace 中，工具支持多种版本同步策略：

```typescript
{
  version: {
    strategy: 'changeset',
    syncAll: true,                      // 同步所有 workspace 包的版本
    syncWorkspaceDeps: true,             // 同步 workspace 依赖的版本引用
    // 例如：如果 @zouwu-wf/workflow 更新到 1.1.0
    // 所有依赖它的包中的 "workspace:*" 会被替换为 "^1.1.0"
  }
}
```

#### 3.7 完整配置示例（pnpm workspace）

```typescript
import { PublishConfig } from '@systembug/qingniao';

const config: PublishConfig = {
  project: {
    name: 'Zouwu Workflow',
    packageManager: 'pnpm',             // 明确指定 pnpm
  },

  // pnpm workspace 配置
  workspace: {
    enabled: true,                       // 启用 workspace 模式
    autoDetect: true,                    // 自动检测
  },

  // 包发现（使用 pnpm list）
  packages: {
    usePnpmList: true,                   // 使用 pnpm 命令发现包
    exclude: ['**/examples/**', '**/test/**'],
    filter: (pkg) => !pkg.private,         // 只发布非私有包
  },

  // 依赖关系处理
  dependencies: {
    respectDependencyOrder: true,        // 考虑依赖顺序
    buildOrder: 'topological',          // 拓扑排序
  },

  // Git 配置
  git: {
    branch: 'main',
    tagPrefix: 'v',
  },

  // 版本管理
  version: {
    strategy: 'changeset',
    syncAll: true,                       // 同步所有包版本
    syncWorkspaceDeps: true,             // 同步 workspace 依赖
  },

  // Changeset 配置
  changeset: {
    versionCommand: 'pnpm changeset:version',
    publishCommand: 'pnpm changeset:publish',
  },

  // 构建配置
  build: {
    steps: [
      { name: '清理', command: 'pnpm clean', skipOnError: true },
      { name: '安装依赖', command: 'pnpm install --frozen-lockfile' },
      { name: '代码检查', command: 'pnpm lint' },
      { name: '类型检查', command: 'pnpm typecheck' },
      { name: '测试', command: 'pnpm test' },
      // 使用 turbo 构建（自动处理依赖顺序）
      { name: '构建', command: 'turbo build' },
    ],
    verifyArtifacts: [
      { package: '@zouwu-wf/workflow', path: 'packages/@zouwu-wf/workflow/dist' },
      { package: '@zouwu-wf/cli', path: 'packages/@zouwu-wf/cli/dist' },
      { package: '@zouwu-wf/expression-parser', path: 'packages/@zouwu-wf/expression-parser/dist' },
      { package: '@zouwu-wf/logger', path: 'packages/@zouwu-wf/logger/dist' },
    ],
  },

  // 发布配置
  publish: {
    replaceWorkspaceProtocols: true,     // 替换 workspace 协议
    protocolReplacement: 'version',       // 使用版本号替换
    skipExisting: true,                   // 跳过已存在的版本
  },

  // 钩子函数
  hooks: {
    beforeVersion: async (ctx) => {
      // 确保所有 workspace 依赖已更新
      await syncWorkspaceDependencies(ctx);
    },
    afterPublish: async (ctx) => {
      console.log(`已发布 ${ctx.packages.length} 个包`);
    },
  },
};

export default config;
```

#### 3.8 Changeset 深度集成

青鸟与 Changeset 深度集成，提供零配置的版本管理和发布流程。

**自动检测 Changeset**：

```typescript
// 自动检测流程：
// 1. 检测 .changeset 目录是否存在
// 2. 检测 .changeset/config.json 配置文件
// 3. 检测 package.json 中的 changeset 相关脚本
// 4. 如果检测到，自动使用 changeset 版本策略
```

**零配置 Changeset 工作流**：

```bash
# 在包含 .changeset 目录的项目中，直接运行：
qingniao

# 工具会自动：
# 1. 检测到 .changeset 目录
# 2. 使用 changeset 版本策略
# 3. 检查是否有未应用的 changeset 文件
# 4. 如果没有，提示创建 changeset
# 5. 应用 changeset 版本更新
# 6. 使用 changeset publish 发布
```

**Changeset 工作流程集成**：

```
1. 检测 Changeset
   ├─ 检查 .changeset 目录
   ├─ 读取 .changeset/config.json
   └─ 检测 changeset 命令可用性

2. 检查 Changeset 文件
   ├─ 扫描 .changeset/*.md 文件（排除 README.md）
   ├─ 如果没有 changeset 文件：
   │  ├─ 提示创建 changeset
   │  ├─ 运行 changeset 命令（交互式）
   │  └─ 等待用户创建
   └─ 如果有 changeset 文件：继续流程

3. 应用版本更新
   ├─ 运行 changeset:version（或自动检测的命令）
   ├─ 更新所有包的版本号
   ├─ 更新 CHANGELOG.md（如果配置）
   └─ 清理已应用的 changeset 文件

4. 发布到 NPM
   ├─ 运行 changeset:publish
   ├─ 支持 OTP 交互式输入
   └─ 验证发布结果
```

**自动检测 Changeset 配置**：

```typescript
// 从 .changeset/config.json 自动读取：
interface ChangesetConfig {
  $schema?: string;
  changelog?: string | [string, any];
  commit?: boolean;
  fixed?: string[][];
  linked?: string[][];
  access?: 'public' | 'restricted';
  baseBranch?: string;
  updateInternalDependencies?: 'patch' | 'minor';
  ignore?: string[];
}

// 青鸟会自动：
// - 读取 changelog 配置，决定是否生成 CHANGELOG
// - 读取 commit 配置，决定是否自动提交
// - 读取 access 配置，用于发布
// - 读取 baseBranch 配置，用于 Git 检查
```

**Changeset 命令自动生成**：

```typescript
// 根据包管理器自动生成命令：
// pnpm: 'pnpm changeset', 'pnpm changeset:version', 'pnpm changeset:publish'
// yarn: 'yarn changeset', 'yarn changeset version', 'yarn changeset publish'
// npm: 'npx changeset', 'npx changeset version', 'npx changeset publish'

// 或者从 package.json scripts 检测：
// - 检测 'changeset' 脚本
// - 检测 'changeset:version' 或 'changeset version' 脚本
// - 检测 'changeset:publish' 或 'changeset publish' 脚本
```

**Changeset 配置覆盖**：

```typescript
// qingniao.config.ts
export default {
  version: {
    strategy: 'changeset',  // 明确指定使用 changeset
  },
  changeset: {
    // 覆盖自动检测的命令
    createCommand: 'pnpm changeset add',  // 覆盖默认命令
    versionCommand: 'pnpm changeset:version',
    publishCommand: 'pnpm changeset:publish',

    // 覆盖自动检测的配置路径
    configPath: '.changeset/config.json',

    // 自定义 changeset 行为
    autoCreate: true,  // 如果没有 changeset 文件，自动创建（非交互式）
    skipVersion: false, // 是否跳过版本更新步骤
  }
};
```

**Changeset 与 Git 集成**：

```typescript
// 青鸟自动处理：
// 1. 版本更新后，自动提交 changeset 相关文件
// 2. 根据 .changeset/config.json 的 commit 配置决定是否提交
// 3. 自动生成提交消息（如果未配置）
// 4. 创建 Git 标签
// 5. 推送到远程仓库

// 示例提交消息（自动生成）：
// "chore: release v1.0.0\n\n[skip ci]"
// 或根据 changeset 配置：
// "chore: version packages"
```

**Changeset 与 CHANGELOG 集成**：

```typescript
// 青鸟自动处理：
// 1. 检测 .changeset/config.json 中的 changelog 配置
// 2. 如果配置了 changelog，自动更新 CHANGELOG.md
// 3. 在版本更新步骤中包含 CHANGELOG.md
// 4. 在 Git 提交中包含 CHANGELOG.md
```

**零配置 Changeset 示例**：

```bash
# 项目结构：
# .
# ├── .changeset/
# │   ├── config.json
# │   └── README.md
# ├── package.json
# ├── pnpm-workspace.yaml
# └── packages/
#     └── @zouwu-wf/
#         └── workflow/

# 直接运行（零配置）：
qingniao

# 等价于以下配置（自动生成）：
{
  version: {
    strategy: 'changeset'  // 自动检测到 .changeset 目录
  },
  changeset: {
    enabled: true,  // 自动检测
    createCommand: 'pnpm changeset',  // 根据 packageManager 自动生成
    versionCommand: 'pnpm changeset:version',
    publishCommand: 'pnpm changeset:publish'
  }
}
```

**Changeset 钩子集成**：

```typescript
// 青鸟提供 changeset 相关的钩子：
hooks: {
  beforeChangesetCreate: async (ctx) => {
    // changeset 创建前的钩子
    console.log('准备创建 changeset');
  },
  afterChangesetCreate: async (ctx) => {
    // changeset 创建后的钩子
    console.log('Changeset 已创建');
  },
  beforeChangesetVersion: async (ctx) => {
    // 版本更新前的钩子
    console.log('准备应用 changeset 版本更新');
  },
  afterChangesetVersion: async (ctx) => {
    // 版本更新后的钩子
    console.log(`版本已更新: ${ctx.version}`);
  },
  beforeChangesetPublish: async (ctx) => {
    // 发布前的钩子
    console.log('准备发布到 NPM');
  },
  afterChangesetPublish: async (ctx) => {
    // 发布后的钩子
    console.log('发布完成');
  }
}
```

**Changeset 错误处理**：

```typescript
// 青鸟自动处理常见错误：
// 1. 没有 changeset 文件：
//    - 提示创建 changeset
//    - 提供交互式创建选项
//    - 支持自动创建（如果配置）

// 2. changeset 版本更新失败：
//    - 显示详细错误信息
//    - 提供恢复建议
//    - 支持重试

// 3. changeset 发布失败：
//    - 检测 OTP 错误，提供提示
//    - 检测网络错误，提供重试建议
//    - 检测权限错误，提供解决步骤
```

**Changeset 与 Workspace 协议**：

```typescript
// 青鸟自动处理：
// 1. 在应用 changeset 版本更新后
// 2. 自动替换所有 workspace 协议为实际版本号
// 3. 确保发布的包使用正确的依赖版本

// 例如：
// 发布前：@zouwu-wf/cli 依赖 @zouwu-wf/workflow: "workspace:*"
// 发布后：@zouwu-wf/cli 依赖 @zouwu-wf/workflow: "^1.0.0"
```

#### 3.10 Turbo 集成

如果项目使用 Turbo，工具会自动检测并利用 Turbo 的依赖图：

```typescript
{
  build: {
    // 自动检测 turbo.json
    useTurbo?: boolean;                  // 是否使用 Turbo（默认: 自动检测）
    turboConfigPath?: string;            // Turbo 配置文件路径
    turboTasks?: string[];               // 要执行的 Turbo 任务
  }
}

// 示例
{
  build: {
    useTurbo: true,
    turboTasks: ['build', 'test'],      // 执行 build 和 test 任务
    // Turbo 会自动处理依赖顺序
  }
}
```

#### 3.11 工作流示例

完整的 pnpm workspace + Changeset 发布流程：

```
1. 检测项目环境
   ├─ 检测 pnpm workspace（读取 pnpm-workspace.yaml）
   ├─ 检测 packageManager（从 package.json）
   ├─ 检测 Changeset（检查 .changeset 目录）
   ├─ 检测 Turbo（检查 turbo.json）
   └─ 验证项目结构

2. 发现包
   ├─ 执行 pnpm list -r --depth -1
   ├─ 解析包信息
   └─ 过滤私有包和排除项

3. 分析依赖关系
   ├─ 读取所有 package.json
   ├─ 构建依赖图
   └─ 拓扑排序

4. Changeset 检查（如果使用 changeset）
   ├─ 检查 .changeset/*.md 文件
   ├─ 如果没有 changeset 文件：
   │  ├─ 提示创建 changeset（交互式）
   │  ├─ 运行 changeset 命令
   │  └─ 等待用户创建
   └─ 如果有 changeset 文件：继续流程

5. 版本管理
   ├─ 如果使用 changeset：
   │  ├─ 运行 changeset:version
   │  ├─ 更新所有包版本
   │  ├─ 更新 CHANGELOG.md（如果配置）
   │  └─ 清理已应用的 changeset 文件
   └─ 如果使用 manual：
      ├─ 交互式选择版本类型
      └─ 手动更新版本号
   ├─ 替换 workspace 协议为实际版本
   └─ 同步依赖版本

6. Git 提交（如果配置）
   ├─ 添加版本相关文件
   ├─ 提交版本更新
   ├─ 创建 Git 标签
   └─ 推送到远程

7. 构建（按依赖顺序）
   ├─ 使用 Turbo 或 pnpm filter
   ├─ 确保依赖顺序正确
   └─ 验证构建产物

8. 发布到 NPM
   ├─ 如果使用 changeset：
   │  ├─ 运行 changeset:publish
   │  ├─ 支持 OTP 交互式输入
   │  └─ 验证发布结果
   └─ 如果使用其他策略：
      ├─ 按依赖顺序发布（先发布被依赖的包）
      ├─ 替换 workspace 协议为实际版本
      └─ 验证发布结果
```

### 4. CLI 接口

#### 4.1 命令结构

```bash
# 基础用法
qingniao [options]
# 或使用简短命令
qn [options]

# 选项
--config, -c <path>        # 指定配置文件路径
--dry-run                  # 仅执行 dry-run
--skip-version             # 跳过版本更新
--skip-build               # 跳过构建检查
--skip-publish             # 跳过发布（仅执行版本更新和构建）
--yes, -y                  # 跳过所有确认提示
--verbose, -v              # 详细输出
--silent, -s               # 静默模式
```

#### 4.2 使用示例

```bash
# 使用默认配置
qingniao
# 或
qn

# 使用自定义配置文件
qingniao --config ./qingniao.config.ts
# 或
qn -c ./qingniao.config.ts

# 仅执行 dry-run
qingniao --dry-run

# 跳过版本更新，仅发布
qingniao --skip-version

# 非交互模式（CI/CD）
qingniao --yes
```

### 5. 执行流程

```
1. 加载配置
   ├─ 查找配置文件
   ├─ 验证配置格式
   └─ 合并默认值

2. 环境检查
   ├─ NPM 认证检查
   ├─ Git 状态检查
   └─ 远程同步检查

3. 版本管理（可选）
   ├─ 选择版本策略
   ├─ 更新版本号
   ├─ 提交到 Git
   ├─ 创建标签
   └─ 推送到远程

4. 构建验证
   ├─ 执行构建步骤
   ├─ 验证构建产物
   └─ 运行测试

5. 发布准备
   ├─ 发现可发布的包
   ├─ 检查已存在的版本
   └─ 确认发布列表

6. 发布执行
   ├─ Dry-run（可选）
   ├─ 正式发布
   └─ 验证发布结果
```

### 6. 钩子系统

支持在关键节点执行自定义逻辑：

```typescript
interface Context {
  version?: string;                    // 当前版本
  packages: PackageInfo[];            // 可发布的包列表
  config: PublishConfig;               // 完整配置
  rootDir: string;                     // 项目根目录
  [key: string]: any;                  // 扩展字段
}

// 钩子函数示例
hooks: {
  beforeVersion: async (ctx) => {
    // 版本更新前的自定义逻辑
    await updateChangelog(ctx.version);
  },
  afterPublish: async (ctx) => {
    // 发布后的通知逻辑
    await notifyTeam(ctx.packages);
  },
}
```

### 7. 错误处理

- **配置错误**：清晰的错误消息和配置验证提示
- **执行错误**：详细的错误堆栈和恢复建议
- **网络错误**：重试机制和超时处理
- **权限错误**：明确的权限要求和解决步骤

### 8. 日志和输出

- **结构化日志**：支持不同日志级别（debug, info, warn, error）
- **进度显示**：使用 Listr 显示任务进度
- **彩色输出**：使用 chalk 提供友好的终端输出
- **静默模式**：支持 CI/CD 环境的静默执行

## 实现计划

### Phase 1: 核心框架（MVP）

1. **零配置系统（优先）**
   - 包管理器自动检测（packageManager 字段、lockfile）
   - Workspace 类型自动检测（pnpm/yarn/npm）
   - 包发现自动推断（workspace 命令）
   - 构建命令自动推断（package.json scripts）
   - 构建产物路径自动推断（package.json 字段、目录检测）

2. **配置系统**
   - 配置文件加载器（支持多种格式）
   - 配置验证器
   - 默认配置合并
   - 零配置与配置文件合并逻辑

3. **基础执行引擎**
   - 命令执行工具
   - 上下文管理
   - 错误处理

4. **基础阶段实现**
   - NPM 认证检查
   - Git 状态检查
   - 版本管理（manual 模式）
   - 包发现（零配置优先）
   - **pnpm workspace 检测**（Phase 1.5）
     - 自动检测 pnpm-workspace.yaml
     - 使用 pnpm list 发现包
     - 基础依赖关系分析

### Phase 2: 完整功能

1. **版本管理增强**
   - **Changeset 深度集成**（优先）
     - 自动检测 .changeset 目录
     - 读取 .changeset/config.json 配置
     - 自动生成 changeset 命令（根据包管理器）
     - Changeset 文件检查和创建流程
     - Changeset 版本更新集成
     - Changeset 发布集成
     - Changeset 与 Git 集成
     - Changeset 与 CHANGELOG 集成
     - Changeset 钩子支持
   - Semver 自动升级
   - 自定义版本策略

2. **构建系统**
   - 构建步骤执行
   - 产物验证
   - 测试集成

3. **发布流程**
   - NPM 发布
   - Dry-run 支持
   - 版本检查
   - **pnpm workspace 完整支持**（Phase 2.5）
     - workspace 协议替换
     - 依赖顺序构建和发布
     - Turbo 集成
     - 版本同步策略

### Phase 3: 高级特性

1. **钩子系统**
   - 钩子函数支持
   - 插件机制

2. **CLI 增强**
   - 交互式提示
   - 进度显示
   - 详细日志

3. **文档和示例**
   - 完整文档
   - 配置示例
   - 迁移指南

## 迁移路径

### 从现有脚本迁移

1. **分析现有脚本**：提取硬编码的配置
2. **创建配置文件**：将配置转换为标准格式
3. **测试验证**：在测试环境验证配置
4. **逐步替换**：替换现有脚本为新工具

### 迁移示例

**原脚本中的硬编码**：

```javascript
// 硬编码的包列表
const builds = [
  ["@wsxjs/wsx-core", "packages/core/dist"],
  ["@wsxjs/wsx-vite-plugin", "packages/vite-plugin/dist"],
];
```

**迁移到配置**：

```json
{
  "build": {
    "verifyArtifacts": [
      { "package": "@wsxjs/wsx-core", "path": "packages/core/dist" },
      { "package": "@wsxjs/wsx-vite-plugin", "path": "packages/vite-plugin/dist" }
    ]
  }
}
```

## 优点

1. **零配置优先**：完全依赖 package.json 和 workspace 配置，开箱即用
2. **可重用性**：通过配置适配不同项目，但零配置已覆盖大多数场景
3. **可维护性**：配置与代码分离，易于更新；零配置无需维护
4. **可扩展性**：支持钩子和插件机制，仅在需要时配置
5. **类型安全**：完整的 TypeScript 支持
6. **开发友好**：清晰的错误消息和文档；零配置降低使用门槛
7. **智能推断**：自动检测项目结构、工具和配置，减少手动设置

## 缺点

1. **学习曲线**：需要理解配置结构
2. **初始设置**：需要创建配置文件
3. **抽象成本**：可能不如直接脚本灵活

## 考虑的替代方案

1. **保持现状**：继续使用硬编码脚本
   - 优点：简单直接
   - 缺点：难以重用和维护

2. **使用现有工具**：如 `changesets`、`lerna` 等
   - 优点：成熟稳定
   - 缺点：功能固定，难以定制

3. **模板系统**：提供脚本模板
   - 优点：简单易用
   - 缺点：仍需手动修改

## 后续工作

1. **插件系统**：支持第三方插件扩展功能
2. **多 registry 支持**：支持发布到多个 NPM registry
3. **CI/CD 集成**：提供 GitHub Actions、GitLab CI 等集成
4. **可视化界面**：提供 Web UI 进行配置管理

## 参考文献

- [Changesets](https://github.com/changesets/changesets)
- [Lerna](https://lerna.js.org/)
- [Semantic Versioning](https://semver.org/)
- [Turbo](https://turbo.build/)

## 变更日志

- **2025-01-XX**: 初始版本，定义通用发布工具设计规范

