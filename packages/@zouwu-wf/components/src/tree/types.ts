/**
 * 树节点数据接口
 */
export interface TreeNodeData<T = any> {
    /** 节点唯一标识 */
    id: string;
    /** 节点显示名称 */
    name: string;
    /** 节点类型（文件夹/文件等） */
    type?: "folder" | "file" | "item";
    /** 节点路径 */
    path?: string;
    /** 额外数据 */
    data?: T;
    /** 子节点 */
    children?: TreeNodeData<T>[];
    /** 是否展开（仅用于受控模式） */
    expanded?: boolean;
    /** 是否选中 */
    selected?: boolean;
    /** 是否禁用 */
    disabled?: boolean;
    /** 自定义图标 */
    icon?: string | React.ReactNode | null;
    /** 自定义样式类名 */
    className?: string;
}

/**
 * 树组件属性
 */
export interface TreeProps<T = any> {
    /** 树节点数据 */
    data: TreeNodeData<T>[];
    /** 选中的节点 ID */
    selectedId?: string | null;
    /** 展开的节点 ID 列表 */
    expandedIds?: Set<string>;
    /** 节点选择回调 */
    onSelect?: (node: TreeNodeData<T>) => void;
    /** 节点展开/折叠回调 */
    onToggle?: (nodeId: string, expanded: boolean) => void;
    /** 搜索关键词 */
    searchQuery?: string;
    /** 是否显示搜索框 */
    showSearch?: boolean;
    /** 搜索框占位符 */
    searchPlaceholder?: string;
    /** 自定义节点渲染 */
    renderNode?: (node: TreeNodeData<T>, level: number) => React.ReactNode;
    /** 自定义文件夹图标 */
    folderIcon?: (expanded: boolean) => React.ReactNode;
    /** 自定义文件图标 */
    fileIcon?: () => React.ReactNode;
    /** 空状态渲染 */
    emptyRender?: () => React.ReactNode;
    /** 根节点类名 */
    className?: string;
    /** 是否虚拟滚动（用于大数据量） */
    virtualScroll?: boolean;
    /** 虚拟滚动项高度 */
    itemHeight?: number;
}

/**
 * 树节点组件属性
 */
export interface TreeNodeProps<T = any> {
    /** 节点数据 */
    node: TreeNodeData<T>;
    /** 节点层级 */
    level: number;
    /** 是否选中 */
    selected: boolean;
    /** 是否展开 */
    expanded: boolean;
    /** 选择回调 */
    onSelect: (node: TreeNodeData<T>) => void;
    /** 展开/折叠回调 */
    onToggle: (nodeId: string, expanded: boolean) => void;
    /** 自定义渲染 */
    renderNode?: (node: TreeNodeData<T>, level: number) => React.ReactNode;
    /** 文件夹图标 */
    folderIcon?: (expanded: boolean) => React.ReactNode;
    /** 文件图标 */
    fileIcon?: () => React.ReactNode;
    /** 检查节点是否展开的函数 */
    isExpanded?: (nodeId: string) => boolean;
    /** 选中的节点 ID（用于子节点判断） */
    selectedId?: string | null;
}
