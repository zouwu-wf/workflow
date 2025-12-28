import React, { useEffect, useState, useCallback } from "react";
import ReactFlow, {
    Node,
    Edge,
    Background,
    Controls,
    MiniMap,
    Connection,
    addEdge,
    useNodesState,
    useEdgesState,
    ReactFlowProvider,
    Position,
} from "reactflow";
import "reactflow/dist/style.css";
import { Button, LoadingMessage } from "@zouwu-wf/components";
import type { WorkflowInfo } from "../../shared/types";
import "./WorkflowCanvas.css";

interface WorkflowCanvasProps {
    workflow: WorkflowInfo;
}

function WorkflowCanvasInner({ workflow }: WorkflowCanvasProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [loading, setLoading] = useState(true);

    // 加载工作流数据并转换为图形
    useEffect(() => {
        setLoading(true);
        fetch(`/api/workflows/${workflow.id}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.graph) {
                    // 使用服务器返回的图形数据
                    const flowNodes: Node[] = data.graph.nodes.map((n: any) => ({
                        id: n.id,
                        type: "default",
                        position: n.position,
                        data: { label: n.data.name },
                        sourcePosition: Position.Right,
                        targetPosition: Position.Left,
                    }));

                    const flowEdges: Edge[] = data.graph.edges.map((e: any) => ({
                        id: e.id,
                        source: e.source,
                        target: e.target,
                        sourceHandle: e.sourceHandle,
                        targetHandle: e.targetHandle,
                        label: e.label,
                        style: e.style,
                    }));

                    setNodes(flowNodes);
                    setEdges(flowEdges);
                } else {
                    // 降级：创建简单的节点和边
                    const initialNodes: Node[] = [
                        {
                            id: "start",
                            type: "default",
                            position: { x: 100, y: 100 },
                            data: { label: "开始" },
                            sourcePosition: Position.Right,
                        },
                    ];

                    const initialEdges: Edge[] = [];

                    setNodes(initialNodes);
                    setEdges(initialEdges);
                }
                setLoading(false);
            })
            .catch((err) => {
                console.error("Failed to load workflow:", err);
                setLoading(false);
            });
    }, [workflow.id, setNodes, setEdges]);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges],
    );

    if (loading) {
        return (
            <div className="canvas-loading">
                <LoadingMessage message="加载工作流..." />
            </div>
        );
    }

    return (
        <div className="workflow-canvas">
            <div className="canvas-header">
                <h2>{workflow.name}</h2>
                <div className="canvas-actions">
                    <Button>保存</Button>
                    <Button>验证</Button>
                    <Button>预览 YAML</Button>
                </div>
            </div>
            <div className="canvas-content">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    minZoom={0.1}
                    maxZoom={2}
                    fitView={true}
                    nodeTypes={{}}
                >
                    <Background />
                    <Controls />
                    <MiniMap />
                </ReactFlow>
            </div>
        </div>
    );
}

function WorkflowCanvas({ workflow }: WorkflowCanvasProps) {
    return (
        <ReactFlowProvider>
            <WorkflowCanvasInner workflow={workflow} />
        </ReactFlowProvider>
    );
}

export default WorkflowCanvas;
