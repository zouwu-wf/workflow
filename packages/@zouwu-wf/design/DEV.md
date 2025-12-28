# 本地开发指南

本文档说明如何在本地开发 `@zouwu-wf/design` 包。

## 前置要求

### 1. 安装 Bun

```bash
# macOS/Linux
curl -fsSL https://bun.sh/install | bash

# 或使用 npm
npm install -g bun

# 验证安装
bun --version
```

### 2. 安装依赖

在项目根目录：

```bash
pnpm install
```

这会安装所有工作区包的依赖，包括：

- `@zouwu-wf/design`
- `@zouwu-wf/workflow-components`
- `@zouwu-wf/workflow-graph`
- `@zouwu-wf/workflow`

## 本地开发流程

### 方式 1: 在包目录开发（推荐）

```bash
# 进入包目录
cd packages/@zouwu-wf/design

# 安装依赖（如果还没安装）
pnpm install

# 启动开发服务器（同时启动 Bun 和 Vite）
pnpm dev
```

**这会启动：**

- **Bun 服务器**：`http://localhost:3000`
    - API 路由：`/api/*`
    - 文件监听：自动重启
- **Vite 开发服务器**：`http://localhost:3001`
    - React 应用：前端界面
    - HMR：热模块替换
    - 代理：`/api/*` → `http://localhost:3000`

**浏览器访问：** `http://localhost:3001`

### 方式 2: 在根目录开发

```bash
# 在项目根目录
pnpm design
```

这会自动进入 `@zouwu-wf/design` 包并运行 `pnpm dev`。

### 方式 3: 仅开发服务器端

```bash
cd packages/@zouwu-wf/design
pnpm dev:server
```

只启动 Bun 服务器，用于测试 API。

### 方式 4: 仅开发客户端

```bash
cd packages/@zouwu-wf/design
pnpm dev:client
```

只启动 Vite 开发服务器，用于前端开发（需要 Bun 服务器在另一个终端运行）。

**注意：** `dev:client` 脚本会自动设置 `BUILD_CLIENT=true`，确保使用正确的 Vite 配置（包含代理）。

## Vite 代理配置说明

### 为什么需要代理？

在开发模式下，我们有两个服务器：

- **Bun 服务器**（端口 3000）：提供 API 路由
- **Vite 服务器**（端口 3001）：提供前端应用和 HMR

浏览器只连接到 Vite 服务器（3001），所以需要 Vite 将 `/api/*` 请求代理到 Bun 服务器（3000）。

### 代理配置的工作原理

**`vite.config.ts` 中有两个配置：**

1. **`clientConfig`**（用于开发）：

    ```typescript
    const clientConfig = defineConfig({
        server: {
            port: 3001,
            proxy: {
                "/api": {
                    target: "http://localhost:3000",
                    changeOrigin: true,
                },
            },
        },
    });
    ```

2. **`libConfig`**（用于库构建）：

    ```typescript
    const libConfig = defineConfig({
      // 没有 server 配置
      build: { lib: { ... } },
    });
    ```

3. **配置选择逻辑：**
    ```typescript
    export default process.env.BUILD_CLIENT ? clientConfig : libConfig;
    ```

### 为什么代理不工作？

**问题：** `dev:client` 脚本没有设置 `BUILD_CLIENT=true`

**结果：**

- Vite 使用 `libConfig`（没有 `server` 配置）
- 代理配置不生效
- API 请求返回 HTML 而不是 JSON

**修复：**

```json
// package.json
"dev:client": "BUILD_CLIENT=true vite"
```

这样 Vite 会使用 `clientConfig`，代理配置生效。

### 验证代理是否工作

1. **查看 Vite 启动日志**：
    - 应该能看到代理配置信息
    - 如果看到 `[Vite 代理]` 日志，说明代理正常工作

2. **测试 API 请求**：

    ```bash
    # 在浏览器中访问
    http://localhost:3001/api/workflows
    ```

    - ✅ 应该返回 JSON 数据
    - ❌ 如果返回 HTML，说明代理没有生效

3. **检查浏览器 Network 面板**：
    - 查看 `/api/workflows` 请求
    - 检查请求 URL 和响应内容

## 开发工作流

### 1. 修改服务器代码

**文件位置：** `src/server/**/*.ts`

**修改后：**

- Bun 的 `--watch` 会自动重启服务器
- 查看终端输出确认重启

**测试：**

```bash
# 在另一个终端测试 API
curl http://localhost:3000/api/workflows
```

### 2. 修改客户端代码

**文件位置：** `src/client/**/*.{ts,tsx,css}`

**修改后：**

- Vite 自动重新编译
- 浏览器自动刷新（HMR）
- 无需手动刷新页面

**查看：**

- 浏览器控制台：查看前端日志
- Vite 终端：查看编译信息

### 3. 修改共享代码

**文件位置：** `src/shared/**/*.ts`

**影响：**

- 服务器和客户端都可能使用
- 修改后两者都会重新加载

### 4. 修改依赖包

如果修改了依赖包（如 `@zouwu-wf/workflow-components`）：

```bash
# 1. 在依赖包目录构建
cd packages/@zouwu-wf/workflow-components
pnpm build

# 2. 或者在开发模式下监听
pnpm dev  # 如果有 watch 模式

# 3. 回到 design 包继续开发
cd ../design
pnpm dev
```

**注意：** 如果使用 `workspace:*` 依赖，修改后需要重新构建依赖包。

## 调试

### 调试服务器

```bash
# 方式 1: 使用调试模式
pnpm dev:debug

# 方式 2: 直接使用 Bun
bun --inspect --watch run src/cli.ts
```

然后在 Chrome 中打开 `chrome://inspect` 进行调试。

### 调试客户端

1. 打开浏览器开发者工具（F12）
2. 在 Sources 标签页设置断点
3. 使用 React DevTools 扩展

### VS Code 调试

1. 按 `F5` 或点击"运行和调试"
2. 选择 "Debug Zouwu Design (Bun)" 配置
3. 设置断点并开始调试

## 常见开发场景

### 场景 1: 添加新的 API 路由

1. 编辑 `src/server/index.ts`
2. 添加新的路由：
    ```typescript
    app.get("/api/new-endpoint", async () => {
        return { data: "test" };
    });
    ```
3. Bun 自动重启
4. 测试：`curl http://localhost:3000/api/new-endpoint`

### 场景 2: 添加新的 React 组件

1. 在 `src/client/components/` 创建新组件
2. 在 `src/client/App.tsx` 中导入使用
3. Vite 自动重新编译
4. 浏览器自动刷新显示新组件

### 场景 3: 修改工作流转换逻辑

1. 编辑 `packages/@zouwu-wf/workflow-graph/src/**/*.ts`
2. 重新构建：
    ```bash
    cd packages/@zouwu-wf/workflow-graph
    pnpm build
    ```
3. 回到 design 包继续开发

### 场景 4: 修改 Tree 组件

1. 编辑 `packages/@zouwu-wf/workflow-components/src/tree/**/*.tsx`
2. 重新构建：
    ```bash
    cd packages/@zouwu-wf/workflow-components
    pnpm build
    ```
3. 或者在开发模式下使用 watch：
    ```bash
    pnpm dev  # 如果有 watch 模式
    ```

## 文件结构

```
packages/@zouwu-wf/design/
├── src/
│   ├── cli.ts              # CLI 入口（开发时直接运行）
│   ├── index.ts            # 库入口（构建后导出）
│   ├── server/             # 服务器代码
│   │   ├── index.ts        # 服务器主文件
│   │   ├── workflow-manager.ts  # 工作流管理
│   │   └── api/            # API 路由（未来）
│   ├── client/             # 客户端代码
│   │   ├── main.tsx        # React 入口
│   │   ├── App.tsx         # 主应用组件
│   │   ├── pages/          # 页面组件
│   │   ├── components/    # 可重用组件
│   │   └── utils/          # 工具函数
│   └── shared/             # 共享代码
│       └── types.ts        # 类型定义
├── index.html              # HTML 入口（Vite）
├── package.json
├── vite.config.ts          # Vite 配置
└── tsconfig.json           # TypeScript 配置
```

## 开发技巧

### 1. 同时开发多个包

```bash
# 终端 1: 开发 workflow-components
cd packages/@zouwu-wf/workflow-components
pnpm dev  # 如果有 watch 模式

# 终端 2: 开发 workflow-graph
cd packages/@zouwu-wf/workflow-graph
pnpm dev

# 终端 3: 开发 design
cd packages/@zouwu-wf/design
pnpm dev
```

### 2. 快速测试 API

```bash
# 使用 curl
curl http://localhost:3000/api/workflows

# 使用 httpie（如果安装）
http GET http://localhost:3000/api/workflows

# 使用浏览器
# 直接访问 http://localhost:3000/api/workflows
```

### 3. 查看构建输出

```bash
# 构建后查看
pnpm build:all
ls -la dist/
```

### 4. 清理构建

```bash
# 删除构建产物
rm -rf dist/
```

### 5. 检查类型错误

```bash
pnpm typecheck
```

## 常见问题

### Q: 修改代码后没有自动刷新？

**A:**

- 服务器代码：检查 Bun 是否使用 `--watch`
- 客户端代码：检查 Vite 是否正常运行
- 依赖包：需要重新构建依赖包

### Q: 端口被占用？

**A:**

```bash
# 查找占用端口的进程
lsof -ti:3000
lsof -ti:3001

# 杀死进程
kill -9 $(lsof -ti:3000)
```

### Q: API 请求失败？返回 HTML 而不是 JSON？

**A:**

1. **确认 Bun 服务器正在运行（端口 3000）**

    ```bash
    # 检查端口
    lsof -ti:3000
    # 如果为空，启动服务器
    pnpm dev:server
    ```

2. **检查 Vite 代理配置是否正确**
    - 确认 `dev:client` 脚本包含 `BUILD_CLIENT=true`
    - 检查 `vite.config.ts` 中的代理配置
    - 确认使用的是 `clientConfig` 而不是 `libConfig`

3. **常见问题：代理不工作**

    **问题现象：**
    - API 请求返回 HTML（`<!DOCTYPE html>`）而不是 JSON
    - 浏览器控制台错误：`Unexpected token '<', "<!DOCTYPE "... is not valid JSON`

    **原因：**
    - `vite.config.ts` 有两个配置：
        - `clientConfig`：包含 `server` 和 `proxy` 配置（用于开发）
        - `libConfig`：不包含 `server` 配置（用于库构建）
    - 如果 `dev:client` 脚本没有设置 `BUILD_CLIENT=true`，Vite 会使用 `libConfig`，导致代理配置不生效

    **修复方法：**

    ```json
    // package.json
    "dev:client": "BUILD_CLIENT=true vite"
    ```

    而不是：

    ```json
    // ❌ 错误：没有设置环境变量
    "dev:client": "vite --port 3001"
    ```

    **验证代理是否工作：**
    - 查看 Vite 启动日志，应该能看到代理配置信息
    - 在浏览器中访问 `http://localhost:3001/api/workflows`
    - 应该返回 JSON 数据，而不是 HTML
    - 如果返回 HTML，说明代理没有生效

4. **查看浏览器网络标签页的请求详情**
    - 打开开发者工具 → Network
    - 查看 `/api/workflows` 请求
    - 检查请求 URL 和响应内容

### Q: 依赖包修改不生效？

**A:**

1. 确认依赖包已重新构建
2. 重启 design 包的开发服务器
3. 检查 `node_modules` 中的包是否更新

### Q: TypeScript 类型错误？

**A:**

```bash
# 运行类型检查
pnpm typecheck

# 查看详细错误
pnpm typecheck --pretty
```

## 下一步

开发完成后：

1. 运行测试（如果有）
2. 运行类型检查：`pnpm typecheck`
3. 运行 lint：`pnpm lint`
4. 构建验证：`pnpm build:all`
5. 提交代码
