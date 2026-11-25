# 设置脚本

[English](README.md) | **简体中文**


此目录包含用于设置和部署照片共享应用程序的帮助程序脚本。

## 可用脚本

### 🧙 setup-wizard.js

交互式设置向导可指导您完成初始配置。

```bash
npm run setup:wizard
```

**它的作用：**
- 提示输入所有必需的配置值
- 为Worker生成`.dev.vars`
- 为网络应用程序生成`.env.local`
- 创建安全的随机秘密
- 验证电子邮件和域格式

**何时使用：**
- 首次设置
- 重置配置
- 创建新部署

---

### ✅ 验证配置.js

验证您的配置文件并检查常见问题。

```bash
npm run validate
```

**它的作用：**
- 检查 `.dev.vars` 是否存在并具有所需的值
- 检查 `.env.local` 是否存在并具有所需的值
- 验证 wrangler.toml 配置
- 检查依赖项是否已安装
- 报告错误和警告

**何时使用：**
- 运行安装向导后
- 开始开发之前
- 配置问题故障排除
- 部署前

---

### 🗄️ db-setup.sh

设置本地 D1 数据库并运行迁移。

```bash
npm run db:setup
```

**它的作用：**
- 创建本地D1数据库
- 按顺序运行所有 SQL 迁移
- 验证数据库表已创建
- 提供故障排除指导

**何时使用：**
- 初始设置后
- 添加新迁移时
- 重置本地数据库
- 排除数据库问题

**要求：**
- 牧马人CLI已安装（`npm install -g wrangler`）
- `./migrations/`目录下的迁移文件

---

### ☁️备份到b2.sh

每晚异地备份到 Backblaze B2。

```bash
npm run backup            # blobs + database
npm run backup -- db      # database only
npm run backup -- blobs   # blobs only
```

**它的作用：**
- 将 R2 照片/视频存储桶镜像到 B2（删除/更改的文件被存档，从不硬删除）
- 导出 D1 数据库 (`wrangler d1 export`)，对其进行 gzip 压缩，并将其作为带日期的 blob 上传
- 将存档版本和旧数据库转储删除到 `RETENTION_DAYS`（默认 90）

**何时使用：**
- 通过 [.github/workflows/backup-b2.yml](../.github/workflows/backup-b2.yml) 自动运行（每晚 05:17 UTC）
- 手动运行以进行临时备份或测试配置

**要求：**
- [rclone](https://rclone.org/install/) 和 Wrangler CLI 于 `PATH`
- Cloudflare、R2 S3 和 B2 凭证的环境变量 — 请参阅 [docs/backup.md](../docs/backup.zh.md)

---

### 🚀 部署helper.sh

用于生产的交互式部署助手。

```bash
npm run deploy:helper
```

**它的作用：**
- 检查 Cloudflare 身份验证
- 创建生产 D1 数据库
- 运行生产迁移
- 创建R2存储桶
- 设置生产秘密
- 部署Worker

**选项：**
1. 仅设置生产数据库
2. 仅创建 R2 存储桶
3. 仅配置机密
4. 仅部署Worker
5. 全面部署（以上全部）

**何时使用：**
- 首次生产部署
- 部署更新
- 设置新资源
- 解决生产问题

**要求：**
- Wrangler CLI 安装并登录
- `.dev.vars` 配置生产值
- `wrangler.toml`已配置

---

## 快速启动工作流程

### 首次设置

1. **运行安装向导：**
   ```bash
   npm run setup:wizard
   ```

2. **验证配置：**
   ```bash
   npm run validate
   ```

3. **设置数据库：**
   ```bash
   npm run db:setup
   ```

4. **安装依赖项：**
   ```bash
   npm run install:all
   ```

5. **开始开发：**
   ```bash
   npm run dev
   ```

### 生产部署

1. **验证配置：**
   ```bash
   npm run validate
   ```

2. **运行部署助手：**
   ```bash
   npm run deploy:helper
   ```

3. **按照提示**部署资源

4. **将前端部署**到 Cloudflare Pages（请参阅 docs/ 中的 configuration.md）

---

## 预提交挂钩

`.githooks/pre-commit` 中提供了存储库本地预提交挂钩。

### 启用钩子

```bash
git config core.hooksPath .githooks
chmod +x .githooks/pre-commit
```

### 它运行什么

- `npm run validate`
- `npm --prefix apps/web run lint`
- `npm run test:all`

---

## 故障排除

### 脚本不会执行

确保脚本可执行：
```bash
chmod +x scripts/*.sh scripts/*.js
```

### 未找到牧马人

全局安装 Wrangler CLI：
```bash
npm install -g wrangler
```

### 配置错误

运行验证以查看具体问题：
```bash
npm run validate
```

### 数据库问题

重置本地数据库：
```bash
rm -rf .wrangler/state
npm run db:setup
```

### 节点版本

需要 Node.js 18 或更高版本：
```bash
node --version
```

---

## 手动执行

您也可以直接运行脚本：

```bash
# Setup wizard
node scripts/setup-wizard.js

# Validation
node scripts/validate-config.js

# Database setup
bash scripts/db-setup.sh

# Deployment helper
bash scripts/deploy-helper.sh
```

---

## 脚本开发

### 添加新脚本

1. 在`scripts/`目录下创建脚本
2. 使可执行文件：`chmod +x scripts/your-script.sh`
3. 将 npm 脚本添加到`package.json`
4. 文档在此README

### 测试脚本

在干净的环境中测试脚本：
```bash
# Backup existing config
mv .dev.vars .dev.vars.backup

# Test script
npm run setup:wizard

# Restore config
mv .dev.vars.backup .dev.vars
```

---

## 相关文档

- [configuration.md](../docs/configuration.zh.md) - 完整配置指南
- [CONTRIBUTING.md](../CONTRIBUTING.zh.md) - 开发工作流程
- [README.md](../README.zh.md) - 项目概述

---

## 支持

如果您在使用这些脚本时遇到问题：
1. 检查此README以进行故障排除
2. 运行 `npm run validate` 诊断问题
3. 请参阅 [CONTRIBUTING.md](../CONTRIBUTING.zh.md) 了解支持选项
