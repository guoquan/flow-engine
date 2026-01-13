# Flow (服喽) 🌊
`@guoquan.net/flow-engine`

[![CI](https://github.com/guoquan/flow-engine/actions/workflows/ci.yml/badge.svg)](https://github.com/guoquan/flow-engine/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/guoquan/flow-engine/graph/badge.svg?token=2T5SGUBMK4)](https://codecov.io/gh/guoquan/flow-engine)
[![Deploy to GitHub Pages](https://github.com/guoquan/flow-engine/actions/workflows/deploy.yml/badge.svg)](https://github.com/guoquan/flow-engine/actions/workflows/deploy.yml)
[![npm version](https://img.shields.io/npm/v/@guoquan.net/flow-engine.svg?style=flat-square)](https://www.npmjs.com/package/@guoquan.net/flow-engine)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[English](#english) | [中文](#中文)

---

## English

> **"Flow: Convincing at first breath."**

**Flow** is a high-performance, lightweight web-based digital human engine based on WebGPU.

### 📦 Installation

This project uses **pnpm** as the package manager. Please ensure you have it installed:
```bash
npm install -g pnpm
```

#### Stable Versions (Recommended)

**From NPM Registry:**
```bash
pnpm add @guoquan.net/flow-engine
```

**From GitHub Packages Registry:**
Add a `.npmrc` file to your project:
```ini
@guoquan:registry=https://npm.pkg.github.com
```
Then install:
```bash
pnpm add @guoquan/flow-engine
```

> **Note**: The naming difference (`@guoquan.net` on NPM vs `@guoquan` on GitHub) is due to account scope requirements on each platform.

#### Development / Latest Version

Install directly from the GitHub repository. You can specify a branch, tag, or commit hash:

```bash
# Latest from main branch
pnpm add github:guoquan/flow-engine

# Specific branch
pnpm add github:guoquan/flow-engine#develop
```

### 🌟 Highlights
- **Modern Rendering**: Based on WebGPU for next-gen performance and visual quality.
- **Data-Driven**: Animation and behavior fully controlled via JSON configuration.
- **Zero-Dependency Core**: Pure frontend architecture, easy to integrate into any project.

### 🏗️ Architecture
Flow Engine adopts a **Controller-Agent** pattern:
*   **FlowEngine**: The core scene manager and renderer (WebGPU).
*   **BehaviorController (Brain)**: A finite state machine managing high-level states (`IDLE`, `TALKING`, `THINKING`).
*   **LookAtProcessor (Reflex)**: Procedural animation system for eye contact and head tracking.
*   **MCP Server (Bridge)**: A Node.js server enabling external AI agents to drive the avatar.

### 🤖 AI Agent Integration (MCP)
Flow Engine includes a built-in **Model Context Protocol (MCP)** server. This allows AI models (like Claude or Gemini) to "see" and "control" the avatar as a tool.

```bash
# Start the MCP Server
pnpm run mcp
```

*   👉 **[Read the MCP Integration Guide](./docs/MCP_GUIDE.md)**
*   👉 **[API Reference](./docs/API_REFERENCE.md)**

### 📚 Documentation
Please visit **[docs/](./docs/)** for the full documentation and API references.

---

## 中文

> **"一开口，就服喽。"**

**Flow** 是一个高性能、轻量级的基于 WebGPU 的 Web 端数字人引擎。

### 📦 安装指南

由于注册表平台限制，本项目在不同平台使用不同的包名作用域：

#### 稳定版本 (推荐)

**从 NPM 安装:**
```bash
npm install @guoquan.net/flow-engine
```

**从 GitHub Packages 安装:**
在项目根目录创建 `.npmrc` 文件:
```ini
@guoquan:registry=https://npm.pkg.github.com
```
然后安装:
```bash
npm install @guoquan/flow-engine
```

> **注意**: 命名差异（NPM 上为 `@guoquan.net`，GitHub 上为 `@guoquan`）是因为各平台对用户作用域（Scope）的要求不同。

#### 开发版 / 最新版本

直接从 GitHub 仓库安装。你可以使用 `#` 前缀指定分支、标签或提交哈希：

```bash
# 安装 main 分支最新代码
npm install github:guoquan/flow-engine

# 指定分支
npm install github:guoquan/flow-engine#develop

# 指定标签
npm install github:guoquan/flow-engine#v0.1.9

# 指定提交哈希
npm install github:guoquan/flow-engine#7834b6c
```

### 🌟 项目亮点
- **现代化渲染**：基于 WebGPU，提供下一代渲染性能与视觉效果。
- **数据驱动**：动画与行为完全通过 JSON 配置文件控制。
- **零依赖核心**：纯前端架构，无需后端即可运行，易于集成。

### 🏗️ 架构设计
Flow Engine 采用 **Controller-Agent** 模式：
*   **FlowEngine**: 核心场景管理器与渲染器 (WebGPU)。
*   **BehaviorController (大脑)**: 有限状态机，管理高级行为状态 (`IDLE`, `TALKING`, `THINKING`)。
*   **LookAtProcessor (反射)**: 程序化动画系统，负责眼神接触与头部追踪。
*   **MCP Server (桥梁)**: 一个 Node.js 服务，允许外部 AI Agent 驱动数字人。

### 🤖 AI Agent 集成 (MCP)
Flow Engine 内置了 **Model Context Protocol (MCP)** 服务器。这使得 AI 模型（如 Claude 或 Gemini）能够将数字人视为一个“工具”并进行控制。

```bash
# 启动 MCP 服务器
npm run mcp
```

*   👉 **[阅读 MCP 集成指南](./docs/MCP_GUIDE.md)**
*   👉 **[API 参考文档](./docs/API_REFERENCE.md)**

### 📚 文档索引
请访问 **[docs/](./docs/)** 查看完整文档与 API 说明。
