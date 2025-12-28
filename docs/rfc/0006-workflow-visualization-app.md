# RFC 0006: 驺吾工作流可视化应用

- **开始日期**: 2025-12-27
- **更新日期**: 2025-12-27
- **RFC PR**:
- **实现议题**:
- **作者**: AI Assistant
- **状态**: Draft
- **命名空间**: `@zouwu-wf/design`

## 摘要

本 RFC 设计一个基于 **Bun** 的本地托管应用，提供 Web 界面来可视化和管理驺吾工作流。该应用使用 **React Flow** 进行工作流的图形化展示，支持动态设计和实时编辑。应用将作为驺吾工作流引擎的可视化工具，帮助开发者更直观地理解、设计和调试工作流。

**核心特性**：通过 `npx zouwu-design` 命令启动本地 Web 服务器，自动扫描指定目录中的 `.zouwu` 文件，提供工作流列表界面，支持创建新工作流、编辑现有工作流等完整的设计功能。

**包独立性**：`@zouwu-wf/design` 是一个**完全独立的包**，与 CLI 无关。它可以直接使用，也可以被 CLI 调用。CLI 只是作为一个可选的便捷启动方式，但 `@zouwu-wf/design` 本身不依赖 CLI。

## 动机

当前驺吾工作流以 .ZOUWU (YAML format) 文件形式存在，虽然人类可读，但在以下场景存在不足：

1. **可视化理解困难**：复杂工作流的步骤关系和流程难以通过文本快速理解
2. **设计效率低**：手动编写 YAML 容易出错，缺乏可视化设计工具
3. **调试不便**：无法直观看到工作流的执行状态和步骤流转
4. **协作困难**：非技术团队成员难以理解纯文本格式的工作流

通过构建一个可视化应用，可以：

- **提升理解效率**：图形化展示工作流结构，一目了然
- **简化设计流程**：拖拽式设计界面，降低工作流创建门槛
- **增强调试能力**：实时显示执行状态，快速定位问题
- **改善协作体验**：可视化界面便于团队沟通和审查

## 设计目标

1. **本地优先**：基于 Bun 的本地服务器，无需外部依赖
2. **实时可视化**：使用 React Flow 实现流畅的工作流图形展示
3. **动态设计**：支持拖拽、连接、编辑等交互式设计功能
4. **双向同步**：可视化编辑与 YAML 文件实时同步
5. **类型安全**：完整的 TypeScript 类型定义和验证
6. **响应式设计**：支持不同屏幕尺寸，适配桌面和移动端

## 包架构

### 包独立性

`@zouwu-wf/design` 是一个**完全独立的包**，与 CLI **完全无关**。它提供：

- 完整的服务器实现（Bun + Elysia/Hono）
- React 前端应用
- 工作流解析和转换功能
- 文件系统操作
- WebSocket 实时通信
- 独立的 CLI 入口（通过 `bin` 字段）

**重要**：`@zouwu-wf/design` 不依赖 `@zouwu-wf/cli`，可以单独安装和使用。CLI 包（`@zouwu-wf/cli`）可以选择性地调用 `@zouwu-wf/design` 作为启动方式，但这是可选的，不是必需的。

### 使用方式

**方式 1：直接使用 design 包（推荐）**

```bash
# 通过 npx 直接使用（design 包有自己的 bin 入口）
npx zouwu-design

# 或全局安装后使用
npm install -g @zouwu-wf/design
zouwu-design

# 指定参数
npx zouwu-design --dir ./workflows --port 3000
```

**方式 2：作为库使用（编程方式）**

```typescript
import { startServer } from "@zouwu-wf/design";

await startServer({
    port: 3000,
    host: "localhost",
    workflowDir: "./workflows",
});
```

**方式 3：使用转换工具**

```typescript
import { yamlToGraph, graphToYaml } from "@zouwu-wf/design";

// 在代码中使用转换功能
const graph = yamlToGraph(yamlContent);
const yaml = graphToYaml(graph);
```

**方式 4：通过 CLI（可选，CLI 内部调用 design 包）**

```bash
# CLI 可以选择性地提供便捷命令（调用 zouwu-design）
npx zouwu design
```

**注意**：方式 4 是可选的。`@zouwu-wf/design` 包本身就有自己的 CLI 入口，可以直接使用，不需要通过 `@zouwu-wf/cli`。

## CLI 入口（可选）

`@zouwu-wf/design` 包本身提供 CLI 入口，可以直接使用。`@zouwu-wf/cli` 可以选择性地提供便捷命令，但这不是必需的。

### Design 包自己的 CLI

`@zouwu-wf/design` 包在 `package.json` 中定义自己的 `bin` 入口：

```json
{
    "name": "@zouwu-wf/design",
    "bin": {
        "zouwu-design": "./dist/cli.js"
    }
}
```

### CLI 包的集成（可选）

如果 `@zouwu-wf/cli` 想要提供便捷命令，可以添加 `design` 命令，调用 `@zouwu-wf/design`：

```bash
# 启动可视化服务器（默认端口 3000）
npx zouwu-design

# 或通过 CLI 包（如果提供）
npx zouwu design

# 指定工作流目录
npx zouwu-design --dir ./workflows

# 指定端口
npx zouwu-design --port 3000

# 指定主机
npx zouwu-design --host localhost

# 完整示例
npx zouwu-design --dir ./workflows --port 3000 --host localhost --open
```

### 命令选项

```typescript
program
    .command("design")
    .description("🌌 启动工作流可视化设计服务器（调用 zouwu-design）")
    .option("-d, --dir <path>", "工作流文件目录路径", "./workflows")
    .option("-p, --port <number>", "服务器端口", "3000")
    .option("-h, --host <host>", "服务器主机", "localhost")
    .option("--open", "自动打开浏览器")
    .option("--watch", "监听文件变化（默认启用）")
    .action(async (options) => {
        // 启动 Bun 服务器
        // 扫描指定目录的 .zouwu 文件
        // 启动 Web 服务器
    });
```

### 工作流发现

服务器启动时自动扫描指定目录：

```typescript
async function discoverWorkflows(dir: string): Promise<WorkflowInfo[]> {
    const pattern = path.join(dir, "**/*.{zouwu,yml,yaml}").replace(/\\/g, "/");
    const files = await glob(pattern);

    return files.map((file) => {
        const content = readFileSync(file, "utf-8");
        const workflow = load(content);
        return {
            id: workflow.id,
            name: workflow.name || path.basename(file),
            path: file,
            version: workflow.version || "1.0.0",
            description: workflow.description,
            lastModified: statSync(file).mtime.getTime(),
        };
    });
}
```

## 技术栈

### 后端

- **Bun**: 高性能 JavaScript 运行时，用于本地服务器
- **Elysia** 或 **Hono**: 轻量级 Web 框架（基于 Bun 优化）
- **文件系统 API**: 读取和写入工作流 YAML 文件
- **WebSocket**: 实时更新和状态同步
- **chokidar** 或 **Bun 文件监听**: 监听工作流文件变化

### 前端

- **React**: UI 框架
- **React Flow**: 工作流图形化展示和编辑
- **TypeScript**: 类型安全
- **Tailwind CSS**: 样式框架
- **Zustand** 或 **Jotai**: 状态管理
- **Vite**: 构建工具（可选，或使用 Bun 的内置构建）

## 详细设计

### 1. 应用架构

```
┌─────────────────────────────────────────┐
│    CLI: npx zouwu-design                │
│    └─> 启动 Bun 服务器                  │
│        └─> 扫描工作流目录                │
│            └─> 启动 Web 服务器          │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│         Web Browser (Client)            │
│  ┌───────────────────────────────────┐  │
│  │   Workflow List View               │  │
│  │   - 工作流列表                      │  │
│  │   - 搜索和过滤                      │  │
│  │   - 新建/编辑/删除                  │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │   React Flow Canvas                 │  │
│  │   - 节点渲染                        │  │
│  │   - 连接线                          │  │
│  │   - 交互控制                        │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │   Control Panel                    │  │
│  │   - 属性编辑                       │  │
│  │   - 步骤配置                       │  │
│  │   - YAML 预览                      │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
              ↕ WebSocket / HTTP
┌─────────────────────────────────────────┐
│      Bun Server (Local Host)           │
│  ┌───────────────────────────────────┐  │
│  │   API Routes                       │  │
│  │   - GET /api/workflows             │  │
│  │   - GET /api/workflows/:id         │  │
│  │   - PUT /api/workflows/:id        │  │
│  │   - POST /api/workflows            │  │
│  │   - DELETE /api/workflows/:id     │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │   Workflow Parser                  │  │
│  │   - YAML → Graph                   │  │
│  │   - Graph → YAML                   │  │
│  │   - Validation                     │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │   File System                      │  │
│  │   - 读取 .zouwu 文件               │  │
│  │   - 写入 .zouwu 文件               │  │
│  │   - 文件监听 (chokidar)            │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### 2. 核心功能

#### 2.0 工作流列表界面

**主界面功能**：

- **工作流列表展示**：
    - 显示所有扫描到的工作流文件
    - 显示工作流名称、ID、版本、描述
    - 显示最后修改时间
    - 支持搜索和过滤

- **操作功能**：
    - **新建工作流**：点击"新建"按钮，创建空白工作流模板
    - **编辑工作流**：点击工作流项，进入可视化编辑界面
    - **删除工作流**：删除工作流文件（带确认）
    - **复制工作流**：复制现有工作流作为模板
    - **重命名工作流**：修改工作流名称和 ID

- **文件管理**：
    - 自动检测新增的工作流文件
    - 监听文件变化，实时更新列表
    - 支持拖拽文件到界面导入

**界面布局**：

```
┌─────────────────────────────────────────────────────────┐
│  Header: 驺吾工作流可视化工具                            │
│  [搜索框]  [+ 新建工作流]                               │
├─────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────┐  │
│  │  📋 工作流列表                                     │  │
│  ├───────────────────────────────────────────────────┤  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │ 📄 example_workflow                          │  │  │
│  │  │    版本: 1.0.0 | 最后修改: 2025-12-27        │  │  │
│  │  │    描述: 示例工作流                           │  │  │
│  │  │    [编辑] [复制] [删除]                      │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │ 📄 scan_directory                            │  │  │
│  │  │    版本: 1.2.0 | 最后修改: 2025-12-27        │  │  │
│  │  │    描述: 扫描目录工作流                       │  │  │
│  │  │    [编辑] [复制] [删除]                      │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

#### 2.1 工作流可视化

**节点类型映射**：

- **普通步骤 (action/builtin)**: 矩形节点，显示步骤名称和 ID
- **条件步骤 (condition)**: 菱形节点，显示条件表达式
- **并行步骤 (parallel)**: 特殊容器节点，包含多个分支
- **循环步骤 (loop)**: 带循环图标的节点，显示迭代器信息
- **开始节点**: 圆形节点，标识工作流入口
- **结束节点**: 圆形节点，标识工作流出口

**连接线**：

- **成功路径**: 绿色实线
- **失败路径**: 红色虚线
- **条件分支**: 带标签的连接线（true/false）
- **并行分支**: 多条连接线汇聚到并行节点

**布局算法**：

- 使用 **dagre** 或 **elkjs** 进行自动布局
- 支持手动拖拽调整节点位置
- 保存布局信息到工作流元数据

#### 2.2 动态设计功能

**节点操作**：

- **添加节点**: 从工具栏拖拽节点类型到画布
- **删除节点**: 选中节点后删除，自动处理连接
- **编辑节点**: 双击节点打开属性面板
- **复制节点**: 复制节点及其配置
- **连接节点**: 拖拽节点端口创建连接

**连接操作**：

- **创建连接**: 从源节点端口拖拽到目标节点端口
- **删除连接**: 选中连接线后删除
- **编辑连接**: 设置条件标签、权重等

**属性编辑**：

- **步骤属性**: ID、名称、描述、类型
- **输入输出**: 配置步骤的输入参数
- **条件表达式**: 编辑条件步骤的表达式
- **错误处理**: 配置重试、超时等选项

#### 2.3 实时同步

**YAML ↔ Graph 转换**：

```typescript
// YAML → Graph
interface WorkflowGraph {
    nodes: FlowNode[];
    edges: FlowEdge[];
    metadata: WorkflowMetadata;
}

// Graph → YAML
function graphToYaml(graph: WorkflowGraph): string {
    // 将图形结构转换为 YAML 格式
}

// YAML → Graph
function yamlToGraph(yaml: string): WorkflowGraph {
    // 将 YAML 解析为图形结构
}
```

**双向同步机制**：

1. **编辑时同步**: 在可视化界面编辑时，实时更新 YAML 预览
2. **文件监听**: 监听工作流文件变化，自动刷新可视化
3. **冲突处理**: 检测文件外部修改，提示用户选择合并策略

#### 2.4 执行状态可视化

**状态显示**：

- **待执行**: 灰色节点
- **执行中**: 蓝色节点，带加载动画
- **成功**: 绿色节点
- **失败**: 红色节点
- **跳过**: 黄色节点

**执行追踪**：

- 高亮当前执行步骤
- 显示步骤执行时间
- 显示步骤输入输出数据
- 错误信息展示

### 3. API 设计

#### 3.1 RESTful API

```typescript
// 获取所有工作流列表（从指定目录扫描）
GET /api/workflows?dir=<path>
Response: {
  workflows: WorkflowInfo[],
  directory: string
}

// 获取单个工作流（转换为图形格式）
GET /api/workflows/:id
Response: { workflow: WorkflowGraph }

// 获取工作流原始 YAML
GET /api/workflows/:id/raw
Response: { content: string, path: string }

// 创建新工作流
POST /api/workflows
Body: {
  name: string,
  description?: string,
  directory?: string  // 保存目录，默认使用启动时的目录
}
Response: {
  workflow: WorkflowGraph,
  filePath: string
}

// 更新工作流（保存到文件）
PUT /api/workflows/:id
Body: { graph: WorkflowGraph }
Response: {
  workflow: WorkflowGraph,
  filePath: string
}

// 删除工作流（删除文件）
DELETE /api/workflows/:id
Response: { success: boolean, filePath: string }

// 重命名工作流
PATCH /api/workflows/:id/rename
Body: { name: string, id?: string }
Response: { workflow: WorkflowInfo }

// 复制工作流
POST /api/workflows/:id/duplicate
Body: { name?: string }
Response: { workflow: WorkflowInfo }

// 验证工作流
POST /api/workflows/:id/validate
Response: { valid: boolean, errors: ValidationError[] }

// 执行工作流（预览）
POST /api/workflows/:id/execute
Body: { inputs: Record<string, any> }
Response: { execution: ExecutionResult }

// 获取工作流目录信息
GET /api/directory
Response: {
  path: string,
  workflows: number,
  lastScan: number
}
```

#### 3.2 WebSocket API

```typescript
// 连接 WebSocket
ws://localhost:3000/ws

// 消息类型
interface WSMessage {
  type: 'workflow-updated' | 'execution-started' | 'execution-progress' | 'execution-completed';
  data: any;
}

// 工作流更新通知
{
  type: 'workflow-updated',
  data: { workflowId: string, graph: WorkflowGraph }
}

// 执行进度更新
{
  type: 'execution-progress',
  data: { workflowId: string, stepId: string, status: 'running' | 'success' | 'error' }
}
```

### 4. 用户界面设计

#### 4.1 设计原则

**视觉设计原则**：

1. **清晰的信息层次**：使用颜色、大小、间距建立清晰的视觉层次
2. **一致的交互模式**：统一的按钮、输入框、卡片样式
3. **即时反馈**：所有操作都有明确的视觉反馈
4. **响应式布局**：适配不同屏幕尺寸
5. **可访问性**：支持键盘导航、屏幕阅读器

**交互设计原则**：

1. **拖拽优先**：主要操作通过拖拽完成
2. **上下文菜单**：右键菜单提供快捷操作
3. **实时预览**：编辑时实时显示 YAML 预览
4. **撤销/重做**：支持操作历史管理
5. **快捷键支持**：常用操作支持键盘快捷键

#### 4.2 颜色系统

**节点类型颜色**：

```typescript
const nodeColors = {
    // 步骤节点
    action: {
        background: "#E8F5E9", // 浅绿色
        border: "#4CAF50", // 绿色
        text: "#1B5E20", // 深绿色
        icon: "⚙️",
    },
    builtin: {
        background: "#E3F2FD", // 浅蓝色
        border: "#2196F3", // 蓝色
        text: "#0D47A1", // 深蓝色
        icon: "🔧",
    },
    condition: {
        background: "#FFF4DD", // 浅黄色
        border: "#FFC107", // 黄色
        text: "#F57F17", // 深黄色
        icon: "❓",
    },
    parallel: {
        background: "#E1F5FE", // 浅青色
        border: "#00BCD4", // 青色
        text: "#006064", // 深青色
        icon: "⚡",
    },
    loop: {
        background: "#F3E5F5", // 浅紫色
        border: "#9C27B0", // 紫色
        text: "#4A148C", // 深紫色
        icon: "🔄",
    },
    workflow: {
        background: "#FCE4EC", // 浅粉色
        border: "#E91E63", // 粉色
        text: "#880E4F", // 深粉色
        icon: "📋",
    },
    // 特殊节点
    start: {
        background: "#C8E6C9", // 绿色
        border: "#4CAF50",
        text: "#1B5E20",
        icon: "▶️",
    },
    end: {
        background: "#FFCDD2", // 红色
        border: "#F44336",
        text: "#B71C1C",
        icon: "⏹️",
    },
};

// 执行状态颜色
const statusColors = {
    pending: "#9E9E9E", // 灰色
    running: "#2196F3", // 蓝色（带动画）
    success: "#4CAF50", // 绿色
    error: "#F44336", // 红色
    skipped: "#FFC107", // 黄色
    cancelled: "#757575", // 深灰色
};
```

**连接线颜色**：

```typescript
const edgeColors = {
    default: "#9E9E9E", // 默认灰色
    success: "#4CAF50", // 成功路径（绿色实线）
    error: "#F44336", // 错误路径（红色虚线）
    conditionTrue: "#4CAF50", // 条件为真（绿色）
    conditionFalse: "#F44336", // 条件为假（红色）
    highlight: "#FF9800", // 高亮路径（橙色）
};
```

#### 4.3 主界面布局

**工作流列表界面**：

```
┌─────────────────────────────────────────────────────────────────────┐
│  🌌 驺吾工作流设计工具                                    [⚙️] [❌] │
├─────────────────────────────────────────────────────────────────────┤
│  [🔍 搜索工作流...]  [+ 新建工作流]  [📁 选择目录]  [🔄 刷新]        │
├─────────────────────────────────────────────────────────────────────┤
│  📋 工作流列表 (./workflows) - 共 3 个工作流                         │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  📄 example_workflow.zouwu                    [⋮] 更多操作      │ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │ 示例工作流                                                │  │ │
│  │  │ 版本: 1.0.0 | 最后修改: 2025-12-27 10:30                │  │ │
│  │  │ 描述: 这是一个示例工作流，展示基本功能                   │  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  │  [✏️ 编辑]  [📋 复制]  [🗑️ 删除]  [✏️ 重命名]  [👁️ 预览]    │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  📄 scan_directory.zouwu                    [⋮] 更多操作      │ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │ 扫描目录工作流                                             │  │ │
│  │  │ 版本: 1.2.0 | 最后修改: 2025-12-27 09:15                 │  │ │
│  │  │ 描述: 扫描指定目录并处理文件                              │  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  │  [✏️ 编辑]  [📋 复制]  [🗑️ 删除]  [✏️ 重命名]  [👁️ 预览]    │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  📄 data_processing.zouwu                  [⋮] 更多操作      │ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │ 数据处理工作流                                             │  │ │
│  │  │ 版本: 2.1.0 | 最后修改: 2025-12-27 08:00                 │  │ │
│  │  │ 描述: 处理和分析数据文件                                  │  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  │  [✏️ 编辑]  [📋 复制]  [🗑️ 删除]  [✏️ 重命名]  [👁️ 预览]    │ │
│  └──────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

**界面元素说明**：

- **Header**：显示应用名称和全局操作（设置、关闭）
- **工具栏**：搜索框、新建按钮、目录选择、刷新按钮
- **工作流卡片**：
    - 文件图标和名称
    - 工作流元信息（名称、版本、修改时间、描述）
    - 操作按钮（编辑、复制、删除、重命名、预览）
    - 更多操作菜单（右键菜单）
- **空状态**：当没有工作流时显示友好的空状态提示

**工作流编辑界面**：

```
┌─────────────────────────────────────────────────────────────────────────┐
│  🌌 编辑工作流: example_workflow                    [💾 保存] [✓ 验证] │
│  [← 返回]  [📋 YAML]  [👁️ 预览]  [↶ 撤销]  [↷ 重做]  [🔍 搜索节点]    │
├──────────┬──────────────────────────────────────────────────────────────┤
│          │                                                              │
│ 侧边栏   │                    Canvas (React Flow)                      │
│          │                                                              │
│ ┌──────┐ │  ┌─────────┐      ┌─────────┐      ┌─────────┐           │
│ │步骤库│ │  │  ▶️ 开始 │      │ ⚙️ 步骤1 │      │ ⚙️ 步骤2 │           │
│ └──────┘ │  │         │      │ 处理数据 │      │ 验证结果 │           │
│          │  └────┬────┘      └────┬────┘      └────┬────┘           │
│ ┌──────┐ │       │                 │                │                │
│ │模板  │ │       └─────────────────┘                │                │
│ └──────┘ │                                          │                │
│          │  ┌─────────┐      ┌─────────┐           │                │
│ ┌──────┐ │  │ ❓ 条件 │      │ ⚡ 并行 │           │                │
│ │历史  │ │  │ 检查条件│      │ 并行处理│           │                │
│ └──────┘ │  └────┬────┘      └────┬────┘           │                │
│          │       │                │                │                │
│ ┌──────┐ │       └────────────────┴────────────────┘                │
│ │图层  │ │  ┌─────────┐      ┌─────────┐                            │
│ └──────┘ │  │ 🔄 循环  │      │ ⏹️ 结束 │                            │
│          │  │ 循环处理  │      │         │                            │
│          │  └────┬────┘      └─────────┘                            │
│          │       │                                                    │
│          │       └────────────────────────────────────┘              │
│          │                                                              │
├──────────┴──────────────────────────────────────────────────────────────┤
│  属性编辑器 / YAML 预览 (可切换标签页)                                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ 属性编辑器                                                          │ │
│  │ ┌────────────────────────────────────────────────────────────────┐ │ │
│  │ │ 步骤 ID: step_1                                                │ │ │
│  │ │ 名称: 处理数据                                                 │ │ │
│  │ │ 类型: action                                                   │ │ │
│  │ │ 服务: dataService                                              │ │ │
│  │ │ 动作: processData                                              │ │ │
│  │ │ 输入: { data: "{{inputs.data}}" }                             │ │ │
│  │ │ 超时: 5000ms                                                   │ │ │
│  │ │ 重试: 3 次                                                     │ │ │
│  │ └────────────────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ YAML 预览                                                          │ │
│  │ ┌────────────────────────────────────────────────────────────────┐ │ │
│  │ │ id: example_workflow                                            │ │ │
│  │ │ name: 示例工作流                                                │ │ │
│  │ │ version: 1.0.0                                                 │ │ │
│  │ │ steps:                                                          │ │ │
│  │ │   - id: step_1                                                  │ │ │
│  │ │     type: action                                                │ │ │
│  │ │     service: dataService                                        │ │ │
│  │ │     action: processData                                        │ │ │
│  │ └────────────────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

**界面元素说明**：

- **顶部工具栏**：
    - 返回按钮：返回工作流列表
    - 保存按钮：保存当前工作流
    - 验证按钮：验证工作流语法
    - YAML 预览：切换 YAML 预览
    - 撤销/重做：操作历史
    - 搜索节点：快速定位节点

- **左侧边栏**：
    - **步骤库**：可拖拽的步骤类型列表
        - Action 步骤
        - Builtin 步骤
        - Condition 步骤
        - Parallel 步骤
        - Loop 步骤
        - Workflow 步骤
    - **模板**：常用工作流模板
    - **历史**：操作历史记录
    - **图层**：图层管理（用于复杂工作流）

- **中央画布**：
    - React Flow 画布
    - 节点渲染（不同类型不同样式）
    - 连接线渲染
    - 缩放和平移控制
    - 小地图（MiniMap）
    - 控制面板（Controls）

- **底部面板**：
    - **属性编辑器**：编辑选中节点的属性
    - **YAML 预览**：实时显示工作流 YAML
    - 可切换标签页
    - 可调整高度（拖拽分隔线）

#### 4.4 组件详细设计

**4.4.1 Canvas 组件（工作流画布）**

```typescript
interface CanvasProps {
  workflow: WorkflowGraph;
  onNodeChange: (node: FlowNode) => void;
  onEdgeChange: (edge: FlowEdge) => void;
  executionState?: ExecutionState;
  onNodeSelect?: (node: FlowNode | null) => void;
  onNodeDelete?: (nodeId: string) => void;
  readOnly?: boolean;
}

function WorkflowCanvas({
  workflow,
  onNodeChange,
  onEdgeChange,
  executionState,
  onNodeSelect,
  onNodeDelete,
  readOnly = false
}: CanvasProps) {
  const [nodes, setNodes] = useState(workflow.nodes);
  const [edges, setEdges] = useState(workflow.edges);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeClick={onNodeClick}
      onNodeContextMenu={onNodeContextMenu}
      onPaneContextMenu={onPaneContextMenu}
      fitView
      minZoom={0.1}
      maxZoom={2}
      defaultViewport={{ x: 0, y: 0, zoom: 1 }}
    >
      <Controls />
      <Background />
      <MiniMap
        nodeColor={(node) => getNodeColor(node.type)}
        maskColor="rgba(0, 0, 0, 0.1)"
      />
      {!readOnly && <NodeToolbar />}
    </ReactFlow>
  );
}
```

**功能特性**：

- 支持拖拽节点
- 支持连接节点（拖拽端口）
- 支持缩放和平移
- 支持多选（框选）
- 支持撤销/重做
- 支持复制/粘贴
- 右键菜单
- 键盘快捷键

**4.4.2 自定义节点组件**

```typescript
interface CustomNodeProps {
  data: {
    stepId: string;
    name: string;
    type: StepType;
    description?: string;
    status?: StepStatus;
    icon?: string;
    color?: string;
  };
  selected: boolean;
}

function CustomNode({ data, selected }: CustomNodeProps) {
  const nodeColor = nodeColors[data.type] || nodeColors.action;
  const statusColor = data.status ? statusColors[data.status] : null;

  return (
    <div
      className={`custom-node ${selected ? 'selected' : ''}`}
      style={{
        background: nodeColor.background,
        border: `2px solid ${selected ? '#FF9800' : nodeColor.border}`,
        borderRadius: data.type === 'condition' ? '50%' : '8px',
        padding: '12px',
        minWidth: '120px',
        boxShadow: selected ? '0 0 0 3px rgba(255, 152, 0, 0.3)' : 'none',
      }}
    >
      {/* 状态指示器 */}
      {data.status && (
        <div
          className="status-indicator"
          style={{ background: statusColor }}
        />
      )}

      {/* 图标和名称 */}
      <div className="node-header">
        <span className="node-icon">{nodeColor.icon}</span>
        <span className="node-name">{data.name}</span>
      </div>

      {/* 步骤 ID */}
      <div className="node-id">{data.stepId}</div>

      {/* 描述 */}
      {data.description && (
        <div className="node-description">{data.description}</div>
      )}

      {/* 端口 */}
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />

      {/* 条件节点特殊处理 */}
      {data.type === 'condition' && (
        <>
          <Handle type="source" position={Position.Right} id="true" />
          <Handle type="source" position={Position.Left} id="false" />
        </>
      )}
    </div>
  );
}
```

**节点类型特殊处理**：

1. **Condition 节点**：菱形形状，两个输出端口（true/false）
2. **Parallel 节点**：特殊容器样式，显示分支数量
3. **Loop 节点**：圆形样式，显示循环变量
4. **Start/End 节点**：特殊样式，固定位置

**4.4.3 属性编辑器组件**

```typescript
interface PropertyPanelProps {
  selectedNode?: FlowNode;
  onUpdate: (node: FlowNode) => void;
  workflow: WorkflowGraph;
}

function PropertyPanel({ selectedNode, onUpdate, workflow }: PropertyPanelProps) {
  if (!selectedNode) {
    return (
      <div className="property-panel-empty">
        <p>选择一个节点以编辑其属性</p>
      </div>
    );
  }

  const step = selectedNode.data;

  return (
    <div className="property-panel">
      <div className="property-section">
        <h3>基本信息</h3>
        <FormField label="步骤 ID">
          <Input
            value={step.stepId}
            onChange={(e) => updateField('stepId', e.target.value)}
            disabled // ID 不可编辑
          />
        </FormField>
        <FormField label="名称">
          <Input
            value={step.name}
            onChange={(e) => updateField('name', e.target.value)}
          />
        </FormField>
        <FormField label="类型">
          <Select
            value={step.type}
            onChange={(e) => updateField('type', e.target.value)}
            options={stepTypes}
          />
        </FormField>
        <FormField label="描述">
          <Textarea
            value={step.description || ''}
            onChange={(e) => updateField('description', e.target.value)}
          />
        </FormField>
      </div>

      {/* 根据步骤类型显示不同的配置 */}
      {step.type === 'action' && (
        <div className="property-section">
          <h3>Action 配置</h3>
          <FormField label="服务">
            <Input value={step.service} onChange={...} />
          </FormField>
          <FormField label="动作">
            <Input value={step.action} onChange={...} />
          </FormField>
          <FormField label="输入">
            <CodeEditor
              value={JSON.stringify(step.input, null, 2)}
              language="json"
              onChange={...}
            />
          </FormField>
        </div>
      )}

      {step.type === 'condition' && (
        <div className="property-section">
          <h3>条件配置</h3>
          <FormField label="条件表达式">
            <CodeEditor
              value={step.condition?.expression || ''}
              language="javascript"
              onChange={...}
            />
          </FormField>
        </div>
      )}

      {/* 通用配置 */}
      <div className="property-section">
        <h3>执行配置</h3>
        <FormField label="超时时间 (ms)">
          <Input
            type="number"
            value={step.timeout || ''}
            onChange={...}
          />
        </FormField>
        <FormField label="重试次数">
          <Input
            type="number"
            value={step.retry?.maxAttempts || 0}
            onChange={...}
          />
        </FormField>
        <FormField label="依赖步骤">
          <MultiSelect
            value={step.dependsOn || []}
            options={workflow.nodes.map(n => ({ value: n.id, label: n.data.name }))}
            onChange={...}
          />
        </FormField>
      </div>

      {/* 错误处理 */}
      <div className="property-section">
        <h3>错误处理</h3>
        <FormField label="错误处理策略">
          <Select
            value={step.onError?.type || 'stop'}
            options={[
              { value: 'stop', label: '停止执行' },
              { value: 'continue', label: '继续执行' },
              { value: 'retry', label: '重试' },
            ]}
            onChange={...}
          />
        </FormField>
      </div>
    </div>
  );
}
```

**4.4.4 工作流列表组件**

```typescript
interface WorkflowListProps {
  workflows: WorkflowInfo[];
  onSelect: (workflow: WorkflowInfo) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  onCreate: () => void;
}

function WorkflowList({
  workflows,
  onSelect,
  onDelete,
  onDuplicate,
  onRename,
  onCreate
}: WorkflowListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredWorkflows, setFilteredWorkflows] = useState(workflows);

  return (
    <div className="workflow-list">
      {/* 工具栏 */}
      <div className="toolbar">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="搜索工作流..."
        />
        <Button onClick={onCreate} primary>
          + 新建工作流
        </Button>
        <Button onClick={refreshList}>
          🔄 刷新
        </Button>
      </div>

      {/* 工作流卡片列表 */}
      <div className="workflow-cards">
        {filteredWorkflows.map(workflow => (
          <WorkflowCard
            key={workflow.id}
            workflow={workflow}
            onClick={() => onSelect(workflow)}
            onDelete={() => onDelete(workflow.id)}
            onDuplicate={() => onDuplicate(workflow.id)}
            onRename={(newName) => onRename(workflow.id, newName)}
          />
        ))}
      </div>

      {/* 空状态 */}
      {filteredWorkflows.length === 0 && (
        <EmptyState
          message="没有找到工作流"
          action={<Button onClick={onCreate}>创建第一个工作流</Button>}
        />
      )}
    </div>
  );
}
```

**4.4.5 工作流卡片组件**

```typescript
interface WorkflowCardProps {
  workflow: WorkflowInfo;
  onClick: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onRename: (newName: string) => void;
}

function WorkflowCard({
  workflow,
  onClick,
  onDelete,
  onDuplicate,
  onRename
}: WorkflowCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="workflow-card" onClick={onClick}>
      <div className="card-header">
        <div className="file-icon">📄</div>
        <div className="file-name">{workflow.fileName}</div>
        <DropdownMenu
          trigger={<Button icon="⋮" />}
          items={[
            { label: '编辑', onClick: onClick },
            { label: '复制', onClick: onDuplicate },
            { label: '重命名', onClick: () => prompt('新名称', onRename) },
            { label: '删除', onClick: onDelete, danger: true },
          ]}
        />
      </div>

      <div className="card-body">
        <h3>{workflow.name}</h3>
        <div className="meta-info">
          <span>版本: {workflow.version}</span>
          <span>修改: {formatDate(workflow.lastModified)}</span>
        </div>
        {workflow.description && (
          <p className="description">{workflow.description}</p>
        )}
      </div>

      <div className="card-actions">
        <Button onClick={onClick}>✏️ 编辑</Button>
        <Button onClick={onDuplicate}>📋 复制</Button>
        <Button onClick={onDelete} danger>🗑️ 删除</Button>
      </div>
    </div>
  );
}
```

#### 4.5 交互设计细节

**4.5.1 拖拽操作**

```typescript
// 从步骤库拖拽到画布
function handleDragFromPalette(type: StepType, position: Position) {
    const newNode = createNode(type, position);
    addNode(newNode);
}

// 节点拖拽
function handleNodeDrag(nodeId: string, newPosition: Position) {
    updateNodePosition(nodeId, newPosition);
    // 自动保存布局
    saveLayout();
}

// 连接线拖拽
function handleEdgeConnect(connection: Connection) {
    const newEdge = createEdge(connection);
    addEdge(newEdge);
    // 验证连接是否有效
    validateConnection(newEdge);
}
```

**4.5.2 右键菜单**

```typescript
interface ContextMenuItems {
    node?: {
        edit: () => void;
        delete: () => void;
        duplicate: () => void;
        copy: () => void;
        cut: () => void;
        properties: () => void;
    };
    edge?: {
        delete: () => void;
        edit: () => void;
        addLabel: () => void;
    };
    canvas?: {
        paste: () => void;
        selectAll: () => void;
        clearSelection: () => void;
        zoomToFit: () => void;
    };
}
```

**4.5.3 键盘快捷键**

```typescript
const shortcuts = {
    // 通用
    "Ctrl+S / Cmd+S": "保存工作流",
    "Ctrl+Z / Cmd+Z": "撤销",
    "Ctrl+Shift+Z / Cmd+Shift+Z": "重做",
    "Ctrl+C / Cmd+C": "复制选中节点",
    "Ctrl+V / Cmd+V": "粘贴节点",
    "Ctrl+X / Cmd+X": "剪切节点",
    "Delete / Backspace": "删除选中节点",
    "Ctrl+A / Cmd+A": "全选",
    "Ctrl+F / Cmd+F": "搜索节点",
    Escape: "取消选择",

    // 画布操作
    "Space + 拖拽": "平移画布",
    "Ctrl + 滚轮": "缩放画布",
    "Ctrl+0 / Cmd+0": "重置缩放",
    "Ctrl+F / Cmd+F": "适应窗口",

    // 节点操作
    Enter: "编辑选中节点",
    F2: "重命名节点",
    "Ctrl+D / Cmd+D": "复制节点",
};
```

**4.5.4 实时验证和反馈**

```typescript
// 节点连接验证
function validateConnection(edge: FlowEdge): ValidationResult {
    const sourceNode = getNode(edge.source);
    const targetNode = getNode(edge.target);

    // 检查循环依赖
    if (hasCircularDependency(sourceNode.id, targetNode.id)) {
        return {
            valid: false,
            error: "检测到循环依赖",
            highlight: [edge.source, edge.target],
        };
    }

    // 检查类型兼容性
    if (!isCompatibleConnection(sourceNode.type, targetNode.type)) {
        return {
            valid: false,
            error: "节点类型不兼容",
            highlight: [edge.source, edge.target],
        };
    }

    return { valid: true };
}

// 实时显示验证错误
function showValidationErrors(errors: ValidationError[]) {
    errors.forEach((error) => {
        highlightNode(error.nodeId, "error");
        showTooltip(error.nodeId, error.message);
    });
}
```

**4.5.5 动画和过渡效果**

```typescript
// 节点添加动画
const nodeEnterAnimation = {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.2 },
};

// 执行状态动画
const runningAnimation = {
    animation: "pulse 2s infinite",
    "@keyframes pulse": {
        "0%, 100%": { opacity: 1 },
        "50%": { opacity: 0.6 },
    },
};

// 连接线动画
const edgeAnimation = {
    animated: true,
    style: {
        strokeDasharray: "5 5",
        animation: "dashdraw 0.5s linear infinite",
    },
};
```

**4.5.6 响应式设计**

```typescript
// 断点定义
const breakpoints = {
  mobile: '640px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1280px'
};

// 移动端适配
function MobileLayout() {
  return (
    <div className="mobile-layout">
      {/* 折叠侧边栏 */}
      <CollapsibleSidebar />
      {/* 全屏画布 */}
      <FullScreenCanvas />
      {/* 底部属性面板（可滑动） */}
      <BottomSheet>
        <PropertyPanel />
      </BottomSheet>
    </div>
  );
}

// 平板适配
function TabletLayout() {
  return (
    <div className="tablet-layout">
      {/* 可折叠侧边栏 */}
      <Sidebar collapsible />
      {/* 画布 */}
      <Canvas />
      {/* 底部面板 */}
      <BottomPanel />
    </div>
  );
}
```

#### 4.6 用户体验流程

**4.6.1 创建新工作流流程**

```
1. 点击"新建工作流"按钮
   ↓
2. 弹出对话框，输入工作流信息
   - 名称（必填）
   - ID（自动生成，可编辑）
   - 描述（可选）
   - 版本（默认 1.0.0）
   ↓
3. 创建空白工作流模板
   - 自动添加 Start 节点
   - 自动添加 End 节点
   - 显示空画布
   ↓
4. 进入编辑界面
   - 显示步骤库
   - 显示属性面板
   - 显示 YAML 预览
   ↓
5. 开始设计工作流
   - 从步骤库拖拽步骤到画布
   - 连接步骤
   - 配置步骤属性
   ↓
6. 保存工作流
   - 点击保存按钮
   - 验证工作流
   - 保存到文件
   - 显示成功提示
```

**4.6.2 编辑现有工作流流程**

```
1. 在工作流列表中点击"编辑"
   ↓
2. 加载工作流
   - 读取 YAML 文件
   - 转换为图形格式
   - 渲染到画布
   ↓
3. 编辑工作流
   - 添加/删除节点
   - 修改连接
   - 编辑属性
   ↓
4. 实时预览
   - YAML 实时更新
   - 验证错误实时显示
   ↓
5. 保存更改
   - 点击保存按钮
   - 验证工作流
   - 保存到文件
   - 显示成功提示
```

**4.6.3 节点操作流程**

```
添加节点：
1. 从步骤库拖拽步骤类型到画布
   ↓
2. 自动创建节点
   - 生成唯一 ID
   - 设置默认名称
   - 设置默认位置
   ↓
3. 自动选中新节点
   - 显示属性面板
   - 高亮节点
   ↓
4. 编辑节点属性
   - 修改名称
   - 配置参数
   - 设置依赖

连接节点：
1. 鼠标悬停在源节点的输出端口
   ↓
2. 显示连接提示
   ↓
3. 拖拽到目标节点的输入端口
   ↓
4. 创建连接线
   ↓
5. 验证连接有效性
   - 检查循环依赖
   - 检查类型兼容性
   ↓
6. 显示连接结果
   - 成功：绿色连接线
   - 失败：红色连接线 + 错误提示

删除节点：
1. 选中节点
   ↓
2. 按 Delete 键或点击删除按钮
   ↓
3. 确认删除（如果节点有连接）
   ↓
4. 删除节点及其所有连接
   ↓
5. 自动调整布局
```

**4.6.4 错误处理和提示**

```typescript
// 错误类型
enum ErrorType {
  VALIDATION_ERROR = 'validation_error',
  CONNECTION_ERROR = 'connection_error',
  SAVE_ERROR = 'save_error',
  LOAD_ERROR = 'load_error',
}

// 错误提示组件
function ErrorToast({ error, onDismiss }) {
  return (
    <div className={`error-toast ${error.type}`}>
      <div className="error-icon">⚠️</div>
      <div className="error-message">{error.message}</div>
      <div className="error-details">{error.details}</div>
      <Button onClick={onDismiss}>关闭</Button>
      {error.action && (
        <Button onClick={error.action}>{error.actionLabel}</Button>
      )}
    </div>
  );
}

// 内联错误提示
function InlineError({ nodeId, error }) {
  return (
    <div className="inline-error" data-node-id={nodeId}>
      <Tooltip content={error.message}>
        <span className="error-badge">⚠️</span>
      </Tooltip>
    </div>
  );
}
```

### 5. 数据模型

#### 5.1 工作流图模型

```typescript
interface FlowNode {
    id: string;
    type: "step" | "condition" | "parallel" | "loop" | "start" | "end";
    position: { x: number; y: number };
    data: {
        stepId: string;
        name: string;
        description?: string;
        stepType?: string;
        status?: StepStatus;
    };
}

interface FlowEdge {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
    label?: string;
    style?: { stroke: string; strokeDasharray?: string };
    data?: {
        condition?: string;
        type: "success" | "error" | "condition";
    };
}

interface WorkflowGraph {
    nodes: FlowNode[];
    edges: FlowEdge[];
    metadata: {
        id: string;
        name: string;
        version: string;
        layout?: LayoutConfig;
    };
}
```

#### 5.2 转换逻辑

```typescript
// YAML 工作流 → 图形节点
function workflowToNodes(workflow: Workflow): FlowNode[] {
    const nodes: FlowNode[] = [];

    // 添加开始节点
    nodes.push({
        id: "start",
        type: "start",
        position: { x: 0, y: 0 },
        data: { name: "开始" },
    });

    // 转换步骤为节点
    workflow.steps.forEach((step, index) => {
        nodes.push({
            id: step.id,
            type: stepTypeToNodeType(step.type),
            position: calculatePosition(index),
            data: {
                stepId: step.id,
                name: step.name,
                description: step.description,
                stepType: step.type,
            },
        });
    });

    // 添加结束节点
    nodes.push({
        id: "end",
        type: "end",
        position: { x: 0, y: nodes.length * 100 },
        data: { name: "结束" },
    });

    return nodes;
}

// 图形节点 → YAML 工作流
function nodesToWorkflow(nodes: FlowNode[], edges: FlowEdge[]): Workflow {
    // 根据节点和连接线重建工作流结构
    // 处理条件分支、并行分支等复杂结构
}
```

### 6. 实现计划

#### 阶段 1: 基础框架 (Week 1-2)

- [ ] 创建 `@zouwu-wf/design` 独立包
- [ ] 在 `@zouwu-wf/design` 包中实现自己的 CLI 入口（`zouwu-design`）
- [ ] （可选）在 `@zouwu-wf/cli` 中添加 `design` 命令作为便捷方式
- [ ] 搭建 Bun 服务器（Elysia/Hono）
- [ ] 实现工作流文件扫描和发现功能
- [ ] 实现基础 API 路由（工作流列表、读取、保存）
- [ ] 创建 React 前端项目
- [ ] 实现工作流列表界面
- [ ] 集成 React Flow
- [ ] 实现基础的文件读写功能

#### 阶段 2: 核心功能 (Week 3-4)

- [ ] 实现工作流列表的搜索和过滤
- [ ] 实现新建工作流功能（创建空白模板）
- [ ] 实现删除和重命名工作流
- [ ] 实现文件监听和自动刷新列表
- [ ] 实现 YAML → Graph 转换
- [ ] 实现 Graph → YAML 转换
- [ ] 实现节点和连接线的渲染
- [ ] 实现拖拽和编辑功能
- [ ] 实现属性面板

#### 阶段 3: 高级功能 (Week 5-6)

- [ ] 实现自动布局算法
- [ ] 实现执行状态可视化
- [ ] 实现 WebSocket 实时更新
- [ ] 实现文件监听和自动刷新
- [ ] 实现工作流验证

#### 阶段 4: 优化和测试 (Week 7-8)

- [ ] 性能优化
- [ ] UI/UX 优化
- [ ] 错误处理和完善
- [ ] 编写测试
- [ ] 文档编写

### 7. 技术细节

#### 7.1 Design 包的 CLI 实现

`@zouwu-wf/design` 包提供自己的 CLI 入口：

```typescript
// packages/@zouwu-wf/design/src/cli.ts
#!/usr/bin/env bun
import { program } from 'commander';
import { startServer } from './server';

program
  .name('zouwu-design')
  .description('🌌 驺吾工作流可视化设计服务器')
  .option('-d, --dir <path>', '工作流文件目录路径', './workflows')
  .option('-p, --port <number>', '服务器端口', '3000')
  .option('-h, --host <host>', '服务器主机', 'localhost')
  .option('--open', '自动打开浏览器')
  .option('--watch', '监听文件变化（默认启用）', true)
  .action(async (options) => {
    const port = parseInt(options.port, 10);
    const host = options.host;
    const workflowDir = path.resolve(options.dir);

    console.log('🌌 启动驺吾工作流可视化服务器...');
    console.log(`📁 工作流目录: ${workflowDir}`);
    console.log(`🌐 服务器地址: http://${host}:${port}`);

    await startServer({
      port,
      host,
      workflowDir,
      open: options.open,
      watch: options.watch,
    });
  });

program.parse();
```

**CLI 包的集成（可选）**：

如果 `@zouwu-wf/cli` 想要提供便捷命令，可以简单地调用 `@zouwu-wf/design` 的 CLI：

```typescript
// packages/@zouwu-wf/cli/src/commands/design.ts
import { spawn } from "child_process";

program
    .command("design")
    .description("🌌 启动工作流可视化设计服务器（调用 zouwu-design）")
    .action(() => {
        // 直接调用 design 包的 CLI
        spawn("npx", ["@zouwu-wf/design", ...process.argv.slice(3)], {
            stdio: "inherit",
        });
    });
```

**注意**：这是可选的。用户可以直接使用 `npx zouwu-design`，不需要通过 CLI 包。

#### 7.2 Bun 服务器与 Vite 客户端架构

本项目采用**双进程架构**：Bun 服务器和 Vite 开发服务器并行运行，通过 HTTP 通信。

**架构图：**

```
┌─────────────────────────────────────────────────────────┐
│                   开发环境 (pnpm dev)                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────┐      ┌──────────────────┐       │
│  │  Bun 服务器      │      │  Vite 开发服务器 │       │
│  │  (端口 3000)     │      │  (端口 3001)      │       │
│  │                  │      │                  │       │
│  │  - API 路由      │      │  - React 应用    │       │
│  │  - 静态文件服务  │      │  - HMR 热重载    │       │
│  │  - 文件监听      │      │  - 代码转换      │       │
│  └────────┬─────────┘      └────────┬─────────┘       │
│           │                        │                  │
│           │  HTTP 代理              │                  │
│           │  /api → 3000           │                  │
│           └─────────┬──────────────┘                  │
│                     │                                  │
│                     ▼                                  │
│            ┌─────────────────┐                         │
│            │   浏览器        │                         │
│            │  localhost:3001 │                         │
│            └─────────────────┘                         │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**工作流程：**

1. **启动过程** (`pnpm dev`)
    - 使用 `concurrently` 同时启动两个进程
    - **Bun 服务器** (`dev:server`): `bun --watch run src/cli.ts`
        - 运行在 `http://localhost:3000`
        - 提供 API 路由 (`/api/*`)
        - 监听文件变化，自动重启
    - **Vite 开发服务器** (`dev:client`): `vite`
        - 运行在 `http://localhost:3001`
        - 提供 React 应用
        - 提供 HMR（热模块替换）
        - 编译 TypeScript/JSX

2. **请求流程（开发模式）**

    ```
    浏览器请求 → localhost:3001 (Vite)
                  ↓
              Vite 检查路径
                  ↓
        ┌─────────┴─────────┐
        │                    │
    /api/*              其他路径
        │                    │
        ↓                    ↓
    代理到 3000          Vite 处理
    (Bun 服务器)        (React 应用)
    ```

3. **Vite 代理配置**

    ```typescript
    // vite.config.ts
    server: {
      port: 3001,
      proxy: {
        "/api": {
          target: "http://localhost:3000",  // 代理到 Bun
          changeOrigin: true,
        },
      },
    }
    ```

4. **生产模式**
    - 构建前端：`pnpm build:client` → 生成 `dist/client/`
    - 启动服务器：`pnpm start` → 只启动 Bun
    - Bun 同时提供静态文件（`dist/client/`）和 API

**关键点：**

- **Bun 和 Vite 是独立的进程**，通过 HTTP 通信
- **Bun 不编译前端代码**，只运行服务器端代码
- **Vite 不运行后端代码**，只编译和提供前端代码
- **开发时**：Vite 代理 API 请求到 Bun
- **生产时**：Bun 同时提供静态文件和 API

**优势：**

1. **开发体验**：Vite 提供快速的 HMR，前端代码修改立即生效
2. **职责分离**：Bun 处理后端，Vite 处理前端编译
3. **生产部署**：构建后只需要 Bun，静态文件已构建

#### 7.3 Bun 服务器设置

```typescript
// packages/@zouwu-wf/design/src/server/index.ts
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { staticPlugin } from "@elysiajs/static";
import { watch } from "chokidar";
import { discoverWorkflows, readWorkflow, saveWorkflow } from "./workflow-manager";

export async function startServer(options: {
    port: number;
    host: string;
    workflowDir: string;
    open?: boolean;
    watch?: boolean;
}) {
    const app = new Elysia()
        .use(cors())
        .use(staticPlugin({ assets: "./dist", prefix: "/" }))
        .get("/api/workflows", async () => {
            const workflows = await discoverWorkflows(options.workflowDir);
            return { workflows, directory: options.workflowDir };
        })
        .get("/api/workflows/:id", async ({ params }) => {
            const workflow = await readWorkflow(params.id, options.workflowDir);
            return { workflow };
        })
        .get("/api/workflows/:id/raw", async ({ params }) => {
            const content = await readWorkflowRaw(params.id, options.workflowDir);
            return { content };
        })
        .post("/api/workflows", async ({ body }) => {
            const workflow = await createWorkflow(body, options.workflowDir);
            return { workflow };
        })
        .put("/api/workflows/:id", async ({ params, body }) => {
            const workflow = await saveWorkflow(params.id, body, options.workflowDir);
            return { workflow };
        })
        .delete("/api/workflows/:id", async ({ params }) => {
            await deleteWorkflow(params.id, options.workflowDir);
            return { success: true };
        })
        .listen(options.port);

    // 文件监听
    if (options.watch) {
        const watcher = watch(`${options.workflowDir}/**/*.{zouwu,yml,yaml}`, {
            ignored: /node_modules/,
            persistent: true,
        });

        watcher.on("change", (filePath) => {
            console.log(`📝 检测到文件变化: ${filePath}`);
            // 通过 WebSocket 通知客户端
        });
    }

    console.log(`🚀 驺吾工作流可视化工具运行在 http://${options.host}:${options.port}`);

    if (options.open) {
        // 自动打开浏览器
        const { default: open } = await import("open");
        await open(`http://${options.host}:${options.port}`);
    }
}
```

#### 7.4 React Flow 配置

```typescript
// 节点类型定义
const nodeTypes = {
  step: StepNode,
  condition: ConditionNode,
  parallel: ParallelNode,
  loop: LoopNode,
  start: StartNode,
  end: EndNode,
};

// React Flow 组件
<ReactFlow
  nodes={nodes}
  edges={edges}
  nodeTypes={nodeTypes}
  onNodesChange={onNodesChange}
  onEdgesChange={onEdgesChange}
  onConnect={onConnect}
  fitView
  attributionPosition="bottom-left"
>
  <Controls />
  <Background />
  <MiniMap />
</ReactFlow>
```

#### 7.5 动态设计交互

```typescript
// 添加节点
function handleAddNode(type: NodeType, position: Position) {
    const newNode: FlowNode = {
        id: generateId(),
        type,
        position,
        data: { name: `新${type}节点` },
    };
    setNodes([...nodes, newNode]);
}

// 连接节点
function handleConnect(connection: Connection) {
    const newEdge: FlowEdge = {
        id: generateId(),
        source: connection.source!,
        target: connection.target!,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
    };
    setEdges([...edges, newEdge]);
}

// 更新节点属性
function handleNodeUpdate(nodeId: string, data: Partial<NodeData>) {
    setNodes(
        nodes.map((node) =>
            node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node,
        ),
    );
}
```

### 8. 文件结构

```
packages/@zouwu-wf/
└── design/                       # 独立的设计服务器包
    ├── src/
    │   ├── server/
    │   │   ├── index.ts          # Bun 服务器入口（导出 startServer）
    │   │   ├── api/
    │   │   │   ├── workflows.ts  # 工作流 API
    │   │   │   └── execution.ts  # 执行 API
    │   │   ├── parser/
    │   │   │   ├── yaml-to-graph.ts
    │   │   │   └── graph-to-yaml.ts
    │   │   ├── watcher.ts        # 文件监听
    │   │   └── workflow-manager.ts  # 工作流文件管理
    │   ├── client/
    │   │   ├── App.tsx
    │   │   ├── pages/
    │   │   │   ├── WorkflowList.tsx    # 工作流列表页面
    │   │   │   └── WorkflowEditor.tsx  # 工作流编辑页面
    │   │   ├── components/
    │   │   │   ├── Canvas/
    │   │   │   │   ├── WorkflowCanvas.tsx
    │   │   │   │   └── CustomNodes.tsx
    │   │   │   ├── List/
    │   │   │   │   ├── WorkflowList.tsx
    │   │   │   │   └── WorkflowCard.tsx
    │   │   │   ├── PropertyPanel/
    │   │   │   │   └── PropertyEditor.tsx
    │   │   │   └── Toolbar/
    │   │   │       └── NodeToolbar.tsx
    │   │   ├── hooks/
    │   │   │   ├── useWorkflow.ts
    │   │   │   └── useExecution.ts
    │   │   └── utils/
    │   │       ├── layout.ts
    │   │       └── validation.ts
    │   └── shared/
    │       ├── types.ts
    │       └── constants.ts
    ├── package.json
    ├── tsconfig.json
    └── README.md
```

**包依赖关系**：

- `@zouwu-wf/design` 是独立包，可以单独使用
- `@zouwu-wf/design` 依赖 `@zouwu-wf/workflow`（用于工作流解析和验证）

**包导出**：

`@zouwu-wf/design` 包的主要导出：

```typescript
// 服务器启动函数
export { startServer } from "./server";

// 转换工具（可作为库使用）
export { yamlToGraph, graphToYaml } from "./parser";

// 类型定义
export type { WorkflowGraph, FlowNode, FlowEdge } from "./shared/types";
```

### 9. 依赖项

#### 9.1 @zouwu-wf/design 包依赖

```json
{
    "name": "@zouwu-wf/design",
    "version": "0.0.1",
    "dependencies": {
        "elysia": "^1.0.0",
        "@elysiajs/cors": "^1.0.0",
        "@elysiajs/static": "^1.0.0",
        "react": "^18.0.0",
        "react-dom": "^18.0.0",
        "reactflow": "^11.0.0",
        "zustand": "^4.0.0",
        "yaml": "^2.0.0",
        "chokidar": "^3.5.3",
        "open": "^10.0.0",
        "@zouwu-wf/workflow": "workspace:*"
    },
    "devDependencies": {
        "@types/react": "^18.0.0",
        "@types/react-dom": "^18.0.0",
        "@types/chokidar": "^2.1.3",
        "typescript": "^5.0.0",
        "tailwindcss": "^3.0.0",
        "autoprefixer": "^10.0.0",
        "postcss": "^8.0.0"
    }
}
```

#### 9.2 @zouwu-wf/design 包的 package.json

```json
{
    "name": "@zouwu-wf/design",
    "version": "0.0.1",
    "type": "module",
    "bin": {
        "zouwu-design": "./dist/cli.js"
    },
    "main": "./dist/index.js",
    "types": "./dist/index.d.ts",
    "exports": {
        ".": {
            "types": "./dist/index.d.ts",
            "import": "./dist/index.mjs",
            "require": "./dist/index.js"
        }
    }
}
```

#### 9.3 @zouwu-wf/cli 包依赖更新（可选）

如果 CLI 包想要提供便捷命令，可以添加 `@zouwu-wf/design` 作为依赖：

```json
{
    "name": "@zouwu-wf/cli",
    "dependencies": {
        "@zouwu-wf/design": "workspace:*" // 可选依赖
        // ... 其他现有依赖
    }
}
```

**注意**：这是可选的。`@zouwu-wf/design` 可以完全独立使用，不需要 CLI 包。

### 10. 使用示例

#### 10.1 启动服务器

```bash
# 使用默认设置（./workflows 目录，端口 3000）
npx zouwu-design

# 指定工作流目录
npx zouwu-design --dir ./my-workflows

# 指定端口和主机
npx zouwu-design --port 8080 --host 0.0.0.0

# 自动打开浏览器
npx zouwu-design --open

# 禁用文件监听
npx zouwu-design --no-watch
```

#### 10.2 工作流管理流程

1. **启动服务器**：

    ```bash
    npx zouwu-design --dir ./workflows
    ```

2. **访问界面**：
    - 浏览器自动打开 `http://localhost:3000`
    - 或手动访问该地址

3. **查看工作流列表**：
    - 界面显示 `./workflows` 目录下所有 `.zouwu` 文件
    - 显示工作流基本信息（名称、版本、描述等）

4. **创建新工作流**：
    - 点击"新建工作流"按钮
    - 输入工作流名称和描述
    - 自动创建空白工作流模板
    - 进入可视化编辑界面

5. **编辑现有工作流**：
    - 点击工作流列表中的"编辑"按钮
    - 进入可视化编辑界面
    - 使用 React Flow 进行拖拽设计
    - 实时预览 YAML 输出

6. **保存工作流**：
    - 点击"保存"按钮
    - 自动保存到对应的 `.zouwu` 文件
    - 显示保存成功提示

7. **文件同步**：
    - 如果外部修改了工作流文件
    - 服务器自动检测变化
    - 通过 WebSocket 通知客户端刷新

### 10. 未来扩展

1. **工作流模板库**: 提供常用工作流模板
2. **协作功能**: 多人同时编辑，实时同步
3. **版本控制**: 工作流版本历史和回滚
4. **导入导出**: 支持多种格式（JSON、PNG、SVG）
5. **插件系统**: 支持自定义节点类型和操作
6. **AI 辅助**: 基于自然语言生成工作流

## 风险评估

1. **性能问题**: 大型工作流可能导致渲染性能下降
    - 缓解: 使用虚拟化、懒加载、分页显示

2. **布局复杂性**: 复杂工作流的自动布局可能不理想
    - 缓解: 提供多种布局算法，支持手动调整

3. **同步冲突**: 文件外部修改与可视化编辑冲突
    - 缓解: 实现冲突检测和合并策略

4. **浏览器兼容性**: React Flow 可能在某些浏览器有兼容问题
    - 缓解: 使用现代浏览器，提供降级方案

## 快速开始

### 安装和使用

```bash
# 方式 1：直接使用 design 包（推荐）
npx zouwu-design

# 方式 2：全局安装 design 包
npm install -g @zouwu-wf/design
zouwu-design

# 方式 3：通过 CLI 包（可选，CLI 内部调用 design）
npx zouwu design

# 指定工作流目录
npx zouwu-design --dir ./my-workflows

# 自定义端口和自动打开浏览器
npx zouwu-design --port 8080 --open
```

### 工作流程

1. **启动服务器**：

    ```bash
    npx zouwu-design --dir ./workflows
    ```

2. **访问界面**：
    - 浏览器自动打开（如果使用 `--open`）
    - 或手动访问 `http://localhost:3000`

3. **查看工作流列表**：
    - 界面显示指定目录下所有 `.zouwu` 文件
    - 每个工作流显示名称、版本、描述等信息

4. **创建新工作流**：
    - 点击"新建工作流"按钮
    - 输入工作流信息
    - 进入可视化编辑界面

5. **编辑工作流**：
    - 点击列表中的"编辑"按钮
    - 使用 React Flow 进行拖拽设计
    - 实时预览和保存

6. **保存更改**：
    - 点击"保存"按钮
    - 自动保存到对应的 `.zouwu` 文件
    - 文件变化会自动同步到列表

## 详细实施计划（Step-by-Step Implementation Plan）

本章节提供完整的、可执行的分步实施计划，确保 RFC 0006 能够顺利落地。

### 实施概览

总工期：**8周**，分为 8 个主要阶段，每个阶段约 1 周时间。

**关键里程碑**：

- Week 1-2: 基础框架搭建，可以启动服务器和访问空白界面
- Week 3-4: 核心功能实现，可以显示工作流列表和基本可视化
- Week 5-6: 高级功能，支持完整的编辑和实时同步
- Week 7-8: 优化和测试，达到生产就绪状态

---

### 阶段 1: 创建项目基础结构（Week 1）

#### 1.1 创建包目录结构

```bash
# 创建包目录
mkdir -p packages/@zouwu-wf/design
cd packages/@zouwu-wf/design

# 创建源码目录结构
mkdir -p src/{server,client,shared}
mkdir -p src/server/{api,parser,core}
mkdir -p src/client/{pages,components,hooks,utils,styles}
mkdir -p src/client/components/{Canvas,List,PropertyPanel,Toolbar,UI}
mkdir -p src/shared/{types,constants}

# 创建配置文件
touch package.json tsconfig.json vite.config.ts tailwind.config.js
touch index.html .gitignore
```

#### 1.2 初始化 package.json

```json
{
    "name": "@zouwu-wf/design",
    "version": "0.0.1",
    "description": "驺吾工作流可视化设计工具",
    "type": "module",
    "bin": {
        "zouwu-design": "./dist/cli.js"
    },
    "main": "./dist/index.js",
    "types": "./dist/index.d.ts",
    "exports": {
        ".": {
            "types": "./dist/index.d.ts",
            "import": "./dist/index.mjs",
            "require": "./dist/index.js"
        }
    },
    "scripts": {
        "dev": "bun run --watch src/cli.ts",
        "dev:client": "vite",
        "build": "bun build src/cli.ts --outdir dist --target node --minify",
        "build:client": "vite build",
        "test": "vitest",
        "lint": "eslint src --ext .ts,.tsx"
    },
    "dependencies": {
        "@elysiajs/cors": "^1.1.1",
        "@elysiajs/static": "^1.1.1",
        "@elysiajs/websocket": "^1.0.8",
        "@zouwu-wf/workflow": "workspace:*",
        "chokidar": "^4.0.3",
        "commander": "^12.1.0",
        "dagre": "^0.8.5",
        "elysia": "^1.1.26",
        "open": "^10.1.0",
        "react": "^18.3.1",
        "react-dom": "^18.3.1",
        "react-router-dom": "^6.26.2",
        "reactflow": "^11.11.4",
        "yaml": "^2.6.1",
        "zustand": "^5.0.2"
    },
    "devDependencies": {
        "@types/dagre": "^0.7.52",
        "@types/react": "^18.3.12",
        "@types/react-dom": "^18.3.1",
        "@vitejs/plugin-react": "^4.3.4",
        "autoprefixer": "^10.4.20",
        "eslint": "^9.15.0",
        "postcss": "^8.4.49",
        "tailwindcss": "^3.4.17",
        "typescript": "^5.7.2",
        "vite": "^6.0.3",
        "vitest": "^2.1.8"
    }
}
```

#### 1.3 TypeScript 配置

```json
// tsconfig.json
{
    "compilerOptions": {
        "target": "ES2022",
        "module": "ESNext",
        "lib": ["ES2022", "DOM", "DOM.Iterable"],
        "moduleResolution": "bundler",
        "resolveJsonModule": true,
        "allowJs": true,
        "strict": true,
        "skipLibCheck": true,
        "esModuleInterop": true,
        "allowSyntheticDefaultImports": true,
        "forceConsistentCasingInFileNames": true,
        "jsx": "react-jsx",
        "outDir": "./dist",
        "baseUrl": ".",
        "paths": {
            "@/*": ["./src/*"]
        }
    },
    "include": ["src/**/*"],
    "exclude": ["node_modules", "dist"]
}
```

#### 1.4 Vite 配置

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    server: {
        port: 3001,
        proxy: {
            "/api": {
                target: "http://localhost:3000",
                changeOrigin: true,
            },
            "/ws": {
                target: "ws://localhost:3000",
                ws: true,
            },
        },
    },
    build: {
        outDir: "dist/client",
        emptyOutDir: true,
    },
});
```

#### 1.5 Tailwind CSS 配置

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/client/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                node: {
                    action: { bg: "#E8F5E9", border: "#4CAF50", text: "#1B5E20" },
                    builtin: { bg: "#E3F2FD", border: "#2196F3", text: "#0D47A1" },
                    condition: { bg: "#FFF4DD", border: "#FFC107", text: "#F57F17" },
                    parallel: { bg: "#E1F5FE", border: "#00BCD4", text: "#006064" },
                    loop: { bg: "#F3E5F5", border: "#9C27B0", text: "#4A148C" },
                    workflow: { bg: "#FCE4EC", border: "#E91E63", text: "#880E4F" },
                    start: { bg: "#C8E6C9", border: "#4CAF50", text: "#1B5E20" },
                    end: { bg: "#FFCDD2", border: "#F44336", text: "#B71C1C" },
                },
                status: {
                    pending: "#9E9E9E",
                    running: "#2196F3",
                    success: "#4CAF50",
                    error: "#F44336",
                    skipped: "#FFC107",
                    cancelled: "#757575",
                },
            },
        },
    },
    plugins: [],
};
```

**阶段 1 验收标准**：

- ✅ 包目录结构完整
- ✅ 所有配置文件正确配置
- ✅ 依赖安装成功（`bun install`）
- ✅ TypeScript 编译通过
- ✅ Tailwind CSS 正常工作

---

### 阶段 2: 实现后端服务器（Week 2）

#### 2.1 共享类型定义

```typescript
// src/shared/types/workflow.ts
import type { Workflow } from "@zouwu-wf/workflow";

export interface WorkflowInfo {
    id: string;
    name: string;
    fileName: string;
    path: string;
    version: string;
    description?: string;
    lastModified: number;
}

export interface FlowNode {
    id: string;
    type: "action" | "builtin" | "condition" | "parallel" | "loop" | "workflow" | "start" | "end";
    position: { x: number; y: number };
    data: {
        stepId?: string;
        name: string;
        description?: string;
        stepType?: string;
        status?: StepStatus;
        [key: string]: unknown;
    };
}

export interface FlowEdge {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
    label?: string;
    type?: "success" | "error" | "condition";
    animated?: boolean;
    style?: {
        stroke?: string;
        strokeDasharray?: string;
    };
}

export interface WorkflowGraph {
    nodes: FlowNode[];
    edges: FlowEdge[];
    metadata: {
        id: string;
        name: string;
        version: string;
        description?: string;
        layout?: LayoutConfig;
    };
}

export type StepStatus = "pending" | "running" | "success" | "error" | "skipped" | "cancelled";

export interface LayoutConfig {
    algorithm: "dagre" | "elkjs" | "manual";
    direction: "TB" | "LR" | "BT" | "RL";
    spacing: {
        node: number;
        rank: number;
    };
}
```

#### 2.2 工作流文件管理器

创建 `src/server/core/workflow-manager.ts`，实现以下核心方法：

- `discoverWorkflows()`: 扫描工作流目录
- `readWorkflow(id)`: 读取单个工作流
- `readWorkflowRaw(id)`: 读取原始 YAML
- `saveWorkflow(id, workflow)`: 保存工作流
- `createWorkflow(data)`: 创建新工作流
- `deleteWorkflow(id)`: 删除工作流
- `renameWorkflow(id, newName)`: 重命名工作流
- `duplicateWorkflow(id, newName)`: 复制工作流

**关键实现点**：

- 使用 Bun 的 `Glob` API 扫描文件
- 使用 `yaml` 库解析和序列化
- 使用 Node.js `fs` 模块操作文件

#### 2.3 Elysia 服务器

创建 `src/server/index.ts`，实现：

**核心 API 路由**：

- `GET /api/workflows` - 获取工作流列表
- `GET /api/workflows/:id` - 获取单个工作流
- `GET /api/workflows/:id/raw` - 获取原始 YAML
- `POST /api/workflows` - 创建工作流
- `PUT /api/workflows/:id` - 更新工作流
- `DELETE /api/workflows/:id` - 删除工作流
- `PATCH /api/workflows/:id/rename` - 重命名工作流
- `POST /api/workflows/:id/duplicate` - 复制工作流
- `GET /api/directory` - 获取目录信息

**WebSocket 支持**：

- `/ws` 端点用于实时通信
- 维护客户端连接列表
- 广播文件变化事件

**文件监听**：

- 使用 `chokidar` 监听工作流目录
- 检测 `change`, `add`, `unlink` 事件
- 通过 WebSocket 通知客户端

#### 2.4 CLI 入口

```typescript
// src/cli.ts
#!/usr/bin/env bun
import { program } from 'commander';
import { resolve } from 'path';
import { startServer } from './server';

program
  .name('zouwu-design')
  .description('🌌 驺吾工作流可视化设计服务器')
  .option('-d, --dir <path>', '工作流文件目录路径', './workflows')
  .option('-p, --port <number>', '服务器端口', '3000')
  .option('-h, --host <host>', '服务器主机', 'localhost')
  .option('--open', '自动打开浏览器')
  .option('--no-watch', '禁用文件监听')
  .action(async (options) => {
    const port = parseInt(options.port, 10);
    const workflowDir = resolve(options.dir);

    console.log('🌌 启动驺吾工作流可视化服务器...');

    await startServer({
      port,
      host: options.host,
      workflowDir,
      open: options.open,
      watch: options.watch,
    });
  });

program.parse();
```

**阶段 2 验收标准**：

- ✅ 服务器可以启动（`bun run dev`）
- ✅ API 端点返回正确数据
- ✅ WebSocket 连接正常
- ✅ 文件监听工作正常
- ✅ CLI 命令参数生效

---

### 阶段 3: 实现前端基础框架（Week 3）

#### 3.1 创建入口文件

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="zh-CN">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>驺吾工作流可视化工具</title>
    </head>
    <body>
        <div id="root"></div>
        <script type="module" src="/src/client/main.tsx"></script>
    </body>
</html>
```

```typescript
// src/client/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

```css
/* src/client/styles/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
@import "reactflow/dist/style.css";

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

#root {
    width: 100vw;
    height: 100vh;
}
```

#### 3.2 创建路由

```typescript
// src/client/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import WorkflowListPage from './pages/WorkflowListPage';
import WorkflowEditorPage from './pages/WorkflowEditorPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WorkflowListPage />} />
        <Route path="/editor/:id" element={<WorkflowEditorPage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

#### 3.3 API 客户端

创建 `src/client/utils/api.ts`，实现所有 API 调用方法：

```typescript
const API_BASE = "/api";

export const api = {
    async getWorkflows() {
        /* ... */
    },
    async getWorkflow(id: string) {
        /* ... */
    },
    async createWorkflow(data) {
        /* ... */
    },
    async updateWorkflow(id, workflow) {
        /* ... */
    },
    async deleteWorkflow(id) {
        /* ... */
    },
    // ...
};
```

#### 3.4 WebSocket 客户端

创建 `src/client/utils/websocket.ts`：

```typescript
export class WorkflowWebSocket {
    private ws: WebSocket | null = null;
    private handlers = new Map<string, Set<Function>>();

    connect() {
        /* ... */
    }
    on(type: string, handler: Function) {
        /* ... */
    }
    off(type: string, handler: Function) {
        /* ... */
    }
    disconnect() {
        /* ... */
    }
}

export const workflowWS = new WorkflowWebSocket();
```

**阶段 3 验收标准**：

- ✅ 前端开发服务器启动（`bun run dev:client`）
- ✅ 路由工作正常
- ✅ API 客户端可以调用后端
- ✅ WebSocket 连接成功
- ✅ Tailwind CSS 样式生效

---

### 阶段 4: 实现核心转换逻辑（Week 4）

#### 4.1 YAML → Graph 转换

创建 `src/server/parser/yaml-to-graph.ts`：

```typescript
export function yamlToGraph(workflow: Workflow): WorkflowGraph {
    const nodes: FlowNode[] = [];
    const edges: FlowEdge[] = [];

    // 1. 添加开始节点
    nodes.push({
        id: "start",
        type: "start",
        position: { x: 0, y: 0 },
        data: { name: "开始" },
    });

    // 2. 遍历步骤，创建节点
    workflow.steps.forEach((step, index) => {
        nodes.push({
            id: step.id,
            type: mapStepTypeToNodeType(step.type),
            position: calculatePosition(index),
            data: {
                stepId: step.id,
                name: step.name || step.id,
                stepType: step.type,
                ...step,
            },
        });

        // 3. 创建连接
        const sourceId = index === 0 ? "start" : workflow.steps[index - 1].id;
        edges.push({
            id: `${sourceId}-${step.id}`,
            source: sourceId,
            target: step.id,
        });
    });

    // 4. 添加结束节点
    nodes.push({
        id: "end",
        type: "end",
        position: { x: 0, y: nodes.length * 100 },
        data: { name: "结束" },
    });

    // 5. 连接最后一个步骤到结束节点
    if (workflow.steps.length > 0) {
        edges.push({
            id: `${workflow.steps[workflow.steps.length - 1].id}-end`,
            source: workflow.steps[workflow.steps.length - 1].id,
            target: "end",
        });
    } else {
        edges.push({
            id: "start-end",
            source: "start",
            target: "end",
        });
    }

    return {
        nodes,
        edges,
        metadata: {
            id: workflow.id,
            name: workflow.name,
            version: workflow.version,
            description: workflow.description,
        },
    };
}
```

#### 4.2 Graph → YAML 转换

创建 `src/server/parser/graph-to-yaml.ts`：

```typescript
export function graphToYaml(graph: WorkflowGraph): Workflow {
    // 过滤掉 start 和 end 节点
    const stepNodes = graph.nodes.filter((node) => !["start", "end"].includes(node.type));

    // 根据连接关系确定步骤顺序
    const orderedSteps = orderStepsByEdges(stepNodes, graph.edges);

    const workflow: Workflow = {
        id: graph.metadata.id,
        name: graph.metadata.name,
        version: graph.metadata.version,
        description: graph.metadata.description,
        steps: orderedSteps.map((node) => ({
            id: node.data.stepId || node.id,
            type: node.data.stepType || "action",
            name: node.data.name,
            ...extractStepData(node.data),
        })),
    };

    return workflow;
}
```

#### 4.3 布局算法

创建 `src/client/utils/layout.ts`，使用 `dagre` 实现自动布局：

```typescript
import dagre from "dagre";
import type { FlowNode, FlowEdge } from "@/shared/types/workflow";

export function autoLayout(nodes: FlowNode[], edges: FlowEdge[]): FlowNode[] {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    // 设置图布局
    dagreGraph.setGraph({
        rankdir: "TB",
        nodesep: 100,
        ranksep: 100,
    });

    // 添加节点
    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: 150, height: 80 });
    });

    // 添加边
    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    // 执行布局
    dagre.layout(dagreGraph);

    // 应用布局结果
    return nodes.map((node) => {
        const position = dagreGraph.node(node.id);
        return {
            ...node,
            position: {
                x: position.x - 75,
                y: position.y - 40,
            },
        };
    });
}
```

**阶段 4 验收标准**：

- ✅ YAML 可以正确转换为 Graph
- ✅ Graph 可以正确转换为 YAML
- ✅ 自动布局算法工作正常
- ✅ 支持所有步骤类型
- ✅ 处理复杂工作流（条件、并行、循环）

---

### 阶段 5: 实现可视化编辑功能（Week 5）

#### 5.1 工作流列表页面

创建 `src/client/pages/WorkflowListPage.tsx`：

**核心功能**：

- 显示所有工作流卡片
- 搜索和过滤
- 新建、编辑、删除、复制、重命名操作
- 响应 WebSocket 事件自动刷新

#### 5.2 工作流编辑器页面

创建 `src/client/pages/WorkflowEditorPage.tsx`：

**核心功能**：

- 顶部工具栏（保存、验证、YAML 预览等）
- 左侧步骤库（可拖拽的步骤类型）
- 中央画布（React Flow）
- 底部属性面板

#### 5.3 自定义节点组件

创建 `src/client/components/Canvas/CustomNodes.tsx`：

```typescript
// 为每种节点类型创建组件
export function ActionNode({ data, selected }: NodeProps) {
  return (
    <div className="rounded-lg p-3 bg-node-action-bg border-2 border-node-action-border">
      <div className="flex items-center gap-2">
        <span>⚙️</span>
        <span className="font-medium">{data.name}</span>
      </div>
      <div className="text-xs text-gray-500 mt-1">{data.stepId}</div>
      <Handle type="target" position="top" />
      <Handle type="source" position="bottom" />
    </div>
  );
}

export function ConditionNode({ data, selected }: NodeProps) {
  return (
    <div className="relative w-32 h-32">
      <div className="absolute inset-0 rotate-45 bg-node-condition-bg border-2 border-node-condition-border" />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl">❓</span>
      </div>
      <Handle type="target" position="top" />
      <Handle type="source" position="right" id="true" />
      <Handle type="source" position="left" id="false" />
    </div>
  );
}

// ... 其他节点类型
```

#### 5.4 属性编辑面板

创建 `src/client/components/PropertyPanel/PropertyEditor.tsx`：

**核心功能**：

- 根据选中节点类型显示不同的表单
- 实时更新节点数据
- 表单验证
- 支持高级配置（重试、超时、错误处理等）

**阶段 5 验收标准**：

- ✅ 工作流列表正确显示
- ✅ 可以创建、编辑、删除工作流
- ✅ React Flow 画布正常渲染
- ✅ 自定义节点样式正确
- ✅ 拖拽操作流畅
- ✅ 属性编辑功能完整

---

### 阶段 6: 实现实时通信和文件监听（Week 6）

#### 6.1 WebSocket 集成

在前端页面中集成 WebSocket：

```typescript
// src/client/pages/WorkflowListPage.tsx
useEffect(() => {
    workflowWS.connect();

    workflowWS.on("workflow-updated", (message) => {
        console.log("工作流已更新:", message.data.filePath);
        refreshWorkflows();
    });

    workflowWS.on("workflow-added", (message) => {
        console.log("新工作流已添加:", message.data.filePath);
        refreshWorkflows();
    });

    workflowWS.on("workflow-deleted", (message) => {
        console.log("工作流已删除:", message.data.filePath);
        refreshWorkflows();
    });

    return () => {
        workflowWS.disconnect();
    };
}, []);
```

#### 6.2 文件监听

确保后端文件监听正确广播事件：

```typescript
// src/server/index.ts
watcher.on("change", async (filePath) => {
    console.log(`📝 检测到文件变化: ${filePath}`);

    for (const ws of wsClients) {
        ws.send(
            JSON.stringify({
                type: "workflow-updated",
                data: { filePath, timestamp: Date.now() },
            }),
        );
    }
});
```

#### 6.3 冲突检测

实现编辑冲突检测：

```typescript
// 检测本地版本与服务器版本
async function checkConflict(workflowId: string) {
    const localVersion = getLocalVersion(workflowId);
    const serverVersion = await api.getWorkflow(workflowId);

    if (localVersion.lastModified !== serverVersion.lastModified) {
        // 显示冲突对话框
        showConflictDialog({
            local: localVersion,
            server: serverVersion,
            onResolve: (choice) => {
                if (choice === "use-server") {
                    loadServerVersion();
                } else if (choice === "use-local") {
                    saveLocalVersion();
                } else if (choice === "merge") {
                    showMergeEditor();
                }
            },
        });
    }
}
```

**阶段 6 验收标准**：

- ✅ WebSocket 实时通信正常
- ✅ 文件变化自动刷新界面
- ✅ 冲突检测工作正常
- ✅ 多客户端同步正常

---

### 阶段 7: UI/UX 优化和完善（Week 7）

#### 7.1 响应式设计

- 实现移动端、平板、桌面端布局
- 使用 Tailwind CSS 的响应式类
- 测试不同屏幕尺寸

#### 7.2 交互优化

- 添加加载状态
- 添加错误提示（Toast）
- 添加确认对话框
- 实现撤销/重做
- 实现键盘快捷键
- 优化拖拽体验

#### 7.3 性能优化

- 虚拟化长列表
- 节点懒加载
- 防抖和节流
- 代码分割

#### 7.4 动画和过渡

- 节点添加动画
- 页面过渡动画
- 执行状态动画
- 连接线动画

**阶段 7 验收标准**：

- ✅ 响应式布局正常
- ✅ 交互体验流畅
- ✅ 加载速度快
- ✅ 动画效果自然

---

### 阶段 8: 测试、文档和发布（Week 8）

#### 8.1 单元测试

```typescript
// src/server/core/__tests__/workflow-manager.test.ts
describe("WorkflowManager", () => {
    it("should discover workflows", async () => {
        // ...
    });

    it("should create workflow", async () => {
        // ...
    });
});
```

#### 8.2 集成测试

```typescript
// src/client/__tests__/api.test.ts
describe("API Client", () => {
    it("should fetch workflows", async () => {
        // ...
    });
});
```

#### 8.3 端到端测试

使用 Playwright 或 Cypress 进行 E2E 测试。

#### 8.4 文档编写

创建以下文档：

- `README.md` - 快速开始指南
- `docs/API.md` - API 文档
- `docs/ARCHITECTURE.md` - 架构说明
- `docs/CONTRIBUTING.md` - 贡献指南

#### 8.5 发布准备

- 版本号管理
- 构建脚本
- 发布到 npm（如需要）
- CI/CD 配置

**阶段 8 验收标准**：

- ✅ 测试覆盖率 ≥ 80%
- ✅ 所有测试通过
- ✅ 文档完整
- ✅ 构建成功
- ✅ 可以发布

---

## 实施检查清单

### 阶段 1: 项目基础结构 ⏱️ Week 1

- [ ] 创建包目录结构
- [ ] 初始化 package.json
- [ ] 配置 TypeScript
- [ ] 配置 Vite
- [ ] 配置 Tailwind CSS
- [ ] 依赖安装成功
- [ ] 基础构建通过

### 阶段 2: 后端服务器 ⏱️ Week 2

- [ ] 共享类型定义
- [ ] 工作流文件管理器
    - [ ] discoverWorkflows
    - [ ] readWorkflow
    - [ ] saveWorkflow
    - [ ] createWorkflow
    - [ ] deleteWorkflow
    - [ ] renameWorkflow
    - [ ] duplicateWorkflow
- [ ] Elysia 服务器
    - [ ] API 路由实现
    - [ ] WebSocket 支持
    - [ ] 文件监听
- [ ] CLI 入口
- [ ] 服务器启动测试

### 阶段 3: 前端基础 ⏱️ Week 3

- [ ] 入口文件
- [ ] 路由配置
- [ ] API 客户端
- [ ] WebSocket 客户端
- [ ] 基础样式
- [ ] 前端开发服务器启动

### 阶段 4: 核心转换 ⏱️ Week 4

- [ ] YAML → Graph 转换
- [ ] Graph → YAML 转换
- [ ] 自动布局算法
- [ ] 转换测试

### 阶段 5: 可视化编辑 ⏱️ Week 5

- [ ] 工作流列表页面
- [ ] 工作流编辑器页面
- [ ] 自定义节点组件
    - [ ] ActionNode
    - [ ] BuiltinNode
    - [ ] ConditionNode
    - [ ] ParallelNode
    - [ ] LoopNode
    - [ ] StartNode
    - [ ] EndNode
- [ ] 属性编辑面板
- [ ] 工具栏组件

### 阶段 6: 实时功能 ⏱️ Week 6

- [ ] WebSocket 集成
- [ ] 文件监听
- [ ] 冲突检测
- [ ] 多客户端同步

### 阶段 7: UI/UX 优化 ⏱️ Week 7

- [ ] 响应式设计
- [ ] 交互优化
- [ ] 性能优化
- [ ] 动画和过渡

### 阶段 8: 测试和发布 ⏱️ Week 8

- [ ] 单元测试（≥ 80% 覆盖率）
- [ ] 集成测试
- [ ] 端到端测试
- [ ] 文档编写
- [ ] 发布准备

---

## 总结

本 RFC 提出了一个基于 Bun 和 React Flow 的工作流可视化应用，旨在提升驺吾工作流的设计、理解和调试体验。通过 `npx zouwu-design` 命令启动本地 Web 服务器，自动扫描指定目录的工作流文件，提供完整的工作流列表和可视化设计功能。

**技术可行性**: ✅ **已验证** - Elysia 和 React Flow 完全满足所有需求

**实施计划**: ✅ **已完成** - 提供完整的 8 周分步实施指南

**预计工期**: **8 周**（4 个双周迭代）

**关键成功因素**：

1. ✅ 严格按照阶段顺序实施
2. ✅ 每个阶段完成后进行验收
3. ✅ 保持代码质量和测试覆盖率
4. ✅ 及时处理技术债务
5. ✅ 持续用户反馈和迭代

通过图形化界面和动态设计功能，将大大降低工作流的创建和维护成本，同时为团队协作提供更好的工具支持。
