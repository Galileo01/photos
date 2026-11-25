# 贡献照片

[English](CONTRIBUTING.md) | **简体中文**


感谢您有兴趣为此项目做出贡献！ 🎉

## 快速入门

有关设置说明、开发工作流程和贡献指南，请参阅：

**[完整贡献指南](./docs/contributing.zh.md)**

## 长话短说

1. **设置：**

   ```bash
   npm install
   cd apps/worker && npm install
   cd ../web && npm install
   ```

2. **发展：**

   ```bash
   # Terminal 1: Worker
   cd apps/worker && npm run dev

   # Terminal 2: Web
   cd apps/web && npm run dev
   ```

3. **测试：**

   ```bash
   npm test
   npm run test:e2e
   ```

4. **公关前：**
   - 运行测试和 linting：`npm test && npm run lint`
   - 创建功能分支：`git checkout -b feature/your-feature`
   - 使用常规提交进行提交：`git commit -m "feat: add feature"`
   - 推送并打开拉取请求

## 项目结构

```text
.
├── apps/
│   ├── web/        # React frontend
│   ├── worker/     # Cloudflare Worker backend
│   └── android/    # Android native app
├── docs/           # Documentation
├── migrations/     # Database migrations
├── scripts/        # Setup and deployment scripts
└── README.md       # Project overview
```

## 行为守则

我们致力于为所有贡献者提供一个热情和包容的环境。请查看 [docs/contributing.md](./docs/contributing.zh.md) 中的行为准则以了解更多信息。

## 问题？

- 📖 查看[docs](./docs/)文件夹
- 💬 打开 GitHub 讨论
- 🐛 将错误报告为 GitHub 问题
- 📝 阅读[完整贡献指南](./docs/contributing.zh.md)

快乐贡献！ 🚀
