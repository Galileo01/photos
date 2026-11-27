# 设计：将在线删除传播到本地同步文件夹（Android）

[English](local-delete-sync-design.md) | **简体中文**


**状态：** IMPLEMENTED（清除门+仅限自己删除，选择加入）。选择的安全模型：选项（A）
清除门控和“只有我自己的删除”。关键部分：迁移`031_photo_tombstones.sql`；
`apps/worker/src/tombstones.ts` + `routes/admin/photos.ts` 中的接线（删除/恢复），
`photoDeletion.ts`（清除）和`routes/me.ts` (`GET /api/me/deletions`)；本国的
`SyncLedger.byPhotoId`/`markLocallyDeleted` + `FolderSyncPlugin.deleteLocalFiles`； JS
`folderSync.reconcileDeletions` + `FolderSyncManager` 中的选择加入开关。剩下的这个
文件是最初的设计原理。

## 目标

当源自 Android **文件夹同步**的照片在服务器上被删除时，也删除
设备同步文件夹中相应的**原始本地文件** - 因此手机的存储空间
跟踪在线图书馆，而不是保留用户已在线删除的原件。

## 判决

**机械上可行，但这是一个真实的项目，而不是调整，而且它确实很危险**（它
销毁用户唯一的原件副本）。它需要在所有三个层（服务器、
本机同步引擎）加上仔细的安全模型。建议构建它选择加入和清除门控。

## 已经存在的东西（关键）

- **持久的本地↔服务器映射。** Android `SyncLedger`（`synced_files` 表）存储，每
上传的文件，既是本地`doc_uri`/`doc_id`，也是服务器`photo_id`
（`SyncLedger.java` — `photo_id` 由 `markUploading(id, photoId)` 编写）。这是唯一的
值得信赖的相关性，并且它已经在进程死亡后幸存下来。
- **对文件夹的写权限。** 通过 `OPEN_DOCUMENT_TREE` 选择SAF树（读+写）；
`SafDirectoryPlugin`已经`createDocument()`进入其中，证明授权包括写入。所以
`DocumentsContract.deleteDocument(resolver, docUri)` 在分类账上 `doc_uri` 在现有的范围内
允许。
- **具有安全窗口的干净服务器删除模型。**服务器删除是**软删除**
（`deleted_at` 设置；`DELETE /photos/:id`），可恢复**30 天**（`PUT /photos/:id/restore`），
然后由夜间 cron 进行硬清除（`photoDeletion.ts` / `scheduled.ts`，
`TRASH_RETENTION_DAYS = 30`）。

## 缺少什么（必须构建）

1. **删除提要+持久的墓碑（服务器）。**今天删除的照片从每个
API（`WHERE deleted_at IS NULL`无处不在），并且该行在 30 天后实际上消失了 —
客户端无法得知“什么”被删除。需要：
   - 一个写在软删除上的`photo_tombstones`表（`photo_id`，`deleted_at`，足以让
     device match: keep it minimal — `photo_id` is the key the device already has), that **outlives**
     the 30-day purge of the `photos` row;
   - `GET /api/me/deletions?since=<cursor>`（已验证）返回`{ photoId, deletedAt }[]` +
     a next cursor. Scope it to deletions the caller is allowed to know about.
2. **本机SAF删除路径。**今天同步包中不存在删除。添加一个
`FolderSyncPlugin` 方法，给定 `photo_id`，查找其账本 `doc_uri` 并调用
`DocumentsContract.deleteDocument`；处理 `false`/异常返回（过时的文档 ID，已撤销
grant）而不崩溃；记录一个新的账本状态（例如`locally_deleted`），因此它是幂等的。
3. **服务器→本地协调阶段。**该引擎严格仅限上传（`扫描→哈希→重复数据删除→
upload`). Add a reconcile step (in `FolderSyncWorker.doWork()` 或 JS 驱动的流程）轮询
使用持久的 `since` 游标进行删除，并驱动匹配账本的本机删除
行。

## 推荐的安全模型（难点）

- **选择加入，默认关闭。** `FolderSyncManager` 中措辞清晰的设置（“同时删除本地
当我在线删除文件时，它们会被删除”）。删除用户的原始文件绝不能令人意外。
- **通过确切的分类帐`photo_id → doc_uri`关联ONLY。**永远不要回退到文件名或
`file_hash` — 副本/重命名/哈希清除副本（迁移 028）将映射到错误的文件。
- **仅限所有者设备。** 仅作用于此设备实际上传的分类帐行。第二个设备
同步的同一个文件夹有自己的账本；并且由*协作者/管理员*执行的删除应该
无法访问所有者的个人存储 - 对提要进行门控，以便设备只能看到删除的内容
上传的照片（与 `uploaded_by` = 此帐户匹配）。
- **永久门，而不是软删除。**首选以下之一：
  - **(A) purge-gate：** 仅在服务器 30 天硬清除后删除本地文件，因此
    soft-delete + restore never destroys the original. Requires tombstones to outlive the row.
    Simple, safest; downside is up to ~30-day lag.
  - **(B) 本地垃圾镜像：** 在服务器软删除上，*移动*本地文件到本地`.trash/`
    subfolder (not hard-deleted); a server restore moves it back; the local `.trash/` is cleaned
    after the retention window. Reversible and prompt, but more moving parts (move + restore + local
    GC) and doubles storage until GC.
建议先运送**(A)**；如果滞后是一个问题，请稍后考虑 (B)。
- **强大的故障处理。** `deleteDocument` 返回 false，撤销/替换树授予，移动
文件（过时的`doc_id`）必须全部记录并跳过，这对同步运行不会造成致命影响。

## 粗略的努力/排序

1. 服务器：墓碑表+软删除写入+`GET /me/deletions?since=`+测试。 （最小的，
解锁一切。）
2. 本机：`deleteDocument`路径+`FolderSyncPlugin`方法+账本`locally_deleted`状态。
3. 引擎：协调阶段+持久光标+选择加入设置UI。
4. QA：软删除→恢复竞争、撤销授权、多设备和“从不触及非同步文件”
案例。

## 产品的开放式问题

- 清除门控 (A) 与本地垃圾镜像 (B)？
- 如果协作者/管理员的删除行为传播到所有者的设备，或者严格来说仅传播到
设备所有者自己删除？
- 视频：同样的处理（它们也是同步的原始视频）——除了视频之外不需要特殊的外壳
账本映射。
