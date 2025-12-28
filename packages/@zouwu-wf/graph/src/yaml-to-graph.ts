import type { WorkflowGraph, FlowNode, FlowEdge } from "./types.js";

/**
 * 将 YAML 工作流转换为 React Flow 图形
 */
export function yamlToGraph(workflowYaml: any): WorkflowGraph {
    const nodes: FlowNode[] = [];
    const edges: FlowEdge[] = [];

    // 默认水平布局配置
    const layout = {
        direction: "LR" as const,
        spacing: { x: 200, y: 100 },
    };

    // 创建开始节点
    const startNode: FlowNode = {
        id: "start",
        type: "start",
        position: { x: 0, y: 0 },
        data: {
            stepId: "start",
            name: "开始",
            description: "工作流开始",
        },
    };
    nodes.push(startNode);

    // 处理步骤
    let currentX = layout.spacing.x;
    let currentY = 0;

    if (workflowYaml.steps && Array.isArray(workflowYaml.steps)) {
        workflowYaml.steps.forEach((step: any, index: number) => {
            const stepId = step.id || `step-${index}`;
            const stepName = step.name || stepId;
            const stepType = step.type || "action";

            const node: FlowNode = {
                id: stepId,
                type: stepType === "condition" ? "condition" : "step",
                position: { x: currentX, y: currentY },
                data: {
                    stepId,
                    name: stepName,
                    description: step.description,
                    stepType: stepType,
                    condition: step.condition,
                },
            };

            nodes.push(node);

            // 创建连接（处理 dependsOn）
            let sourceIds: string[] = [];
            if (step.dependsOn) {
                sourceIds = Array.isArray(step.dependsOn) ? step.dependsOn : [step.dependsOn];
            } else if (index === 0) {
                sourceIds = ["start"];
            } else {
                sourceIds = [workflowYaml.steps[index - 1].id || `step-${index - 1}`];
            }

            sourceIds.forEach((sourceId) => {
                const edge: FlowEdge = {
                    id: `edge-${sourceId}-${stepId}`,
                    source: sourceId,
                    target: stepId,
                    sourceHandle: "right",
                    targetHandle: "left",
                };
                edges.push(edge);
            });

            // 更新位置（水平布局）
            currentX += layout.spacing.x;
        });
    }

    // 创建结束节点
    // 结束节点应该放在最后一个步骤节点之后
    const lastStepId = nodes.length > 1 ? nodes[nodes.length - 1].id : "start";
    const endNode: FlowNode = {
        id: "end",
        type: "end",
        position: {
            x: currentX, // 使用当前的 currentX，即最后一个步骤节点之后
            y: 0,
        },
        data: {
            stepId: "end",
            name: "结束",
            description: "工作流结束",
        },
    };
    nodes.push(endNode);

    // 连接到结束节点
    const endEdge: FlowEdge = {
        id: `edge-${lastStepId}-end`,
        source: lastStepId,
        target: "end",
        sourceHandle: "right",
        targetHandle: "left",
    };
    edges.push(endEdge);

    return {
        nodes,
        edges,
        metadata: {
            id: workflowYaml.id || "unknown",
            name: workflowYaml.name || "未命名工作流",
            version: workflowYaml.version || "1.0.0",
            layout,
        },
    };
}
