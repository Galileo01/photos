import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Star, Archive, ArchiveRestore, Trash2, Wand2, Loader2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import { getEvent, getPhotos, deletePhoto, setPhotoFeatured, setPhotoArchived, getPreviewUrl, getOriginalUrl, replacePhoto } from '../api';
import type { Event, Photo } from '../types';
import { autoEnhanceImage, resizeBlobToJpeg } from '../autoEnhance';

const AdminPhotoManager: React.FC = () => {
  const { t } = useTranslation(['admin', 'common', 'photos']);
  const { slug } = useParams<{ slug: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deletingPhoto, setDeletingPhoto] = useState<Photo | null>(null);
  const [enhancingPhotoId, setEnhancingPhotoId] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      loadData();
    }
  }, [slug]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [eventData, photosData] = await Promise.all([
        getEvent(slug!),
        getPhotos(slug!),
      ]);
      setEvent(eventData);
      setPhotos(photosData);
      setError(null);
    } catch (err) {
      setError(t('admin:photoManagerPage.errors.load'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const togglePhoto = (photoId: string) => {
    const newSelected = new Set(selectedPhotos);
    if (newSelected.has(photoId)) {
      newSelected.delete(photoId);
    } else {
      newSelected.add(photoId);
    }
    setSelectedPhotos(newSelected);
  };

  const toggleFeatured = async (photoId: string, currentStatus: boolean) => {
    try {
      await setPhotoFeatured(photoId, !currentStatus);
      // Update local state
      setPhotos(photos.map(p => 
        p.id === photoId ? { ...p, is_featured: !currentStatus } : p
      ));
      setSuccess(currentStatus
        ? t('admin:photoManagerPage.success.featuredRemoved')
        : t('admin:photoManagerPage.success.featuredAdded'));
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(t('admin:photoManagerPage.errors.featured'));
      console.error(err);
    }
  };

  const toggleArchived = async (photoId: string, currentStatus: boolean) => {
    try {
      await setPhotoArchived(photoId, !currentStatus);
      setPhotos(photos.map(p =>
        p.id === photoId ? { ...p, archived_at: currentStatus ? null : new Date().toISOString() } : p
      ));
      setSuccess(currentStatus
        ? t('admin:photoManagerPage.success.unarchived')
        : t('admin:photoManagerPage.success.archived'));
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(t('admin:photoManagerPage.errors.archive'));
      console.error(err);
    }
  };

  const handleAutoEnhance = async (photo: Photo) => {
    if (photo.file_type === 'video/mp4') return;
    setEnhancingPhotoId(photo.id);
    try {
      const originalUrl = getOriginalUrl(slug!, photo.id, photo.file_type, photo.cache_version);
      const enhancedOriginal = await autoEnhanceImage(originalUrl);
      const enhancedPreview = await resizeBlobToJpeg(enhancedOriginal, 1920);
      await replacePhoto(slug!, photo.id, enhancedOriginal, enhancedPreview);
      await loadData();
      setSuccess(t('admin:photoManagerPage.success.enhanced'));
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(t('admin:photoManagerPage.errors.enhance'));
      console.error(err);
    } finally {
      setEnhancingPhotoId(null);
    }
  };

  const selectAll = () => {
    setSelectedPhotos(new Set(photos.map(p => p.id)));
  };

  const deselectAll = () => {
    setSelectedPhotos(new Set());
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      await deletePhoto(photoId);
      setSuccess(t('admin:photoManagerPage.success.movedToTrash'));
      setDeletingPhoto(null);
      await loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(t('admin:photoManagerPage.errors.delete'));
      console.error(err);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPhotos.size === 0) return;
    
    const confirm = window.confirm(t('admin:photoManagerPage.bulkTrashConfirm', { count: selectedPhotos.size }));
    if (!confirm) return;

    try {
      // Delete photos one by one
      let deleted = 0;
      for (const photoId of selectedPhotos) {
        try {
          await deletePhoto(photoId);
          deleted++;
        } catch (err) {
          console.error(`Failed to delete photo ${photoId}:`, err);
        }
      }
      
      setSuccess(t('admin:photoManagerPage.success.bulkMovedToTrash', {
        moved: deleted,
        total: selectedPhotos.size,
      }));
      setSelectedPhotos(new Set());
      await loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(t('admin:photoManagerPage.errors.bulkDelete'));
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link to="/admin" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
            {t('admin:photoManagerPage.back')}
          </Link>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">{event?.name}</h1>
              <p className="text-gray-600 mt-2">{t('admin:photoManagerPage.subtitle')}</p>
            </div>
            <Link
              to={`/admin/events/${slug}/upload`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              📷 {t('admin:photoManagerPage.uploadPhotos')}
            </Link>
          </div>
          <div className="mt-3">
            <Link to="/admin/trash" className="text-sm text-gray-600 hover:text-gray-900 inline-flex items-center gap-1">
              <Trash2 className="w-4 h-4" /> {t('admin:photoManagerPage.viewTrash')}
            </Link>
          </div>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Bulk Action Bar */}
        {selectedPhotos.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 px-4 py-3 rounded mb-4 flex items-center justify-between">
            <span className="text-blue-900 font-medium">
              {t('admin:photoManagerPage.selected', { count: selectedPhotos.size })}
            </span>
            <div className="flex gap-2">
              <button
                onClick={deselectAll}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition text-sm"
              >
                {t('photos:selection.deselectAll')}
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm"
              >
                🗑️ {t('admin:photoManagerPage.moveToTrash')}
              </button>
            </div>
          </div>
        )}

        {/* Photo Stats */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold text-gray-900">{photos.length}</span>
              <span className="text-gray-600 ml-2">{t('admin:photoManagerPage.photoCount', { count: photos.length })}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition text-sm"
              >
                {t('photos:selection.selectAll')}
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-gray-600">{t('admin:photoManagerPage.loading')}</p>
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600 mb-4">{t('admin:photoManagerPage.empty')}</p>
            <Link
              to={`/admin/events/${slug}/upload`}
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              {t('admin:photoManagerPage.uploadPhotos')}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className={`relative bg-white rounded-lg shadow overflow-hidden group cursor-pointer ${
                  selectedPhotos.has(photo.id) ? 'ring-4 ring-blue-500' : ''
                }`}
                onClick={() => togglePhoto(photo.id)}
              >
                <div className="aspect-square">
                  <img
                    src={getPreviewUrl(slug!, photo.id, photo.file_type, photo.cache_version)}
                    alt={photo.original_filename}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                
                {/* Checkbox */}
                <div className="absolute top-2 left-2">
                  <input
                    type="checkbox"
                    checked={selectedPhotos.has(photo.id)}
                    onChange={() => togglePhoto(photo.id)}
                    className="w-5 h-5 rounded"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                {/* Featured badge */}
                {!!photo.is_featured && (
                  <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded text-xs font-bold">
                    ⭐
                  </div>
                )}

                {/* Archived badge */}
                {!!photo.archived_at && (
                  <div className="absolute top-2 right-2 mt-8 bg-gray-700 text-white px-2 py-1 rounded text-xs font-bold" style={{ top: photo.is_featured ? '2.25rem' : '0.5rem' }}>
                    {t('admin:photoManagerPage.archived')}
                  </div>
                )}

                {/* Actions overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 flex-wrap">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFeatured(photo.id, photo.is_featured || false);
                    }}
                    className={`px-3 py-2 rounded transition text-sm flex items-center gap-1 ${
                      photo.is_featured
                        ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                        : 'bg-gray-700 text-white hover:bg-gray-600'
                    }`}
                    title={photo.is_featured ? t('photos:featured.remove') : t('photos:featured.mark')}
                  >
                    <Star className={`w-4 h-4 ${photo.is_featured ? 'fill-current' : ''}`} />
                    {photo.is_featured ? t('photos:featured.featured') : t('photos:featured.feature')}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleArchived(photo.id, !!photo.archived_at);
                    }}
                    className="px-3 py-2 rounded transition text-sm flex items-center gap-1 bg-gray-700 text-white hover:bg-gray-600"
                    title={photo.archived_at ? t('admin:photoManagerPage.unarchive') : t('admin:photoManagerPage.archiveTooltip')}
                  >
                    {photo.archived_at ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                    {photo.archived_at ? t('admin:photoManagerPage.unarchive') : t('admin:photoManagerPage.archive')}
                  </button>
                  {photo.file_type !== 'video/mp4' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAutoEnhance(photo);
                      }}
                      disabled={enhancingPhotoId === photo.id}
                      className="px-3 py-2 rounded transition text-sm flex items-center gap-1 bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
                      title={t('admin:photoManagerPage.enhanceTooltip')}
                    >
                      {enhancingPhotoId === photo.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                      {t('admin:photoManagerPage.enhance')}
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingPhoto(photo);
                    }}
                    className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm"
                  >
                    🗑️ {t('admin:trash')}
                  </button>
                </div>

                {/* Info */}
                <div className="p-2">
                  <p className="text-xs text-gray-600 truncate">{photo.original_filename}</p>
                  {photo.favorites_count > 0 && (
                    <p className="text-xs text-gray-500">❤️ {photo.favorites_count}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingPhoto && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4 text-red-600">🗑️ {t('admin:photoManagerPage.moveToTrash')}</h2>
                <div className="mb-4">
                  <img
                    src={getPreviewUrl(slug!, deletingPhoto.id, deletingPhoto.file_type, deletingPhoto.cache_version)}
                    alt={deletingPhoto.original_filename}
                    className="w-full rounded"
                  />
                </div>
                <p className="mb-4 text-gray-700">
                  {t('admin:photoManagerPage.singleTrashBefore')}{' '}
                  <strong>{deletingPhoto.original_filename}</strong>
                  {t('admin:photoManagerPage.singleTrashAfter')}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleDeletePhoto(deletingPhoto.id)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                    {t('admin:photoManagerPage.moveToTrash')}
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

export default AdminPhotoManager;
