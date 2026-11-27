# 配置指南

[English](configuration.md) | **简体中文**


本指南介绍如何为您自己的部署配置照片共享应用程序。

## 概述

该应用程序被设计为可白标并可通过环境变量进行完全配置。无需更改代码即可自定义品牌、域或可选功能。

## 所需配置

### Worker（后端）配置

在您的 Cloudflare Worker 环境或 `wrangler.toml` 中设置这些变量：

```toml
[vars]
# Application Identity
APP_NAME = "Your App Name"
BRAND_NAME = "Your Brand"
COPYRIGHT_HOLDER = "Your Name or Organization"
APP_DOMAIN = "photos.yourdomain.com"
CONTACT_EMAIL = "contact@yourdomain.com"

# Environment (optional, defaults to production)
ENVIRONMENT = "production"  # or "development"
```

### 秘密（通过 Cloudflare Dashboard 或 CLI）

这些必须设置为秘密（不在`wrangler.toml`中）：

```bash
# Required
wrangler secret put ADMIN_EMAILS
# Enter: admin1@example.com,admin2@example.com

wrangler secret put JWT_SECRET
# Enter: A secure random string (min 32 characters) - signs mobile OAuth bearer tokens

wrangler secret put EVENT_COOKIE_SECRET
# Enter: Another secure random string (min 32 characters)

# Optional: Google Analytics 4
wrangler secret put GA_MEASUREMENT_ID
# Enter: Your GA4 Measurement ID (format: G-XXXXXXXXXX)
```

> **注意**：Cloudflare Access 本身会验证边缘的 `Cf-Access-Jwt-Assertion` 标头
> 在请求到达Worker之前 - Worker只需将已经验证的JWT解码为
> 读取用户的电子邮件，因此没有单独的 `ACCESS_TEAM_DOMAIN`/`ACCESS_AUD` 秘密
> 在这里配置。直接在 Cloudflare 零信任中配置您的 Access 应用程序/策略
> 仪表板（请参阅下面的 Cloudflare 访问部分）。

### 可选电子邮件功能（Mailgun）

对于协作者邀请和通知：

```bash
wrangler secret put MAILGUN_API_KEY
# Enter: Your Mailgun API key

wrangler secret put MAILGUN_DOMAIN
# Enter: mg.yourdomain.com
```

**注意：** 如果未配置 Mailgun，与电子邮件相关的功能（协作者、邀请链接、上传通知）将自动禁用。

### Web 应用程序（前端）配置

前端在运行时从后端获取其配置。对于本地开发，在`apps/web/`中创建`.env`：

```env
# Development only - points to your local worker
VITE_API_URL=http://localhost:8787
```

在生产中，Web 应用程序自动从工作线程继承配置（不需要 .env）。

## Cloudflare 资源

### 所需的 Cloudflare 资源

该应用程序需要以下 Cloudflare 服务：

1. **Workers** - 无服务器后端
2. **D1 数据库** - 用于元数据的 SQLite 数据库
3. **R2 存储** - 照片/视频的对象存储
4. **Cloudflare 访问** - OAuth 身份验证

### 绑定配置

在 `wrangler.toml` 中，确保配置了这些绑定：

```toml
[[d1_databases]]
binding = "DB"
database_name = "your-photos-db"
database_id = "your-database-id"

[[r2_buckets]]
binding = "PHOTOS_BUCKET"
bucket_name = "your-photos-bucket"
```

## 功能标志

根据配置自动启用功能：

|特色 |要求 |自动启用 |
| --------- | ------------- | -------------- |
|电子邮件发送 | Mailgun API 密钥 + 域名 | ✓ |
|协作者 |已启用电子邮件发送 | ✓ |
|收藏 |随时可用 | ✓ |
|地理编码 |随时可用 | ✓ |
|分析 (GA4) | GA_MEASUREMENT_ID已配置| ✓ |

### 谷歌分析 4 设置

该应用程序支持 Google Analytics 4 (GA4) 来跟踪用户交互。

**跟踪的内容：**

- 页面浏览量（路线更改时自动）
- 照片视图（当用户打开详细视图时）
- 照片下载（单张和批量ZIP下载）
- 收藏操作（添加/删除收藏）

**配置：**

1. **获取您的GA4测量ID：**
   - 前往 [Google Analytics](https://analytics.google.com/)
   - 创建新的 GA4 属性或使用现有属性
   - 导航到管理 → 数据流 → Web 流
   - 复制您的测量 ID（格式：`G-XXXXXXXXXX`）

2. **生产配置：**
设置为 Cloudflare Worker 密钥：

   ```bash
   cd apps/worker
   wrangler secret put GA_MEASUREMENT_ID
   # Enter: G-XXXXXXXXXX
   ```

3. **开发配置：**
添加到`apps/web/.env`（您可能需要从`.env.example`创建此文件）：

   ```bash
   VITE_GA_MEASUREMENT_ID="G-XXXXXXXXXX"
   ```

或者使用占位符ID进行测试：

   ```bash
   VITE_GA_MEASUREMENT_ID="G-PLACEHOLDER"
   ```

4. **禁用分析：**
要禁用跟踪：
   - 不要设置 `GA_MEASUREMENT_ID` 秘密（或使用 `wrangler secret delete GA_MEASUREMENT_ID` 删除它）
   - 对于开发，请从 `.env` 中删除 `VITE_GA_MEASUREMENT_ID` 或将其设置为 `G-PLACEHOLDER`

**隐私考虑因素：**

- 默认情况下启用 IP 匿名化
- 不会将个人身份信息 (PII) 发送至 GA4
- 如果您所在司法管辖区要求，请考虑添加 Cookie 同意横幅（GDPR、CCPA 等）

**确认：**

- 部署后，访问您的站点并浏览页面
- 打开 Google Analytics → 报告 → 实时
- 您应该会在大约 30 秒内看到您的活动

- `APP_DOMAIN` - 无协议的主域（例如“photos.example.com”）
- 用于 CORS、电子邮件链接、SEO 元数据和 API URL

### 联系信息

- `CONTACT_EMAIL` - 显示在页脚中并用于系统电子邮件

## 环境变量参考

### 工作环境变量

|变量|类型 |必填 |描述 |
| ---------- | ------ | ---------- | ------------- |
| `APP_NAME` |字符串|是的 |完整的应用程序名称 |
| `BRAND_NAME` |字符串|是的 | UI 的品牌名称 |
| `COPYRIGHT_HOLDER` |字符串|是的 |版权所有者姓名 |
| `APP_DOMAIN` |字符串|是的 |无协议域 |
| `CONTACT_EMAIL` |字符串|是的 |联系电子邮件地址 |
| `ENVIRONMENT` |字符串|没有 | `production` 或 `development` |
| `ADMIN_EMAILS` |秘密|是的 |以逗号分隔的管理员电子邮件 |
| `JWT_SECRET` |秘密|是的 |签署/验证移动 OAuth Bearer token（32 个以上字符）|
| `EVENT_COOKIE_SECRET` |秘密|是的 | Cookie 签名秘密（32 个以上字符）|
| `GA_MEASUREMENT_ID` |秘密|没有 | Google Analytics 4 测量 ID |
| `MAILGUN_API_KEY` |秘密|没有 | Mailgun API 电子邮件密钥 |
| `MAILGUN_DOMAIN` |秘密|没有 | Mailgun 发送域 |

### Web 应用程序环境变量（开发）

|变量|类型 |必填 |描述 |
|--------------------------|--------|----------|-----------------------------------|
| `VITE_API_URL` |字符串|仅限开发 |当地发展工作者URL |
| `VITE_GA_MEASUREMENT_ID` |字符串|没有 | Google Analytics 4 测量 ID |

## 快速启动配置

### 1. 克隆并安装

```bash
git clone <repository-url>
npm install
```

### 2. 配置Worker

编辑`apps/worker/wrangler.toml`：

```toml
[vars]
APP_NAME = "My Photo Gallery"
BRAND_NAME = "My Gallery"
COPYRIGHT_HOLDER = "Your Name"
APP_DOMAIN = "photos.yourdomain.com"
CONTACT_EMAIL = "hello@yourdomain.com"
```

### 3.设定秘密

```bash
cd apps/worker
wrangler secret put ADMIN_EMAILS
wrangler secret put JWT_SECRET
wrangler secret put EVENT_COOKIE_SECRET
```

### 4.创建D1数据库

```bash
wrangler d1 create your-photos-db
# Copy the database_id to wrangler.toml
```

### 5. 运行迁移

该项目不使用 Wrangler 的内置迁移跟踪系统；每个文件中
`migrations/` 是一个简单的、按文件名幂等的 SQL 脚本，按顺序应用：

```bash
for file in ./migrations/*.sql; do wrangler d1 execute your-photos-db --remote --file="$file"; done
```

### 6. 创建R2桶

```bash
wrangler r2 bucket create your-photos-bucket
```

### 7. 部署

```bash
# Deploy worker
cd apps/worker
npm run deploy

# Build and deploy web app
cd ../web
npm run build
# Deploy dist/ to your hosting (Pages, Netlify, etc.)
```

## 开发设置

对于本地发展：

```bash
# Terminal 1: Start worker
cd apps/worker
npm run dev

# Terminal 2: Start web app
cd apps/web
npm run dev
```

Web 应用程序将在 `http://localhost:5173` 可用，并将向`http://localhost:8787` 的Worker代理 API 请求。

## 验证

部署后，验证您的配置：

1. 访问 `https://your-domain.com` - 应显示您的品牌名称
2. 检查页脚版权 - 应显示您的版权所有者
3. 尝试创建活动（需要管理员登录）

## 故障排除

### “功能不可用”错误

- 如果协作者功能不起作用，请检查 Mailgun 配置
- 验证所有必需的机密均已设置为 `wrangler secret list`

### CORS 错误

- 确保 `APP_DOMAIN` 与您的实际域名匹配
- 检查 Cloudflare Access 是否配置正确

### 身份验证问题

- 验证在零信任仪表板中为 `/admin*`（对于移动设备为 `/api/mobile-login`）正确配置了 Cloudflare Access
- 检查`ADMIN_EMAILS`中的管理员电子邮件设置是否正确
- 确保`JWT_SECRET`和`EVENT_COOKIE_SECRET`设置正确

### 电子邮件未发送

- 验证 Mailgun API 密钥和域名是否正确
- 检查 Mailgun 日志以了解递送问题
- 确认发送域已在 Mailgun 中验证

## 安全最佳实践

1. **使用强秘密** - 生成加密安全的随机字符串
2. **定期轮换秘密** - 定期更新 JWT 和 cookie 秘密
3. **限制管理员访问** - 仅将必要的电子邮件添加到`ADMIN_EMAILS`
4. **启用 Cloudflare Access** - 不要仅依赖应用程序身份验证
5. **使用 HTTPS** - 始终在启用 SSL/TLS 的情况下进行部署
6. **查看 Cloudflare 设置** - 启用 DDoS 保护和 WAF 规则

## 下一步

- 阅读 [features.md](./features.zh.md) 了解可用功能
- 查看 [architecture.md](./architecture.zh.md) 了解技术细节
- 检查 [api-reference.md](./api-reference.zh.md) 中的 API 文档
- 请参阅 [contributing.md](./contributing.zh.md) 进行贡献
