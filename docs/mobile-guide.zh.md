# 移动应用程序（安卓）

[English](mobile-guide.md) | **简体中文**


此文件夹包含用于照片应用程序的电容器供电的移动应用程序。它包裹着
现有的 React Web 应用程序并添加了后台同步和文件夹访问等本机功能。

> **平台状态**：当前仅`apps/android/`签入此存储库并发布
> （请参阅 [android-deployment.md](android-deployment.zh.md) 和 CHANGELOG 了解 Android 构建历史记录）。
> 没有`apps/ios/`项目。该网络应用程序本身在 iOS Safari 中运行良好，并且 Capacitor 是
> 跨平台，因此下面的 iOS 说明可供任何想要运行的人参考
> `npx cap add ios` 并自行打包 iOS 构建 - 但 iOS 并未构建、测试或
> 今天由该项目分发。

## 特征

### 移动设备特定功能

- **后台上传同步**：即使应用程序关闭，照片也会继续上传
- **文件夹同步**：自动将整个文件夹（如相机胶卷）同步到活动
- **本地通知**：上传完成时收到通知
- **离线队列**：当连接可用时，照片将排队并上传
- **网络检测**：根据连接情况自动暂停/恢复上传

### 共享功能（网络+移动）

所有现有的网络功能都可以在移动设备上使用，包括：

- 活动图库
- 通过拖放上传照片
- EXIF元数据提取
- 收藏
- 地图视图
- 管理后台

## 先决条件

### 适用于 Android 开发（现已支持）

- Android Studio已安装
- Android SDK 和模拟器设置
- 物理 Android 设备（可选）

### 对于 iOS 开发（当前未打包 - 请参阅上面的平台状态说明）

- 安装了 Xcode 14+ 的 macOS
- iOS 模拟器或物理 iOS 设备
- Apple 开发者帐户（用于设备测试和 App Store）
- 需要首先从 `apps/web` 运行 `npx cap add ios` 来生成缺失的 iOS 项目

## 开发设置

### 1.安装依赖项

```bash
cd apps/web
npm install
```

### 2. 构建网络应用程序

```bash
npm run build
```

### 3. 同步到本机平台

```bash
npx cap sync
```

这会将 Web 构建复制到 iOS 和 Android 文件夹并更新本机依赖项。

> 从 `apps/web`（而不是从 `--prefix` 的存储库根目录）运行 Capacitor 命令，以便平台解析正常工作。

## 运行应用程序

### iOS系统

```bash
# Open in Xcode
npx cap open ios

# Then click Run button in Xcode (⌘R)
```

**在设备上测试：**

1. 通过USB连接iPhone
2. 在 Xcode 中选择您的设备
3. 信任设备上的开发者证书
4. 单击运行

### 安卓

```bash
# Open in Android Studio
npx cap open android

# Then click Run button in Android Studio (Shift+F10)
```

**在设备上测试：**

1. 在 Android 设备上启用开发者模式
2. 启用USB调试
3. 通过USB连接设备
4. 在 Android Studio 中选择设备
5. 单击运行

## 生产建筑

### iOS（应用商店）

```bash
# 1. Open in Xcode
npx cap open ios

# 2. In Xcode:
#    - Product > Archive
#    - Upload to App Store Connect
#    - Submit for review
```

**所需设置：**

- 捆绑 ID：`com.yourcompany.photos`（在 Xcode 中配置）
- 应用程序名称：“照片”（或您的应用程序名称）
- 版本和内部版本号
- 应用程序图标（商店为 1024x1024）
- 所有设备尺寸的屏幕截图
- 隐私政策URL
- 应用商店描述

**Info.plist 中所需的权限：**

```xml
<key>NSPhotoLibraryUsageDescription</key>
<string>Access photos to upload to your events</string>
<key>NSCameraUsageDescription</key>
<string>Take photos to upload to events</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>Add location data to your photos</string>
```

### 安卓（Play 商店）

```bash
# 1. Open in Android Studio
npx cap open android

# 2. In Android Studio:
#    - Build > Generate Signed Bundle/APK
#    - Follow signing wizard
#    - Upload AAB to Play Console
```

**所需设置：**

- 应用程序ID：`com.yourcompany.photos`（在build.gradle中配置）
- `build.gradle`中的版本代码和名称
- 签名密钥（使用 keytool 创建）
- 应用程序图标（各种尺寸）
- 专题图和屏幕截图
- 隐私政策URL
- Play 商店列表

**AndroidManifest.xml 中所需的权限：**

```xml
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
<uses-permission android:name="android.permission.CAMERA"/>
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>
<uses-permission android:name="android.permission.INTERNET"/>
```

## 后台同步如何工作

### iOS 后台同步行为

- 使用`BackgroundTasks`框架
- 每 15 分钟定期同步一次（当应用程序在后台时）
- 操作系统根据使用模式决定何时运行
- 每个任务最多可同步约 30 秒

### Android 后台同步行为

- 使用 `WorkManager` 进行后台任务
- 比 iOS 更可靠
- 可以运行更长的后台任务
- 电池优化感知

### 执行

同步逻辑参见`src/services/backgroundSync.ts`：

1. 检查网络连接
2. 从 IndexedDB 队列中检索挂起的上传
3. 分块上传照片
4. 显示完成通知
5. 处理错误和重试

## 文件夹同步

文件夹同步允许用户将文件夹（例如相机胶卷）指向某个活动；其中的新照片是
自动上传。在 Android 上，它作为 **本机后台引擎** 运行，而不是在 WebView 中。

### 如何使用

1. 在移动应用程序中打开活动上传页面
2. 点击文件夹同步部分中的“选择文件夹”
3. 授予存储权限
4. 选择要同步的文件夹
5. 新照片会自动上传，包括在应用程序关闭时

### 建筑学

发动机位于`apps/android/app/src/main/java/nl/thijsvtol/photos/sync/`并在
工作经理的工作。 Web层仅存储配置并将其传递出去。

|件|角色 |
| --- | --- |
| `SyncScheduler` |定期 `PeriodicWorkRequest`（默认每小时）+ 一次性“立即同步”运行，全部都在一个唯一的工作名称下 |
| `FolderSyncWorker` |运行本身：扫描→哈希→重复数据删除→上传|
| `SafScanner` |递归 `DocumentsContract` 遍历SAF树URI（也支持`SafDirectoryPlugin.listFiles`）|
| `MediaProbe` |流式传输 SHA-256、二次采样预览 JPEG、EXIF — 永远不会保存整个文件 |
| `PhotosApiClient` | Web 应用程序使用相同 `/uploads/*` 端点的 OkHttp 客户端；零件主体从 `content://` URI | 流出
| `SyncLedger` | SQLite 记录所见的每个文件 — 重复数据删除历史记录和持久上传队列 |
| `SyncNotifier` |进度 + 摘要通知，带有“暂停同步”操作 |
| `FolderSyncPlugin` |电容桥：`configure`、`syncNow`、`getStatus`、`retryFailed`、`resetLedger`、面对面切换 |

为什么是原生的：之前的 JS 实现使用了`BackgroundTask.beforeExit`，这是一种一次性授权
从未重新注册，因此每次启动它最多运行一次，并且永远不会与应用程序一起消失。

### 前台服务和播放策略

根据 Google Play 的前台服务政策，版本 49 被拒绝，因此前台
使用和不使用服务是一个有意的、承载的区别——而不是实现细节。

**前台服务（`dataSync`）仅用于用户刚刚请求的工作：**

- 点击“立即同步”、添加文件夹或重试隔离的文件
- 手动选择文件并共享到应用程序上传 (`UploadForegroundService`)

**计划的工作永远不会占用任何时间。** 定期扫描作为普通 WorkManager 作业运行 — 不
`setForeground()`，非加急。在计时器上持有 `dataSync` 前台服务不是
用户发起的而不是用户可感知的，这正是策略所禁止的。预定同步
根据定义是可推迟的，因此操作系统可以在维护窗口中运行它。的延续
用户启动的运行也*不是*用户启动的：点击授权用户等待的工作，而不是
一个开放式的前台服务链，耗尽了数千张积压的照片。

`SyncScheduler.KEY_USER_INITIATED` 通过工作请求携带此信息，并且
`FolderSyncPlugin.syncNow({ userInitiated })` 将其暴露给 Web 层。应用程序启动/恢复通行证
`false`。

两种运行都会显示进度通知，因此同步始终可见；只有前景一张
是`ongoing`（不可驳回）。每个进度通知都会命名具体操作（“正在上传
照片到您的图库”），点击时打开应用程序，并执行真正停止照片的操作
工作 — **停止**（结束当前运行，保留恢复状态）和 **关闭**（禁用后台）
同步直到在设置中重新启用）；手动上传通知具有**取消上传**。

取消手动上传跨越了流程边界：通知操作由本机处理
当上传循环在 WebView 中运行时，由 `UploadActionReceiver` 执行，该循环可能不存在。这
接收器记录 JS 循环在文件之间和块批次之间轮询的标志
`ProgressNotification.consumeCancelRequest()`，然后干净地停止，并显示每个项目的多部分简历
状态完好无损。

**Play 控制台声明。** `dataSync` 用例必须声明为 *上传用户的
照片发送到自己的服务器，由用户发起* - 不是“本地处理：导入导出”，这是
版本 49 声明了什么，用于设备上导入/导出。演示视频必须向用户展示
开始上传和生成的通知，包括停止上传。

### 重复检测

即使在重新分配或重新添加文件夹后，文件也不会上传两次。两个独立的键：

- **廉价身份** — `(event, SAF document id, size, mtime)`。重新选择文件夹后仍然存在。
- **内容哈希** — SHA-256，与网络上的 `computeFileHash()` 匹配，因此可以正确复制组。

如果本地账本不知道哈希值，引擎会通过以下方式询问服务器
`POST /api/admin/events/:slug/uploads/check-hashes`，报告已对活动进行哈希处理
有一张完整的、未删除的照片。这就是使同步在重新安装、清除应用程序后仍然存在的原因
数据，或从第二台设备同步的同一文件夹。

`FolderSyncConfig.lastSyncTime` 已弃用且未使用。这是之前*唯一的*重复数据删除信号，
因为添加文件夹会重置它，所以每次重新添加都会重新上传整个文件夹。

### 内存和崩溃行为

峰值内存与文件大小和批处理大小无关——没有任何东西可以缓冲整个文件：

- 通过 64 KB 缓冲区对流进行哈希处理；
- 使用 `inSampleSize` 预览解码，因此 108MP 照片永远不会分配全分辨率位图；
- 上传部分将字节范围直接从 `content://` URI 传输到套接字中。

多部分恢复状态（`upload_id` + 部分 ETag）在每个部分落地时提交到账本。如果
进程终止，下一次运行将卡在 `uploading` 中的行扫回队列**与**
状态，因此部分上传的大视频会继续而不是重新启动。该扫描增加了
行的重试计数器，因此可重复终止进程的文件在之后被隔离
`MAX_RETRIES`，而不是在以后的每次运行中中毒。文件夹中列出了隔离的文件
与每个文件重试同步 UI。

每次运行都有上限（约 9 分钟/200 个文件），如果仍有积压，则会链接延续，因此
数千张照片的积压会在各个运行中耗尽，而不是一个运行因超载而被终止。

### 设置

可在“文件夹同步”部分中按设备进行配置，由 WorkManager 约束强制执行：

- **在后台同步** — 主开关（也可通过通知的“暂停同步”关闭）
- **仅限 Wi-Fi** — 默认开启；使用`NetworkType.UNMETERED`
- **电池电量低时跳过** — 默认开启
- **间隔** — 15 分钟到每天，默认每小时

还会在应用程序启动和恢复时扫描文件夹。

### 人脸检测

人脸嵌入需要WASM模型，该模型仅存在于WebView中。本地上传的照片是
停放在账本 (`faces_pending`) 中，并在下次应用程序时由 `faceDetectionQueue.ts` 清空
打开，通过`SafDirectory.readPreview()`解码。

请参阅`apps/web/src/services/folderSync.ts`（配置）和`sync/`包（引擎）。

## 开发流程

### 做出改变

1. 编辑`src/`中的React代码
2. 构建：`npm run build`
3. 同步：`npx cap sync`
4. 在 Xcode/Android Studio 中测试

### 热重载（网络）

为了更快的开发，请使用网页版：

```bash
npm run dev
# Mobile features won't work but UI can be tested
```

### 实时重新加载（本地）

使用 Capacitor 的实时重新加载进行本机测试：

```bash
# Start dev server
npm run dev

# Update capacitor.config.ts with your local IP:
# server: { url: 'http://192.168.1.x:5173' }

# Then open in native IDE
npx cap sync
npx cap open ios  # or android
```

## 故障排除

### 构建错误

```bash
# Clear build cache
rm -rf dist/
npm run build
npx cap sync
```

### iOS 问题

- **“无法验证开发者”**：设置 > 常规 > VPN 和设备管理
- **“无配置文件”**：在 Xcode 首选项中添加 Apple ID
- **后台任务不起作用**：检查 Xcode 功能中的后台模式

### 安卓问题

- **Gradle 同步失败**：更新 Android Studio 和 Gradle
- **应用程序在启动时崩溃**：检查 Logcat 是否有错误
- **权限被拒绝**：检查 AndroidManifest.xml

### 插件问题

```bash
# Reinstall Capacitor plugins
npm install @capacitor/core @capacitor/filesystem @capacitor/local-notifications @capacitor/network @capawesome/capacitor-background-task
npx cap sync
```

如果 Android 构建在具有 `proguard-android.txt is no longer supported` 的 Capacitor 插件中失败，则该项目在安装后使用 `patch-package` 对 `@capacitor/haptics` 应用持久修复。

```bash
# Re-apply all patches manually (also runs automatically on npm install)
npx patch-package
```

## 文件结构

```text
apps/
├── web/                         # Web app (React + Vite)
│   ├── src/
│   │   ├── services/
│   │   │   ├── backgroundSync.ts    # Manual/share upload background service
│   │   │   ├── folderSync.ts        # Folder sync configuration (engine is native)
│   │   │   └── folderSyncPlugin.ts  # Bridge to the native sync engine
│   │   ├── components/
│   │   │   └── FolderSyncManager.tsx # Folder sync UI + settings
│   │   └── main.tsx                 # Capacitor initialization
│   ├── capacitor.config.ts          # Capacitor configuration
│   └── package.json
│
└── android/                     # Android native project
    ├── app/
    │   ├── src/
    │   │   └── main/
    │   │       ├── AndroidManifest.xml
    │   │       ├── assets/           # Web assets (synced from web/dist)
    │   │       └── java/
    │   └── build.gradle
    ├── build.gradle
    ├── settings.gradle
    └── gradlew
```

## 资源

- [电容器文档](https://capacitorjs.com/docs)
- [后台任务插件](https://capawesome.io/plugins/background-task/)
- [iOS 后台任务](https://developer.apple.com/documentation/backgroundtasks)
- [Android WorkManager](https://developer.android.com/topic/libraries/architecture/workmanager)

## 支持

对于问题或疑问：

1. 检查上面的故障排除部分
2. 查看电容器插件文档
3. 检查本机平台日志（Xcode Console / Android Logcat）
