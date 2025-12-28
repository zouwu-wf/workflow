/**
 * 工作流图形类型定义
 */

/**
 * 流程节点
 */
export interface FlowNode {
    id: string;
    type: "step" | "condition" | "parallel" | "loop" | "start" | "end";
    position: { x: number; y: number };
    data: {
        stepId: string;
        name: string;
        description?: string;
        stepType?: string;
        status?: StepStatus;
        condition?: any;
        [key: string]: any;
    };
}

/**
 * 流程边（连接线）
 */
export interface FlowEdge {
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

/**
 * 工作流图
 */
export interface WorkflowGraph {
    nodes: FlowNode[];
    edges: FlowEdge[];
    metadata: {
        id: string;
        name: string;
        version: string;
        layout?: LayoutConfig;
    };
}

/**
 * 步骤状态
 */
export type StepStatus = "pending" | "running" | "success" | "error" | "skipped" | "cancelled";

/**
 * 布局配置
 */
export interface LayoutConfig {
    direction: "TB" | "LR" | "BT" | "RL";
    spacing: { x: number; y: number };
}
