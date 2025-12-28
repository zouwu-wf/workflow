import React from "react";
import type { TreeNodeProps } from "./types";
import "./TreeNode.css";

function TreeNode<T = any>({
    node,
    level,
    selected,
    expanded,
    onSelect,
    onToggle,
    renderNode,
    folderIcon,
    fileIcon,
    isExpanded,
    selectedId,
}: TreeNodeProps<T>) {
    const hasChildren = node.children && node.children.length > 0;
    const isFolder = node.type === "folder" || hasChildren;

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (node.disabled) return;
        onSelect(node);
    };

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isFolder) {
            onToggle(node.id, !expanded);
        }
    };

    // 自定义渲染
    if (renderNode) {
        return <>{renderNode(node, level)}</>;
    }

    // 默认渲染
    return (
        <div
            className={`tree-node ${selected ? "selected" : ""} ${node.disabled ? "disabled" : ""}`}
        >
            <div
                className="tree-node-content"
                style={{ paddingLeft: `${level * 20 + 8}px` }}
                onClick={handleClick}
            >
                {isFolder && (
                    <span className="tree-node-toggle" onClick={handleToggle}>
                        {folderIcon ? (
                            folderIcon(expanded)
                        ) : (
                            <span className="tree-node-icon">{expanded ? "📂" : "📁"}</span>
                        )}
                    </span>
                )}
                {!isFolder && (
                    <span className="tree-node-icon">
                        {fileIcon ? fileIcon() : node.icon || "📄"}
                    </span>
                )}
                <span className="tree-node-name">{node.name}</span>
                {node.data && typeof node.data === "object" && "version" in node.data && (
                    <span className="tree-node-badge">v{String((node.data as any).version)}</span>
                )}
            </div>
            {isFolder && expanded && hasChildren && (
                <div className="tree-node-children">
                    {node.children!.map((child) => {
                        const childExpanded = isExpanded
                            ? isExpanded(child.id)
                            : child.expanded || false;
                        const childSelected = selectedId ? selectedId === child.id : false;
                        return (
                            <TreeNode
                                key={child.id}
                                node={child}
                                level={level + 1}
                                selected={childSelected}
                                expanded={childExpanded}
                                onSelect={onSelect}
                                onToggle={onToggle}
                                renderNode={renderNode}
                                folderIcon={folderIcon}
                                fileIcon={fileIcon}
                                isExpanded={isExpanded}
                                selectedId={selectedId}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default TreeNode;
