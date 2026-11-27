# 联系表格设置

[English](contact-form.md) | **简体中文**


首页 (`apps/web/src/pages/Landing.tsx`) 已包含工作联系表
(`apps/web/src/components/ContactForm.tsx`) 通过 [Formspree](https://formspree.io/) 构建
`@formspree/react` 包的 `useForm` 钩子 - 没有要构建的后端端点，只有一个 Formspree
要配置的表单 ID。

## 配置您自己的 Formspree 表单 ID

1. 前往 [formspree.io](https://formspree.io/) 并注册一个免费帐户
2. 创建一个新表单
3. 复制您的表单 ID（表单端点中`/f/`之后的部分，例如`https://formspree.io/f/xyzabc123` -> `xyzabc123`）
4. 更新传递给 `apps/web/src/pages/Landing.tsx` 中的 `<ContactForm />` 的 `formId` 属性：

   ```tsx
   <ContactForm formId="YOUR-FORM-ID" />
   ```

`formId` 目前硬编码在 `Landing.tsx` 中，而不是从环境变量中读取，
因此，自托管者需要直接编辑此行（或者将其连接到 `VITE_*` 环境变量，如果您愿意的话）
更喜欢它在构建/运行时配置）。

## 显示的联系电子邮件

与表单本身分开，用户界面其他位置显示的联系电子邮件（页脚、隐私
策略）来自`contactEmail`运行时配置（`apps/web/src/config.ts`），它读取
开发中的 `VITE_CONTACT_EMAIL` 或生产中工作程序注入的运行时配置 - 请参阅
[configuration.md](./configuration.zh.md)如何设置`CONTACT_EMAIL`。

## 替代方案：基于Worker的联系端点

如果您不想依赖 Formspree，您可以将 `ContactForm.tsx` 替换为普通表单
改为发布到自定义工作线程。今天`apps/worker/src/routes/`没有这条路线，
但使用 [MailChannels](https://www.mailchannels.com/) 的最小示例（可免费使用
Cloudflare Workers（根据其当前条款）将如下所示：

```typescript
import { Hono } from 'hono';
import type { Env } from '../types';

const app = new Hono<{ Bindings: Env }>();

app.post('/api/contact', async (c) => {
  try {
    const { name, email, message } = await c.req.json<{ name?: string; email?: string; message?: string }>();

    if (!name || !email || !message) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: c.env.CONTACT_EMAIL }] }],
        from: { email: 'noreply@yourdomain.com', name: 'Contact Form' },
        subject: `Contact Form: Message from ${name}`,
        content: [
          {
            type: 'text/plain',
            value: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      return c.json({ error: 'Failed to send message' }, 502);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Contact form error:', error);
    return c.json({ error: 'Failed to send message' }, 500);
  }
});

export const contactRoutes = app;
```

您还需要在 `apps/worker/src/index.ts` 中安装此路由并更新 `ContactForm.tsx`
提交到 `/api/contact` 而不是使用 Formspree 挂钩。
