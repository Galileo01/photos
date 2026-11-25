# 图像处理注意事项

[English](image-processing.md) | **简体中文**


## 当前实施情况

**截至撰写本文时，这是当前已交付的架构** - 不是临时的发布前间隙。
预览生成完全发生在客户端； **没有服务器端水印、调整大小、
或 Instagram 风格的衍生品** 代码库中的任何位置（已确认：`generateWatermarkText()`
`apps/worker/src/imageProcessing.ts` 存在，但未从任何路由调用）。

### 今天实际发生了什么

1. **原始**：上传的文件（照片、视频或RAW）按原样存储在R2的`original/{eventSlug}/{photoId}.{ext}`下，没有服务器端修改。
2. **图片预览**：浏览器（`apps/web/src/imageUtils.ts#createPreview`，或 `rawImageUtils.ts` 中的 RAW 解码路径）在客户端将图片最长边缩放到 1920 像素以内，以 85% JPEG 质量生成预览，并将其作为第二个文件上传到 `preview/{eventSlug}/{photoId}.jpg`。
3. **视频衍生文件**：新上传的视频最初使用原始 `.mp4` 播放，并上传一张 `poster/{eventSlug}/{photoId}.jpg` 封面。定时执行的 `scripts/transcode-videos.sh` 可以随后在 `preview/{eventSlug}/{photoId}.mp4` 生成 1080p H.264 衍生文件。媒体请求优先读取该衍生文件，在它尚不存在时回退到原视频。
4. **无水印**：原始文件和所有衍生文件都不会添加水印。
5. **不会为新上传生成 Instagram-square (`ig/`) 衍生文件**。`ig/` R2 key 前缀及其 `media.ts` 路由仅用于让旧链接和缓存对象继续工作，并在删除照片时清理旧对象。当前没有代码路径向其中写入新文件。

### 历史背景（已取代）

本文档的早期草案建议添加服务器端水印和 Instagram 衍生品
生成（通过 Cloudflare Images、专用图像处理 Worker + 队列或外部
服务）在“v1 启动”之前。这项工作从未建成，并且上面的仅客户端方法
取而代之的是，此后一直保留该架构。以下选项仅供参考
如果将来重新审视水印/服务器端衍生产品，但不应理解为
迫在眉睫的路线图项目。

### 实施选项（如果重新审视）

#### 选项 1：Cloudflare 图像（推荐）

使用具有转换和水印功能的 Cloudflare Images 服务。

**优点：**

- 原生 Cloudflare 集成
- 内置转换和水印
- CDN集成
- 无需自定义代码

**缺点：**

- 每张图像的额外费用
- 需要订阅 Cloudflare Images

#### 选项 2：图像处理工作者

使用带有图像处理库的 Cloudflare Worker（例如，`@cloudflare/image-resizing` 或 `sharp` 编译为 WASM）。

**优点：**

- 完全控制加工
- 无额外服务费用
- 可以在上传时处理

**缺点：**

- Worker有规模和CPU限制
- 更复杂的实现
- 可能需要使用持久对象进行异步处理

#### 选项3：外部加工服务

上传后触发外部服务（例如AWS Lambda、Google Cloud Functions）。

**优点：**

- 无限的处理能力
- 可以使用任何图像库
- 单独关注

**缺点：**

- 额外的基础设施
- 网络延迟
- 更复杂的架构

### 如果重访

这里的任何未来工作都可能遵循**选项 2**，并配备专门的Worker进行图像处理：

1. 创建一个单独的Worker（例如`apps/image-processor`）
2. 上传完成后，排队作业来处理图像
3. 使用 Cloudflare 队列来处理异步处理
4. 生成带水印/Instagram 衍生品
5. 将结果存储在 R2 中

### 当前行为（不是解决方法 - 这是交付的设计）

- 原件按上传方式存储在 R2 中
- 客户端生成的 1920px JPEG 预览与原始预览一起存储在 R2 中
- `GET /media/:slug/ig/:photoId` 仍然存在以实现向后兼容，但没有路由或上传
路径曾经写入一个新的`ig/`对象
- 任何地方都没有应用水印

## 相关文件（如果将来实现服务器端处理）

1. **Worker**：`apps/worker/src/imageProcessing.ts`已有`generateWatermarkText()` /
`formatWatermarkTime()` 不会从任何地方调用的帮助程序 - 真正的实现将
需要从上传完成挂钩实际调用它们（例如，在
`apps/worker/src/routes/admin/uploads.ts`)
2. **新Worker**：用于实际工作的单独 `apps/image-processor` Worker（或 Cloudflare 映像）
图像处理
3. **数据库**：`photos` 已具有 `preview_complete`/`upload_complete` 标志（请参阅
[migrations/020_photo_preview_complete.sql](../migrations/020_photo_preview_complete.sql)) 那
服务器端管道可以重用或扩展以跟踪其他衍生品生成状态
4. **前端**：`apps/web/src/pages/AdminEventUpload.tsx`已经显示上传进度并且可以
扩展以显示服务器端处理状态
