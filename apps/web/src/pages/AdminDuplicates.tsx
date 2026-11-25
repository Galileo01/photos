import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Copy, Trash2, Users, Loader2, Hash, FolderCheck } from 'lucide-react';
import Navbar from '../components/Navbar';
import { getDuplicatePhotos, deletePhoto, bulkDeletePhotos, getPreviewUrl, getOriginalUrl, syncPeopleAcrossDuplicates, getPhotosMissingFileHash, setPhotoFileHash } from '../api';
import { computeFileHash } from '../imageUtils';
import type { DuplicateGroup, DuplicatePhoto } from '../api';

type DuplicateMessageKey =
  | 'admin:duplicatePhotos.errors.load'
  | 'admin:duplicatePhotos.errors.delete'
  | 'admin:duplicatePhotos.errors.bulkDelete'
  | 'admin:duplicatePhotos.errors.syncPeople'
  | 'admin:duplicatePhotos.errors.backfill'
  | 'admin:duplicatePhotos.success.movedToTrash'
  | 'admin:duplicatePhotos.success.bulkMovedToTrash'
  | 'admin:duplicatePhotos.success.peopleSynced'
  | 'admin:duplicatePhotos.success.peopleAlreadySynced'
  | 'admin:duplicatePhotos.success.hashesBackfilled';

type DuplicateMessage = {
  key: DuplicateMessageKey;
  values?: Record<string, string | number>;
};

const AdminDuplicates: React.FC = () => {
  const { t } = useTranslation(['admin', 'common']);
  const [groups, setGroups] = useState<DuplicateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<DuplicateMessage | null>(null);
  const [success, setSuccess] = useState<DuplicateMessage | null>(null);
  const [deletingPhoto, setDeletingPhoto] = useState<DuplicatePhoto | null>(null);
  const [syncingPeople, setSyncingPeople] = useState(false);
  const [backfilling, setBackfilling] = useState(false);
  const [backfillProgress, setBackfillProgress] = useState<{ done: number } | null>(null);
  // "Keep album X" bulk cleanup — lets an admin pick a single event as the trusted
  // source-of-truth copy and bulk-delete every OTHER duplicate copy of those same photos
  // (found in any other event) in one action, rather than clicking through each group's
  // individual Trash button one photo at a time.
  const [keepEventSlug, setKeepEventSlug] = useState('');
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [confirmingBulkDelete, setConfirmingBulkDelete] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getDuplicatePhotos();
      setGroups(data);
      setError(null);
    } catch (err) {
      setError({ key: 'admin:duplicatePhotos.errors.load' });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (photo: DuplicatePhoto) => {
    try {
      await deletePhoto(photo.id);
      setGroups((prev) =>
        prev
          .map((g) => ({ ...g, photos: g.photos.filter((p) => p.id !== photo.id) }))
          .filter((g) => g.photos.length > 1)
      );
      setDeletingPhoto(null);
      setSuccess({ key: 'admin:duplicatePhotos.success.movedToTrash' });
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError({ key: 'admin:duplicatePhotos.errors.delete' });
      console.error(err);
    }
  };

  const totalDuplicates = groups.reduce((sum, g) => sum + (g.photos.length - 1), 0);

  // Every distinct event that appears in at least one duplicate group, sorted by name — the
  // options for the "keep this album" picker below.
  const eventOptions = useMemo(() => {
    const bySlug = new Map<string, string>();
    for (const group of groups) {
      for (const photo of group.photos) {
        if (!bySlug.has(photo.event_slug)) bySlug.set(photo.event_slug, photo.event_name);
      }
    }
    return Array.from(bySlug.entries())
      .map(([slug, name]) => ({ slug, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [groups]);

  // Every OTHER-event photo that's a duplicate of something already in `keepEventSlug` — these
  // are exactly what the bulk action below deletes. A group only qualifies if it actually
  // contains a photo from the kept event (a group with no photo from that event is unrelated).
  const photosToDeleteForKeptEvent = useMemo(() => {
    if (!keepEventSlug) return [];
    const result: DuplicatePhoto[] = [];
    for (const group of groups) {
      const hasKeptCopy = group.photos.some((p) => p.event_slug === keepEventSlug);
      if (!hasKeptCopy) continue;
      for (const photo of group.photos) {
        if (photo.event_slug !== keepEventSlug) result.push(photo);
      }
    }
    return result;
  }, [groups, keepEventSlug]);

  const handleBulkDeleteForKeptEvent = async () => {
    if (photosToDeleteForKeptEvent.length === 0) return;
    try {
      setBulkDeleting(true);
      setError(null);
      const photoIds = photosToDeleteForKeptEvent.map((p) => p.id);
      const { deletedCount } = await bulkDeletePhotos(photoIds);
      const deletedIds = new Set(photoIds);
      setGroups((prev) =>
        prev
          .map((g) => ({ ...g, photos: g.photos.filter((p) => !deletedIds.has(p.id)) }))
          .filter((g) => g.photos.length > 1)
      );
      setConfirmingBulkDelete(false);
      setSuccess({
        key: 'admin:duplicatePhotos.success.bulkMovedToTrash',
        values: { count: deletedCount },
      });
      setTimeout(() => setSuccess(null), 5000);
      setKeepEventSlug('');
    } catch (err) {
      setError({ key: 'admin:duplicatePhotos.errors.bulkDelete' });
      console.error(err);
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleSyncPeople = async () => {
    try {
      setSyncingPeople(true);
      setError(null);
      const { groupsSynced, tagsAdded } = await syncPeopleAcrossDuplicates();
      setSuccess(tagsAdded > 0
        ? {
            key: 'admin:duplicatePhotos.success.peopleSynced',
            values: { groupCount: groupsSynced, tagCount: tagsAdded },
          }
        : { key: 'admin:duplicatePhotos.success.peopleAlreadySynced' });
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError({ key: 'admin:duplicatePhotos.errors.syncPeople' });
      console.error(err);
    } finally {
      setSyncingPeople(false);
    }
  };

  /**
   * One-time repair for the real root cause of "No duplicate photos found" when duplicates
   * DO exist: file_hash was NULL for essentially every photo uploaded via the Android app's
   * native background-sync path (a bug fixed 2026-08-06 — see backgroundSync.ts's fix comment),
   * plus any photo uploaded before the file_hash column/feature existed at all. Backfills it by
   * downloading each hash-less photo's ORIGINAL file (fetch, same-origin, admin session cookie
   * applies automatically — same approach downloadInstagram() already uses), hashing it
   * client-side with the same SHA-256 logic uploads use, then PATCHing the result back. Runs
   * one page (50 photos) at a time so progress is visible and a failure partway through doesn't
   * lose all prior progress. Re-runs GET /duplicates afterwards to pick up any newly-matched
   * groups.
   */
  const handleBackfillHashes = async () => {
    try {
      setBackfilling(true);
      setError(null);
      setBackfillProgress({ done: 0 });

      let cursor: string | null = null;
      let done = 0;
      for (;;) {
        const { photos, nextCursor } = await getPhotosMissingFileHash(cursor, 50);
        for (const photo of photos) {
          try {
            const url = getOriginalUrl(photo.event_slug, photo.id, photo.file_type, photo.cache_version ?? undefined);
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to fetch original: ${response.statusText}`);
            const blob = await response.blob();
            const fileHash = await computeFileHash(blob);
            if (fileHash) {
              await setPhotoFileHash(photo.id, fileHash);
            }
          } catch (photoErr) {
            // Best-effort — one unreadable/missing original shouldn't abort the whole backfill.
            console.warn(`[Backfill file hashes] Failed for photo ${photo.id}:`, photoErr);
          }
          done++;
          setBackfillProgress({ done });
        }
        if (!nextCursor) break;
        cursor = nextCursor;
      }

      setSuccess({
        key: 'admin:duplicatePhotos.success.hashesBackfilled',
        values: { count: done },
      });
      setTimeout(() => setSuccess(null), 5000);
      await loadData();
    } catch (err) {
      setError({ key: 'admin:duplicatePhotos.errors.backfill' });
      console.error(err);
    } finally {
      setBackfilling(false);
      setBackfillProgress(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link to="/admin" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
            {t('admin:duplicatePhotos.back')}
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Copy className="w-8 h-8" /> {t('admin:duplicatePhotos.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {t('admin:duplicatePhotos.description')}{' '}
            {totalDuplicates > 0 && t('admin:duplicatePhotos.extraCopies', { count: totalDuplicates })}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={handleBackfillHashes}
              disabled={backfilling}
              title={t('admin:duplicatePhotos.backfillTooltip')}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition flex items-center gap-2 disabled:opacity-50"
            >
              {backfilling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Hash className="w-4 h-4" />}
              {backfilling
                ? t('admin:duplicatePhotos.hashing', { count: backfillProgress?.done ?? 0 })
                : t('admin:duplicatePhotos.backfill')}
            </button>
            {groups.length > 0 && (
              <button
                onClick={handleSyncPeople}
                disabled={syncingPeople}
                title={t('admin:duplicatePhotos.syncPeopleTooltip')}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition flex items-center gap-2 disabled:opacity-50"
              >
                {syncingPeople ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                {syncingPeople ? t('admin:duplicatePhotos.syncing') : t('admin:duplicatePhotos.syncPeople')}
              </button>
            )}
          </div>
        </div>

        {groups.length > 0 && (
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-2">
              <FolderCheck className="w-4 h-4" /> {t('admin:duplicatePhotos.keepEventTitle')}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              {t('admin:duplicatePhotos.keepEventDescription')}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={keepEventSlug}
                onChange={(e) => setKeepEventSlug(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg"
              >
                <option value="">{t('admin:duplicatePhotos.selectEvent')}</option>
                {eventOptions.map((e) => (
                  <option key={e.slug} value={e.slug}>{e.name}</option>
                ))}
              </select>
              <button
                onClick={() => setConfirmingBulkDelete(true)}
                disabled={!keepEventSlug || photosToDeleteForKeptEvent.length === 0 || bulkDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                {keepEventSlug
                  ? t('admin:duplicatePhotos.moveElsewhereCount', { count: photosToDeleteForKeptEvent.length })
                  : t('admin:duplicatePhotos.moveElsewhere')}
              </button>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            {t(success.key, success.values ?? {})}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {t(error.key, error.values ?? {})}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-gray-600">{t('admin:duplicatePhotos.scanning')}</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
            <p className="text-gray-600 dark:text-gray-400">{t('admin:duplicatePhotos.empty')}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {groups.map((group) => (
              <div key={group.fileHash} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {group.photos.map((photo) => (
                    <div key={photo.id} className="flex-shrink-0 w-40 relative group">
                      <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                        <img
                          src={getPreviewUrl(photo.event_slug, photo.id, photo.file_type, photo.cache_version)}
                          alt={photo.original_filename}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <button
                        onClick={() => setDeletingPhoto(photo)}
                        className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition"
                        title={t('admin:duplicatePhotos.moveToTrash')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate mt-1">{photo.original_filename}</p>
                      <p className="text-xs text-gray-400 truncate">{photo.event_name}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {confirmingBulkDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4 text-red-600">🗑️ {t('admin:duplicatePhotos.moveToTrash')}</h2>
                <p className="mb-4 text-gray-700 dark:text-gray-300">
                  {t('admin:duplicatePhotos.bulkConfirmBefore', { count: photosToDeleteForKeptEvent.length })}{' '}
                  <strong>{eventOptions.find((e) => e.slug === keepEventSlug)?.name}</strong>
                  {t('admin:duplicatePhotos.bulkConfirmAfter')}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleBulkDeleteForKeptEvent}
                    disabled={bulkDeleting}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {bulkDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {bulkDeleting ? t('common:states.deleting') : t('admin:duplicatePhotos.moveToTrash')}
                  </button>
                  <button
                    onClick={() => setConfirmingBulkDelete(false)}
                    disabled={bulkDeleting}
                    className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition disabled:opacity-50"
                  >
                    {t('common:actions.cancel')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {deletingPhoto && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4 text-red-600">🗑️ {t('admin:duplicatePhotos.moveToTrash')}</h2>
                <p className="mb-4 text-gray-700">
                  {t('admin:duplicatePhotos.singleConfirmBefore')}{' '}
                  <strong>{deletingPhoto.original_filename}</strong> ({deletingPhoto.event_name})
                  {t('admin:duplicatePhotos.singleConfirmAfter')}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleDelete(deletingPhoto)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                    {t('admin:duplicatePhotos.moveToTrash')}
                  </button>
                  <button
                    onClick={() => setDeletingPhoto(null)}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                  >
                    {t('common:actions.cancel')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDuplicates;
