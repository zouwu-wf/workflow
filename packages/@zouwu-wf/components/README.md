# @zouwu-wf/workflow-components

驺吾工作流可重用组件库 - 提供工作流相关的 React 组件。

## 安装

```bash
pnpm add @zouwu-wf/workflow-components
```

## 组件

### Tree 树形组件

高性能的树形组件，支持文件夹结构、搜索、展开/折叠等功能。

#### 基础用法

```tsx
import { Tree } from "@zouwu-wf/workflow-components";
import type { TreeNodeData } from "@zouwu-wf/workflow-components";

const data: TreeNodeData[] = [
    {
        id: "1",
        name: "文件夹1",
        type: "folder",
        children: [
            {
                id: "1-1",
                name: "文件1",
                type: "file",
                data: { version: "1.0.0" },
            },
        ],
    },
];

function App() {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    return (
        <Tree
            data={data}
            selectedId={selectedId}
            expandedIds={expandedIds}
            onSelect={(node) => setSelectedId(node.id)}
            onToggle={(nodeId, expanded) => {
                const next = new Set(expandedIds);
                if (expanded) {
                    next.add(nodeId);
                } else {
                    next.delete(nodeId);
                }
                setExpandedIds(next);
            }}
            showSearch
            searchPlaceholder="搜索工作流..."
        />
    );
}
```

#### 从路径构建树

```tsx
import { Tree, buildTreeFromPaths } from "@zouwu-wf/workflow-components";

const items = [
    { id: "1", name: "workflow1", path: "folder1/workflow1.zouwu", data: { version: "1.0.0" } },
    { id: "2", name: "workflow2", path: "folder1/workflow2.zouwu", data: { version: "2.0.0" } },
    { id: "3", name: "workflow3", path: "folder2/workflow3.zouwu", data: { version: "1.5.0" } },
];

const treeData = buildTreeFromPaths(items);

<Tree data={treeData} onSelect={(node) => console.log(node)} />;
```

#### 自定义渲染

```tsx
<Tree
    data={data}
    renderNode={(node, level) => (
        <div style={{ paddingLeft: level * 20 }}>
            <CustomNode node={node} />
        </div>
    )}
    folderIcon={(expanded) => (expanded ? "📂" : "📁")}
    fileIcon={() => "📄"}
/>
```

## API

### Tree Props

| 属性              | 类型                                               | 默认值      | 说明                           |
| ----------------- | -------------------------------------------------- | ----------- | ------------------------------ |
| data              | `TreeNodeData[]`                                   | 必填        | 树节点数据                     |
| selectedId        | `string \| null`                                   | `undefined` | 选中的节点 ID                  |
| expandedIds       | `Set<string>`                                      | `undefined` | 展开的节点 ID 集合（受控模式） |
| onSelect          | `(node: TreeNodeData) => void`                     | `undefined` | 节点选择回调                   |
| onToggle          | `(nodeId: string, expanded: boolean) => void`      | `undefined` | 节点展开/折叠回调（受控模式）  |
| searchQuery       | `string`                                           | `''`        | 搜索关键词                     |
| showSearch        | `boolean`                                          | `false`     | 是否显示搜索框                 |
| searchPlaceholder | `string`                                           | `'搜索...'` | 搜索框占位符                   |
| renderNode        | `(node: TreeNodeData, level: number) => ReactNode` | `undefined` | 自定义节点渲染                 |
| folderIcon        | `(expanded: boolean) => ReactNode`                 | `undefined` | 自定义文件夹图标               |
| fileIcon          | `() => ReactNode`                                  | `undefined` | 自定义文件图标                 |
| emptyRender       | `() => ReactNode`                                  | `undefined` | 空状态渲染                     |
| className         | `string`                                           | `''`        | 根节点类名                     |

### TreeNodeData

```typescript
interface TreeNodeData<T = any> {
    id: string;
    name: string;
    type?: "folder" | "file" | "item";
    path?: string;
    data?: T;
    children?: TreeNodeData<T>[];
    expanded?: boolean;
    selected?: boolean;
    disabled?: boolean;
    icon?: string | React.ReactNode;
    className?: string;
}
```

## 工具函数

### buildTreeFromPaths

从路径列表构建树结构。

```typescript
buildTreeFromPaths<T>(
  items: Array<{ id: string; name: string; path: string; data?: T }>
): TreeNodeData<T>[]
```

### flattenTree

扁平化树结构。

```typescript
flattenTree<T>(
  nodes: TreeNodeData<T>[],
  result?: TreeNodeData<T>[]
): TreeNodeData<T>[]
```

## 样式

组件包含基础样式，可以通过 CSS 变量自定义：

```css
.workflow-tree {
    --tree-node-padding: 0.5rem;
    --tree-node-hover-bg: #f0f0f0;
    --tree-node-selected-bg: #e3f2fd;
    --tree-node-selected-border: #667eea;
}
```

## 技术细节

### 数据结构

Tree 组件使用 `react-arborist` 作为底层渲染引擎。为了适配 `react-arborist` 的数据格式，组件会将 `TreeNodeData` 转换为适合的格式。

**重要**: 所有 `TreeNodeData` 的属性（`type`, `path`, `data`, `icon`, `disabled`, `className` 等）都直接放在数据对象的顶层，而不是包装在 `_original` 属性中。这确保了数据的完整性和访问的便捷性。

```typescript
// 转换后的数据结构
{
  id: "1",
  name: "file",
  type: "file",        // 直接访问
  path: "folder/file", // 直接访问
  data: {...},         // 直接访问
  children: []
}
```

### 性能优化

- 使用 `react-arborist` 的虚拟滚动处理大数据量
- 使用 `useMemo` 缓存转换后的数据
- 使用 `useCallback` 优化回调函数

## 开发

```bash
# 安装依赖
pnpm install

# 开发模式（监听文件变化）
pnpm dev

# 构建
pnpm build

# 类型检查
pnpm typecheck
```

## License

MIT
