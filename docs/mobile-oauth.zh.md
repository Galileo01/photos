# 移动 OAuth 部署指南

[English](mobile-oauth.md) | **简体中文**


## 概述

本指南介绍如何为移动应用程序 (Android) 设置 OAuth 身份验证。该移动应用程序使用 Cloudflare Access 进行身份验证并提供深度链接支持。

## 生产部署

### 1. 在 Cloudflare Worker 中设置 JWT_SECRET

生成一个安全的随机 JWT 密钥并将其设置在您的 Cloudflare Worker 中：

```bash
cd apps/worker

# Generate a secure random secret (min 32 characters)
wrangler secret put JWT_SECRET
# Paste your secure random string when prompted
```

或者使用 Cloudflare 仪表板：

1. 转到Workers & Pages > 您的Worker姓名
2. 设置 > 变量和秘密
3. 添加秘密：`JWT_SECRET` =（您的安全随机字符串）

### 2. 为移动登录路由配置 Cloudflare Access

移动 OAuth 流程使用两条路由，这两条路由都需要受到 Cloudflare Access 的保护
（就像管理页面一样）：

- `/api/mobile-login` - 应用程序在系统浏览器中打开的首页；立即
Access 对用户进行身份验证后，重定向到 `/api/mobile-auth`
- `/api/mobile-auth` - 读取经过 Access 验证的用户，发出 JWT，并重定向到
`photos://auth/callback` 深层链接

在您的 Cloudflare 零信任仪表板中：

1. 转到访问 > 应用程序
2. 找到您的照片应用程序
3. 确保`/api/mobile-login`和`/api/mobile-auth`受到与`/admin/*`相同的策略保护

或者创建一个新策略：

- **应用域**：`photos.yourdomain.com`
- **路径**：`/api/mobile-login`（为`/api/mobile-auth`添加第二条规则/路径）
- **策略**：与您的管理策略相同（电子邮件白名单等）

### 3. 部署后端

```bash
cd apps/worker
npm run deploy
```

### 4. 构建和部署移动应用程序

```bash
cd apps/web

# Build web app
npm run build

# Sync to Android
npx cap sync android

# Open in Android Studio
npx cap open android
```

然后从 Android Studio 构建并安装 APK。

## 测试 OAuth 流程

### 1. 手机App测试

1. 在 Android 设备/模拟器上打开应用程序
2. 导航到管理部分（或触发登录）
3. 点击“登录”按钮
4. 浏览器应打开：`https://photos.yourdomain.com/api/mobile-login?state=<random>`
5. Cloudflare Access 提示进行身份验证
6. 页面立即跳转至`/api/mobile-auth?state=<random>`，显示“认证成功”
7. 浏览器重定向到：`photos://auth/callback?token=...&user=...`
8. 应用程序捕获深层链接并存储令牌
9. 您现在应该以管理员权限登录！

### 2. 验证令牌是否正常工作

检查 Android logcat：

```text
[MobileAuth] Deep link received: photos://auth/callback?...
[MobileAuth] Token stored successfully
[API] Request: GET /api/user/profile Full URL: https://photos.yourdomain.com/api/user/profile
[API] Authorization header: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. 测试API请求

登录后，所有API请求应自动包含承载令牌：

- 查看活动
- 查看照片
- 上传照片（仅限管理员）
- 使用文件夹同步（仅限管理员）

## 故障排除

### 令牌未发送

- 检查 logcat 中是否有 `[API] Authorization header:`
- 验证令牌是否已存储：`[MobileAuth] Token stored successfully`

### 认证失败

- 检查Worker日志：`npx wrangler tail`
- 验证 JWT_SECRET 在生产中设置
- 确保 `/api/mobile-login` 和 `/api/mobile-auth` 均受 Cloudflare Access 保护

### 深层链接不起作用

- 验证 AndroidManifest.xml 是否具有 `photos://auth` 的意图过滤器
- 检查 logcat 中的深层链接事件
- 尝试手动打开：`adb shell am start -W -a android.intent.action.VIEW -d "photos://auth/callback?token=test"`

### 令牌已过期

- 令牌将在 30 天后过期
- 用户需要重新登录
- 应用程序将显示自动注销

## 安全说明

1. **JWT_SECRET**：保守这个秘密！永远不要承诺 git。它用于签署/验证移动令牌。
2. **令牌过期**：令牌有效期为 30 天。如果需要，调整`mobileAuth.ts`。
3. **仅HTTPS**：令牌仅通过HTTPS传输。
4. **令牌存储**：存储在 Capacitor Preferences 中（通过 Android 操作系统钥匙串加密）。
5. **状态参数**：CSRF保护 - 验证深层链接回调是否与原始请求匹配。
