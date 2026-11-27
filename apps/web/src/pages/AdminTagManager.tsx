import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/Navbar';
import { getTags, createTag, updateTag, deleteTag } from '../api';
import type { Tag, UpdateTagRequest } from '../types';

const AdminTagManager: React.FC = () => {
  const { t } = useTranslation(['admin', 'common']);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Create modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagSlug, setNewTagSlug] = useState('');
  
  // Edit modal state
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  
  // Delete confirmation
  const [deletingTag, setDeletingTag] = useState<Tag | null>(null);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      setLoading(true);
      const data = await getTags();
      setTags(data);
      setError(null);
    } catch (err) {
      setError(t('admin:tagManagerPage.errors.load'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTagName) {
      setError(t('admin:tagManagerPage.errors.nameRequired'));
      return;
    }

    try {
      await createTag({
        name: newTagName,
        slug: newTagSlug || undefined,
      });
      
      setSuccess(t('admin:tagManagerPage.success.created'));
      setShowCreateModal(false);
      setNewTagName('');
      setNewTagSlug('');
      await loadTags();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(t('admin:tagManagerPage.errors.create'));
      console.error(err);
    }
  };

  const openEditModal = (tag: Tag) => {
    setEditingTag(tag);
    setEditName(tag.name);
    setEditSlug(tag.slug);
  };

  const handleUpdateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTag) return;

    try {
      const updates: UpdateTagRequest = {};
      
      if (editName !== editingTag.name) {
        updates.name = editName;
      }
      
      if (editSlug !== editingTag.slug) {
        updates.slug = editSlug;
      }

      await updateTag(editingTag.id, updates);
      
      setSuccess(t('admin:tagManagerPage.success.updated'));
      setEditingTag(null);
      await loadTags();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(t('admin:tagManagerPage.errors.update'));
      console.error(err);
    }
  };

  const handleDeleteTag = async () => {
    if (!deletingTag) return;

    try {
      await deleteTag(deletingTag.id);
      
      setSuccess(t('admin:tagManagerPage.success.deleted'));
      setDeletingTag(null);
      await loadTags();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(t('admin:tagManagerPage.errors.delete'));
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link to="/admin" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
            {t('admin:tagManagerPage.back')}
          </Link>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">{t('admin:tagManagerPage.title')}</h1>
              <p className="text-gray-600 mt-2">{t('admin:tagManagerPage.subtitle')}</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              + {t('admin:tagManagerPage.create')}
            </button>
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

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-gray-600">{t('admin:tagManagerPage.loading')}</p>
          </div>
        ) : tags.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600 mb-4">{t('admin:tagManagerPage.empty')}</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              {t('admin:tagManagerPage.createFirst')}
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin:tagManagerPage.name')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin:tagManagerPage.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tags.map((tag) => (
                  <tr key={tag.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {tag.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <code className="bg-gray-100 px-2 py-1 rounded">{tag.slug}</code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openEditModal(tag)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        {t('common:actions.edit')}
                      </button>
                      <button
                        onClick={() => setDeletingTag(tag)}
                        className="text-red-600 hover:text-red-900"
                      >
                        {t('common:actions.delete')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Create Tag Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4">{t('admin:tagManagerPage.createTitle')}</h2>
                <form onSubmit={handleCreateTag}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('admin:tagManagerPage.name')} *
                      </label>
                      <input
                        type="text"
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        placeholder={t('admin:tagManagerPage.namePlaceholder')}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('admin:tagManagerPage.slugOptional')}
                      </label>
                      <input
                        type="text"
                        value={newTagSlug}
                        onChange={(e) => setNewTagSlug(e.target.value)}
                        placeholder={t('admin:tagManagerPage.slugPlaceholder')}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {t('admin:tagManagerPage.slugHint')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 mt-6">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      {t('admin:tagManagerPage.create')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                    >
                      {t('common:actions.cancel')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Tag Modal */}
        {editingTag && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4">{t('admin:tagManagerPage.editTitle')}</h2>
                <form onSubmit={handleUpdateTag}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('admin:tagManagerPage.name')}
                      </label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Slug
                      </label>
                      <input
                        type="text"
                        value={editSlug}
                        onChange={(e) => setEditSlug(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-3 mt-6">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      {t('admin:tagManagerPage.saveChanges')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingTag(null)}
                      className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                    >
                      {t('common:actions.cancel')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Delete Tag Modal */}
        {deletingTag && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4 text-red-600">⚠️ {t('admin:tagManagerPage.deleteTitle')}</h2>
                <p className="mb-4 text-gray-700">
                  {t('admin:tagManagerPage.deleteBefore')}{' '}
                  <strong>{deletingTag.name}</strong>
                  {t('admin:tagManagerPage.deleteAfter')}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleDeleteTag}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                    {t('admin:tagManagerPage.deleteTitle')}
                  </button>
                  <button
                    onClick={() => setDeletingTag(null)}
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

export default AdminTagManager;
