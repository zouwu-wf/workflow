import React, { useMemo, useCallback, useRef, useEffect, useState } from "react";
import { Tree as ArboristTree, NodeApi } from "react-arborist";
import type { TreeProps, TreeNodeData } from "./types";
import "./Tree.css";

// 将 TreeNodeData 转换为 react-arborist 需要的格式
// 直接将所有属性放在顶层，不需要 _original 包装
function convertToArboristData<T>(nodes: TreeNodeData<T>[]): any[] {
    return nodes.map((node) => {
        // 确保 ID 是字符串且唯一
        const uniqueId = String(node.id);
        return {
            id: uniqueId,
            name: node.name,
            // 直接展开所有其他属性，而不是放在 _original 中
            type: node.type,
            path: node.path,
            data: node.data,
            icon: node.icon,
            disabled: node.disabled,
            className: node.className,
            children: node.children ? convertToArboristData(node.children) : undefined,
        };
    });
}

function Tree<T = any>({
    data,
    selectedId,
    expandedIds,
    onSelect,
    onToggle,
    searchQuery = "",
    showSearch = false,
    searchPlaceholder = "搜索...",
    renderNode,
    folderIcon,
    fileIcon,
    emptyRender,
    className = "",
}: TreeProps<T>) {
    // 用于获取容器高度的 ref
    const containerRef = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState(600); // 默认高度

    // 动态计算容器高度
    useEffect(() => {
        const updateHeight = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const newHeight = rect.height || 600;
                // 确保是数字类型
                setHeight(Math.max(100, Math.floor(newHeight)));
            }
        };

        // 使用 requestAnimationFrame 确保 DOM 已渲染
        const timeoutId = setTimeout(() => {
            updateHeight();
        }, 0);

        window.addEventListener("resize", updateHeight);
        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener("resize", updateHeight);
        };
    }, []);

    // 转换为 react-arborist 格式
    const arboristData = useMemo(() => convertToArboristData(data), [data]);

    // 处理节点选择（react-arborist 使用 onActivate）
    const handleSelect = useCallback(
        (node: NodeApi<any>) => {
            if (node?.data) {
                // 直接从 node.data 构建 TreeNodeData，不需要 _original
                const treeNode: TreeNodeData<T> = {
                    id: node.data.id,
                    name: node.data.name,
                    type: node.data.type,
                    path: node.data.path,
                    data: node.data.data,
                    icon: node.data.icon,
                    disabled: node.data.disabled,
                    className: node.data.className,
                    children: node.data.children,
                };
                onSelect?.(treeNode);
            }
        },
        [onSelect],
    );

    // 处理节点展开/折叠
    // react-arborist 的 onToggle 接收 (id: string) => void
    const handleToggle = useCallback(
        (id: string) => {
            // 从 arboristData 中查找节点
            const findNodeById = (nodes: any[], targetId: string): any | null => {
                for (const node of nodes) {
                    if (node.id === targetId) {
                        return node;
                    }
                    if (node.children) {
                        const found = findNodeById(node.children, targetId);
                        if (found) return found;
                    }
                }
                return null;
            };
            const node = findNodeById(arboristData, id);
            if (node?.id) {
                // 注意：react-arborist 内部管理展开状态，这里我们只通知外部
                // 实际展开状态需要从 react-arborist 的树状态中获取
                // 简化处理：假设调用 onToggle 时状态已改变
                onToggle?.(node.id, true);
            } else {
                console.warn("Tree toggle: node not found:", { id });
            }
        },
        [onToggle, arboristData],
    );

    // 自定义节点渲染
    // react-arborist 的 children 接收 NodeRendererProps
    const renderNodeContent = useCallback(
        (props: { node: NodeApi<any> }) => {
            const node = props.node;
            // 安全检查：确保 node.data 存在
            if (!node?.data) {
                console.error("Tree renderNodeContent: node.data is missing!", {
                    nodeId: node?.id,
                    hasNode: !!node,
                    hasData: !!node?.data,
                });
                return <div>Invalid node data</div>;
            }
            const nodeData = node.data;
            const hasChildren = nodeData.children && nodeData.children.length > 0;
            const isFolder = nodeData.type === "folder" || hasChildren;
            const isSelected = selectedId === nodeData.id;

            // 构建 TreeNodeData 用于回调
            const treeNode: TreeNodeData<T> = {
                id: nodeData.id,
                name: nodeData.name,
                type: nodeData.type,
                path: nodeData.path,
                data: nodeData.data,
                icon: nodeData.icon,
                disabled: nodeData.disabled,
                className: nodeData.className,
                children: nodeData.children,
            };

            // 如果提供了自定义渲染函数，使用它
            if (renderNode) {
                return <>{renderNode(treeNode, node.level)}</>;
            }

            // 默认渲染
            return (
                <div
                    className={`tree-node-content ${isSelected ? "selected" : ""} ${
                        nodeData.disabled ? "disabled" : ""
                    }`}
                    style={{ paddingLeft: `${node.level * 20 + 8}px` }}
                >
                    {isFolder && (
                        <span className="tree-node-toggle">
                            {folderIcon ? (
                                folderIcon(node.isOpen)
                            ) : (
                                <span className="tree-node-icon">{node.isOpen ? "📂" : "📁"}</span>
                            )}
                        </span>
                    )}
                    {!isFolder && (
                        <span className="tree-node-icon">
                            {fileIcon ? fileIcon() : nodeData.icon || "📄"}
                        </span>
                    )}
                    <span className="tree-node-name">{nodeData.name}</span>
                    {nodeData.data &&
                        typeof nodeData.data === "object" &&
                        "version" in nodeData.data && (
                            <span className="tree-node-badge">
                                v{String((nodeData.data as any).version)}
                            </span>
                        )}
                </div>
            );
        },
        [selectedId, renderNode, folderIcon, fileIcon],
    );

    // 过滤数据（如果提供了搜索查询）
    const filteredData = useMemo(() => {
        if (!searchQuery) return arboristData;

        const query = searchQuery.toLowerCase();
        const filterNode = (node: any): any | null => {
            // 安全检查：确保节点有基本属性
            if (!node?.id || !node?.name) {
                console.warn("Tree filter: node missing required properties:", {
                    nodeId: node?.id,
                    node,
                });
                return null;
            }
            const matches =
                node.name?.toLowerCase().includes(query) ||
                node.id?.toLowerCase().includes(query) ||
                (node.path && node.path.toLowerCase().includes(query));

            // 递归过滤子节点
            const filteredChildren = node.children
                ? node.children.map(filterNode).filter(Boolean)
                : [];

            if (matches || filteredChildren.length > 0) {
                // 创建新节点时，保留所有属性（现在所有属性都在顶层，不需要特殊处理）
                return {
                    ...node,
                    children: filteredChildren.length > 0 ? filteredChildren : node.children || [],
                };
            }

            return null;
        };

        return arboristData.map(filterNode).filter(Boolean);
    }, [arboristData, searchQuery]);

    // 初始展开的节点
    const initialOpenState = useMemo(() => {
        if (!expandedIds) return undefined;
        const openState: Record<string, boolean> = {};
        expandedIds.forEach((id) => {
            openState[id] = true;
        });
        return openState;
    }, [expandedIds]);

    if (filteredData.length === 0) {
        return (
            <div className={`workflow-tree ${className}`}>
                {showSearch && (
                    <div className="tree-search">
                        <input
                            type="text"
                            placeholder={searchPlaceholder}
                            value={searchQuery}
                            onChange={() => {
                                // 搜索由外部控制
                            }}
                            className="tree-search-input"
                            readOnly
                        />
                    </div>
                )}
                <div className="tree-content">
                    {emptyRender ? (
                        emptyRender()
                    ) : (
                        <div className="tree-empty">
                            <p>没有找到数据</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={`workflow-tree ${className}`}>
            {showSearch && (
                <div className="tree-search">
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        value={searchQuery}
                        onChange={() => {
                            // 搜索由外部控制
                        }}
                        className="tree-search-input"
                        readOnly
                    />
                </div>
            )}
            <div ref={containerRef} className="tree-content" style={{ height: "100%" }}>
                {height > 0 && (
                    <ArboristTree
                        data={filteredData}
                        initialOpenState={initialOpenState}
                        onActivate={handleSelect}
                        onToggle={handleToggle}
                        width="100%"
                        height={Number(height)}
                        indent={20}
                        rowHeight={28}
                    >
                        {renderNodeContent}
                    </ArboristTree>
                )}
            </div>
        </div>
    );
}

export default Tree;
