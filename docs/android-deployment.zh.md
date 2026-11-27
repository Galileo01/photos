# Android 部署设置指南

[English](android-deployment.md) | **简体中文**


本指南将帮助您通过 GitHub Actions 设置自动将 Android 应用程序部署到 Google Play 商店。

## 先决条件

- Google Play Console 开发者帐户（一次性费用 25 美元）
- 访问 Google Cloud Console
- GitHub 存储库管理员访问

## 第 1 步：生成 Android 密钥库

密钥库用于签署您的应用程序版本。确保安全！

```bash
cd ~/
keytool -genkey -v \
  -keystore photos-release-key.keystore \
  -alias photos \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# You'll be prompted for:
# - Keystore password (remember this!)
# - Key password (can be same as keystore password)
# - Your name, organization, etc.
```

**重要的**：

- 安全地备份此密钥库文件（例如密码管理器、加密存储）
- 如果丢失，您将无法在 Play 商店上更新您的应用程序！
- 永远不要将其提交到 git

将 GitHub 机密的密钥库转换为 base64：

```bash
cat ~/photos-release-key.keystore | base64 | pbcopy  # macOS
# or
cat ~/photos-release-key.keystore | base64 -w 0      # Linux
```

## 第 2 步：设置 Google Play 管理中心 API

### 2.1 创建谷歌云项目

1. 前往 [Google Cloud 控制台](https://console.cloud.google.com/)
2. 创建新项目：“照片应用程序部署”
3. 启用**Google Play Android 开发者API**：
   - 搜索“Google Play Android 开发者API”
   - 点击“启用”

### 2.2 创建服务帐号

1. 转到 **IAM 和管理** > **服务帐户**
2. 单击**创建服务帐户**
   - 姓名：`github-actions-play-deploy`
   - 描述：“用于部署到 Play 商店的 GitHub Actions 的服务帐户”
3. 单击**创建并继续**
4. 跳过授予额外角色（我们将在 Play 管理中心执行此操作）
5. 单击**完成**
6. 单击您刚刚创建的服务帐户
7. 转到 **按键** 选项卡
8. 单击 **添加密钥** > **创建新密钥**
9. 选择 **JSON** 格式
10. 下载 JSON 文件（安全保存！）

### 2.3 将服务帐号链接到 Play 管理中心

1. 前往 [Google Play 管理中心](https://play.google.com/console)
2. 导航至 **设置**（齿轮图标）> **API 访问**
3. 单击您的服务帐户旁边的**链接**
4. 授予权限：
   - 检查 **管理员（所有权限）** 或至少：
   - ✅ 查看应用程序信息并下载批量报告
   - ✅ 创建和编辑草稿应用程序
   - ✅ 发布到生产环境、排除设备并使用应用签名
   - ✅ 管理测试轨道
5. 点击**应用**

## 第 3 步：更新 Android 构建配置

更新`apps/android/app/build.gradle`：

**将版本名称从“1.0”更改为“1.0.0”**并**添加签名配置**：

```groovy
android {
    namespace = "nl.thijsvtol.photos"
    compileSdk = rootProject.ext.compileSdkVersion
    defaultConfig {
        applicationId "nl.thijsvtol.photos"
        minSdkVersion rootProject.ext.minSdkVersion
        targetSdkVersion rootProject.ext.targetSdkVersion
        versionCode 1
        versionName "1.0.0"  // ← Changed from "1.0"
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
        aaptOptions {
            ignoreAssetsPattern = '!.svn:!.git:!.ds_store:!*.scc:.*:!CVS:!thumbs.db:!picasa.ini:!*~'
        }
    }

    // ← Add this signingConfigs block
    signingConfigs {
        release {
            if (System.getenv("RELEASE_KEYSTORE_FILE")) {
                storeFile file(System.getenv("RELEASE_KEYSTORE_FILE"))
                storePassword System.getenv("RELEASE_KEYSTORE_PASSWORD")
                keyAlias System.getenv("RELEASE_KEY_ALIAS")
                keyPassword System.getenv("RELEASE_KEY_PASSWORD")
            }
        }
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
            signingConfig signingConfigs.release  // ← Add this line
        }
    }
}
```

## 第 4 步：配置 GitHub 机密

转到您的 GitHub 存储库：
**设置** > **秘密和变量** > **操作** > **新存储库秘密**

添加这些秘密：

### ANDROID_KEYSTORE_BASE64

步骤 1 中的 base64 编码的密钥库

### ANDROID_KEYSTORE_PASSWORD

您在创建密钥库时使用的密码

### ANDROID_KEY_ALIAS

您使用的别名（例如，`photos`）

### ANDROID_KEY_PASSWORD

密钥密码（通常与密钥库密码相同）

### GOOGLE_PLAY_SERVICE_ACCOUNT_JSON

步骤 2.2 中的服务帐户 JSON 文件的全部内容
（打开文件并复制粘贴所有JSON）

## 第 5 步：首次部署

### 5.1 手动初始上传

在部署 GitHub Actions 之前，您需要手动上传第一个版本：

```bash
# Build web app
cd apps/web
npm run build
npx cap sync android

# Navigate to Android project
cd ../android

# Open in Android Studio
npx cap open android
```

在 Android Studio 中：

1. **构建** > **生成签名包 / APK**
2. 选择 **Android 应用程序包**
3. 使用第 1 步中的密钥库
4. 为发布而构建
5. 手动将 AAB 上传到 Play 管理中心：
   - 前往 Play 管理中心
   - 如果需要，创建新应用程序
   - 转到 **生产** > **创建新版本**
   - 上传AAB文件
   - 填写发布详细信息
   - 另存为草稿（尚未发布）

### 5.2 测试 GitHub Actions 部署

1. 转到您的 GitHub 存储库
2. 单击 **操作** 选项卡
3. 选择 **Android - 构建并部署到 Play 商店**
4. 单击 **运行工作流程**
5. 选择：
   - 轨道：**内部**（测试最安全）
   - 凹凸版本：**真实**
6. 单击 **运行工作流程**
7. 监控构建

如果成功，请检查 Play 管理中心以获取新的内部版本！

## 第 6 步：常规部署工作流程

### 部署到内部测试

1. 转到 GitHub **操作** 选项卡
2. 使用轨道运行工作流程：**内部**
3. 彻底测试

### 升级至测试版

1. 内部轨道测试
2. 使用以下轨道运行工作流程：**beta**
3. 获取 Beta 测试人员的反馈

### 发布到生产环境

1. 确保 Beta 测试完成
2. 运行工作流程并跟踪：**生产**
3. 应用将接受 Google 审核（1-7 天）

## 版本管理

### 自动版本冲突

运行工作流程时，将“Bump version code”设置为`true`以自动增加内部版本号。

### 手动版本冲突

```bash
cd apps/android/app

# Bump patch version (1.0.0 → 1.0.1)
../../../scripts/bump-version.sh patch

# Bump minor version (1.0.0 → 1.1.0)
../../../scripts/bump-version.sh minor

# Bump major version (1.0.0 → 2.0.0)
../../../scripts/bump-version.sh major

# Just bump version code
../../../scripts/bump-version.sh
```

## 故障排除

### “找不到包”错误

- 确保您已手动上传第一个版本
- 检查包名称是否匹配：`nl.thijsvtol.photos`

### “密钥库错误”

- 验证 GitHub 中的所有密钥库机密是否设置正确
- 确保ANDROID_KEYSTORE_BASE64是有效的base64

### “服务帐户没有权限”

- 检查 Play 管理中心 API 访问设置
- 确保服务帐户具有“发布到生产”权限

### 构建失败

- 在 GitHub Actions 中检查工作流程日志
- 验证 Node.js 和 Java 版本
- 不要将 `org.gradle.java.home` 硬编码为本地绝对路径；使用 CI `setup-java` / `JAVA_HOME`
- 首先尝试在本地构建

## 安全最佳实践

1. **永远不要**将密钥库文件提交到 git
2. **始终**安全地备份您的密钥库
3. **定期轮换**服务帐户密钥
4. **使用**内部/alpha 轨道在生产前进行测试
5. **监控** Play 控制台以获取自动安全警报

## 文件已创建

已为 Android 部署创建以下文件：

- `.github/workflows/android-deploy.yml` - GitHub Actions 工作流程
- `scripts/bump-version.sh` - 版本管理脚本（可执行）
- `android-deployment.md` - 本设置指南

## 下一步

1. ✅ **更新 build.gradle** - 添加签名配置（参见步骤 3）
2. **生成密钥库** - 按照步骤 1 操作
3. **设置 Google Play 管理中心 API** - 按照第 2 步操作
4. **配置 GitHub 机密** - 按照步骤 4 操作
5. **首先进行手动上传** - 按照步骤 5.1 操作
6. **测试 GitHub 操作** - 按照步骤 5.2 操作

## 其他资源

- [Google Play 管理中心帮助](https://support.google.com/googleplay/android-developer)
- [Android 应用签名](https://developer.android.com/studio/publish/app-signing)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [电容安卓文档](https://capacitorjs.com/docs/android)
