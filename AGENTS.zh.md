# AGENTS.md

[English](AGENTS.md) | [简体中文](AGENTS.zh.md)

本文件为在 Photos 仓库中工作的 AI Agent 定义全仓库协作规则。

## 沟通方式

- 默认使用中文回答。代码、命令、路径、API 字段和专有名词保持原文。
- 区分已验证事实、假设和计划工作。
- 报告相关验证结果和仍然存在的限制。

## 仓库结构

- `apps/web` 包含 React 19、TypeScript 和 Vite 前端。
- `apps/worker` 包含部署到 Cloudflare Workers 的 Hono 应用。
- `apps/android` 包含 Capacitor Android 包装层和原生后台同步代码。
- `migrations` 包含按顺序执行的 Cloudflare D1 迁移。
- `docs` 包含项目文档。
- `scripts` 包含初始化、部署、备份和维护脚本。

## 编辑规则

- 修改前检查相邻模块和已有实现。
- 变更范围限制在请求所需行为内，避免无关重构、格式化噪音和生成产物。
- 手写源码、配置和文档优先使用 `apply_patch` 等结构化编辑工具。
- 修改后检查完整 diff 并移除无关变更。
- 保留现有私人部署配置，不得提交 `.env.personal` 或任何密钥。

## React 和 TypeScript

- 新类型声明优先使用 `type`，已有 API 明确要求 `interface` 时除外。
- 新 React 文件使用 `import * as React from 'react'`，hooks 使用 `React.useXxx`。
- 先声明命名函数组件，再在文件末尾导出。
- 在行为正确的前提下复用已有 Context、组件、API Client 和类型。

## 多语言

- 英文是源语言，简体中文使用 `zh-CN`。
- Web 用户可见文案分别放入 `apps/web/src/i18n/locales/en` 和对应的 `zh-CN` 资源。
- 两种语言资源的 key 结构必须一致。动态消息使用插值和复数规则。
- 日期和数字跟随当前语言，用户可见输出不得固定使用 `en-US`。
- 页面标题、placeholder、tooltip、ARIA 标签、确认提示、Toast 与可见文案同步更新。
- 客户端展示的 API 错误使用稳定错误码，同时保留可读的服务端错误信息用于兼容和日志。
- Android 原生文案存放在 Android 字符串资源中，WebView 与原生通知使用一致术语。

## 双语文档

- 每个 Git 跟踪的英文 Markdown 文件都必须有同目录、同文件名的 `.zh.md` 版本。
- `AGENTS.md` 和 `AGENTS.zh.md` 必须保持语义一致。Agent 工具以 `AGENTS.md` 作为自动发现和执行的文件。
- 英文文档中的行为或事实发生变化时，在同一次变更中更新中文版本。
- 中文文档优先链接已存在的中文版本。命令、路径、环境变量、API 路由、代码和配置 key 必须保持原样。
- 两种语言的章节结构、表格、代码块、提示和示例保持对应。

## 数据库和部署

- 数据库结构变更通过新的有序迁移文件实施，并兼容已经在远端执行的迁移。
- 私人部署需要先执行 `npm --prefix apps/web run build:personal`，再由 Wrangler 将 `apps/web/dist` 与 Worker 一起部署。
- 未经用户明确要求，不得提交密钥、部署生产环境、修改远端 D1 数据或发布制品。

## 验证

- 开发过程中运行范围最小的相关测试，完成后运行受影响 package 的完整测试和构建命令。
- Web 变更通常需要执行 `npm --prefix apps/web test`、`npm --prefix apps/web run lint`，涉及 personal 模式时还需执行两种 Web 构建。
- Worker 变更通常需要执行 Worker 测试和构建。
- Android 原生变更需要执行 Android 构建。
- Markdown 变更需要运行文档语言检查，最后执行 `git diff --check`。
