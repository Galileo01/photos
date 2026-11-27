# 架构文档

[English](architecture.md) | **简体中文**


本文档提供了照片共享应用程序架构的技术概述。

## 技术栈

### 前端（网络应用程序）

- **框架：** React 19 与 TypeScript
- **构建工具：** Vite 8
- **路由：** React Router v7
- **样式：**Tailwind CSS4
- **状态管理：** React Context API + Hooks
- **多语言：** `i18next` + `react-i18next`（英文 `en` 为源语言，简体中文为 `zh-CN`）
- **手机：** Capacitor 8（Android原生包装；iOS当前未包装）
- **图像处理：** 浏览器画布 API 用于预览/模糊占位符，`libraw-wasm` 用于客户端 RAW 解码，`react-filerobot-image-editor` + `react-konva` 用于浏览器内图像编辑
- **视频处理：** `@ffmpeg/ffmpeg`（WASM，单线程）用于客户端修剪/裁剪/速度编辑
- **HTTP 客户端：** Axios

### 后端（Worker）

- **运行时：** Cloudflare Workers（V8 隔离）
- **框架：** Hono（轻量级Web框架）
- **数据库：** Cloudflare D1 (SQLite)
- **存储：** Cloudflare R2（兼容 S3）
- **身份验证：** Cloudflare 访问（Web）+ JWT Bearer token（移动）
- **电子邮件：** Mailgun（可选）

### 基础设施

- **CDN:** Cloudflare
- **托管：** Cloudflare Pages（前端）+ Workers（后端）
- **SSL/TLS：** 通过 Cloudflare 自动
- **DDoS 防护：** Cloudflare
- **分析：** 内置（无外部依赖项）

### D1 阅读预算和计划维护

D1 对扫描的行进行收费，而不仅仅是返回的行。迁移
`033_reduce_d1_reads.sql` 添加活动缩略图的有序部分索引，
活动照片分页、人工智能丰富和通知队列、过时的上传、
并覆盖人脸/标签会员指数。在部署之前应用一次
优化查询：

```sh
./apps/worker/node_modules/.bin/wrangler d1 execute photos-db --env production --remote --file=migrations/033_reduce_d1_reads.sql
```

迁移以 D1 支持的 `PRAGMA optimize` 刷新规划器结束
统计数据。在大量数据/索引更改后运行它，而不是在每个请求上运行它。
检查`EXPLAIN QUERY PLAN`和`meta.rows_read`；索引存在并不能证明
查询使用它。索引构建本身会消耗读取和写入。
AI 队列、通知队列和未附加照片页面明确使用它们的
有序/覆盖指数 (`INDEXED BY`)：生产测量表明
NULL——重度遗留索引在优化后仍然赢得了规划者的估计。
这三个有界读路径在部署之前需要迁移033。

活动缩略图使用每个活动的索引前一项查找而不是排名
每张照片。人员过滤器保留活动访问检查并结合检测到的
带有手动标签的面孔。独立照片分页使用索引反查找。
人物列表计数保留了不同面孔和标签的不同照片语义。

网络客户端仅共享并发的相同活动/照片/人物阅读，而不是
确定的回应。写入和身份验证更改使挂起的读取无效
分享。图库刷新一次获取照片，上传完成
合并为每一秒窗口一次刷新，如果出现则进行尾随刷新
上传在未完成的提取期间完成。私人API回复不是
放置在共享缓存中。

**自 2026 年 10 月 25 日起，预定的 Worker 作业已暂停。** 所有三个 `[triggers]`
`wrangler.toml` 中的部分故意包含 `crons = []`，包括
制作和舞台。通知、AI 丰富和维护
延迟，而不是丢弃。不要在午夜或部署时自动恢复。
在查看实际读取成本并明确选择恢复后，恢复
`crons = ["0 * * * *"]` 用于所需的环境并部署其触发器。
这控制了 Worker cron 触发器，而不是单独的 GitHub Actions 计划。

## 系统架构

```text
┌─────────────────────────────────────────────────────────────┐
│                         End Users                           │
│              (Web Browsers / Mobile Apps)                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTPS
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare CDN                           │
│          (DDoS Protection, SSL, WAF, Caching)               │
└────────┬────────────────────────────────────────────┬───────┘
         │                                            │
         │ Static Assets                              │ API Requests
         ▼                                            ▼
┌────────────────────┐                    ┌──────────────────────┐
│  Cloudflare Pages  │                    │  Cloudflare Worker   │
│   (React SPA)      │                    │   (Hono Backend)     │
│                    │                    │                      │
│ - React Components │                    │ - API Routes         │
│ - Tailwind CSS     │                    │ - Business Logic     │
│ - Client-side      │                    │ - Authentication     │
│   Image Processing │                    │ - Feature Flags      │
└────────────────────┘                    └──────┬───────┬───────┘
                                                 │       │
                                                 │       │
                           ┌─────────────────────┘       └─────────────────┐
                           │                                               │
                           ▼                                               ▼
                  ┌─────────────────┐                          ┌──────────────────┐
                  │  Cloudflare D1  │                          │  Cloudflare R2   │
                  │   (SQLite DB)   │                          │ (Object Storage) │
                  │                 │                          │                  │
                  │ - Events        │                          │ - Original Photos│
                  │ - Photos        │                          │ - Preview Images │
                  │ - Users         │                          │ - Videos         │
                  │ - Favorites     │                          │                  │
                  │ - Collaborators │                          │ Folders:         │
                  └─────────────────┘                          │ - original/      │
                                                               │ - preview/       │
                                                               └──────────────────┘
                           │
                           │ Optional
                           ▼
                  ┌─────────────────┐
                  │     Mailgun     │
                  │  (Email Service)│
                  │                 │
                  │ - Invitations   │
                  │ - Notifications │
                  └─────────────────┘
```

## 项目结构

```text
.
├── apps/
│   ├── web/                    # Frontend React application
│   │   ├── src/
│   │   │   ├── components/     # Reusable UI components (ImageEditorModal, VideoEditorModal,
│   │   │   │                  # CastButton/CastReceiver, PullToRefresh, OfflineBanner, ...)
│   │   │   ├── contexts/       # React contexts (Auth, Upload, etc.)
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   ├── i18n/           # i18next 初始化、语言工具和翻译资源
│   │   │   ├── pages/          # Page components (routes) (Timeline, PhotoUsage, PrivacyPolicy,
│   │   │   │                  # InviteAccept, ...)
│   │   │   ├── services/       # Business logic services (uploadManager, backgroundSync, ...)
│   │   │   ├── utils/          # Utility functions
│   │   │   ├── rawImageUtils.ts # Client-side RAW (.cr2/.nef/.arw/.dng/...) decoding via libraw-wasm
│   │   │   ├── imageUtils.ts   # Preview/blur-placeholder generation (Canvas API)
│   │   │   ├── api.ts          # API client
│   │   │   ├── config.ts       # Runtime configuration
│   │   │   └── types.ts        # TypeScript types
│   │   ├── android/            # Capacitor Android project
│   │   └── public/             # Static assets
│   │
│   └── worker/                 # Backend Cloudflare Worker
│       ├── src/
│       │   ├── routes/         # API route handlers
│       │   │   ├── admin/      # Admin-only routes (modular)
│       │   │   │   ├── events.ts      # Event CRUD
│       │   │   │   ├── uploads.ts     # Upload handling
│       │   │   │   ├── photos.ts      # Photo management (incl. featured/replace/bulk ops)
│       │   │   │   ├── analytics.ts   # Statistics
│       │   │   │   ├── tags.ts        # Tag CRUD
│       │   │   │   └── utilities.ts   # Geocoding, thumbnails, misc utilities
│       │   │   ├── admin.ts           # Admin router orchestrator (mounted at /api/admin)
│       │   │   ├── collaborators.ts   # Collaboration features + invite links
│       │   │   ├── favorites.ts       # Favorites system + user profile
│       │   │   ├── media.ts           # Serves original/preview images & videos from R2
│       │   │   ├── zip.ts             # Batch ZIP download
│       │   │   ├── features.ts        # Public favoriting/featured/tag endpoints
│       │   │   ├── mobileAuth.ts      # Mobile OAuth login + token issuance
│       │   │   └── seo.ts             # SEO endpoints
│       │   ├── auth.ts         # Authentication middleware
│       │   ├── config.ts       # Configuration management
│       │   ├── features.ts     # Feature flag system
│       │   ├── geocoding.ts    # Reverse geocoding
│       │   ├── imageProcessing.ts  # Watermark text helpers (currently unused by any route)
│       │   ├── fileTypeUtils.ts # File-type/extension helpers (images, videos, RAW)
│       │   ├── index.ts        # Worker entry point
│       │   ├── types.ts        # TypeScript types
│       │   └── utils.ts        # Utility functions
│       └── wrangler.toml       # Worker configuration
│
├── migrations/                 # D1 database migrations
│   └── *.sql                   # SQL migration files
│
├── docs/                       # Documentation files
└── scripts/                    # Utility and setup scripts
```

## 核心模块

### 前端架构

#### 前端配置系统（`config.ts`）

```typescript
// Production: Injected by worker at runtime
window.__CONFIG__ = { apiUrl: '...', brandName: '...' };

// Development: Falls back to VITE_ environment variables
getConfig() → reads window.__CONFIG__ || import.meta.env
```

#### 身份验证上下文 (`contexts/AuthContext.tsx`)

使用 React Context 的全局身份验证状态：

- 使用 Cloudflare Access 的 OAuth 流程
- JWT 代币管理
- 用户会话持久化
- 管理员权限检查

#### API 客户端 (`api.ts`)

集中式API通信：

- 带有拦截器的 Axios 实例
- 自动令牌注入
- 错误处理
- URL 施工帮手

#### 定制挂钩

- `usePhotoSelection.ts` - 照片选择状态管理
- `useAuth` - 身份验证挂钩（来自 AuthContext）

#### 关键部件

- **照片卡** - 包含精选、收藏的个人照片，EXIF
- **EventGallery** - 主图库视图，具有过滤、排序功能
- **AdminEventUpload** - 拖放上传界面
- **导航栏/页脚** - 带有动态品牌的导航

### 后端架构

#### 后端配置系统（`config.ts`）

环境感知配置：

```typescript
getConfig(env) → {
  appName, brandName, domain, contactEmail,
  adminEmails, jwtSecret, mailgunApiKey, ...
}
```

#### 功能标志 (`features.ts`)

自动特征检测：

```typescript
getFeatures(config) → {
  hasMailgun, canSendEmails, enableCollaborators,
  enableFavorites, enableGeocoding, ...
}

// Middleware
requireFeature('enableCollaborators')

// Inline check
checkFeature(env, 'canSendEmails')
```

#### 身份验证（`auth.ts`）

多层安全：

1. **Cloudflare 访问** - CDN 级别的 OAuth
2. **JWT验证** - 令牌验证
3. **管理员检查** - 基于电子邮件的管理员授权
4. **上传权限** - 协作者或管理员

中间件功能：

- `requireAuth` - 仅限经过身份验证的用户
- `requireAdmin` - 仅限管理员用户
- `requireUploadPermission` - 管理员或活动协作者

#### 路线结构

**管理路由**（模块化）：

- `admin/events.ts` - 活动CRUD 操作
- `admin/uploads.ts` - 分段上传处理
- `admin/photos.ts` - 照片管理
- `admin/analytics.ts` - 统计端点
- `admin/tags.ts` - 标签管理
- `admin/utilities.ts` - 地理编码、缩略图

**公共路线**：

- `public.ts` - 活动、照片、时间线、标签（列表/详细信息）
- `media.ts` - 提供来自 R2 的原始/预览图像和视频字节（范围请求感知）
- `zip.ts` - 批量ZIP下载
- `features.ts` - 公开推荐/最喜欢的照片、收藏、按标签查找
- `collaborators.ts` - 协作功能+邀请链接
- `favorites.ts` - 用户收藏 + 个人资料
- `mobileAuth.ts` - 移动 OAuth 登录 (`/api/mobile-login`) 和令牌发行 (`/api/mobile-auth`)
- `seo.ts` - 站点地图、robots.txt

## 数据流

### 照片上传流程

```text
1. User selects photo in browser
   └─> Client reads EXIF, generates blurhash
       └─> Client creates preview (1200px max)
           └─> POST /admin/events/:slug/uploads/start
               └─> Worker creates multipart upload in R2
                   └─> Client uploads preview parts
                       └─> POST /admin/events/:slug/uploads/:id/complete?preview=true
                           └─> Client uploads original parts
                               └─> POST /admin/events/:slug/uploads/:id/complete
                                   └─> Worker sends notification (if collaborator)
                                       └─> Photo appears in gallery
```

### 认证流程

```text
1. User visits protected page
   └─> Cloudflare Access challenges user
       └─> User logs in with OAuth (Google, etc.)
           └─> Access issues JWT token
               └─> Frontend stores token
                   └─> API requests include token
                       └─> Worker validates JWT
                           └─> Worker checks admin status
                               └─> Request authorized
```

### 特征标志流程

```text
1. Request hits worker
   └─> Middleware checks feature requirement
       └─> getConfig(env) reads environment
           └─> getFeatures(config) evaluates flags
               └─> Mailgun configured?
                   ├─> Yes: enableCollaborators = true
                   └─> No: enableCollaborators = false
                       └─> Return 503 "Feature not available"
```

## 数据库架构

### 核心表

#### 活动

- 活动元数据、密码、可见性
- 照片、协作者、标签的外键父级

#### 照片

- 照片元数据、EXIF数据、GPS坐标
- 引用活动，存储 uploaded_by name

#### 用户

- OAuth 用户配置文件（电子邮件、姓名、头像）
- 管理状态由环境变量决定，而不是数据库

#### 活动协作者

- 多对多：活动↔用户
- 跟踪邀请和接受日期

#### 用户收藏

- 多对多：用户↔照片
- 存储最喜欢的关系

#### 标签和活动标签

- 标签定义和活动关联

#### 合作历史

- 协作者操作的审核日志

#### 邀请链接

- 可共享的邀请令牌
- 限时、一次性或多次使用

请参阅 [migrations/](../migrations/) 了解完整的架构。

## 性能优化

### 前端

1. **图像处理**
   - 客户端预览生成可减少上传大小
   - Blurhash 占位符用于即时加载反馈
   - 上传前基于画布调整大小

2. **代码分割**
   - 使用 React.lazy 进行基于路由的代码分割
   - 重型部件的动态导入

3. **缓存**
   - Service Worker 缓存（如果已实现）
   - 来自 CDN 的浏览器缓存标头

### 后端

1. **边缘计算**
   - Worker 在 Cloudflare 的全球网络上运行
   - <10ms CPU 每个请求的时间
   - 无冷启动（V8 隔离）

2. **数据库优化**
   - 用于常见查找的索引查询
   - 准备好的安全性和速度声明
   - 选择性列获取

3. **贮存**
   - 直接 R2 上传（无工作代理）
   - CDN 缓存经常访问的照片
   - 大文件分段上传

## 安全

### 身份验证层

1. **Cloudflare Access** - 阻止未经身份验证的请求
2. **JWT 验证** - 验证令牌签名和到期时间
3. **管理员授权** - 根据 ADMIN_EMAILS 检查电子邮件
4. **活动权限** - 检查协作者关系

### 数据保护

1. **HTTPS 仅** - 所有流量均加密
2. **CORS** - 仅限于配置的域
3. **SQL 注入** - 仅准备好的语句
4. **XSS 保护** - React 自动转义输出
5. **CSRF** - SameSite cookies + JWT 令牌

### 保密管理

所有敏感值都存储为 Cloudflare 机密：

- 绝不在代码或版本控制中
- 静态时加密
- 通过 Cloudflare 仪表板进行访问控制

## 可扩展性

### 水平缩放

- **Worker**：自动扩展至数百万个请求
- **D1**：处理 10k+ RPS（读取）、1k+ RPS（写入）
- **R2**：无限存储，高吞吐量
- **CDN**：全球边缘网络

### 局限性

- **D1**：每个数据库 1GB 数据库大小
- **R2**：无硬性限制，即用即付
- **Workers**：128MB内存，30sCPU时间（企业）

### 成长之路

1. **小**：单个区域，<1000 张照片
2. **中**：多区域 D1 只读副本
3. **大型**：多个D1数据库（按年份分片）
4. **企业**：用于实时功能的耐用对象

## 监控

### 内置指标

- Cloudflare 仪表板中的Worker分析
- D1 查询性能指标
- R2 存储和带宽使用

### 推荐的外部工具

- **Sentry** - 错误跟踪
- **LogFlare** - 日志聚合
- **Prometheus** - 自定义指标（如果需要）

## 开发流程

### 本地发展

1. 使用 Wrangler CLI 进行Worker开发
2. 用于前端的 Vite 开发服务器，带有 HMR
3. D1本地数据库用于测试
4. R2 本地模拟（或开发存储桶）

### 测试

- 前端：Vitest + React 测试库（`npm test` in `apps/web`）
- E2E：剧作家测试（`npm run test:e2e` 于 `apps/web`）
- Worker：Vitest（`npm test`在`apps/worker`）

### 部署

1. **Worker**：`wrangler deploy`
2. **前端**：构建 → 部署到页面
3. **迁移**：`for file in ./migrations/*.sql; do wrangler d1 execute <db-name> --remote --file="$file"; done`（该项目直接应用普通编号的SQL文件，而不是使用Wrangler的迁移跟踪系统）

## 未来的增强功能

潜在的改进：

1. **实时功能** - 用于实时协作的耐用对象
2. **自适应视频流** - 在当前定时生成单码率 1080p H.264 衍生文件的基础上集成 Cloudflare Stream
3. **人工智能功能** - 用于自动标记的Worker人工智能
4. **高级搜索** - 使用 Vectorize 进行全文搜索
5. **CDN 优化** - 自动图像优化的抛光
6. **iOS 应用程序** - 打包适用于 iOS 的现有 Capacitor Web 应用程序（当前仅限 Android）

## 参考

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [荣誉框架](https://hono.dev/)
- [React 文档](https://react.dev/)
- [Vite指南](https://vitejs.dev/)
