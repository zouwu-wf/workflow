# 青鸟发布工具使用指南 - Zouwu Workflow

## 📖 简介

青鸟是专为 Zouwu Workflow 项目设计的**完全零配置**发布工具。无需任何配置文件，工具会自动从项目结构推断所有必要信息。

## 🚀 快速开始

### 安装依赖

```bash
pnpm install
```

### 发布流程

```bash
# 完整发布流程（交互式，完全零配置）
pnpm release

# 或直接使用命令
qingniao

# 仅执行 dry-run（不实际发布）
pnpm release:dry-run
# 或
qingniao --dry-run
```

## 🎯 零配置自动检测

青鸟工具会自动检测以下信息，**无需任何配置文件**：

### 自动检测项

- ✅ **包管理器**：从 `package.json` 的 `packageManager` 字段检测（pnpm@9.0.0）
- ✅ **Workspace 类型**：从 `pnpm-workspace.yaml` 自动检测 pnpm workspace
- ✅ **包列表**：使用 `pnpm list -r --depth -1` 自动发现所有包
- ✅ **包过滤**：自动排除私有包（`private: true`）和 examples/test 目录
- ✅ **版本策略**：检测 `.changeset` 目录（未检测到，使用 manual 策略）
- ✅ **构建工具**：从 `turbo.json` 自动检测 Turbo
- ✅ **构建步骤**：从 `package.json` scripts 自动生成：
  - `clean`（如果存在，skipOnError: true）
  - `install`（自动添加 `--frozen-lockfile`）
  - `lint`（如果存在）
  - `typecheck`（如果存在）
  - `test`（如果存在）
  - `build`（使用 turbo build）
- ✅ **构建产物路径**：从每个包的 `package.json` 自动推断（main/module/types 字段）
- ✅ **Git 分支**：自动检测当前分支
- ✅ **依赖顺序**：自动分析 workspace 依赖关系，拓扑排序

### 发布的包（自动检测）

工具会自动发现并发布以下包：
- `@zouwu-wf/workflow`
- `@zouwu-wf/cli`
- `@zouwu-wf/expression-parser`

**自动排除**：
- `@zouwu-wf/logger`（私有包，`private: true`）
- 任何 examples、test 目录中的包

## 📋 发布流程

1. **环境检查**
   - NPM 认证检查
   - Git 状态检查（必须在 main 分支，工作区干净）
   - 远程同步检查

2. **版本管理**（可选）
   - 选择版本类型（major/minor/patch）
   - 更新所有包的版本号
   - 同步 workspace 依赖版本
   - 提交到 Git 并创建标签

3. **构建验证**
   - 清理构建产物
   - 安装依赖
   - 代码检查（ESLint）
   - 类型检查（TypeScript）
   - 运行测试
   - 构建所有包（Turbo）
   - 验证构建产物

4. **发布到 NPM**
   - 显示将要发布的包列表
   - 检查已存在的版本
   - Dry-run 测试（可选）
   - 正式发布

## 🎯 使用示例

### 基本发布

```bash
# 1. 确保代码已提交
git add .
git commit -m "feat: 新功能"

# 2. 运行发布
pnpm release

# 3. 按照提示操作
# - 选择是否更新版本
# - 选择版本类型（major/minor/patch）
# - 确认发布
```

### 跳过版本更新

```bash
# 只发布，不更新版本
qingniao --skip-version
```

### 仅验证构建

```bash
# 不发布，只验证构建
qingniao --skip-publish
```

### 非交互模式（CI/CD）

```bash
# 跳过所有确认提示
qingniao --yes
```

## 🔧 自定义配置（可选）

**默认情况下，完全不需要配置文件！** 所有配置都自动检测。

如果确实需要覆盖某些自动检测的结果，可以创建 `qingniao.config.json`：

```json
{
  "git": {
    "branch": "develop"  // 覆盖：默认自动检测当前分支
  },
  "build": {
    "steps": [
      // 覆盖：默认从 package.json scripts 自动生成
    ]
  }
}
```

**配置文件优先级**：
1. 命令行 `--config` 指定的文件
2. `qingniao.config.json`（如果存在）
3. `package.json` 中的 `qingniao` 字段（如果存在）
4. **零配置自动检测**（默认，推荐）

## 📚 相关文档

- [RFC 0005: 青鸟通用发布工具设计规范](../rfc/0005-universal-publish-tool.md)
- [青鸟包 README](../../packages/@systembug/qingniao/README.md)

---

> **蓬山此去无多路，青鸟殷勤为探看**
> 让代码发布如青鸟传递消息般优雅流畅！

