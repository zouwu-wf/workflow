import React, { useState, useMemo } from "react";
import {
    Tree,
    buildTreeFromPaths,
    Button,
    Input,
    LoadingMessage,
    ErrorMessage,
    EmptyMessage,
} from "@zouwu-wf/components";
import type { TreeNodeData } from "@zouwu-wf/components";
import type { WorkflowInfo } from "../../shared/types";
import "./WorkflowTree.css";

interface WorkflowTreeProps {
    workflows: WorkflowInfo[];
    workflowDir?: string;
    onSelectWorkflow: (workflow: WorkflowInfo) => void;
    selectedWorkflow: WorkflowInfo | null;
    loading?: boolean;
    error?: string | null;
    onRefresh?: () => void;
}

function WorkflowTree({
    workflows,
    workflowDir = "",
    onSelectWorkflow,
    selectedWorkflow,
    loading = false,
    error = null,
    onRefresh,
}: WorkflowTreeProps) {
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");

    // 将工作流转换为树节点数据
    const treeData = useMemo(() => {
        const items = workflows.map((workflow) => {
            // 计算相对于 workflowDir 的路径
            let relativePath = workflow.path;
            if (workflowDir) {
                // 标准化路径分隔符
                const normalizedWorkflowDir = workflowDir.replace(/\\/g, "/");
                const normalizedFilePath = workflow.path.replace(/\\/g, "/");

                // 提取相对路径
                if (normalizedFilePath.startsWith(normalizedWorkflowDir)) {
                    relativePath = normalizedFilePath.slice(normalizedWorkflowDir.length);
                    // 移除开头的斜杠
                    if (relativePath.startsWith("/")) {
                        relativePath = relativePath.slice(1);
                    }
                }
            }

            // 提取目录路径（不包括文件名）
            // 例如: "folder1/subfolder/workflow.yml" -> "folder1/subfolder/workflow"
            const pathParts = relativePath.split("/");
            const fileName = pathParts[pathParts.length - 1];
            const fileNameWithoutExt = fileName.replace(/\.(zouwu|yml|yaml)$/, "");
            const dirPath = pathParts.slice(0, -1).join("/");

            // 构建树路径：目录路径 + 文件名（不含扩展名）
            const treePath = dirPath ? `${dirPath}/${fileNameWithoutExt}` : fileNameWithoutExt;

            // 使用完整文件路径确保 ID 唯一性（即使工作流 ID 重复）
            // 格式：workflowId::完整文件路径（标准化）
            // 使用 workflow.path（完整文件路径）而不是 treePath，确保绝对唯一
            const normalizedPath = workflow.path.replace(/\\/g, "/");
            const uniqueId = `${workflow.id}::${normalizedPath}`;
            return {
                id: uniqueId,
                name: workflow.name,
                path: treePath,
                data: {
                    workflow,
                    version: workflow.version,
                },
            };
        });

        return buildTreeFromPaths(items);
    }, [workflows, workflowDir]);

    const handleSelect = (node: TreeNodeData) => {
        if (node.data && "workflow" in node.data) {
            onSelectWorkflow(node.data.workflow as WorkflowInfo);
        }
    };

    const handleToggle = (nodeId: string, expanded: boolean) => {
        const next = new Set(expandedIds);
        if (expanded) {
            next.add(nodeId);
        } else {
            next.delete(nodeId);
        }
        setExpandedIds(next);
    };

    return (
        <div className="workflow-tree">
            <div className="tree-header">
                <div className="header-top">
                    <h2>工作流列表</h2>
                    {onRefresh && (
                        <Button
                            onClick={onRefresh}
                            disabled={loading}
                            title="刷新列表"
                            className="refresh-btn"
                        >
                            🔄
                        </Button>
                    )}
                </div>
                <div className="search-box">
                    <Input
                        type="text"
                        placeholder="搜索工作流..."
                        value={searchQuery}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setSearchQuery(e.target.value)
                        }
                        disabled={loading}
                    />
                </div>
                <Button
                    onClick={() => {
                        /* TODO */
                    }}
                    disabled={loading}
                    className="new-workflow-btn"
                >
                    + 新建工作流
                </Button>
            </div>

            <div className="tree-content winxp-scrollbar" style={{ height: "calc(100vh - 200px)" }}>
                {loading && <LoadingMessage message="加载中..." />}

                {error && <ErrorMessage message={error} onRetry={onRefresh} />}

                {!loading && !error && (
                    <>
                        {workflows.length === 0 ? (
                            <EmptyMessage
                                message="没有找到工作流"
                                actionLabel="创建第一个工作流"
                                onAction={() => {
                                    /* TODO */
                                }}
                            />
                        ) : (
                            <Tree
                                data={treeData}
                                selectedId={
                                    selectedWorkflow
                                        ? (() => {
                                              // 查找匹配的工作流节点
                                              const findNode = (
                                                  nodes: TreeNodeData[],
                                              ): TreeNodeData | null => {
                                                  for (const node of nodes) {
                                                      if (
                                                          node.data &&
                                                          "workflow" in node.data &&
                                                          (node.data.workflow as WorkflowInfo)
                                                              .id === selectedWorkflow.id &&
                                                          (node.data.workflow as WorkflowInfo)
                                                              .path === selectedWorkflow.path
                                                      ) {
                                                          return node;
                                                      }
                                                      if (node.children) {
                                                          const found = findNode(node.children);
                                                          if (found) return found;
                                                      }
                                                  }
                                                  return null;
                                              };
                                              return findNode(treeData)?.id || null;
                                          })()
                                        : null
                                }
                                expandedIds={expandedIds}
                                onSelect={handleSelect}
                                onToggle={handleToggle}
                                searchQuery={searchQuery}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default WorkflowTree;
