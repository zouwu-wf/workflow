# @zouwu-wf/workflow

🌌 驺吾工作流Schema核心包 - Schema定义和运行时验证器

## 📜 项目概述

`@zouwu-wf/workflow` 是驺吾工作流系统的核心包，包含完整的运行时引擎、Schema定义和平台中立的工具集。

> [!NOTE]
> 本包专为 Node.js/Bun 环境设计，移除了浏览器特定依赖以优化服务端性能。

**📦 包含组件**：

- **Runtime**: `WorkflowOrchestrator`, `NodeWorkflowLoader`, `VariableResolver`
- **Schema**: JSON Schema 定义和验证器
- **Expression**: 强大的表达式解析和求值引擎

**📦 相关包**：

- `@zouwu-wf/cli` - 命令行工具包
- `@zouwu-wf/logger` - 日志工具库

## 🌟 核心特性

### 🚀 强劲运行时

- **WorkflowOrchestrator**: 核心编排引擎，支持复杂的流程控制
- **Node.js Optimized**: 专为服务端环境优化，极致性能
- **Expression Engine**: 基于 Peggy 的表达式解析器，支持复杂逻辑运算
- **Plugins**: 可扩展的步骤执行器架构

### ✅ JSON Schema定义

- **工作流主Schema**: 定义完整的工作流结构和语法
- **步骤类型Schema**: 详细定义各种步骤类型（condition、action、builtin、loop、parallel、workflow）
- **模板语法Schema**: 支持`{{}}`模板变量和JavaScript表达式

### 🔧 运行时验证器

- **基于Ajv的验证器**: 高性能的JSON Schema验证
- **中文错误信息**: 提供本地化的中文错误提示
- **严格类型检查**: 确保工作流结构的正确性

### 📚 TypeScript类型支持

- **完整类型定义**: 基于Schema生成的TypeScript接口
- **模板语法类型**: 支持变量引用和表达式的类型定义
- **强类型保证**: 编译时类型检查支持

## 🚀 快速开始

### 安装

```bash
npm install @zouwu-wf/workflow
```

### 使用示例

```typescript
import { WorkflowOrchestrator, NodeWorkflowLoader } from "@zouwu-wf/workflow";
import { createLogger } from "@zouwu-wf/logger";

// 初始化引擎
const logger = createLogger();
const loader = new NodeWorkflowLoader(logger);
const orchestrator = new WorkflowOrchestrator(loader, logger);

// 执行工作流
try {
    const execution = await orchestrator.executeWorkflow("example_workflow", {
        input: { message: "Hello Zouwu" },
    });
    console.log("工作流执行完成:", execution.status);
} catch (error) {
    console.error("执行失败:", error);
}
```

## 📋 工作流语法示例

### 基础工作流结构

```yaml
id: "preference_update"
name: "偏好设置更新"
description: "更新用户偏好设置的完整流程"
version: "1.0.0"
author: "驺吾引擎"

triggers:
    - intent: "update_preferences"

inputs:
    - name: "delta"
      type: "object"
      required: true
      description: "偏好设置变更数据"

steps:
    - id: "validate_input"
      type: "condition"
      description: "验证输入数据"
      condition:
          operator: "exists"
          value: "{{inputs.delta}}"
      onTrue:
          - id: "apply_changes"
            type: "action"
            service: "wenchang"
            action: "applyDelta"
            input:
                delta: "{{inputs.delta}}"
            output_schema:
                type: "object"
                properties:
                    success: { type: "boolean" }
                    data: { type: "object" }
      onFalse:
          - id: "return_error"
            type: "builtin"
            action: "error"
            input:
                message: "输入数据无效"
                code: "INVALID_INPUT"

    - id: "return_result"
      type: "builtin"
      action: "return"
      input:
          success: "{{steps.apply_changes.output.success}}"
          data: "{{steps.apply_changes.output.data}}"
      dependsOn: ["validate_input"]
```

## 🔧 开发指南

### 项目结构

```
@zouwu-wf/workflow/
├── schemas/                    # JSON Schema定义
│   ├── workflow.schema.json    # 主工作流Schema
│   ├── step-types.schema.json  # 步骤类型Schema
│   └── template-syntax.schema.json # 模板语法Schema
├── src/
│   ├── cli/                   # CLI工具
│   ├── generators/            # 代码生成器
│   ├── schemas/               # Schema加载器
│   ├── types/                 # TypeScript类型定义
│   ├── validators/            # 验证器
│   └── index.ts              # 主入口
├── scripts/
│   ├── build.js              # 构建脚本
│   └── test.js               # 测试脚本
└── README.md
```

### 构建和测试

```bash
# 编译TypeScript
npm run compile

# 运行测试
npm run test

# 构建发布包
npm run build

# 开发模式
npm run dev
```

## 📚 参考文档

- [RFC 0039: 驺吾工作流语法规范](../../../docs/rfc/0039-zouwu-workflow-syntax-specification.md)
- [工作流设计最佳实践](./docs/best-practices.md)
- [API参考文档](./docs/api-reference.md)
- [CLI工具完整指南](./docs/cli-guide.md)

## 🤝 贡献指南

欢迎贡献代码、报告问题或提出建议！

1. Fork项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启Pull Request

## 📄 许可证

MIT License - 详见 [LICENSE](./LICENSE) 文件

## 🌟 致谢

- 感谢驺吾引擎团队的设计理念
- 感谢开源社区的JSON Schema和Ajv项目
- 感谢所有贡献者的努力

---

🌌 让工作流开发充满古典韵味，同时保持现代化的技术水准！
