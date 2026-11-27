# API 文档

[English](api-reference.md) | **简体中文**


完成照片共享应用程序的 REST API 参考（Cloudflare Worker、`apps/worker`）。

## 基础URL

```text
Production: https://<your-domain>
Development: http://localhost:8787
```

几乎所有API路线都安装在`/api/*`下。 `/media/*`、`/sitemap.xml` 和 `/robots.txt` 是
唯一的例外（它们故意位于 `/api` 之外，因为它们不是 JSON 端点）。

## 验证

存在三种独立的身份验证机制，具体使用取决于路由：

1. **Cloudflare Access**（Web 管理路线）：Cloudflare Access 位于 `/admin*` 前面并存在问题
一旦用户通过您配置的身份进行身份验证，就会出现 `Cf-Access-Jwt-Assertion` 标头
提供者。Worker从 Access 提供的标头中读取经过身份验证的用户的电子邮件。
2. **JWT Bearer token**（移动应用程序）：通过以下方式完成 Cloudflare 访问流程后
`/api/mobile-login`，移动应用程序收到签名的JWT（请参阅
[mobile-oauth.md](mobile-oauth.zh.md)) 并将其作为 `Authorization: Bearer <token>` 发送
后续请求。
3. **每个活动会话 cookie**（公共密码保护活动）：`POST /api/events/:slug/login`
验证活动密码并设置`HttpOnly`会话cookie（并返回一个便携式
`eventSessionToken` 适用于不能依赖 cookie 的本机客户端）。

管理员状态源自 `ADMIN_EMAILS` 环境变量（逗号分隔的电子邮件列表），
不是数据库标志。

## API 端点

### 授权

|方法|路径|授权 |描述 |
| --- | --- | --- | --- |
| GET | `/api/auth/login` | Cloudflare 访问 |触发访问认证，然后重定向到`return_to`（默认为`/favorites`） |
| GET | `/api/auth/logout` | - |重定向到 `/cdn-cgi/access/logout` 以清除访问会话 |
| POST | `/api/events/:slug/login` | - |验证活动的密码；设置会话 cookie 并返回 `{ success, eventSessionToken }` |
| POST | `/api/admin/logout` |管理员 |清除管理会话 |

### 活动和照片（公开）

|方法|路径|授权 |描述 |
| --- | --- | --- | --- |
| GET | `/api/events` |可选 |列出对调用者可见的活动（对所有人公开活动；按管理员状态和 `event_collaborators` 过滤的私人/仅限协作者的活动；受密码保护的公共活动需要活动会话）|
| GET | `/api/events/:slug` |可选 |活动详情 |
| GET | `/api/events/:slug/photos` |可选 |列出活动照片 |
| GET | `/api/events/:slug/photos/:photoId` |可选 |单张照片详情|
| GET | `/api/map/photos` |可选 |所有带有 GPS 坐标的照片，用于地图视图 |
| GET | `/api/tags` | - |列出所有标签 |
| GET | `/api/timeline` |可选 |按时间顺序、分页显示所有可访问活动的照片/视频 |
| GET | `/api/events/by-tag/:tagSlug` | - |列出与标签关联的活动 |
| GET | `/api/photos/featured` | - |首页的精选照片|
| GET | `/api/photos/most-favorited` | - |最喜欢的照片 |
| POST | `/api/photos/:photoId/favorite` | - |首页上使用的面向公众的收藏切换（与下面经过验证的收藏API分开）|

**示例 - `GET /api/events`（形状，并非详尽无遗）：**

```json
{
  "events": [
    {
      "id": 1,
      "slug": "summer-festival-2024",
      "name": "Summer Festival 2024",
      "inferred_date": "2024-07-15",
      "created_at": "2024-01-01T00:00:00Z",
      "visibility": "public",
      "requires_password": false,
      "latest_upload": "2024-07-16T09:12:00Z"
    }
  ]
}
```

### 媒体（密码/访问门控）

由 `apps/worker/src/routes/media.ts` 提供服务，由 R2 直接支持。支持HTTP`Range`
视频清理的请求（单个范围）。

|方法|路径|描述 |
| --- | --- | --- |
| GET | `/media/:slug/preview/:photoId` |预览媒体（图片使用客户端生成的最长边 1920px JPEG；视频优先使用定时任务生成的 1080p H.264 衍生文件，缺失时回退到原视频）|
| GET | `/media/:slug/original/:photoId` |全分辨率原始文件|
| GET | `/media/:slug/poster/:photoId` |视频的 JPEG 封面帧|
| GET | `/media/:slug/ig/:photoId` |为兼容旧链接保留的旧路径；当前不会写入新文件（参见 [image-processing.md](image-processing.zh.md)）|

---

### 管理员 - 活动、照片、分析和标签

所有管理端点都需要 Cloudflare Access 身份验证（或有效的移动 JWT Bearer token）
并安装在`/api/admin`下。

|方法|路径|描述 |
| --- | --- | --- |
| POST | `/api/admin/events` |创建新活动 |
| PUT | `/api/admin/events/:slug` |更新活动（名称、描述、密码、可见性...）
| DELETE | `/api/admin/events/:slug` |删除活动并级联删除其照片 |
| PUT | `/api/admin/events/:slug/location` |设置/更新活动GPS位置 |
| POST | `/api/admin/events/:slug/tags` |设置分配给活动的标签 |
| POST | `/api/admin/events/:slug/regenerate-thumbnails` |重新运行活动照片的缩略图/预览生成 |
| POST | `/api/admin/events/:slug/geocode-photos` |对活动中所有带有 GPS 标签的照片进行反向地理编码 |
| GET | `/api/admin/events/:slug/stats` |针对特定活动的分析 |
| GET | `/api/admin/stats` |仪表板范围内的统计数据 |
| POST | `/api/admin/events/:slug/uploads/start` |开始照片或视频的分段上传 |
| PUT | `/api/admin/events/:slug/uploads/:photoId/parts/:partNumber` |上传一个多部分 |
| POST | `/api/admin/events/:slug/uploads/:photoId/complete` |完成分段上传 |
| POST | `/api/admin/events/:slug/uploads/:photoId/cancel` |中止正在进行的分段上传 |
| PUT | `/api/admin/photos/:photoId/featured` |切换照片的精选状态 |
| PUT | `/api/admin/photos/:photoId/replace` |替换照片的原始/预览文件（由应用内编辑器使用）|
| DELETE | `/api/admin/photos/:photoId` |删除单张照片 |
| POST | `/api/admin/photos/bulk-delete` |一次删除多张照片 |
| POST | `/api/admin/photos/bulk-copy` |将照片复制到另一个活动 |
| PATCH | `/api/admin/photos/bulk-location` |批量更新多张照片的GPS位置|
| POST | `/api/admin/tags` |创建标签 |
| PUT | `/api/admin/tags/:id` |更新标签 |
| DELETE | `/api/admin/tags/:id` |删除标签 |

**示例 - `PUT /api/admin/photos/:photoId/replace`:** 接受旧版
`multipart/form-data`正文（字段`original`/`preview`），或者，在多部分的本机平台上
WebView 中的上传不可靠，原始的 `application/octet-stream` 正文带有 `?target=preview`
或`?target=original`查询参数。

---

### 协作者和邀请链接

**注意：** 电子邮件邀请需要 `enableCollaborators` 功能标志（已配置 Mailgun）；
可共享的邀请链接无需 Mailgun 即可使用。

|方法|路径|授权 |描述 |
| --- | --- | --- | --- |
| GET | `/api/events/:slug/collaborators` |管理员/协作者|列出活动的协作者 |
| POST | `/api/events/:slug/collaborators` | `invite_create` 能力 |通过电子邮件邀请协作者（发送邀请电子邮件）|
| DELETE | `/api/events/:slug/collaborators/:userEmail` | `collaborator_remove` 能力 |删除协作者 |
| PUT | `/api/events/:slug/collaborators/:userEmail/role` | `role_change` 能力 |更改协作者的角色 |
| GET | `/api/events/:slug/collaboration-history` |管理员 |活动的协作者/邀请操作的审核日志 |
| GET | `/api/user/collaborations` |已认证 |当前用户协作的活动 |
| GET | `/api/users/search` |管理员 |搜索用户（例如邀请作为协作者）|
| POST | `/api/events/:slug/invite-links` | `invite_create` 能力 |创建可共享、可过期的邀请链接 |
| GET | `/api/events/:slug/invite-links` | `invite_create` 能力 |列出活动的有效邀请链接 |
| DELETE | `/api/events/:slug/invite-links/:token` | `invite_revoke` 能力 |撤销邀请链接 |
| POST | `/api/invite/:token/accept` |已认证 |接受邀请链接，以协作者身份加入活动 |

协作者权限基于能力（例如`invite_create`、`collaborator_remove`、
`role_change`、`invite_revoke`）而不是单一的平面“协作者”角色 - 请参阅
架构中为 `event_collaborators`/`collaboration_history`，角色为 `docs/features.md`
模型。

---

### 收藏和用户个人资料

**注意：** 需要 `enableFavorites` 功能标志（默认情况下始终启用）。

|方法|路径|授权 |描述 |
| --- | --- | --- | --- |
| GET | `/api/favorites` |必填 |列出当前用户收藏的照片 |
| GET | `/api/favorites/ids` |必填 |仅列出收藏的照片的 ID（UI 状态更便宜）|
| POST | `/api/favorites/:photoId` |必填 |收藏一张照片 |
| DELETE | `/api/favorites/:photoId` |必填 |取消收藏照片 |
| GET | `/api/user/profile` |可选|获取当前用户的个人资料 |
| PUT | `/api/user/profile` |必填 |更新当前用户的个人资料 |

---

### 批量下载

|方法|路径|授权 |描述 |
| ------ | ----------------------- | ----------------------- | ------------------------------------------------------ |
| POST | `/api/events/:slug/zip` |必需（活动访问）|请求下载所选照片的​​ZIP（最多 50 张）|

---

### 移动OAuth

请参阅 [mobile-oauth.md](mobile-oauth.zh.md) 了解完整流程和 Cloudflare Access 配置。

|方法|路径|授权 |描述 |
| --- | --- | --- | --- |
| GET | `/api/mobile-login` | Cloudflare 访问 |移动应用程序打开登录链接后浏览器中显示的首页；立即重定向至 `/api/mobile-auth` |
| GET | `/api/mobile-auth` | Cloudflare 访问 |读取经过 Access 身份验证的用户，发出签名的 JWT，并使用令牌重定向到 `photos://auth/callback` 深层链接 |

---

### SEO

|方法|路径|描述 |
| --- | --- | --- |
| GET | `/sitemap.xml` | XML 公共活动站点地图 |
| GET | `/robots.txt` |机器人文件|

---

## 错误响应

所有端点可能返回以下错误代码：

### 400 错误请求

```json
{
  "error": "Validation error message"
}
```

### 401 未经授权

```json
{
  "error": "Unauthorized"
}
```

### 403 禁忌

```json
{
  "error": "Insufficient permissions"
}
```

### 404 未找到

```json
{
  "error": "Resource not found"
}
```

### 500 内部服务器错误

```json
{
  "error": "Internal server error"
}
```

### 503 服务不可用

```json
{
  "error": "Feature not available. This feature requires additional configuration.",
  "feature": "enableCollaborators",
  "reason": "Mailgun not configured"
}
```

## 速率限制

目前没有实施速率限制。考虑添加：

- Cloudflare 速率限制规则
- 针对每个用户限制的自定义中间件
- 用于分布式速率限制的持久对象

## CORS

CORS 配置为允许来自以下来源的请求：

- 在生产中配置`APP_DOMAIN`
- `localhost:*` 开发中

允许的方法：`GET`、`POST`、`PUT`、`DELETE`、`OPTIONS`

## 网络钩子

目前没有实施任何网络钩子。潜在用例：

- 电子邮件确认回调
- 付款处理（如果添加了货币化）
- 第三方集成

## TypeScript 类型

对于 TypeScript 客户端，请参阅 `apps/worker/src/types.ts` 和 `apps/web/src/types.ts` 了解
权威的当前类型定义 - 下面的形状仅供说明，可能会出现偏差
随着时间的推移与代码同步。

```typescript
interface Event {
  id: number;
  slug: string;
  name: string;
  visibility: 'public' | 'private' | 'collaborators_only';
  description: string | null;
  is_archived: boolean;
  inferred_date: string | null;
  created_at: string;
}

interface Photo {
  id: string; // ULID
  event_id: number;
  original_filename: string;
  media_type: 'photo' | 'video';
  capture_time: string | null;
  uploaded_at: string;
  width: number | null;
  height: number | null;
  is_featured: boolean;
  favorites_count: number;
  // ... EXIF/GPS fields, see apps/worker/src/types.ts
}

interface User {
  email: string;
  name: string | null;
  avatar: string | null;
  isAdmin: boolean;
}
```

## API 客户端示例

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://your-domain',
  headers: {
    Authorization: `Bearer ${getToken()}`, // mobile app only; web relies on Cloudflare Access + cookies
  },
});

// List events
const { data: events } = await api.get('/api/events');

// Upload a photo (multipart upload flow)
const { data } = await api.post(`/api/admin/events/${slug}/uploads/start`, {
  filename: 'IMG_1234.jpg',
  contentType: 'image/jpeg',
  fileSize: 5242880,
});

// Upload parts directly to R2 via the presigned URLs
for (const part of data.parts) {
  await axios.put(part.url, filePart);
}

// Complete the upload
await api.post(`/api/admin/events/${slug}/uploads/${data.photoId}/complete`, {
  uploadId: data.uploadId,
  parts: completedParts,
});
```

## 参考

- [荣誉文档](https://hono.dev/)
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [API设计最佳实践](https://restfulapi.net/)
