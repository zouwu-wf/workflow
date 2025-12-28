# @zouwu-wf/design

🌌 驺吾工作流可视化设计工具 - 基于 Bun 和 React Flow 的工作流设计器

## 功能特性

- 🎨 可视化工作流设计
- 📋 工作流列表管理
- 🔄 实时 YAML 同步
- 🎯 拖拽式节点编辑
- ✅ 工作流验证
- 📱 响应式设计

## 安装

```bash
npm install -g @zouwu-wf/design
```

## 使用

```bash
# 启动设计服务器（默认使用 ./workflows 目录）
zouwu-design

# 如果 ./workflows 目录不存在，会自动创建

# 指定其他工作流目录
zouwu-design --dir ./my-workflows

# 指定端口
zouwu-design --port 3000

# 自动打开浏览器
zouwu-design --open

# 完整示例
zouwu-design --dir ./workflows --port 3000 --open
```

**注意**：默认工作流目录是 `./workflows`（相对于当前工作目录）。如果目录不存在，程序会自动创建。

## 生产模式

发布后的包已经包含了构建好的前端文件（`dist/client/`）。Bun 服务器会自动检测并提供静态文件服务。

**使用方式：**

```bash
# 全局安装
npm install -g @zouwu-wf/design

# 启动服务器（自动提供前端和 API）
zouwu-design

# 或使用 npx（无需安装）
npx zouwu-design
```

**工作原理：**

1. **发布时**：`prepublishOnly` 脚本会自动构建：
    - 服务器端代码 → `dist/`（库文件）
    - 客户端代码 → `dist/client/`（静态文件）

2. **运行时**：Bun 服务器会：
    - 检查 `dist/client/` 目录是否存在
    - 如果存在，使用 `staticPlugin` 提供静态文件服务
    - 同时提供 API 路由 (`/api/*`)
    - 根路径 `/` 返回前端应用

3. **单一服务器**：生产模式下只需要一个 Bun 服务器，同时提供：
    - 前端应用（React 应用）
    - API 服务（工作流管理）
    - 静态资源（CSS、JS、图片等）

**端口：** 默认端口 3000，可通过 `--port` 选项修改。

## 开发

详细的本地开发指南请查看 [DEV.md](./DEV.md)。

## 常见问题

### CommonJS 模块导入问题

如果在 Vite 配置中遇到 CommonJS 模块导入问题，请查看 [COMMONJS_IMPORT.md](./COMMONJS_IMPORT.md) 了解解决方案。

### 快速开始

**前置要求：** 需要安装 **Bun** 运行时

```bash
# 安装 Bun（macOS/Linux）
curl -fsSL https://bun.sh/install | bash

# 或使用 npm
npm install -g bun

# 验证安装
bun --version
```

**启动开发服务器：**

```bash
# 在包目录
cd packages/@zouwu-wf/design

# 安装依赖
pnpm install

# 启动开发（同时启动 Bun 和 Vite）
pnpm dev
```

**访问应用：**

- 前端界面：`http://localhost:3001`
- API 端点：`http://localhost:3000/api/*`

### 开发模式命令

```bash
# 同时启动 Bun 服务器（端口 3000）和 Vite 开发服务器（端口 3001）
# - Bun 服务器：监听文件变化自动重启
# - Vite 开发服务器：自动热重载前端代码
pnpm dev

# 仅启动 Bun 服务器（带 watch）
pnpm dev:server

# 仅启动 Vite 开发服务器（带热重载）
pnpm dev:client

# 调试模式（同时启动服务器和客户端，带调试）
pnpm dev:debug

# 启动服务器（不启用 watch 模式）
pnpm dev:no-watch
```

**更多开发信息：** 查看 [DEV.md](./DEV.md) 了解完整的开发工作流、调试技巧和常见问题。

**如果遇到 "bun: command not found" 错误**：

1. 安装 Bun：`curl -fsSL https://bun.sh/install | bash`
2. 重新加载 shell：`exec /bin/zsh` 或 `source ~/.zshrc`
3. 验证安装：`bun --version`

详细说明请查看 [INSTALL.md](./INSTALL.md)

### 调试运行

#### 在根目录运行（推荐）

```bash
# 在项目根目录
# 基本运行
pnpm design

# 带参数运行
pnpm design -- --dir ./workflows --port 3000 --open

# 调试模式（带 watch）
pnpm design:debug

# 注意：dev 命令默认已启用 watch 模式
```

#### 在包目录运行

```bash
# 进入包目录
cd packages/@zouwu-wf/design

# 安装依赖（如果还没安装）
pnpm install

# 开发模式（默认启用 watch，文件变化自动重启）
pnpm dev

# 开发模式（带参数）
pnpm dev -- --dir ./workflows --port 3000 --open

# 开发模式（不启用 watch）
pnpm dev:no-watch

# 调试模式（启用 Node.js Inspector，带 watch）
pnpm dev:debug
```

### 直接使用 Bun

```bash
# 基本运行
bun run src/cli.ts

# 带参数
bun run src/cli.ts --dir ./workflows --port 3000 --open

# 调试模式
bun --inspect run src/cli.ts
```

### VS Code 调试

1. 按 `F5` 启动调试
2. 选择 "Debug Zouwu Design (Bun)" 配置
3. 或使用 "Debug Zouwu Design with Args" 使用自定义参数

详细调试说明请查看 [DEBUG.md](./DEBUG.md)

### 构建

```bash
# 构建项目
pnpm build
```

## 许可证

MIT
