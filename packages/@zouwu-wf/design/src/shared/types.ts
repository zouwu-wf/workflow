/**
 * 服务器启动选项
 */
export interface ServerOptions {
    port: number;
    host: string;
    workflowDir: string;
    open?: boolean;
    watch?: boolean;
}

/**
 * 工作流信息
 */
export interface WorkflowInfo {
    id: string;
    name: string;
    fileName: string;
    path: string;
    version: string;
    description?: string;
    lastModified: number;
}

// 从 graph 包导出类型
export type { FlowNode, FlowEdge, WorkflowGraph, StepStatus, LayoutConfig } from "@zouwu-wf/graph";
