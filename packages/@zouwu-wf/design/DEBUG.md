# 调试指南

## 前置要求

这个项目需要 **Bun** 运行时。如果还没有安装，请先安装：

```bash
# macOS/Linux
curl -fsSL https://bun.sh/install | bash

# 或使用 npm
npm install -g bun

# 验证安装
bun --version
```

## 调试运行方法

### 方法 1: 在根目录运行（推荐）

```bash
# 在项目根目录运行
# 基本运行
pnpm design

# 带参数运行（需要先构建或使用 -- 传递参数）
pnpm design -- --dir ./workflows --port 3000 --open

# 调试模式
pnpm design:debug

# Watch 模式
pnpm design
```

### 方法 2: 在包目录运行

```bash
cd packages/@zouwu-wf/design

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
```

### 方法 2: 直接使用 Bun

```bash
cd packages/@zouwu-wf/design

# 基本运行
bun run src/cli.ts

# 带参数
bun run src/cli.ts --dir ./workflows --port 3000 --open

# 调试模式
bun --inspect run src/cli.ts

# Watch 模式
bun --watch run src/cli.ts
```

### 方法 3: 使用 VS Code 调试

1. 打开 VS Code
2. 按 `F5` 或点击"运行和调试"
3. 选择 "Debug Zouwu Design (Bun)" 配置
4. 或选择 "Debug Zouwu Design with Args" 使用自定义参数

### 方法 4: 使用 Chrome DevTools

```bash
# 启动调试模式
bun --inspect run src/cli.ts

# 然后在 Chrome 中打开
# chrome://inspect
# 点击 "inspect" 链接
```

## 常用调试命令

```bash
# 同时启动 Bun 服务器和 Vite 开发服务器
# - Bun 服务器：http://localhost:3000（API 和静态文件）
# - Vite 开发服务器：http://localhost:3001（前端热重载）
pnpm dev

# 仅启动 Bun 服务器（带参数）
pnpm dev:server -- --dir ./workflows --port 3000 --open

# 仅启动 Vite 开发服务器
pnpm dev:client

# 指定工作流目录（需要在 dev:server 中使用）
pnpm dev:server -- --dir ./my-workflows

# 指定端口（需要在 dev:server 中使用）
pnpm dev:server -- --port 8080

# 自动打开浏览器（需要在 dev:server 中使用）
pnpm dev:server -- --open

# 完整示例（仅服务器）
pnpm dev:server -- --dir ./workflows --port 3000 --host localhost --open
```

## 调试技巧

### 1. 添加断点

在代码中添加 `debugger;` 语句，然后在调试模式下运行。

### 2. 查看日志

服务器启动后会输出日志，包括：

- 工作流目录路径
- 服务器地址
- 文件变化通知

### 3. 检查 API

服务器启动后，可以访问：

- `http://localhost:3000/api/workflows` - 获取工作流列表
- `http://localhost:3000/api/directory` - 获取目录信息

### 4. 热重载

使用 `--watch` 模式（默认启用），文件变化时服务器会自动重启。

## 故障排除

### Bun 未找到

```bash
# 安装 Bun
curl -fsSL https://bun.sh/install | bash

# 或添加到 PATH
export PATH="$HOME/.bun/bin:$PATH"
```

### 端口被占用

```bash
# 使用其他端口
pnpm dev -- --port 3001
```

### 工作流目录不存在

```bash
# 创建目录
mkdir -p ./workflows

# 或指定现有目录
pnpm dev -- --dir ./existing-workflows
```

## 开发工作流

1. **启动开发服务器**

    ```bash
    pnpm dev
    ```

2. **在另一个终端测试 API**

    ```bash
    curl http://localhost:3000/api/workflows
    ```

3. **修改代码后**
    - 如果使用 `--watch` 模式，会自动重启
    - 否则需要手动重启服务器

4. **查看错误**
    - 检查终端输出
    - 检查浏览器控制台（如果前端已实现）
