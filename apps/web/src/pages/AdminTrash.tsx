import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Trash2, RotateCcw, AlertTriangle } from 'lucide-react';
import Navbar from '../components/Navbar';
import { getTrash, restorePhoto, permanentlyDeletePhoto, emptyTrash, getPreviewUrl } from '../api';
import type { TrashPhoto } from '../api';

const AdminTrash: React.FC = () => {
  const { t } = useTranslation(['admin', 'common']);
  const [photos, setPhotos] = useState<TrashPhoto[]>([]);
  const [retentionDays, setRetentionDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmingEmpty, setConfirmingEmpty] = useState(false);
  const [deletingPhoto, setDeletingPhoto] = useState<TrashPhoto | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getTrash();
      setPhotos(data.photos);
      setRetentionDays(data.retentionDays);
      setError(null);
    } catch (err) {
      setError('load');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (photoId: string) => {
    try {
      await restorePhoto(photoId);
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      setSuccess('restored');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('restore');
      console.error(err);
    }
  };

  const handlePermanentDelete = async (photoId: string) => {
    try {
      await permanentlyDeletePhoto(photoId);
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      setDeletingPhoto(null);
      setSuccess('deleted');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('delete');
      console.error(err);
    }
  };

  const handleEmptyTrash = async () => {
    try {
      const result = await emptyTrash();
      setPhotos([]);
      setConfirmingEmpty(false);
      setSuccess(`emptied:${result.deletedCount}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('empty');
      console.error(err);
    }
  };

  const daysLeft = (deletedAt: string | null | undefined): number => {
    if (!deletedAt) return retentionDays;
    const deletedMs = new Date(deletedAt.replace(' ', 'T') + 'Z').getTime();
    const purgeMs = deletedMs + retentionDays * 24 * 60 * 60 * 1000;
    return Math.max(0, Math.ceil((purgeMs - Date.now()) / (24 * 60 * 60 * 1000)));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link to="/admin" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
            {t('admin:trashPage.back')}
          </Link>
          <div className="flex justify-between items-center flex-wrap gap-3">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Trash2 className="w-8 h-8" /> {t('admin:trashPage.title')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {t('admin:trashPage.description', { count: retentionDays })}
              </p>
            </div>
            {photos.length > 0 && (
              <button
                onClick={() => setConfirmingEmpty(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                {t('admin:trashPage.emptyTrash')}
              </button>
            )}
          </div>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            {success.startsWith('emptied:')
              ? t('admin:trashPage.success.emptied', { count: Number(success.split(':')[1]) })
              : t(`admin:trashPage.success.${success}` as 'admin:trashPage.success.restored' | 'admin:trashPage.success.deleted')}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {t(`admin:trashPage.errors.${error}` as
              | 'admin:trashPage.errors.load'
              | 'admin:trashPage.errors.restore'
              | 'admin:trashPage.errors.delete'
              | 'admin:trashPage.errors.empty')}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-gray-600">{t('admin:trashPage.loading')}</p>
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
            <p className="text-gray-600 dark:text-gray-400">{t('admin:trashPage.empty')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {photos.map((photo) => (
              <div key={photo.id} className="relative bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden group">
                <div className="aspect-square">
                  <img
                    src={getPreviewUrl(photo.event_slug, photo.id, photo.file_type, photo.cache_version)}
                    alt={photo.original_filename}
                    className="w-full h-full object-cover opacity-75"
                    loading="lazy"
                  />
                </div>
                <div className="absolute top-2 left-2 bg-gray-900/80 text-white px-2 py-1 rounded text-xs">
                  {t('admin:trashPage.daysLeft', { count: daysLeft(photo.deleted_at) })}
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => handleRestore(photo.id)}
                    className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm flex items-center gap-1"
                    title={t('admin:trashPage.restore')}
                  >
                    <RotateCcw className="w-4 h-4" /> {t('admin:trashPage.restore')}
                  </button>
                  <button
                    onClick={() => setDeletingPhoto(photo)}
                    className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm"
                    title={t('admin:trashPage.deleteForever')}
                  >
                    {t('admin:trashPage.deleteForever')}
                  </button>
                </div>
                <div className="p-2">
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{photo.original_filename}</p>
                  <p className="text-xs text-gray-400 truncate">{photo.event_name}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {deletingPhoto && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4 text-red-600 flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6" /> {t('admin:trashPage.deleteForever')}
                </h2>
                <p className="mb-4 text-gray-700">
                  {t('admin:trashPage.deleteConfirmBefore')}{' '}
                  <strong>{deletingPhoto.original_filename}</strong>
                  {t('admin:trashPage.deleteConfirmAfter')}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handlePermanentDelete(deletingPhoto.id)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                    {t('admin:trashPage.deleteForever')}
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

        {confirmingEmpty && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4 text-red-600 flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6" /> {t('admin:trashPage.emptyTrash')}
                </h2>
                <p className="mb-4 text-gray-700">
                  {t('admin:trashPage.emptyConfirm', { count: photos.length })}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleEmptyTrash}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                    {t('admin:trashPage.emptyTrash')}
                  </button>
                  <button
                    onClick={() => setConfirmingEmpty(false)}
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

export default AdminTrash;
