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
import YamlPreviewModal from "../components/YamlPreviewModal";
import ValidationResultModal from "../components/ValidationResultModal";
import type { WorkflowInfo } from "../../shared/types";
import "./WorkflowCanvas.css";

interface WorkflowCanvasProps {
    workflow: WorkflowInfo;
}

function WorkflowCanvasInner({ workflow }: WorkflowCanvasProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [loading, setLoading] = useState(true);
    const [showYamlPreview, setShowYamlPreview] = useState(false);
    const [yamlContent, setYamlContent] = useState("");
    const [loadingYaml, setLoadingYaml] = useState(false);
    const [showValidationResult, setShowValidationResult] = useState(false);
    const [validationResult, setValidationResult] = useState<{
        valid: boolean;
        errors: Array<{ path: string; message: string; value?: any }>;
    } | null>(null);
    const [validating, setValidating] = useState(false);

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

    // 处理预览 YAML 按钮点击
    const handlePreviewYaml = useCallback(async () => {
        setLoadingYaml(true);
        try {
            const response = await fetch(`/api/workflows/${workflow.id}/raw`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            setYamlContent(data.content || "");
            setShowYamlPreview(true);
        } catch (err) {
            console.error("Failed to load YAML:", err);
            alert(`无法加载 YAML: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setLoadingYaml(false);
        }
    }, [workflow.id]);

    // 处理验证按钮点击
    const handleValidate = useCallback(async () => {
        setValidating(true);
        try {
            const response = await fetch(`/api/workflows/${workflow.id}/validate`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            setValidationResult({
                valid: data.valid,
                errors: data.errors || [],
            });
            setShowValidationResult(true);
        } catch (err) {
            console.error("Failed to validate workflow:", err);
            setValidationResult({
                valid: false,
                errors: [
                    {
                        path: "root",
                        message: `验证请求失败: ${err instanceof Error ? err.message : String(err)}`,
                    },
                ],
            });
            setShowValidationResult(true);
        } finally {
            setValidating(false);
        }
    }, [workflow.id]);

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
                    <Button onClick={handleValidate} disabled={validating}>
                        {validating ? "验证中..." : "验证"}
                    </Button>
                    <Button onClick={handlePreviewYaml} disabled={loadingYaml}>
                        {loadingYaml ? "加载中..." : "预览 YAML"}
                    </Button>
                </div>
            </div>
            <div className="canvas-content">
                {/* @ts-expect-error - React 18/19 type compatibility issue with reactflow */}
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
                    {/* @ts-expect-error - React 18/19 type compatibility issue with reactflow */}
                    <Background />
                    {/* @ts-expect-error - React 18/19 type compatibility issue with reactflow */}
                    <Controls />
                    {/* @ts-expect-error - React 18/19 type compatibility issue with reactflow */}
                    <MiniMap />
                </ReactFlow>
            </div>
            <YamlPreviewModal
                isOpen={showYamlPreview}
                yamlContent={yamlContent}
                workflowName={workflow.name}
                onClose={() => setShowYamlPreview(false)}
                readOnly={true}
            />
            {validationResult && (
                <ValidationResultModal
                    isOpen={showValidationResult}
                    onClose={() => setShowValidationResult(false)}
                    valid={validationResult.valid}
                    errors={validationResult.errors}
                    workflowName={workflow.name}
                />
            )}
        </div>
    );
}

function WorkflowCanvas({ workflow }: WorkflowCanvasProps) {
    return (
        // @ts-expect-error - React 18/19 type compatibility issue with reactflow
        <ReactFlowProvider>
            <WorkflowCanvasInner workflow={workflow} />
        </ReactFlowProvider>
    );
}

export default WorkflowCanvas;
