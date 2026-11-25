# 照片分享应用程序

[English](README.md) | **简体中文**


一个全栈、白标照片库应用程序，使用 React + Vite + Tailwind（前端）和 Cloudflare Workers（后端）构建，具有 D1 数据库和 R2 存储。

> **开源和自托管**：部署您自己的品牌照片共享平台，完全控制您的数据。

## 文档

- **[配置指南](docs/configuration.zh.md)** - 完整的设置和部署说明
- **[API 参考](docs/api-reference.zh.md)** - REST API 端点文档
- **[架构](docs/architecture.zh.md)** - 技术架构和设计
- **[功能](docs/features.zh.md)** - 功能描述和使用示例
- **[图像处理](docs/image-processing.zh.md)** - 预览/导数生成和当前限制
- **[联系表单](docs/contact-form.zh.md)** - 配置首页联系表单
- **[移动指南](docs/mobile-guide.zh.md)** - 构建和运行 Android 应用程序
- **[移动 OAuth 设置](docs/mobile-oauth.zh.md)** - 适用于移动应用程序的 Cloudflare Access OAuth
- **[Android 部署](docs/android-deployment.zh.md)** - Google Play 商店发布流程
- **[贡献](docs/contributing.zh.md)** - 贡献指南和开发工作流程

## 🏗️建筑

### 前端 (`apps/web`)

- **框架**：React 19 + TypeScript
- **构建工具**：Vite 8
- **样式**：Tailwind CSS 4
- **路由**：React Router v7
- **状态**：React hooks + Context API
- **多语言**：使用 `i18next` + `react-i18next` 管理英文和简体中文资源
- **存储**：IndexedDB（通过 Dexie）用于上传队列持久化
- **地图**：Leaflet + React-Leaflet（带有标记聚类）
- **图像处理**：客户端画布 API 用于预览/模糊占位符生成、RAW 解码 (`libraw-wasm`) 和浏览器内图像编辑 (`react-filerobot-image-editor` + `react-konva`)
- **视频**：通过`@ffmpeg/ffmpeg`进行客户端修剪/处理（单线程，不需要COOP/COEP）
- **移动**：Capacitor 8（Android 原生包装器；iOS 目前未包装）

### 后端 (`apps/worker`)

- **运行时**：Cloudflare Workers
- **框架**：Hono 4
- **数据库**：Cloudflare D1 (SQLite)
- **存储**：Cloudflare R2（兼容 S3）
- **身份验证**：Cloudflare Access（网络）+ JWT Bearer token（移动）、HTTP 仅用于每个活动密码的会话 Cookie
- **图像处理**：预览/模糊占位符生成在上传时在客户端发生；Worker仅从 R2 流式传输原始/预览文件，并且 **不** 应用服务器端水印或调整大小（请参阅 [docs/image-processing.md](docs/image-processing.zh.md)）

## ✨ 特点

### 公共特色

- 🏠 **首页**：具有自动旋转功能的精选照片幻灯片
- 📋 **活动列表**：浏览所有公共活动，包括预览图像、标签和位置
- 🔐 **密码保护**：可选的每个活动密码保护
- 🖼️ **图库视图**：砖石布局，响应式卡片保留宽高比
- 📅 **照片排序**：按日期 (asc/desc)、文件名 (asc/desc) 或精选状态
- 🏷️ **标签过滤**：按标签浏览活动（例如“Schaatsen”、“Skeeleren”）
- 🌍 **城市过滤**：按位置/城市过滤活动
- 📷 **直接照片链接**：与`/p/:eventSlug/:photoId`分享个人照片
- 🎯 **照片导航**：无需重新加载页面即可无缝浏览（pushState）
- ⌨️ **键盘导航**：箭头键、Escape 关闭、幻灯片模式
- 📱 **移动设备友好**：触摸手势、原生共享API和响应式设计
- 🌐 **界面语言**：可在用户菜单或设置中切换英文和简体中文，切换立即生效并在本地保存偏好
- 📸 **EXIF 元数据**：完整的相机、镜头和设置显示
- 🗺️ **地图视图**：在交互式地图上浏览具有 GPS 坐标的所有照片（标记聚类）
- 🕒 **时间线视图**：按时间顺序、无限滚动查看所有可访问的活动
- 🎥 **视频支持**：上传并播放 `.mp4`/`.mov` 视频和照片
- 📡 **Chromecast**：从网络应用程序将照片/视频投射到电视上
- 📶 **离线感知**：离线横幅+下拉刷新，原生网络状态检测
- ⬇️ **下载选项**：
  - 原始全分辨率文件
  - 预览（1920px @ 85% 质量JPEG）
  - 批量下载选定的照片为ZIP（最多50张）
- ⭐ **收藏**：将照片添加到收藏，在专用的收藏页面中查看
- 🎨 **渐进式图像**：模糊占位符 → 完整图像过渡
- 🔄 **智能缓存**：预览浏览器缓存的图像
- 📄 **照片使用和隐私页面**：专用 `/usage`（权利/许可）和 `/privacy` 页面
- 🔗 **邀请链接**：通过可共享、可过期的链接以协作者身份加入活动 (`/invite/:token`)

### 管理功能

#### 仪表板 (`/admin`)

- 📊 **分析卡**：总活动、照片、存储使用情况、收藏
- 📈 **公共/私人分割**：跟踪活动可见性一目了然
- 🎯 **活动管理**：创建、编辑和删除活动
- 🏷️ **标签系统**：将标签分配给编辑模式中的活动
- 🗑️ **安全删除**：所有破坏性操作的确认模式
- 📝 **活动详细信息**：编辑名称、描述、密码和标签
- 🔗 **快速访问**：上传、照片管理器和公共图库的直接链接

#### 照片上传 (`/admin/events/:slug/upload`)

- 📤 **拖放**：一次上传多张照片和视频
- 🔄 **持久队列**：IndexedDB 支持的上传队列在页面重新加载后仍然存在
- 📦 **分段上传**：高效地将大文件（5MB 块）上传到 R2
- 🚦 **并发上限**：限制并发上传以避免大批量耗尽浏览器的连接池
- 📊 **EXIF 提取**：自动元数据提取（相机、镜头、设置、GPS）
- 🖼️ **RAW 照片支持**：客户端 RAW 解码（`.cr2`、`.nef`、`.arw`、`.dng` 等，通过 `libraw-wasm`）并生成JPEG预览，同时保留原始RAW文件
- 🖼️ **客户端预览生成**：在浏览器中创建 1920 像素预览（85% 质量）
- 🎨 **模糊占位符**：生成微小的模糊占位符以进行渐进加载
- 📈 **活动分析**：
  - 照片数和GPS覆盖率
  - 最喜欢的 5 张照片（带缩略图）
  - 使用的相机型号
  - 精选照片数量
- 🗺️ **GPS 位置设置器**：用于查看/验证照片位置的交互式地图
- 🖼️ **照片管理器链接**：快速访问管理所有照片

#### 照片管理器 (`/admin/events/:slug/photos`)

- 🎯 **网格视图**：所有活动照片的视觉概览
- ☑️ **批量选择**：使用全选/取消全选进行复选框选择
- ⭐ **特色切换**：将照片标记为特色（显示在首页上）
- 🗑️ **回收站**：将照片移至回收站（保留 30 天，可恢复），而不是直接删除
- 📦 **存档**：隐藏时间线中的照片而不删除它
- ✨ **自动增强**：一键客户端白平衡+对比度修复
- 👁️ **预览模式**：删除前预览照片
- 🏷️ **特色徽章**：特色照片的视觉指示器
- 💝 **收藏计数**：查看有多少用户收藏了每张照片
- ✂️ **图像编辑**：在浏览器中裁剪、旋转和调整曲线/级别（基于 Filerobot 的编辑器）；本机 Android 使用相同的编辑器和同源 blob 获取来避免画布污染
- 🎬 **视频编辑**：通过 FFmpeg 修剪、裁剪和调整客户端播放速度 WASM
- 📤 **替换原始/预览**：将编辑保存回 R2，无需从头开始重新上传

#### 组织、搜索与 AI（`/admin/trash`、`/admin/duplicates`、`/admin/people`、`/admin/activity`、`/search`）

- 🗑️ **垃圾**：查看、恢复或永久删除已垃圾照片；立即清空整个回收站
- 🔁 **重复检测**：将具有相同字节内容的照片分组 (SHA-256)，甚至跨活动
- 🧑‍🤝‍🧑 **人物**：上传时在客户端检测人脸 (`@vladmandic/human`) 并分组为
通过每小时一次的服务器端集群工作来命名人员——不需要 Workers AI 面部模型
- 🔍 **统一搜索**：具有可选语义的全文搜索（文件名、位置、AI 字幕）
重新排名，由 Cloudflare Workers AI 的免费每日分配（字幕 + 嵌入）提供支持
- 🕰️ **回忆**：时间线页面上的“这一天”轮播（纯SQL，无AI）
- 📜 **活动动态**：基于轮询记录收藏、活动创建和照片移入回收站
- 📲 **Android 自动备份**：选择一个设备文件夹以自动将新照片/视频备份到
后台活动（存储访问框架）

#### 标签管理器 (`/admin/tags`)

- 🏷️ **标签CRUD**：创建、编辑和删除标签
- 📊 **使用统计**：查看有多少活动使用每个标签
- 🔗 **自动段头**：自动生成URL友好的段头
- 📝 **描述**：为上下文添加描述到标签
- ⚠️ **安全删除**：删除正在使用的标签之前发出警告

#### 协作者系统

- 👥 **邀请用户**：通过电子邮件邀请协作者上传照片到特定活动
- 🔗 **可共享的邀请链接**：生成可过期、可撤销的链接，以便人们可以在没有电子邮件邀请的情况下作为协作者自行加入
- 📧 **电子邮件通知**：包含活动详细信息的自动邀请电子邮件（需要 Mailgun）
- ⚡ **上传权限**：协作者可以上传照片/视频，无需管理员访问权限
- 🧑‍🤝‍🧑 **协作者角色**：细粒度的功能（例如邀请、删除协作者、更改角色）而不是单一的平面角色
- 📊 **状态跟踪**：查看待处理、已接受或拒绝的邀请
- 🕓 **协作历史记录**：每个活动的协作者/邀请操作的审核日志
- 🔒 **安全访问**：使用 Cloudflare Access 身份验证（Web）和 JWT Bearer token（移动设备）
- 🗑️ **轻松管理**：随时从管理后台添加或删除协作者
- 📚 **文档**：有关详细指南，请参阅 [CONTRIBUTING.md](./CONTRIBUTING.zh.md) 和 [docs/features.md](docs/features.zh.md#collaboration-system)

#### 技术特点

- 🔐 **Cloudflare Access**：安全的管理员身份验证
- 🔒 **仅限管理员 API**：X-Admin-Access 标头验证
- 🎨 **响应式设计**：适用于桌面、平板电脑和移动设备
- ✅ **实时反馈**：所有操作的成功/错误消息
- 🚀 **优化性能**：高效的查询和缓存

## 建筑学

```text
.
├── apps/
│   ├── web/           # React + Vite + Tailwind frontend
│   ├── worker/        # Cloudflare Worker backend (TypeScript + Hono)
│   └── android/       # Android native app (Capacitor)
├── migrations/        # D1 database migrations
├── wrangler.toml      # Worker configuration
└── README.md          # This file
```

## 先决条件

- Node.js 18+ 和 npm
- Cloudflare 帐户
- 牧马人CLI (`npm install -g wrangler`)

## 本地开发设置

### 使用安装脚本快速启动

```bash
./scripts/setup-dev.sh
```

这将安装所有依赖项并显示后续步骤。

### 手动设置

### 1.安装依赖项

```bash
# Install worker dependencies
cd apps/worker
npm install

# Install web dependencies
cd ../web
npm install
```

### 2. 设置D1数据库（本地）

```bash
# Create local D1 database
wrangler d1 create photos-db-local

# Run ALL migrations
for file in ./migrations/*.sql; do wrangler d1 execute photos-db-local --local --file="$file"; done
```

### 3. 设置 R2 存储桶

对于**本地开发**，您不需要创建 R2 存储桶 - Wrangler 会自动在本地模拟 R2 存储。

对于**生产部署**，您需要：

1. 在 Cloudflare 仪表板中启用 R2（设置 → R2）
2. 创建存储桶：

```bash
wrangler r2 bucket create photos-storage
```

### 4. 配置本地机密

对于本地开发，在与 `wrangler.toml` 相同的目录中创建 `.dev.vars` 文件：

```bash
# Create .dev.vars file with your secrets
cat > .dev.vars << 'EOF'
# Required: Secret for signing event session cookies
EVENT_COOKIE_SECRET=dev-secret-change-in-production-123456789

# Optional: Shared secret for admin API in development
# ADMIN_SHARED_SECRET=your-admin-secret
EOF
```

> **注意**： `.dev.vars` 文件应该被 gitignored 并且永远不会提交到版本控制。

### 5. 启动开发服务器

**终端 1 - Worker：**

```bash
npm --prefix apps/worker run dev
# Worker runs on http://localhost:8787
```

**终端 2 - Web 应用：**

```bash
cd apps/web
npm run dev
# Web app runs on http://localhost:5173
# API requests are proxied to the worker
```

### 6. 访问应用程序

- **公共站点**：<http://localhost:5173>
- **管理后台**：<http://localhost:5173/admin>
- **WorkerAPI**：<http://localhost:8787>（直接访问）

---

## 运行应用程序

### 本地发展

设置完成后，您需要**两个终端窗口**同时运行：

**终端 1 - Worker（后端 API）**：

```bash
cd apps/worker
npm run dev
```

- 运行于 <http://localhost:8787>
- 处理所有 `/api/*` 和 `/media/*` 请求
- 代码更改时自动重新加载
- 访问本地 D1 和模拟 R2 存储

**终端 2 - Web 应用程序（前端）**：

```bash
cd apps/web
npm run dev
```

- 运行于 <http://localhost:5173>
- 代理 `/api` 和 `/media` 请求到端口 8787 上的工作线程
- 热模块更换（即时更新）
- 兼容 React DevTools

**本地使用管理面板**：

在开发中，管理员访问使用共享密钥：

1. 在`.dev.vars`中设置`ADMIN_SHARED_SECRET`（例如，`dev-secret-123`）
2. 在请求中添加 `X-Admin-Secret: dev-secret-123` 标头
3. 或者使用浏览器扩展添加标题
4. 管理页面将自动包含此标题

**开发工作流程**：

1. 启动两个终端（worker + web）
2. 在 <http://localhost:5173/admin> 创建活动
3. 上传活动照片
4. 将一些照片标记为精选照片
5. 查看公共图库和首页

### 测试本地生产构建

**构建前端**：

```bash
cd apps/web
npm run build
npm run preview  # Serves the production build
```

**在本地测试Worker**：

```bash
cd apps/worker
npm run build
wrangler dev  # Uses production-like environment
```

## 生产部署

### 1. 创建生产D1数据库

```bash
# Create production database
wrangler d1 create photos-db

# Copy the database_id from output and update wrangler.toml
# Update both [[d1_databases]] and [[env.production.d1_databases]] with the same database_id

# Run ALL migrations on the production database in filename order
for file in ./migrations/*.sql; do wrangler d1 execute photos-db --remote --file="$file"; done

# Verify migrations were successful:
wrangler d1 execute photos-db --remote --command "SELECT name FROM sqlite_master WHERE type='table';"
# Should show: events, photos, tags, event_tags, event_collaborators, collaboration_history,
# invite_links, and other supporting tables
```

### 2. 创建R2桶

```bash
wrangler r2 bucket create photos-storage
```

### 3.设定生产秘密

```bash
# Set cookie secret
wrangler secret put EVENT_COOKIE_SECRET
# Enter a strong random string (use: openssl rand -base64 32)

# Admin access is handled by Cloudflare Access (see below)
```

### 4. 部署Worker

```bash
cd apps/worker
npm install
cd ../..
npx wrangler deploy --env production
```

### 5. 将前端部署到 Cloudflare 页面

**创建页面项目：**

1. 转到 Cloudflare 仪表板 → **Workers & Pages**
2. 单击 **创建** → 选择 **页面** 选项卡
3. 连接到您的 Git 存储库
4. 配置构建设置：
   - **项目名称**：`photos`（或您的选择）
   - **生产分支**：`main`（或您的默认分支）
   - **根目录**：`apps/web`
   - **构建命令**：`npm install && npm run build`
   - **构建输出目录**：`dist`
   - **部署命令**：`echo "Deploy complete"`
5. 保存并部署

**重要**：`apps/web/public/_routes.json`文件配置路由：

```json
{
  "version": 1,
  "include": ["/*"],
  "exclude": ["/api/*", "/media/*"]
}
```

这告诉 Pages 为除 `/api/*` 和 `/media/*` 之外的所有路由提供服务，这些路由由 Worker 处理。

### 6. 配置域和路由

1. **将路由添加到 wrangler.toml** （应该已经配置）：

   ```toml
   [env.production]
   name = "photos-worker"
   routes = [
     { pattern = "photos.yourdomain.com/api/*", zone_name = "yourdomain.com" },
     { pattern = "photos.yourdomain.com/media/*", zone_name = "yourdomain.com" }
   ]
   ```

2. **将自定义域添加到页面**：
   - 在 Pages 项目中 → **自定义域**
   - 单击**设置自定义域**
   - 输入`photos.yourdomain.com`
   - 等待DNS传播

3. **它是如何工作的**：
   - Pages 在 `photos.yourdomain.com` 上提供 React 应用程序
   - Worker通过路由处理`photos.yourdomain.com/api/*`和`photos.yourdomain.com/media/*`
   - `_routes.json` 防止 Pages 干扰 Worker 路由

### 7. 设置 Cloudflare 访问（管理员保护）

**配置 Cloudflare 访问**：

1. 转到 **Cloudflare 仪表板** → **零信任** → **访问** → **应用程序**
2. 单击 **添加应用程序** → 选择 **自托管**
3. 配置应用程序：
   - **应用程序名称**：照片管理
   - **会话持续时间**：24 小时（或您的偏好）
   - **应用领域**：
     - Subdomain: `photos`
     - Domain: `yourdomain.com`
     - Path: `/admin*` (protects all admin routes)
4. 单击**下一步**
5. 添加政策：
   - **策略名称**：管理员访问权限
   - **操作**：允许
   - **配置规则**：
     - Include: Emails ending in `@yourdomain.com`
     - Or: Include specific email addresses
6. 单击 **下一步** → **添加应用程序**

**它是如何工作的**：

- 访问 `/admin*` 的用户必须通过 Cloudflare Access 进行身份验证
- Cloudflare 为经过身份验证的用户添加 `Cf-Access-Jwt-Assertion` 标头
- Worker 验证此标头并设置 `X-Admin-Access: 1`
- 管理API端点需要此标头

**在生产中访问管理员**：

1. 访问<https://photos.yourdomain.com/admin>
2. Cloudflare Access 将提示进行身份验证
3. 使用您的授权电子邮件登录
4. 您将被重定向到管理后台
5. 会话持续 24 小时（或配置的持续时间）

## 数据库架构

数据库结构由 [migrations/](migrations/) 中按顺序排列的 SQL 文件增量定义。除最初的
`events`、`photos`、`tags` 和 `event_tags` 外，关键表还包括：

- `event_collaborators` - 每个活动的协作者记录以及角色/能力
- `collaboration_history` - 邀请/角色/删除操作的审核日志
- `invite_links` - 可共享、可过期的自助邀请链接
- `users`（电子邮件作为主键）-个人资料数据，源自`ADMIN_EMAILS`的管理状态
- `favorites` - 每个用户最喜欢的照片

值得注意的 `events` 列：`visibility` (`public` | `private` | `collaborators_only`)、`description`、
`is_archived`。值得注意的 `photos` 列：`latitude`/`longitude`、`favorites_count`、
`blur_placeholder`、`is_featured`、`media_type`、`uploaded_by`、`source_photo_id`、
`is_notified`、`preview_complete`、`upload_complete`、`file_hash`、`cache_version`。

有关完整的当前架构，请参阅 [docs/architecture.md](docs/architecture.zh.md) 或检查
直接`migrations/*.sql` - 这个README故意不重复详尽的列列表
以避免在添加迁移时出现不同步。

## R2存储布局

```text
photos-storage/
├── original/
│   └── {eventSlug}/
│       └── {photoId}.{jpg|mp4|cr2|nef|...}   (original file, extension follows source file type)
├── preview/
│   └── {eventSlug}/
│       ├── {photoId}.jpg                     (客户端生成的图片预览，最长边 1920px，质量 85%)
│       └── {photoId}.mp4                     (定时任务生成的 1080p H.264 视频衍生文件)
└── poster/
    └── {eventSlug}/
        └── {photoId}.jpg                     (视频封面帧)
```

> **注意**：预览和原始文件都**没有水印**，也不会在服务端调整图片尺寸。
> 图片预览在上传时由客户端生成，维护脚本可以生成视频预览和视频封面。
> 旧版 `ig/{eventSlug}/{photoId}.jpg`
> 键空间仍然存在，仅用于清理目的（删除照片也会尝试删除任何
> 来自旧上传的剩余 `ig/` 对象）；没有代码路径写入新的 `ig/` 文件。看
> [docs/image-processing.md](docs/image-processing.zh.md) 了解详细信息。

## API 端点

请参阅 [docs/api-reference.md](docs/api-reference.zh.md) 了解完整的、逐个端点的 REST API
参考（公共、媒体、管理员、协作者、收藏、移动身份验证和SEO路线）。

## 环境变量和秘密

### Worker的秘密（来自`wrangler secret put`）

- `EVENT_COOKIE_SECRET`：签署会话cookie的秘密（必需）
- `ADMIN_SHARED_SECRET`：开发中的管理员可选共享密钥API
- `JWT_SECRET`：签署/验证移动 OAuth Bearer token（移动应用程序身份验证所需）
- `MAILGUN_API_KEY` / `MAILGUN_DOMAIN`：可选，启用协作者邀请电子邮件
- `GA_MEASUREMENT_ID`：可选，启用 Google Analytics 4 跟踪

### 工作环境变量

- `ENVIRONMENT`：设置为“开发”或“生产”
- `ADMIN_EMAILS`：以逗号分隔的管理员电子邮件地址列表

完整的环境变量参考请参见 [docs/configuration.md](docs/configuration.zh.md)。

## 安全特性

- **密码保护**：SHA-256 使用随机盐进行哈希处理
- **会话 Cookie**：HttpOnly、安全、SameSite=Lax、仅限会话（无过期时间）
- **管理员保护**：Cloudflare 访问 + 标头验证
- **移动身份验证**：Cloudflare 访问验证后颁发的 JWT Bearer token（请参阅 [docs/mobile-oauth.md](docs/mobile-oauth.zh.md)）
- **CORS**：配置为同源请求
- **输入验证**：所有API端点验证输入

## 已知的限制和未来的增强

1. **无服务器端水印**：预览在客户端生成（仅调整大小JPEG）；尽管一些较旧的代码注释/路由名称暗示了水印覆盖，但当前代码库中的任何地方都没有应用水印覆盖。
2. **无自适应视频流**：系统保留原视频，定时维护任务可以生成单一的 1080p H.264 衍生文件，但没有 Cloudflare Stream 这类多码率流媒体管道。
3. **缩略图优化**：可以为图库网格添加较小的缩略图，而不是重复使用 1920 像素预览。
4. **iOS**：目前仅打包/发布Android原生应用；该网络应用程序本身可以在 iOS Safari 中运行。

## 故障排除

### 数据库问题

**Worker未连接到 D1**：

- 确保 wrangler.toml 中的 `database_id` 与您的 D1 数据库匹配
- 检查 `migrations/` 中的每个 SQL 文件是否都已按文件名顺序执行
- 验证 `wrangler dev` 输出中的绑定
- 运行：`wrangler d1 execute photos-db-local --local --command "SELECT name FROM sqlite_master WHERE type='table';"`
  - 应显示：活动、照片、标签、event_tags、event_collaborators、invite_links 等

**缺少列错误**：

- 您可能没有运行所有迁移
- 按顺序运行每个迁移文件（请参阅设置说明）
- 常见缺失列：`is_featured`、`description`、`latitude`、`favorites_count`

### 上传问题

**上传失败**：

- 检查浏览器控制台是否存在 CORS 错误
- 验证 R2 存储桶是否存在且绑定正确
- 检查文件是否有效 JPEG 图像
- 确保 R2 绑定支持分段上传
- 检查网络选项卡是否有 413 错误（文件太大）

**上传队列不持久**：

- 在浏览器 DevTools → Application 选项卡中检查 IndexedDB
- 应该看到`PhotoUploadQueue`数据库
- 清除 IndexedDB，如果损坏则重试

### 管理员访问问题

**开发中拒绝管理员访问**：

- 检查项目根目录中是否存在`.dev.vars`文件
- 验证`ADMIN_SHARED_SECRET`已设置
- 检查浏览器网络选项卡中的 `X-Admin-Secret` 标头
- 尝试清除浏览器缓存和cookie

**生产中拒绝管理员访问**：

- 验证已为 `/admin*` 路径配置 Cloudflare Access
- 检查您是否使用授权电子邮件登录
- 在“网络”选项卡中查找 `Cf-Access-Jwt-Assertion` 标头
- 确保`X-Admin-Access: 1`标头发送到API
- 检查Worker日志：`wrangler tail --env production`

### 照片显示问题

**照片未显示在图库中**：

- 验证活动密码是否正确（如果是私人活动）
- 检查浏览器 cookie 是否已启用
- 在浏览器控制台中查找身份验证错误
- 确保照片存在于 R2 存储中
- 检查“网络”选项卡是否有图像请求上的 403/404 错误

**特色照片未显示在着陆页上**：

- 验证照片是否被标记为特色（⭐ 照片管理器中的徽章）
- 检查精选照片是否在PUBLIC活动中（无密码）
- 运行：`wrangler d1 execute photos-db --remote --command "SELECT COUNT(*) FROM photos WHERE is_featured = 1;"`
- 如果不存在精选照片，则着陆页会回退到最近的照片

**标签未显示**：

- 检查迁移 004 是否已运行（创建标签表）
- 验证标签是否存在：`wrangler d1 execute photos-db --remote --command "SELECT * FROM tags;"`
- 通过管理标签管理器创建默认标签

### 性能问题

**照片加载缓慢**：

- 检查R2存储桶是否与worker位于同一区域
- 验证正在生成缩略图（不提供原始缩略图）
- 检查浏览器的“网络”选项卡是否有缓慢的请求
- 考虑为 `/media/*` 路由启用 Cloudflare 缓存

**管理后台速度慢**：

- 大量照片会减慢统计查询速度
- 检查工作日志中的 D1 查询性能
- 考虑添加数据库索引（已包含在迁移中）

### 常见错误

**“未找到活动”**：

- 数据库为空 - 在管理后台中创建一个活动
- 或者检查活动是否公开（对于活动列表页面）

**“加载照片失败”**：

- 活动可能不存在
- 活动可能受密码保护（需要先登录）
- 检查工作日志中是否有数据库错误

**“上传失败”或“网络错误”**：

- Worker 可能没有运行
- R2 绑定可能配置错误
- 检查工作响应中的 CORS 标头

## 开发技巧

**调试**：

- 使用`wrangler tail`实时查看Worker日志
- 添加`--env production`到尾部生产Worker：`wrangler tail --env production`
- 检查浏览器 IndexedDB（应用程序 → 存储）以查看上传队列状态
- 使用浏览器“网络”选项卡调试 API 调用并检查标头
- 用于组件调试的 React DevTools 扩展

**测试**：

- 使用各种JPEG文件进行测试，以确保EXIF提取有效
- 使用有/没有GPS数据的照片进行测试
- 使用不同的相机品牌/型号进行测试
- 测试受密码保护的活动
- 使用多个活动和照片测试管理功能

**数据库管理**：

- 查询本地数据库：`wrangler d1 execute photos-db-local --local --command "SELECT * FROM events;"`
- 查询生产数据库：`wrangler d1 execute photos-db --remote --command "SELECT * FROM events;"`
- 导出数据库：`wrangler d1 export photos-db --remote --output=backup.sql`
- 检查表架构：`wrangler d1 execute photos-db --remote --command "PRAGMA table_info(photos);"`

**表现**：

- 使用`wrangler dev --remote`针对生产D1/R2进行测试（比本地更快）
- 监控工作日志中的 D1 查询性能
- 在 Cloudflare 仪表板中检查 R2 带宽使用情况

**工作流程提示**：

- 使用不同的配置创建测试活动（公共、私有、标记）
- 保留一组带有各种EXIF数据的测试照片
- 使用浏览器配置文件测试公共视图与管理视图
- 使用浏览器 DevTools 设备模拟测试移动响应能力

## 执照

该项目根据MIT许可证获得许可。有关详细信息，请参阅 [LICENSE](LICENSE) 文件。

## 致谢

内置：

- [React](https://react.dev/) - UI 框架
- [Vite](https://vitejs.dev/) - 构建工具
- [Tailwind CSS](https://tailwindcss.com/) - 样式
- [Hono](https://hono.dev/) - 后端框架
- [Cloudflare Workers](https://workers.cloudflare.com/) - 无服务器平台

## 支持

对于问题、疑问或贡献，请参阅 [contributing.md](docs/contributing.zh.md)。
