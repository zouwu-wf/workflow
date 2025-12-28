# RFC 0008: Vite 配置中 CommonJS 模块导入解决方案

- **开始日期**: 2025-12-28
- **更新日期**: 2025-12-28
- **RFC PR**: 
- **实现议题**: 
- **作者**: AI Assistant
- **状态**: Implemented
- **相关组件**: `@zouwu-wf/design/vite.config.ts`

## 摘要

本 RFC 记录在 Vite 配置文件中导入 CommonJS 模块（如 `vite-plugin-monaco-editor`）的解决方案，使用 `createRequire` API 正确处理模块系统差异。

## 动机

### 问题描述

在 Vite 配置文件中导入 CommonJS 模块时，遇到以下错误：

```
TypeError: monacoEditorPlugin is not a function
    at file:///path/to/vite.config.ts:12:5
```

### 根本原因

1. **配置文件执行环境**: `vite.config.ts` 在 Node.js 环境中直接执行，不经过 Vite 的构建流程
2. **模块系统差异**: ESM（ECMAScript Modules）和 CommonJS 的导入/导出机制不同
3. **默认导出处理**: CommonJS 的 `module.exports = ...` 在 ESM 中需要通过 `.default` 访问
4. **自动转换限制**: Vite 的自动 CommonJS 转换仅适用于应用代码，不适用于配置文件

### 实际场景

在 `@zouwu-wf/design` 包中，需要导入 `vite-plugin-monaco-editor` 插件：

```typescript
// ❌ 错误的方式
import monacoEditorPlugin from "vite-plugin-monaco-editor";
// TypeError: monacoEditorPlugin is not a function

// ❌ 尝试使用命名导入
import * as monacoEditorPlugin from "vite-plugin-monaco-editor";
// monacoEditorPlugin 是一个对象，不是函数
```

## 解决方案

### 方案 1: 使用 `createRequire`（已采用）

使用 Node.js 的 `createRequire` API 在 ESM 环境中导入 CommonJS 模块：

```typescript
import { createRequire } from "module";

// 使用 createRequire 导入 CommonJS 模块
const require = createRequire(import.meta.url);
const monacoEditorPlugin = require("vite-plugin-monaco-editor").default;
```

**优点：**
- ✅ 最可靠和兼容（Node.js 12.2.0+）
- ✅ 同步执行，不影响配置加载性能
- ✅ 代码清晰明确
- ✅ 不需要异步处理

**缺点：**
- 需要额外的导入语句
- 代码稍微冗长

### 方案 2: 使用动态 `import()`（备选）

使用异步动态导入，Vite 支持异步配置函数：

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// 使用异步配置函数
export default defineConfig(async () => {
    const { default: monacoEditorPlugin } = await import("vite-plugin-monaco-editor");
    
    return {
        plugins: [
            react(),
            monacoEditorPlugin({
                languageWorkers: ["editorWorkerService", "typescript", "json", "html"],
            }),
        ],
        // ... 其他配置
    };
});
```

**优点：**
- ✅ 更符合 ESM 规范
- ✅ 代码更简洁
- ✅ Vite 官方支持异步配置函数（自 Vite 2.9.0+）

**缺点：**
- 需要将配置函数改为异步
- 如果配置中有多个 CommonJS 模块，需要多个 await
- 某些工具可能不完全支持异步配置

### 方案 3: Vite 自动转换（不适用）

Vite 在生产构建时会自动将 CommonJS 模块转换为 ESM，但这**仅适用于应用代码**，不适用于配置文件本身。

## 实施细节

### 当前实现

在 `packages/@zouwu-wf/design/vite.config.ts` 中：

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import { resolve } from "path";
import { createRequire } from "module";

// 使用 createRequire 导入 CommonJS 模块
const require = createRequire(import.meta.url);
const monacoEditorPlugin = require("vite-plugin-monaco-editor").default;

// 前端构建配置（用于开发和生产构建）
const clientConfig = defineConfig({
    plugins: [
        react(),
        monacoEditorPlugin({
            languageWorkers: ["editorWorkerService", "typescript", "json", "html"],
        }),
    ],
    // ... 其他配置
});
```

### 关键点

1. **`createRequire(import.meta.url)`**: 创建一个相对于当前文件的 require 函数
2. **`.default` 访问**: CommonJS 模块的默认导出需要通过 `.default` 访问
3. **同步执行**: 配置在模块加载时同步执行，确保插件正确初始化

## 影响分析

### 正面影响

1. ✅ 解决了 CommonJS 模块导入问题
2. ✅ 代码清晰，易于理解和维护
3. ✅ 性能无影响（同步执行）
4. ✅ 兼容性好，适用于所有 Node.js 版本

### 潜在风险

1. ⚠️ 如果未来 `vite-plugin-monaco-editor` 迁移到 ESM，需要更新导入方式
2. ⚠️ 其他开发者可能不熟悉 `createRequire` API

### 迁移成本

- **当前**: 无迁移成本，已实现
- **未来切换到方案 2**: 需要将配置函数改为异步，影响较小

## 替代方案考虑

### 为什么不使用动态 `import()`？

虽然动态 `import()` 更符合 ESM 规范，但对于单个 CommonJS 模块：
- `createRequire` 更简单直接
- 同步执行，性能更好
- 不需要修改配置函数签名

### 何时考虑切换到动态 `import()`？

如果满足以下条件：
- ✅ 项目中有多个 CommonJS 模块需要导入
- ✅ 希望代码更符合 ESM 规范
- ✅ 使用现代工具链（Vite 2.9.0+）
- ✅ 不依赖同步配置的工具

## 文档

已创建以下文档：

1. **`packages/@zouwu-wf/design/COMMONJS_IMPORT.md`**: 详细的解决方案文档
2. **`packages/@zouwu-wf/design/README.md`**: 添加了常见问题链接

## 测试

### 验证步骤

1. ✅ 开发服务器正常启动
2. ✅ Vite 配置正确加载
3. ✅ Monaco Editor 插件正常工作
4. ✅ 生产构建成功
5. ✅ 所有检查（lint、format、typecheck）通过

### 测试结果

```bash
# 开发模式
pnpm dev
# ✅ 成功启动，无错误

# 类型检查
pnpm typecheck
# ✅ 通过

# 构建
pnpm build
# ✅ 成功
```

## 未来改进

1. **监控**: 关注 `vite-plugin-monaco-editor` 是否迁移到 ESM
2. **文档**: 保持文档更新，记录最佳实践
3. **工具**: 考虑创建工具函数简化 CommonJS 导入

## 参考资源

- [Node.js createRequire 文档](https://nodejs.org/api/module.html#module_module_createrequire_filename)
- [Vite 配置文档](https://vitejs.dev/config/)
- [ESM 和 CommonJS 互操作](https://nodejs.org/api/esm.html#esm_interop_with_commonjs)
- [Vite 异步配置函数](https://vitejs.dev/config/#config-function)

## 总结

使用 `createRequire` 是在 Vite 配置文件中导入 CommonJS 模块的可靠解决方案。它提供了：

- ✅ 简单明确的实现
- ✅ 良好的兼容性
- ✅ 无性能影响
- ✅ 易于维护

对于单个 CommonJS 模块，这是最佳选择。如果未来需要导入多个 CommonJS 模块，可以考虑切换到异步 `import()` 方案。

