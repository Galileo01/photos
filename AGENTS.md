# AGENTS.md

[English](AGENTS.md) | [简体中文](AGENTS.zh.md)

This file defines repository-wide instructions for AI agents working on Photos.

## Communication

- Respond in Chinese by default. Keep code, commands, paths, API fields, and proper nouns in their original form.
- Separate verified observations from assumptions and planned work.
- Report relevant validation results and any remaining limitations.

## Repository structure

- `apps/web` contains the React 19, TypeScript, and Vite frontend.
- `apps/worker` contains the Hono application deployed to Cloudflare Workers.
- `apps/android` contains the Capacitor Android wrapper and native background-sync code.
- `migrations` contains ordered Cloudflare D1 migrations.
- `docs` contains project documentation.
- `scripts` contains setup, deployment, backup, and maintenance scripts.

## Editing rules

- Inspect adjacent modules and existing implementations before editing.
- Keep changes limited to the requested behavior. Avoid unrelated refactors, formatting churn, and generated artifacts.
- Prefer structured editing tools such as `apply_patch` for handwritten source, configuration, and documentation.
- Review the complete diff after editing and remove unrelated changes.
- Preserve existing private-deployment configuration and never commit `.env.personal` or secrets.

## React and TypeScript

- Prefer `type` for new type declarations unless an existing API requires an `interface`.
- New React files use `import * as React from 'react'` and `React.useXxx` hooks.
- Declare named function components and export them at the bottom of the file.
- Reuse existing contexts, components, API clients, and types when they preserve the required behavior.

## Localization

- English is the source locale and Simplified Chinese is `zh-CN`.
- Put user-visible Web strings in `apps/web/src/i18n/locales/en` and the matching `zh-CN` resource.
- Keep locale resource keys structurally identical. Use interpolation and plural rules for dynamic messages.
- Format dates and numbers with the active locale. Do not hard-code `en-US` in user-visible output.
- Update page titles, placeholders, tooltips, ARIA labels, confirmations, and toasts together with visible text.
- Use stable API error codes for errors displayed by clients. Preserve readable server error messages for compatibility and logs.
- Android native strings belong in Android string resources. Keep WebView and native notification terminology aligned.

## Bilingual documentation

- Every tracked English Markdown file must have a sibling with the `.zh.md` suffix.
- Keep `AGENTS.md` and `AGENTS.zh.md` semantically equivalent. Agent tools discover `AGENTS.md` as the operative file.
- When an English document changes behavior or factual content, update its Chinese sibling in the same change.
- Chinese documents link to translated siblings when they exist. Preserve commands, paths, environment variables, API routes, code, and configuration keys exactly.
- Keep section structure, tables, code blocks, warnings, and examples aligned across both languages.

## Database and deployment

- Add schema changes through a new ordered migration. Preserve compatibility with already-applied remote migrations.
- The personal deployment uses `npm --prefix apps/web run build:personal` before Wrangler deploys `apps/web/dist` with the Worker.
- Do not commit secrets, deploy production, mutate remote D1 data, or publish artifacts unless the user explicitly requests it.

## Validation

- Run the narrowest relevant tests during development, then run the affected package's full test and build commands.
- Web changes normally require `npm --prefix apps/web test`, `npm --prefix apps/web run lint`, and both Web builds when personal mode is affected.
- Worker changes normally require the Worker tests and build.
- Android native changes require an Android build.
- Run the documentation locale check for Markdown changes and finish with `git diff --check`.
