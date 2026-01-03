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

This package is distributed under two different scopes depending on the registry:

#### Stable Versions (Recommended)

**From NPM Registry:**
```bash
npm install @guoquan.net/flow-engine
```

**From GitHub Packages Registry:**
Add a `.npmrc` file to your project:
```ini
@guoquan:registry=https://npm.pkg.github.com
```
Then install:
```bash
npm install @guoquan/flow-engine
```

> **Note**: The naming difference (`@guoquan.net` on NPM vs `@guoquan` on GitHub) is due to account scope requirements on each platform.

#### Development / Latest Version

Install directly from the GitHub repository. You can specify a branch, tag, or commit hash using the `#` prefix:

```bash
# Latest from main branch
npm install github:guoquan/flow-engine

# Specific branch
npm install github:guoquan/flow-engine#develop

# Specific tag
npm install github:guoquan/flow-engine#v0.1.9

# Specific commit hash
npm install github:guoquan/flow-engine#7834b6c
```

### 🌟 Highlights
- **Modern Rendering**: Based on WebGPU for next-gen performance and visual quality.
- **Data-Driven**: Animation and behavior fully controlled via JSON configuration.
- **Zero-Dependency Core**: Pure frontend architecture, easy to integrate into any project.

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

### 📚 文档索引
请访问 **[docs/](./docs/)** 查看完整文档与 API 说明。
