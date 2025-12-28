# @zouwu-wf/workflow-graph

驺吾工作流图形转换器 - 提供 YAML 工作流与图形表示之间的双向转换。

## 安装

```bash
pnpm add @zouwu-wf/workflow-graph
```

## 功能

- **yamlToGraph**: 将 YAML 工作流转换为 React Flow 图形
- **graphToYaml**: 将 React Flow 图形转换回 YAML 工作流

## 使用

```typescript
import { yamlToGraph, graphToYaml } from "@zouwu-wf/workflow-graph";
import type { WorkflowGraph } from "@zouwu-wf/workflow-graph";

// YAML → Graph
const workflowYaml = {
    id: "my_workflow",
    name: "我的工作流",
    version: "1.0.0",
    steps: [
        { id: "step1", type: "action", name: "步骤1" },
        { id: "step2", type: "action", name: "步骤2", dependsOn: "step1" },
    ],
};

const graph = yamlToGraph(workflowYaml);
// graph.nodes: FlowNode[]
// graph.edges: FlowEdge[]
// graph.metadata: { id, name, version, layout }

// Graph → YAML
const yaml = graphToYaml(graph, existingWorkflow);
// 返回完整的工作流 YAML 对象
```

## API

### yamlToGraph(workflowYaml: any): WorkflowGraph

将 YAML 工作流转换为图形表示。

**参数：**

- `workflowYaml`: 工作流 YAML 对象

**返回：**

- `WorkflowGraph`: 包含节点、边和元数据的图形对象

### graphToYaml(graph: WorkflowGraph, existingWorkflow?: any): any

将图形表示转换回 YAML 工作流。

**参数：**

- `graph`: 工作流图形对象
- `existingWorkflow`: 可选，现有工作流对象（用于保留元数据）

**返回：**

- 完整的工作流 YAML 对象

## 类型

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
        [key: string]: any;
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

## 开发

```bash
# 安装依赖
pnpm install

# 构建
pnpm build

# 开发模式（监听文件变化）
pnpm dev

# 类型检查
pnpm typecheck
```

## License

MIT
