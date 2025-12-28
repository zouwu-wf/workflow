# 开发指南 - Zouwu Workflow

本文档提供 Zouwu Workflow 项目的完整开发指南，包括环境设置、开发流程、调试技巧和常见问题。

## 📋 目录

- [环境要求](#环境要求)
- [项目结构](#项目结构)
- [快速开始](#快速开始)
- [包开发指南](#包开发指南)
- [开发工作流](#开发工作流)
- [调试技巧](#调试技巧)
- [常见问题](#常见问题)
- [相关文档](#相关文档)

## 环境要求

### 必需工具

1. **Node.js** (推荐使用 Volta 管理版本)
    - 版本：22.10.0（通过 Volta 自动管理）
    - 安装：项目使用 Volta，会自动使用正确的版本

2. **pnpm** (包管理器)
    - 版本：9.0.0（通过 Volta 自动管理）
    - 安装：`npm install -g pnpm@9.0.0`

3. **Bun** (仅用于 `@zouwu-wf/design` 包)
    - 安装：`curl -fsSL https://bun.sh/install | bash`
    - 验证：`bun --version`

### 可选工具

- **Volta**：用于管理 Node.js 和 pnpm 版本（推荐）
- **Turbo**：用于任务编排（已包含在项目中）

## 项目结构

```
zouwu-workflow/
├── packages/                    # 所有包
│   ├── @systembug/             # 系统工具包
│   │   ├── qingniao/          # 发布工具
│   │   └── diting/            # 其他工具
│   └── @zouwu-wf/             # 核心包
│       ├── workflow/         # 工作流引擎
│       ├── cli/              # CLI 工具
│       ├── expression-parser/ # 表达式解析器
│       ├── logger/           # 日志工具
│       ├── components/       # React 组件库
│       ├── graph/            # 图形转换工具
│       └── design/           # 可视化设计工具
├── docs/                      # 文档
│   ├── rfc/                  # RFC 文档
│   ├── qingniao-usage.md    # 发布工具使用指南
│   └── DEV_GUIDE.md         # 本文件
├── .changeset/               # Changeset 配置
├── turbo.json                # Turbo 配置
├── pnpm-workspace.yaml       # pnpm workspace 配置
└── package.json              # 根 package.json
```

## 快速开始

### 1. 克隆仓库

```bash
git clone <repository-url>
cd zouwu-workflow
```

### 2. 安装依赖

```bash
# 安装所有包的依赖
pnpm install
```

这会自动：

- 安装所有工作区包的依赖
- 链接 workspace 依赖
- 设置 Git hooks（Husky）

### 3. 验证安装

```bash
# 检查 Node.js 版本（Volta 会自动使用正确版本）
node --version  # 应该是 22.10.0

# 检查 pnpm 版本
pnpm --version  # 应该是 9.0.0

# 检查 Bun（如果开发 design 包）
bun --version

# 运行类型检查
pnpm typecheck

# 运行 lint
pnpm lint
```

## 包开发指南

### 核心包

#### @zouwu-wf/workflow

工作流引擎核心包。

```bash
cd packages/@zouwu-wf/workflow

# 开发
pnpm dev

# 构建
pnpm build

# 测试
pnpm test

# 类型检查
pnpm typecheck
```

#### @zouwu-wf/cli

命令行工具。

```bash
cd packages/@zouwu-wf/cli

# 开发
pnpm dev

# 构建
pnpm build

# 测试
pnpm test
```

#### @zouwu-wf/expression-parser

表达式解析器。

```bash
cd packages/@zouwu-wf/expression-parser

# 开发
pnpm dev

# 构建
pnpm build

# 测试
pnpm test
```

#### @zouwu-wf/components

React 组件库。

```bash
cd packages/@zouwu-wf/components

# 开发（如果有 watch 模式）
pnpm dev

# 构建
pnpm build

# 类型检查
pnpm typecheck
```

#### @zouwu-wf/graph

图形转换工具。

```bash
cd packages/@zouwu-wf/graph

# 开发
pnpm dev

# 构建
pnpm build
```

### 设计工具

#### @zouwu-wf/design

可视化设计工具（需要 Bun）。

**详细开发指南**：请查看 [packages/@zouwu-wf/design/DEV.md](../../packages/@zouwu-wf/design/DEV.md)

**快速开始**：

```bash
# 在根目录
pnpm design

# 或在包目录
cd packages/@zouwu-wf/design
pnpm dev
```

**访问**：

- 前端界面：`http://localhost:3001`
- API 端点：`http://localhost:3000/api/*`

### 工具包

#### @systembug/qingniao

发布工具。

**使用指南**：请查看 [docs/qingniao-usage.md](./qingniao-usage.md)

```bash
# 发布（交互式）
pnpm release

# Dry-run
pnpm release:dry-run
```

## 开发工作流

### 1. 创建新功能

```bash
# 1. 创建新分支
git checkout -b feat/new-feature

# 2. 开发代码
# ... 编写代码 ...

# 3. 运行检查
pnpm lint
pnpm typecheck
pnpm test

# 4. 提交代码
git add .
git commit -m "feat: 新功能描述"
```

### 2. 修改依赖包

如果修改了某个依赖包（如 `@zouwu-wf/components`），需要重新构建：

```bash
# 1. 进入依赖包目录
cd packages/@zouwu-wf/components

# 2. 构建
pnpm build

# 3. 回到使用该包的目录继续开发
cd ../design
pnpm dev
```

**注意**：如果使用 `workspace:*` 依赖，修改后需要重新构建依赖包。

### 3. 同时开发多个包

```bash
# 终端 1: 开发 components
cd packages/@zouwu-wf/components
pnpm dev  # 如果有 watch 模式

# 终端 2: 开发 graph
cd packages/@zouwu-wf/graph
pnpm dev

# 终端 3: 开发 design
cd packages/@zouwu-wf/design
pnpm dev
```

### 4. 运行所有检查

```bash
# 在根目录运行
pnpm lint        # 代码检查
pnpm typecheck   # 类型检查
pnpm test        # 运行测试
pnpm build       # 构建所有包
```

### 5. 提交前检查

项目使用 Husky 进行 Git hooks，提交前会自动运行：

- `lint`：代码检查
- `format`：代码格式化
- `typecheck`：类型检查

如果检查失败，提交会被阻止。

## 调试技巧

### TypeScript 调试

```bash
# 运行类型检查并显示详细错误
pnpm typecheck

# 在特定包中运行类型检查
pnpm --filter @zouwu-wf/design typecheck
```

### 调试设计工具

**详细调试指南**：请查看 [packages/@zouwu-wf/design/DEBUG.md](../../packages/@zouwu-wf/design/DEBUG.md)

**快速调试**：

```bash
# 调试模式（带 Node.js Inspector）
pnpm design:debug

# 或使用 Bun
cd packages/@zouwu-wf/design
bun --inspect run src/cli.ts
```

然后在 Chrome 中打开 `chrome://inspect` 进行调试。

### VS Code 调试

1. 按 `F5` 启动调试
2. 选择相应的调试配置
3. 设置断点并开始调试

### 日志调试

```bash
# 查看详细日志
DEBUG=* pnpm design

# 查看特定包的日志
pnpm --filter @zouwu-wf/design dev
```

## 常见问题

### Q: 端口被占用？

```bash
# 查找占用端口的进程
lsof -ti:3000
lsof -ti:3001

# 杀死进程
kill -9 $(lsof -ti:3000)
kill -9 $(lsof -ti:3001)
```

### Q: 依赖安装失败？

```bash
# 清理并重新安装
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

### Q: TypeScript 类型错误？

```bash
# 运行类型检查查看详细错误
pnpm typecheck

# 如果错误太多，可以先修复一个包
pnpm --filter @zouwu-wf/workflow typecheck
```

### Q: 修改依赖包不生效？

1. 确认依赖包已重新构建：

    ```bash
    cd packages/@zouwu-wf/components
    pnpm build
    ```

2. 重启使用该包的开发服务器

3. 检查 `node_modules` 中的包是否更新

### Q: Vite 配置中 CommonJS 模块导入问题？

如果在 Vite 配置中遇到 `monacoEditorPlugin is not a function` 错误，请查看：

- [packages/@zouwu-wf/design/COMMONJS_IMPORT.md](../../packages/@zouwu-wf/design/COMMONJS_IMPORT.md)
- [RFC 0008: Vite CommonJS 模块导入解决方案](./rfc/0008-vite-commonjs-import-solution.md)

### Q: Bun 命令未找到？

```bash
# 安装 Bun
curl -fsSL https://bun.sh/install | bash

# 重新加载 shell
exec /bin/zsh
# 或
source ~/.zshrc

# 验证安装
bun --version
```

### Q: Git hooks 不工作？

```bash
# 重新安装 hooks
pnpm prepare

# 或手动运行
husky install
```

### Q: Turbo 缓存问题？

```bash
# 清理 Turbo 缓存
pnpm turbo clean

# 或删除 .turbo 目录
rm -rf .turbo
```

## 开发最佳实践

### 1. 代码风格

- 使用 Prettier 格式化代码（自动运行）
- 遵循 ESLint 规则
- 使用 TypeScript 严格模式

### 2. 提交规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

```bash
feat: 新功能
fix: 修复 bug
docs: 文档更新
style: 代码格式
refactor: 重构
test: 测试
chore: 构建/工具
```

### 3. 测试

- 编写单元测试
- 运行测试确保通过
- 保持测试覆盖率

### 4. 类型安全

- 使用 TypeScript 严格模式
- 避免使用 `any`
- 为公共 API 提供类型定义

### 5. 文档

- 更新相关文档
- 添加代码注释
- 更新 CHANGELOG

## 相关文档

### 包特定文档

- **[@zouwu-wf/design 开发指南](../../packages/@zouwu-wf/design/DEV.md)**: 设计工具的详细开发指南
- **[@zouwu-wf/design 调试指南](../../packages/@zouwu-wf/design/DEBUG.md)**: 调试技巧和工具
- **[@zouwu-wf/design CommonJS 导入](../../packages/@zouwu-wf/design/COMMONJS_IMPORT.md)**: CommonJS 模块导入解决方案

### 项目文档

- **[发布工具使用指南](./qingniao-usage.md)**: 青鸟发布工具的使用方法
- **[RFC 文档](./rfc/README.md)**: 设计文档和规范
- **[RFC 0008: Vite CommonJS 导入](./rfc/0008-vite-commonjs-import-solution.md)**: CommonJS 模块导入解决方案

### 工具文档

- **[Turbo 文档](https://turbo.build/repo/docs)**: 任务编排工具
- **[pnpm 文档](https://pnpm.io/)**: 包管理器
- **[Bun 文档](https://bun.sh/docs)**: JavaScript 运行时
- **[Vite 文档](https://vitejs.dev/)**: 构建工具

## 获取帮助

如果遇到问题：

1. 查看本文档的[常见问题](#常见问题)部分
2. 查看相关包的文档
3. 查看 [RFC 文档](./rfc/README.md) 了解设计决策
4. 提交 Issue 或联系维护者

---

**Happy Coding! 🚀**
