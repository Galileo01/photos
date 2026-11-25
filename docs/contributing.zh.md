# 贡献指南

[English](contributing.md) | **简体中文**


感谢您有兴趣为这个照片共享应用程序做出贡献！本指南将帮助您入门。

## 目录

- [行为准则](#code-of-conduct)
- [开始使用](#getting-started)
- [开发设置](#development-setup)
- [项目结构](#project-structure)
- [开发流程](#development-workflow)
- [编码标准](#coding-standards)
- [多语言](#多语言)
- [测试](#testing)
- [提交变更](#submitting-changes)
- [功能请求](#feature-requests)
- [错误报告](#bug-reports)
- [文档](#documentation)
- [社区](#community)

## 行为守则

### 我们的承诺

我们致力于为所有贡献者提供一个热情和包容的环境，无论其背景或经验水平如何。

### 预期行为

- 尊重和体贴
- 欢迎新人并帮助他们入门
- 提供建设性反馈
- 专注于对项目最有利的事情
- 对其他贡献者表现出同理心

### 不可接受的行为

- 任何形式的骚扰或​​歧视
- 恶搞或侮辱性评论
- 个人或政治攻击
- 公开他人的私人信息
- 其他有理由被认为不适当的行为

### 报告

如果您遇到或目睹不可接受的行为，请将其报告给项目维护人员。

## 入门

### 先决条件

在做出贡献之前，请确保您拥有：

- **Node.js** 已安装 18+
- **npm** 或 **yarn** 包管理器
- **Git** 用于版本控制
- **Cloudflare 帐户**（免费套餐即可）
- **Wrangler CLI** 全球安装
- TypeScript 和 React 的基础知识
- 熟悉 git 工作流程

### 首次贡献者

如果您是开源新手，请从以下开始：

1. 标记为 `good first issue` 的问题
2. 文档改进
3. 测试覆盖率改进
4. 小错误修复

不要害怕在讨论中提问或发表评论！

## 开发设置

### 1. 分叉和克隆

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/photo-sharing-app.git
cd photo-sharing-app
```

### 2.安装依赖项

```bash
# Worker dependencies
cd apps/worker
npm install

# Web dependencies
cd ../web
npm install
```

### 3. 配置环境

在`apps/worker/`中创建`.dev.vars`：

```bash
# Required for local development
ADMIN_EMAILS=your-email@example.com
JWT_SECRET=local-dev-secret-change-in-production
EVENT_COOKIE_SECRET=another-local-secret

# Optional for testing collaboration features
MAILGUN_API_KEY=your-mailgun-key
MAILGUN_DOMAIN=your-mailgun-domain

# Branding (optional)
APP_NAME=Photos Local Dev
BRAND_NAME=Your Name
COPYRIGHT_HOLDER=Your Name
APP_DOMAIN=localhost:5173
CONTACT_EMAIL=your-email@example.com
```

在`apps/web/`中创建`.env.local`：

```bash
VITE_API_URL=http://localhost:8787
VITE_APP_NAME=Photos Local Dev
VITE_BRAND_NAME=Your Name
VITE_COPYRIGHT_HOLDER=Your Name
```

### 4. 设置数据库

```bash
cd apps/worker

# Create local D1 database
wrangler d1 create photos-db-local

# Update wrangler.toml with local database_id

# Run migrations (plain numbered SQL files, not Wrangler's migrations-tracking system)
for file in ../../migrations/*.sql; do wrangler d1 execute photos-db-local --local --file="$file"; done
```

### 5. 设置 R2 存储桶

```bash
# Create development R2 bucket (or use local simulator)
wrangler r2 bucket create photos-dev

# Update wrangler.toml with dev bucket name
```

### 6. 启动开发服务器

```bash
# Terminal 1: Worker (backend)
cd apps/worker
npm run dev
# Runs on http://localhost:8787

# Terminal 2: Web (frontend)
cd apps/web
npm run dev
# Runs on http://localhost:5173
```

### 7. 验证设置

- 访问<http://localhost:5173>
- 检查浏览器控制台是否有错误
- 尝试查看图库（应该是空的）
- 使用您的 ADMIN_EMAILS 测试管理员访问权限

## 项目结构

```text
.
├── apps/
│   ├── worker/               # Backend (Cloudflare Worker)
│   │   ├── src/
│   │   │   ├── routes/       # API endpoints
│   │   │   │   └── admin/    # Admin-only routes (modular)
│   │   │   ├── config.ts     # Configuration system
│   │   │   ├── features.ts   # Feature flag system
│   │   │   ├── auth.ts       # Authentication middleware
│   │   │   └── index.ts      # Worker entry point
│   │   ├── wrangler.toml     # Worker configuration
│   │   └── package.json
│   │
│   └── web/                  # Frontend (React SPA)
│       ├── src/
│       │   ├── components/   # Reusable UI components
│       │   ├── contexts/     # React contexts
│       │   ├── hooks/        # Custom hooks
│       │   ├── pages/        # Route components
│       │   ├── services/     # Business logic
│       │   ├── utils/        # Utilities
│       │   └── config.ts     # Runtime config
│       ├── android/          # Capacitor Android
│       └── package.json
│
├── migrations/               # D1 database migrations
├── docs/                     # Documentation
└── scripts/                  # Utility scripts
```

## 开发流程

### 分支命名

使用描述性分支名称：

```bash
# Features
git checkout -b feature/add-video-transcoding
git checkout -b feature/bulk-download

# Bug fixes
git checkout -b fix/safari-upload-issue
git checkout -b fix/geocoding-timeout

# Documentation
git checkout -b docs/update-api-docs
git checkout -b docs/add-deployment-guide

# Refactoring
git checkout -b refactor/split-admin-routes
git checkout -b refactor/extract-upload-logic
```

### 提交消息

遵循[常规提交](https://www.conventionalcommits.org/)：

```text
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**类型：**

- `feat`：新功能
- `fix`：错误修复
- `docs`：文档更改
- `style`：代码风格更改（格式）
- `refactor`：代码重构
- `test`：添加或更新测试
- `chore`：维护任务

**示例：**

```bash
feat(worker): add video transcoding support

Implements video transcoding using Cloudflare Stream API.
Includes thumbnail generation and adaptive bitrate streaming.

Closes #123

---

fix(web): resolve Safari upload issue

Safari was not properly handling multipart uploads due to
missing Content-Type header. Added explicit header.

Fixes #456

---

docs(readme): update installation instructions

Added troubleshooting section for common D1 migration errors.

---

refactor(admin): extract event routes to separate module

Split admin.ts from 1058 lines to modular structure.
Created admin/events.ts, admin/photos.ts, etc.

Part of #789
```

### 拉取请求流程

1. **创建分支**

   ```bash
   git checkout -b feature/your-feature
   ```

2. **进行更改**
   - 按照风格指南编写代码
   - 添加新功能的测试
   - 根据需要更新文档

3. **本地测试**

   ```bash
   # Run tests
   cd apps/web && npm test
   cd apps/worker && npm test

   # Check types (there's no dedicated type-check script; build runs tsc)
   cd apps/web && npx tsc --noEmit
   cd apps/worker && npx tsc --noEmit

   # Lint code (apps/web only - there's no root or worker lint script)
   cd apps/web && npm run lint
   ```

4. **提交更改**

   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

5. **保持分支更新**

   ```bash
   git fetch origin
   git rebase origin/master
   ```

6. **推至叉子**

   ```bash
   git push origin feature/your-feature
   ```

7. **打开拉取请求**
   - 前往 GitHub 并创建 PR
   - 填写公关模板
   - 链接相关问题
   - 请求审核

8. **地址反馈**
   - 进行要求的更改
   - 将更新推送到同一分支
   - 回复评论

9. **合并**
   - 维护者将在批准后合并
   - 合并后删除分支

## 编码标准

### 打字稿

**使用显式类型：**

```typescript
// Good
function getEvent(slug: string): Event | null {
  // ...
}

// Avoid
function getEvent(slug) {
  // ...
}
```

**首选对象接口：**

```typescript
// Good
interface Event {
  id: number;
  slug: string;
  title: string;
}

// Avoid any
const event: any = { ... };
```

**谨慎使用枚举：**

```typescript
// Prefer literal types
type MediaType = 'photo' | 'video';

// Over enums
enum MediaType {
  Photo = 'photo',
  Video = 'video'
}
```

### 反应

**使用功能组件：**

```typescript
// Good
const PhotoCard: React.FC<PhotoCardProps> = ({ photo }) => {
  return <div>...</div>;
};

// Avoid class components
class PhotoCard extends React.Component {
  // ...
}
```

**逻辑的自定义挂钩：**

```typescript
// Extract reusable logic into hooks
function usePhotoSelection(photos: Photo[]) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  // ... logic
  return { selected, toggleSelection, clearSelection };
}
```

**保持组件较小：**

```typescript
// Split large components into smaller ones
// AdminEventUpload.tsx (600 lines)
//   ↓
// AdminEventUpload.tsx (400 lines)
// + EventLocationPicker.tsx (120 lines)
// + UploadQueueList.tsx (115 lines)
```

### 霍诺航线

**模块化路线组织：**

```typescript
// Good: Separate concerns
// routes/admin/events.ts
const app = new Hono<{ Bindings: Env }>();
app.get('/', listEvents);
app.post('/', createEvent);
export default app;

// Avoid: Everything in one file
// routes/admin.ts (1058 lines)
```

**使用中间件：**

```typescript
// Good: Reusable middleware
app.use('/*', requireAuth);
app.use('/admin/*', requireAdmin);

// Avoid: Checking auth in every route
app.get('/admin/events', async (c) => {
  if (!isAdmin(c)) return c.json({ error: 'Forbidden' }, 403);
  // ...
});
```

### 命名约定

**文件：**

- 组件：`PascalCase.tsx`（PhotoCard.tsx）
- 挂钩：`camelCase.ts`（usePhotoSelection.ts）
- 实用程序：`camelCase.ts`（imageUtils.ts）
- 路线：`kebab-case.ts`（admin-routes.ts）或`camelCase.ts`

**变量：**

- 常量：`UPPER_SNAKE_CASE` (MAX_FILE_SIZE)
- 变量：`camelCase`（照片列表）
- 类型：`PascalCase`（PhotoCardProps）

**功能：**

- 函数：`camelCase`（getEvent，createPhoto）
- 反应组件：`PascalCase`（照片卡）
- 挂钩：以 `use` 开头的`camelCase`（useAuth）

### 代码组织

**进口订单：**

```typescript
// 1. React/external libraries
import React, { useState } from 'react';
import { Hono } from 'hono';

// 2. Internal modules (absolute imports)
import { requireAuth } from '@/auth';
import { getConfig } from '@/config';

// 3. Relative imports
import { PhotoCard } from './PhotoCard';
import type { Photo } from '../types';

// 4. Assets/styles
import './styles.css';
```

**避免桶装出口：**

```typescript
// Avoid: index.ts that re-exports everything
export * from './PhotoCard';
export * from './EventCard';

// Prefer: Direct imports
import { PhotoCard } from './components/PhotoCard';
```

### 评论

**公共 API 的文档注释：**

```typescript
/**
 * Uploads a photo to an event with multipart upload
 * @param eventSlug - The event slug
 * @param file - The file to upload
 * @returns Upload ID and signed URLs for parts
 */
async function startUpload(eventSlug: string, file: File) {
  // ...
}
```

**复杂逻辑的内联评论：**

```typescript
// Calculate optimal part size based on file size
// R2 requires 5MB minimum parts, except for last part
const partSize = Math.max(5 * 1024 * 1024, Math.ceil(fileSize / 100));
```

**避免明显的评论：**

```typescript
// Bad
const photos = []; // initialize photos array

// Good (no comment needed)
const photos: Photo[] = [];
```

## 多语言

英文是源语言，简体中文使用 `zh-CN`。Web 界面文案需要同时放在
`apps/web/src/i18n/locales/en/` 和 `apps/web/src/i18n/locales/zh-CN/` 对应的功能 namespace 中。

- 两种语言的 key 结构保持一致
- 动态值使用插值和复数规则
- 句子中包含链接、强调文字等 React 元素时使用 `Trans`
- 面向用户的日期和数字使用 `localeForLanguage()` 返回的当前语言区域格式
- 同时更新可见标签、占位符、tooltip、ARIA label、确认信息、toast 和 SEO 文本
- 语言切换或插值行为发生变化时，新增或更新针对性测试

每个被 Git 跟踪的英文 Markdown 文档还需要一个 `.zh.md` 同级文件。中英文版本的标题、表格、代码块、命令、路径和配置 key 应保持一致，然后运行：

```bash
npm run docs:i18n:check
```

## 测试

### 单元测试（Vitest）

```typescript
// components/PhotoCard.test.tsx
import { render, screen } from '@testing-library/react';
import { PhotoCard } from './PhotoCard';

describe('PhotoCard', () => {
  it('should render photo with correct src', () => {
    const photo = { id: 1, preview_url: 'https://...', ... };
    render(<PhotoCard photo={photo} />);

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', photo.preview_url);
  });

  it('should call onSelect when clicked', () => {
    const onSelect = vi.fn();
    const photo = { id: 1, ... };
    render(<PhotoCard photo={photo} onSelect={onSelect} />);

    screen.getByRole('img').click();
    expect(onSelect).toHaveBeenCalledWith(1);
  });
});
```

### E2E 测试（剧作家）

```typescript
// e2e/gallery.spec.ts
import { test, expect } from '@playwright/test';

test('should display event gallery', async ({ page }) => {
  await page.goto('/events/summer-festival-2024');

  // Check event title
  await expect(page.locator('h1')).toContainText('Summer Festival 2024');

  // Check photos are loaded
  const photos = page.locator('[data-testid="photo-card"]');
  await expect(photos).toHaveCount(await photos.count());
});

test('should open lightbox on photo click', async ({ page }) => {
  await page.goto('/events/summer-festival-2024');

  // Click first photo
  await page.locator('[data-testid="photo-card"]').first().click();

  // Check lightbox opens
  await expect(page.locator('[data-testid="lightbox"]')).toBeVisible();
});
```

### 运行测试

```bash
# Unit tests
npm test

# Unit tests (watch mode)
npm test -- --watch

# E2E tests
npm run test:e2e

# E2E tests (headed)
npm run test:e2e -- --headed

# Type checking
npm run type-check

# Linting
npm run lint
```

### 测试覆盖率

目标：

- **关键路径：** 100% 覆盖率（验证、上传）
- **组件：** 80%+ 覆盖率
- **公用事业：** 90%+ 覆盖率
- **路线：** 70%+ 覆盖率

```bash
# Generate coverage report
npm test -- --coverage
```

## 提交更改

### 拉取请求模板

创建 PR 时，请包括：

```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Related Issues
Closes #123
Related to #456

## Testing
- [ ] Unit tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing performed

## Screenshots (if applicable)
[Add screenshots for UI changes]

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests pass locally
- [ ] Dependent changes merged
```

### 审核流程

1. **自动检查**
   - 测试必须通过
   - 必须通过 Linting
   - 类型检查必须通过
   - 没有合并冲突

2. **代码审查**
   - 至少需要一项批准
   - 解决所有评论
   - 保持讨论具有建设性

3. **合并要求**
   - 所有检查均通过
   - 经维护者批准
   - 与主分支保持同步
   - 如果有要求的话，壁球会提交

## 功能请求

### 提出特色

1. **检查现有问题**
   - 搜索类似请求
   - 对现有问题发表评论

2. **公开讨论**
   - 创建 GitHub 讨论
   - 解释用例
   - 描述期望的行为
   - 建议实施方法

3. **获取反馈**
   - 等待维护者回复
   - 讨论替代方案
   - 完善提案

4. **创建问题**
   - 如果获得批准，请创建详细问题
   - 使用功能请求模板
   - 讨论链接

### 功能请求模板

```markdown
## Feature Description
Clear description of the feature.

## Use Case
Explain why this feature is needed.

## Proposed Solution
How you think it should work.

## Alternatives Considered
Other approaches you've considered.

## Additional Context
Screenshots, mockups, links, etc.

## Implementation Notes
Technical considerations (optional).
```

## 错误报告

### 报告错误

1. **搜索现有问题**
   - 检查是否已报告
   - 将信息添加到现有问题

2. **创建详细报告**
   - 使用错误报告模板
   - 包括复制步骤
   - 添加错误消息/日志
   - 指定环境

### 错误报告模板

```markdown
## Bug Description
Clear description of the bug.

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior
What should happen.

## Actual Behavior
What actually happens.

## Screenshots
If applicable.

## Environment
- OS: [e.g. macOS 14.1]
- Browser: [e.g. Chrome 120]
- Version: [e.g. v1.0.0]
- Node: [e.g. 18.19.0]

## Error Messages

~~~text
将错误日志粘贴到此处
~~~

## Additional Context
Any other relevant information.
```

## 文档

### 记录什么

- 新功能或现有功能的更改
- 配置选项
- API 端点
- 复杂的算法或业务逻辑
- 设置说明
- 故障排除指南

### 文档风格

- 写出清晰、简洁的句子
- 使用主动语态
- 包含代码示例
- 添加 UI 功能的屏幕截图
- 保持README.md更新
- 更新CHANGELOG.md

### 文档文件

- **README.md** - 项目概述
- **configuration.md** - 设置指南
- **api-reference.md** - API 参考
- **ARCHITECTURE.md** - 技术概述
- **FEATURES.md** - 功能描述
- **CONTRIBUTING.md** - 此文件
- **CHANGELOG.md** - 版本历史

## 社区

### 沟通渠道

- **GitHub 问题** - 错误报告、功能请求
- **GitHub 讨论** - 问题、想法、一般性讨论
- **拉取请求** - 代码审查、实施讨论

### 寻求帮助

- 首先检查文档
- 搜索现有问题
- 在 GitHub 讨论中提问
- 要有耐心和尊重

### 帮助他人

- 回答讨论中的问题
- 审查拉取请求
- 改进文档
- 分享您的用例

## 认出

贡献者在以下领域获得认可：

- README.md 贡献者部分
- CHANGELOG.md 做出重大贡献
- GitHub 贡献者页面

感谢您的贡献！ 🎉

---

## 快速参考

```bash
# Setup
git clone <fork>
cd apps/worker && npm install
cd ../web && npm install

# Development
npm run dev          # From repo root: starts both worker and web concurrently
npm test             # Run tests (in apps/web or apps/worker)
npm run lint         # Check code style (apps/web only)
npx tsc --noEmit     # Check types (in apps/web or apps/worker)

# Before PR
npm test             # Tests pass (in apps/web and apps/worker)
npm run lint         # No lint errors (apps/web)
npx tsc --noEmit     # No type errors (apps/web and apps/worker)
git rebase origin/master  # Up to date

# Commit
git add .
git commit -m "feat: add feature"
git push origin feature-branch

# Create PR on GitHub
```

## 执照

通过贡献，您同意您的贡献将在与项目相同的许可证下获得许可（请参阅LICENSE文件）。

## 问题？

不要犹豫，快来询问吧！对某个问题展开讨论或发表评论。

快乐贡献！ 🚀
