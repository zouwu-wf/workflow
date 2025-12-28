# RFC 0007: Tree 组件数据结构重构 - 去掉 `_original` 包装

- **开始日期**: 2025-12-27
- **更新日期**: 2025-12-27
- **RFC PR**:
- **实现议题**:
- **作者**: AI Assistant
- **状态**: Implemented
- **相关组件**: `@zouwu-wf/components/src/tree/Tree.tsx`

## 摘要

本 RFC 提议重构 `Tree` 组件的数据结构，去掉 `_original` 属性包装，直接将所有 `TreeNodeData` 属性放在顶层，简化数据流并消除潜在的数据丢失问题。

## 动机

### 当前问题

当前实现中，`Tree` 组件使用 `react-arborist` 作为底层渲染引擎。为了适配 `react-arborist` 的数据格式要求，我们创建了一个转换层：

```typescript
// 当前实现
function convertToArboristData(nodes: TreeNodeData[]) {
    return nodes.map((node) => ({
        id: node.id,
        name: node.name,
        children: node.children ? convertToArboristData(node.children) : undefined,
        _original: node, // 所有其他属性被包装在 _original 中
    }));
}
```

这种设计导致了以下问题：

1. **数据丢失风险**: 在过滤、更新等操作中，`_original` 属性可能丢失，导致运行时错误
2. **代码复杂性**: 所有访问原始数据的地方都需要 `node.data._original` 这样的深层访问
3. **调试困难**: 当 `_original` 丢失时，错误信息不够清晰
4. **不必要的间接层**: `react-arborist` 实际上支持在数据对象上添加任意属性

### 实际遇到的问题

在生产环境中，我们遇到了以下错误：

```
Tree.tsx:87 Uncaught TypeError: Cannot read properties of undefined (reading '_original')
```

这个错误发生在以下场景：

- 搜索过滤时创建新节点
- `react-arborist` 内部状态更新
- 数据重新渲染时

## 详细设计

### 当前数据结构

```typescript
// 转换后的数据结构（当前）
{
    id: "1",
    name: "file",
    children: [],
    _original: {
        id: "1",
        name: "file",
        type: "file",
        path: "folder/file",
        data: { workflow: {...} },
        icon: "📄",
        disabled: false,
        className: "...",
        children: []
    }
}
```

### 提议的数据结构

```typescript
// 转换后的数据结构（提议）
{
    id: "1",
    name: "file",
    type: "file",           // 直接放在顶层
    path: "folder/file",     // 直接放在顶层
    data: { workflow: {...} }, // 直接放在顶层
    icon: "📄",              // 直接放在顶层
    disabled: false,         // 直接放在顶层
    className: "...",        // 直接放在顶层
    children: []
}
```

### 实施细节

#### 1. 更新 `convertToArboristData` 函数

```typescript
// 之前
function convertToArboristData<T>(nodes: TreeNodeData<T>[]): any[] {
    return nodes.map((node) => ({
        id: String(node.id),
        name: node.name,
        children: node.children ? convertToArboristData(node.children) : undefined,
        _original: node,
    }));
}

// 之后
function convertToArboristData<T>(nodes: TreeNodeData<T>[]): any[] {
    return nodes.map((node) => ({
        id: String(node.id),
        name: node.name,
        type: node.type,
        path: node.path,
        data: node.data,
        icon: node.icon,
        disabled: node.disabled,
        className: node.className,
        children: node.children ? convertToArboristData(node.children) : undefined,
    }));
}
```

#### 2. 更新所有数据访问点

**之前**:

```typescript
const originalNode = node.data._original as TreeNodeData<T>;
const isFolder = originalNode.type === "folder";
```

**之后**:

```typescript
const nodeData = node.data;
const isFolder = nodeData.type === "folder";
```

#### 3. 更新回调函数

**之前**:

```typescript
const handleSelect = (node: NodeApi<any>) => {
    if (node?.data?._original) {
        onSelect?.(node.data._original);
    }
};
```

**之后**:

```typescript
const handleSelect = (node: NodeApi<any>) => {
    if (node?.data) {
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
};
```

#### 4. 简化过滤逻辑

**之前**:

```typescript
const filterNode = (node: any): any | null => {
    if (!node?._original) {
        return null;
    }
    const originalNode = node._original;
    // ... 过滤逻辑
    return {
        ...node,
        children: filteredChildren,
        // 需要确保 _original 被保留
    };
};
```

**之后**:

```typescript
const filterNode = (node: any): any | null => {
    if (!node?.id || !node?.name) {
        return null;
    }
    // ... 过滤逻辑
    return {
        ...node,
        children: filteredChildren,
        // 所有属性都在顶层，自动保留
    };
};
```

## 优缺点分析

### 优点

1. **消除数据丢失风险**: 不再需要担心 `_original` 属性丢失
2. **代码更简洁**: 减少一层嵌套，直接访问属性
3. **性能提升**: 减少属性访问层级
4. **更易维护**: 数据结构更直观，调试更容易
5. **类型安全**: TypeScript 类型检查更直接

### 缺点

1. **数据对象更大**: 每个节点对象包含更多属性（但这是必要的属性）
2. **需要验证兼容性**: 需要确认 `react-arborist` 不会过滤掉这些额外属性

### 风险评估

- **低风险**: `react-arborist` 是一个成熟的库，支持在数据对象上添加任意属性
- **向后兼容**: 这是一个内部重构，不影响外部 API
- **测试覆盖**: 需要确保所有使用场景都经过测试

## 实施计划

### 阶段 1: 代码重构（已完成）

- [x] 更新 `convertToArboristData` 函数
- [x] 更新 `handleSelect` 回调
- [x] 更新 `handleToggle` 回调
- [x] 更新 `renderNodeContent` 渲染函数
- [x] 简化 `filteredData` 过滤逻辑

### 阶段 2: 测试验证

- [x] 类型检查：TypeScript 编译通过
- [x] Linter 检查：代码风格检查通过
- [x] 功能验证：在 `@zouwu-wf/design` 中实际使用验证
- [ ] 单元测试：创建测试文件（待添加测试框架）
- [ ] 性能测试：验证大数据量下的性能（待实际场景验证）
- [ ] 浏览器兼容性测试（待实际场景验证）

### 阶段 3: 文档更新

- [x] 更新组件文档（README.md 已包含完整 API 文档）
- [x] 更新使用示例（README.md 中已有示例）
- [x] 创建 RFC 文档讨论重构方案
- [x] 更新 RFC README 索引

## 替代方案

### 方案 A: 保持 `_original` 但增强保护

**优点**: 最小化改动
**缺点**: 仍然存在数据丢失风险，需要大量防御性代码

### 方案 B: 使用 Map 存储原始数据

**优点**: 完全隔离
**缺点**: 增加内存开销，代码更复杂

### 方案 C: 当前方案（推荐）

**优点**: 简单、直接、安全
**缺点**: 需要重构代码

## 未解决的问题

1. **性能影响**: 需要在实际使用中验证大数据量下的性能表现
2. **内存占用**: 需要评估内存占用的变化
3. **向后兼容**: 确认是否有外部代码依赖 `_original` 属性

## 参考

- [react-arborist 文档](https://github.com/brimdata/react-arborist)
- [Tree 组件实现](../../packages/@zouwu-wf/components/src/tree/Tree.tsx)
- [TreeNodeData 类型定义](../../packages/@zouwu-wf/components/src/tree/types.ts)

## 讨论要点

1. **是否还有其他地方使用了 `_original` 属性？**
2. **是否需要提供迁移工具或指南？**
3. **性能影响是否可接受？**
4. **是否有更好的数据结构设计方案？**

## 结论

去掉 `_original` 包装，直接将所有属性放在顶层是一个更简洁、更安全的设计。这个重构消除了数据丢失的风险，简化了代码，提高了可维护性。建议采用此方案。
