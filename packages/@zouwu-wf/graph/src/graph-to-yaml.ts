import type { WorkflowGraph, FlowNode } from "./types.js";

/**
 * 将 React Flow 图形转换为 YAML 工作流
 */
export function graphToYaml(graph: WorkflowGraph, existingWorkflow?: any): any {
    // 从现有工作流获取基础信息，或使用图形元数据
    const workflow: any = existingWorkflow
        ? { ...existingWorkflow }
        : {
              id: graph.metadata.id,
              name: graph.metadata.name,
              version: graph.metadata.version || "1.0.0",
              description: "",
          };

    // 更新更新时间戳
    workflow.updatedAt = Date.now();
    if (!workflow.createdAt) {
        workflow.createdAt = Date.now();
    }

    // 过滤掉开始和结束节点，只处理实际步骤
    const stepNodes = graph.nodes.filter((node) => node.id !== "start" && node.id !== "end");

    // 构建步骤数组
    const steps: any[] = [];
    const nodeMap = new Map<string, FlowNode>();

    // 创建节点映射
    stepNodes.forEach((node) => {
        nodeMap.set(node.id, node);
    });

    // 构建依赖关系映射
    const dependencies = new Map<string, string[]>();
    graph.edges.forEach((edge) => {
        if (edge.source !== "start" && edge.target !== "end") {
            if (!dependencies.has(edge.target)) {
                dependencies.set(edge.target, []);
            }
            dependencies.get(edge.target)!.push(edge.source);
        }
    });

    // 按依赖顺序排序节点（简单的拓扑排序）
    const visited = new Set<string>();
    const sortedNodes: FlowNode[] = [];

    const visit = (nodeId: string) => {
        if (visited.has(nodeId)) return;
        visited.add(nodeId);

        const deps = dependencies.get(nodeId) || [];
        deps.forEach((dep) => {
            if (nodeMap.has(dep)) {
                visit(dep);
            }
        });

        const node = nodeMap.get(nodeId);
        if (node) {
            sortedNodes.push(node);
        }
    };

    stepNodes.forEach((node) => {
        if (!visited.has(node.id)) {
            visit(node.id);
        }
    });

    // 转换为步骤格式
    sortedNodes.forEach((node) => {
        const step: any = {
            id: node.data.stepId || node.id,
            type: node.data.stepType || node.type || "action",
        };

        if (node.data.name) {
            step.name = node.data.name;
        }

        if (node.data.description) {
            step.description = node.data.description;
        }

        // 添加依赖关系
        const deps = dependencies.get(node.id);
        if (deps && deps.length > 0) {
            step.dependsOn = deps.length === 1 ? deps[0] : deps;
        }

        // 根据节点类型添加特定属性
        if (node.type === "condition" && node.data.condition) {
            step.condition = node.data.condition;
        }

        // 保留其他数据属性
        Object.keys(node.data).forEach((key) => {
            if (
                !["stepId", "name", "description", "stepType", "status", "condition"].includes(key)
            ) {
                step[key] = node.data[key];
            }
        });

        steps.push(step);
    });

    workflow.steps = steps;

    return workflow;
}
