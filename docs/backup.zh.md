# 异地备份到 Backblaze B2

[English](backup.md) | **简体中文**


所有内容的主要副本都位于 **Cloudflare** 中：

- **Blob**（照片和视频）— R2 存储桶`photos-storage` (`PHOTOS_BUCKET`)。
- **元数据**（人物、面孔集群、海报状态、活动……）——D1
数据库`photos-db`。

这是单个帐户上的单个提供商。每晚备份增加了一个
第二，在不同的提供商 (Backblaze B2) 上进行**独立**复制 —
[3-2-1 备份](https://en.wikipedia.org/wiki/Backup#3-2-1_rule) 的“不同提供商、异地”支线。
这可以防止第二个 Cloudflare 存储桶无法出现的故障模式：
帐户锁定或账单纠纷，或者我们自己的代码中存在批量删除的错误
对象。

这里双向带宽都是免费的——R2没有出口费用，B2没有出口费用
入口费用（B2↔Cloudflare 出口通过带宽联盟免费），因此
同步仅花费 B2 存储（约 6 美元/TB/月）。

## 运行什么

[`.github/workflows/backup-b2.yml`](../.github/workflows/backup-b2.yml) 运行
每晚 **05:17 UTC** （在 03:00 UTC 转码作业之后，因此我们备份
转码视频，而不是对它们进行竞赛），也可以通过手动触发
**操作 → 每晚备份到 B2 → 运行工作流程**。它调用
[`scripts/backup-to-b2.sh`](../scripts/backup-to-b2.sh)，它有两个作用
独立的事物：

1. **斑点** — `rclone sync R2:photos-storage → B2:<bucket>/photos/blobs`。
更改或删除的文件将移至`B2:<bucket>/photos/_archive/<date>/`
而不是硬删除，因此 R2 中的错误删除永远不会破坏
仅备份文件。
2. **数据库** — 逻辑 SQL 转储（架构 + 数据），gzip 压缩并上传到
`B2:<bucket>/photos/db-backups/photos-db-<date>.sql.gz`。 `wrangler d1 export`
[无法导出包含 fts5 虚拟表的数据库](https://github.com/cloudflare/workers-sdk/issues/6305)
（您的 `photos_fts` 搜索索引），因此脚本枚举了真实的表并
一次导出一张（`--table` 每次调用仅接受一张表），然后
连接它们。 fts5 索引**未**备份 - 它是完全派生的
从 `photos` 开始并在恢复时重建（见下文）。 BLOB栏目（人脸/AI
嵌入）保留为 SQL 十六进制文字。

三个前缀 (`blobs/`、`_archive/`、`db-backups/`) 是兄弟姐妹
`photos/`（`B2_PREFIX`），因此镜像永远不会重新同步其自己的存档或
转储。 `_archive/` 被修剪为 `ARCHIVE_RETENTION_DAYS` （默认 30 — 这是
主要成本驱动因素，因为夜间转码会就地重写视频）和
`db-backups/` 到 `DB_RETENTION_DAYS`（默认 90 — 转储很小）。

## 成本

双向接送免费（R2 无出口费，B2 无入口费）
GitHub Actions 在公共存储库上是免费的，因此唯一的成本是 **B2 存储
休息**（约 0.006 美元/GB/月，前 10 GB 免费）。因为 `rclone sync` 是
增量备份*频率*几乎不会影响成本——每晚的成本约为
与每周相同。重要的杠杆是图书馆的总规模和
`ARCHIVE_RETENTION_DAYS`。 （可选）启用 **B2 生命周期规则** 进行硬删除
在类似的窗口之后隐藏/旧文件版本（来自`b2_hard_delete=false`）。

## 一次性设置

### 1.创建B2桶+key

1. 在 Backblaze B2 中创建一个 **私有** 存储桶（例如 `thijsvtol-photos-backup`）。
2. 创建一个范围仅限于该存储桶的**应用程序密钥**。请注意 `keyID` 和
`applicationKey`（显示一次）。
3. 建议的强化（针对勒索软件/泄露密钥的深度防御）：
   - 在存储桶上启用**对象锁定**（治理模式），以便备份
     immutable for a retention window.
   - 添加 **生命周期规则** 将先前的文件版本保留约 90 天，然后
     delete them, bounding storage from the `hard_delete=false` versioning.

### 2. 创建R2读取令牌

Cloudflare 仪表板 → **R2 → 管理 API 代币** → 创建一个代币
**对象读取**权限`photos-storage`。这会产生一个
`Access Key ID` 和 `Secret Access Key` 用于 S3 兼容的 API。

### 3. 添加 GitHub 存储库机密

仓库 → **设置 → 秘密和变量 → 操作**：

|秘密|从哪里来|
| --- | --- |
| `CLOUDFLARE_ACCOUNT_ID` |已存在（由其他工作流程使用）|
| `CLOUDFLARE_API_TOKEN` |已经存在；必须包括 **D1 阅读** |
| `R2_ACCESS_KEY_ID` | R2 S3 API 代币（步骤 2） |
| `R2_SECRET_ACCESS_KEY` | R2 S3 API 代币（步骤 2） |
| `B2_KEY_ID` | B2 应用程序密钥`keyID`（步骤 1）|
| `B2_APPLICATION_KEY` | B2 应用程序密钥`applicationKey`（步骤 1）|
| `B2_BUCKET` | B2 存储桶名称（步骤 1）|

### 4. 测试一下

首先使用模式`db`（快速）手动触发工作流程，确认
`photos-db-<date>.sql.gz`降落在B2，然后运行`all`。

## 本地运行

```bash
export CLOUDFLARE_ACCOUNT_ID=... CLOUDFLARE_API_TOKEN=...
export R2_ACCESS_KEY_ID=... R2_SECRET_ACCESS_KEY=...
export B2_KEY_ID=... B2_APPLICATION_KEY=... B2_BUCKET=thijsvtol-photos-backup

npm run backup            # everything
npm run backup -- db      # database only
npm run backup -- blobs   # blobs only
```

需要 `PATH` 上的 [`rclone`](https://rclone.org/install/) 和 `wrangler`。

## 正在恢复

**您从未恢复过的备份不是备份 - 尝试恢复一次。**

数据库（恢复到*新鲜/空*数据库并在重新指向产品之前进行验证）：

```bash
rclone copyto B2:<bucket>/photos/db-backups/photos-db-2026-08-19.sql.gz ./dump.sql.gz
gunzip dump.sql.gz
wrangler d1 execute photos-db --remote --file=dump.sql
```

然后**重建全文检索索引**，故意不在
dump（源自`photos`）。重新运行 `photos_fts` 块 —
`CREATE VIRTUAL TABLE photos_fts`、三个 `photos_fts_*` 触发器以及
回填 `INSERT` — 来自
[迁移/023_photos_organization_and_ai.sql](../migrations/023_photos_organization_and_ai.sql)
（第 54-82 行）针对恢复的数据库：

```bash
wrangler d1 execute photos-db --remote --command "CREATE VIRTUAL TABLE IF NOT EXISTS photos_fts USING fts5(original_filename, ai_caption, ai_tags, city, content='photos', content_rowid='rowid');"
# ...then the three CREATE TRIGGER statements and the backfill INSERT from that migration.
```

Blob（当前镜像位于`photos/blobs/`下；恢复特定的
从`photos/_archive/<date>/`删除/更改文件）：

```bash
rclone copy B2:<bucket>/photos/blobs R2:photos-storage
```

## 调音

脚本理解的环境变量（除`B2_BUCKET`之外都是可选的）：
`R2_BUCKET`、`B2_BUCKET`、`B2_PREFIX`、`D1_DATABASE`、`ARCHIVE_RETENTION_DAYS`
（默认 30）、`DB_RETENTION_DAYS`（默认 90）、`RETENTION_DAYS`（备用
两者），`BACKUP_STAMP`。
