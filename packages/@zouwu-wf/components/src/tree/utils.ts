import type { TreeNodeData } from "./types";

/**
 * 从路径列表构建树结构
 */
export function buildTreeFromPaths<T = any>(
    items: Array<{ id: string; name: string; path: string; data?: T }>,
): TreeNodeData<T>[] {
    const tree: TreeNodeData<T> = {
        id: "root",
        name: "root",
        type: "folder",
        path: "",
        children: [],
    };

    items.forEach((item) => {
        const parts = item.path.split("/").filter(Boolean);
        let current = tree;

        parts.forEach((part, index) => {
            const isLast = index === parts.length - 1;
            const currentPath = parts.slice(0, index + 1).join("/");

            if (isLast) {
                // 最后一部分是文件
                if (!current.children) {
                    current.children = [];
                }
                // item.id 已经包含了路径信息（格式：workflowId::treePath），直接使用
                // 检查是否已存在相同 ID 的节点（防止重复）
                const existingNode = current.children.find((child) => child.id === item.id);
                if (!existingNode) {
                    current.children.push({
                        id: item.id,
                        name: item.name,
                        type: "file",
                        path: item.path,
                        data: item.data,
                    });
                } else {
                    // 如果已存在，使用路径确保唯一性
                    const fallbackId = `${item.id}::${item.path}::${Date.now()}`;
                    current.children.push({
                        id: fallbackId,
                        name: item.name,
                        type: "file",
                        path: item.path,
                        data: item.data,
                    });
                }
            } else {
                // 中间部分是文件夹
                // 使用完整路径查找，确保唯一性
                let folder = current.children?.find(
                    (child) => child.type === "folder" && child.path === currentPath,
                );

                if (!folder) {
                    // 使用完整路径作为文件夹 ID，确保唯一性
                    folder = {
                        id: `folder::${currentPath}`,
                        name: part,
                        type: "folder",
                        path: currentPath,
                        children: [],
                    };
                    if (!current.children) {
                        current.children = [];
                    }
                    current.children.push(folder);
                }

                current = folder;
            }
        });
    });

    return tree.children || [];
}

/**
 * 扁平化树结构
 */
export function flattenTree<T = any>(
    nodes: TreeNodeData<T>[],
    result: TreeNodeData<T>[] = [],
): TreeNodeData<T>[] {
    nodes.forEach((node) => {
        result.push(node);
        if (node.children) {
            flattenTree(node.children, result);
        }
    });
    return result;
}
