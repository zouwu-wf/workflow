import React, { useState, useEffect, useCallback } from "react";
import WorkflowTree from "./pages/WorkflowTree";
import WorkflowCanvas from "./pages/WorkflowCanvas";
import ResizableSplitter from "./components/ResizableSplitter";
import type { WorkflowInfo } from "../shared/types";
import "./App.css";

function App() {
    const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowInfo | null>(null);
    const [workflows, setWorkflows] = useState<WorkflowInfo[]>([]);
    const [workflowDir, setWorkflowDir] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 加载工作流列表
    const loadWorkflows = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch("/api/workflows");
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }
            const data = await res.json();
            setWorkflows(data.workflows || []);
            setWorkflowDir(data.directory || "");
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "加载工作流列表失败";
            console.error("Failed to load workflows:", err);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    // 初始加载
    useEffect(() => {
        loadWorkflows();
    }, [loadWorkflows]);

    return (
        <div className="app-container">
            <ResizableSplitter
                minLeftWidth={250}
                minRightWidth={400}
                initialLeftWidth={300}
                direction="vertical"
                splitterWidth={4}
                left={
                    <WorkflowTree
                        workflows={workflows}
                        workflowDir={workflowDir}
                        onSelectWorkflow={setSelectedWorkflow}
                        selectedWorkflow={selectedWorkflow}
                        loading={loading}
                        error={error}
                        onRefresh={loadWorkflows}
                    />
                }
                right={
                    selectedWorkflow ? (
                        <WorkflowCanvas workflow={selectedWorkflow} />
                    ) : (
                        <div className="empty-state">
                            <h2>选择一个工作流开始设计</h2>
                            <p>从左侧列表中选择一个工作流，或创建新工作流</p>
                        </div>
                    )
                }
            />
        </div>
    );
}

export default App;
