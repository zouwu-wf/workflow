# CommonJS 模块导入解决方案

## 问题描述

在 Vite 配置文件中导入 CommonJS 模块（如 `vite-plugin-monaco-editor`）时，可能会遇到以下错误：

```
TypeError: monacoEditorPlugin is not a function
```

这是因为 Vite 配置文件使用 ESM（ECMAScript Modules）格式，而某些插件是 CommonJS 模块，需要特殊处理。

## 解决方案

### 方法 1: 使用 `createRequire`（当前方案）

这是最可靠的方法，适用于所有情况：

```typescript
import { createRequire } from "module";

// 使用 createRequire 导入 CommonJS 模块
const require = createRequire(import.meta.url);
const monacoEditorPlugin = require("vite-plugin-monaco-editor").default;
```

**优点：**

- 兼容性好，适用于所有 Node.js 版本（12.2.0+）
- 明确处理 CommonJS 模块
- 不需要异步处理

**缺点：**

- 需要额外的导入语句
- 代码稍微冗长

### 方法 2: 使用动态 `import()`（备选方案）

可以使用异步动态导入，Vite 支持异步配置函数：

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

- 更符合 ESM 规范
- 代码更简洁
- Vite 官方支持异步配置函数（自 Vite 2.9.0+）

**缺点：**

- 需要将配置函数改为异步
- 如果配置中有多个 CommonJS 模块，需要多个 await
- 某些工具可能不完全支持异步配置

### 方法 3: 使用 Vite 的自动转换（不适用）

Vite 会自动将 CommonJS 模块转换为 ESM，但这**仅适用于应用代码**，不适用于配置文件本身。配置文件在 Node.js 环境中直接执行，不会经过 Vite 的转换过程。

## 为什么需要特殊处理？

1. **配置文件执行环境**：`vite.config.ts` 在 Node.js 环境中直接执行，不经过 Vite 的构建流程
2. **模块系统差异**：ESM 和 CommonJS 的导入/导出机制不同
3. **默认导出处理**：CommonJS 的 `module.exports = ...` 在 ESM 中需要通过 `.default` 访问

## 当前实现

我们使用**方法 1（createRequire）**，因为：

1. ✅ 最可靠和兼容
2. ✅ 不需要异步处理
3. ✅ 代码清晰明确
4. ✅ 适用于所有 Node.js 版本
5. ✅ 同步执行，不影响配置加载性能

## 何时考虑切换到方法 2？

如果满足以下条件，可以考虑使用异步 `import()`：

- ✅ 项目只使用现代工具链（Vite 2.9.0+）
- ✅ 不依赖同步配置的工具
- ✅ 希望代码更符合 ESM 规范
- ✅ 配置中有多个 CommonJS 模块需要导入

**注意**：对于单个 CommonJS 模块，`createRequire` 仍然是推荐方案。

## 相关文件

- `vite.config.ts` - Vite 配置文件，包含 CommonJS 导入处理
- `package.json` - 项目依赖配置

## 参考资源

- [Node.js createRequire 文档](https://nodejs.org/api/module.html#module_module_createrequire_filename)
- [Vite 配置文档](https://vitejs.dev/config/)
- [ESM 和 CommonJS 互操作](https://nodejs.org/api/esm.html#esm_interop_with_commonjs)
