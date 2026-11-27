import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Capacitor } from '@capacitor/core';
import { UserPlus, X, Mail, Check, Link as LinkIcon, Copy, Trash2 } from 'lucide-react';
import { getCollaborators, inviteCollaborator, removeCollaborator, searchUsers, createInviteLink, getInviteLinks, revokeInviteLink, updateCollaboratorRole } from '../api';
import type { Collaborator, InviteLink, CollaboratorRole } from '../types';
import { config } from '../config';
import { localeForLanguage } from '../i18n/language';

// On native (Capacitor) the origin is localhost, so use the configured domain instead.
const getInviteBaseUrl = (): string =>
  Capacitor.isNativePlatform() ? `https://${config.domain}` : window.location.origin;

interface CollaboratorManagerProps {
  eventSlug: string;
  eventName: string;
}

const CollaboratorManager: React.FC<CollaboratorManagerProps> = ({ eventSlug, eventName }) => {
  const { t, i18n } = useTranslation('events');
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [inviteLinks, setInviteLinks] = useState<InviteLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [linksLoading, setLinksLoading] = useState(false);
  const [creatingLink, setCreatingLink] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<CollaboratorRole>('uploader');
  const [inviteLinkRole, setInviteLinkRole] = useState<CollaboratorRole>('uploader');
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [updatingRoleEmail, setUpdatingRoleEmail] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Array<{ id: string; email: string; name: string | null }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadCollaborators();
    loadInviteLinks();
  }, [eventSlug]);

  useEffect(() => {
    // Close suggestions when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEmailChange = (value: string) => {
    setInviteEmail(value);
    
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Don't search if input is too short
    if (value.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    
    // Debounce search
    const timeout = setTimeout(async () => {
      try {
        const users = await searchUsers(value);
        setSuggestions(users);
        setShowSuggestions(users.length > 0);
      } catch (err) {
        console.error('Failed to search users:', err);
      }
    }, 300);
    
    setSearchTimeout(timeout);
  };

  const selectSuggestion = (email: string) => {
    setInviteEmail(email);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const loadCollaborators = async () => {
    try {
      setLoading(true);
      const data = await getCollaborators(eventSlug);
      setCollaborators(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load collaborators:', err);
      setError(t('collaboration.errors.load'));
    } finally {
      setLoading(false);
    }
  };

  const loadInviteLinks = async () => {
    try {
      setLinksLoading(true);
      const links = await getInviteLinks(eventSlug);
      setInviteLinks(links);
    } catch (err) {
      console.error('Failed to load invite links:', err);
    } finally {
      setLinksLoading(false);
    }
  };

  const handleCreateLink = async () => {
    try {
      setCreatingLink(true);
      setError(null);
      const newLink = await createInviteLink(eventSlug, inviteLinkRole);
      setInviteLinks([newLink, ...inviteLinks]);
      setSuccess(t('collaboration.success.linkCreated'));
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Failed to create invite link:', err);
      setError(
        err.response?.data?.code
          ? t('collaboration.errors.createLink')
          : (err.response?.data?.error || t('collaboration.errors.createLink')),
      );
    } finally {
      setCreatingLink(false);
    }
  };

  const handleCopyLink = (token: string) => {
    const inviteUrl = `${getInviteBaseUrl()}/invite/${token}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleRevokeLink = async (token: string) => {
    if (!confirm(t('collaboration.inviteLinks.revokeConfirm'))) {
      return;
    }

    try {
      await revokeInviteLink(eventSlug, token);
      setInviteLinks(inviteLinks.filter(link => link.token !== token));
      setSuccess(t('collaboration.success.linkRevoked'));
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to revoke invite link:', err);
      setError(t('collaboration.errors.revokeLink'));
    }
  };

  const handleInvite = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    
    console.log('[CollaboratorManager] Starting invite for:', inviteEmail);
    
    if (!inviteEmail || !inviteEmail.includes('@')) {
      setError(t('collaboration.errors.invalidEmail'));
      return;
    }

    try {
      setInviting(true);
      setError(null);
      setSuccess(null);
      
      console.log('[CollaboratorManager] Calling inviteCollaborator API...');
      const result = await inviteCollaborator(eventSlug, inviteEmail, inviteRole);
      console.log('[CollaboratorManager] Invite successful:', result);
      
      setSuccess(t('collaboration.success.invitationSent', { email: inviteEmail }));
      setInviteEmail('');
      
      // Reload collaborators list
      console.log('[CollaboratorManager] Reloading collaborators list...');
      await loadCollaborators();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('[CollaboratorManager] Failed to invite collaborator:', err);
      console.error('[CollaboratorManager] Error details:', {
        message: err.message,
        response: err.response,
        status: err.response?.status,
        data: err.response?.data
      });
      setError(
        err.response?.data?.code
          ? t('collaboration.errors.invite')
          : (err.response?.data?.error || err.message || t('collaboration.errors.invite')),
      );
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (email: string) => {
    if (!confirm(t('collaboration.list.removeConfirm', { email }))) {
      return;
    }

    try {
      await removeCollaborator(eventSlug, email);
      setSuccess(t('collaboration.success.removed', { email }));
      await loadCollaborators();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to remove collaborator:', err);
      setError(t('collaboration.errors.remove'));
    }
  };

  const handleRoleChange = async (email: string, role: CollaboratorRole) => {
    try {
      setUpdatingRoleEmail(email);
      await updateCollaboratorRole(eventSlug, email, role);
      await loadCollaborators();
      setSuccess(t('collaboration.success.roleUpdated', {
        email,
        role: t(`collaboration.roles.${role}`),
      }));
      setTimeout(() => setSuccess(null), 2500);
    } catch (err) {
      console.error('Failed to update role:', err);
      setError(t('collaboration.errors.updateRole'));
    } finally {
      setUpdatingRoleEmail(null);
    }
  };

  const getRoleBadgeColor = (role: CollaboratorRole) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700';
      case 'editor':
        return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700';
      case 'uploader':
        return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('collaboration.manageTitle')}</h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          {t('collaboration.inviteDescription', { eventName })}
</p>
      </div>

      {/* Invite Form */}
      <div className="mb-6">
        <label htmlFor="invite-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('collaboration.inviteByEmail')}
        </label>
        <div className="flex gap-2">
          <div className="flex-1 relative" ref={suggestionsRef}>
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
            <input
              id="invite-email"
              type="email"
              value={inviteEmail}
              onChange={(e) => handleEmailChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleInvite(e);
                } else if (e.key === 'Escape') {
                  setShowSuggestions(false);
                }
              }}
              onFocus={() => {
                if (suggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              placeholder={t('collaboration.emailPlaceholder')}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={inviting}
              autoComplete="off"
            />
            
            {/* Autocomplete Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {suggestions.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => selectSuggestion(user.email)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 focus:bg-gray-100 dark:focus:bg-gray-600 focus:outline-none transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{user.email}</div>
                        {user.name && <div className="text-xs text-gray-500 dark:text-gray-400">{user.name}</div>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as CollaboratorRole)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            disabled={inviting}
          >
            <option value="viewer">{t('collaboration.roles.viewer')}</option>
            <option value="uploader">{t('collaboration.roles.uploader')}</option>
            <option value="editor">{t('collaboration.roles.editor')}</option>
            <option value="admin">{t('collaboration.roles.admin')}</option>
          </select>
          <button
            type="button"
            onClick={handleInvite}
            disabled={inviting || !inviteEmail}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            {inviting ? t('collaboration.sending') : t('collaboration.invite')}
          </button>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-lg text-sm">
          {success}
        </div>
      )}

      {/* Invite Links Section */}
      <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('collaboration.inviteLinks.title')}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('collaboration.inviteLinks.description')}</p>
          </div>
          <button
            type="button"
            onClick={handleCreateLink}
            disabled={creatingLink}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
          >
            <LinkIcon className="w-4 h-4" />
            {creatingLink ? t('collaboration.inviteLinks.creating') : t('collaboration.inviteLinks.create')}
          </button>
        </div>
        <div className="mb-3">
          <label className="text-xs text-gray-600 dark:text-gray-400 mr-2">{t('collaboration.inviteLinks.role')}</label>
          <select
            value={inviteLinkRole}
            onChange={(e) => setInviteLinkRole(e.target.value as CollaboratorRole)}
            className="px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            disabled={creatingLink}
          >
            <option value="viewer">{t('collaboration.roles.viewer')}</option>
            <option value="uploader">{t('collaboration.roles.uploader')}</option>
            <option value="editor">{t('collaboration.roles.editor')}</option>
            <option value="admin">{t('collaboration.roles.admin')}</option>
          </select>
        </div>

        {linksLoading ? (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-white"></div>
          </div>
        ) : inviteLinks.length === 0 ? (
          <div className="text-center py-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
            <LinkIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 dark:text-gray-400 text-sm">{t('collaboration.inviteLinks.empty')}</p>
            <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">{t('collaboration.inviteLinks.emptyHint')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {inviteLinks.map((link) => (
              <div
                key={link.token}
                className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex-1 min-w-0 mr-3">
                  <div className="flex items-center gap-2 mb-1">
                    <LinkIcon className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <code className="text-xs text-gray-600 dark:text-gray-400 font-mono truncate">
                      {getInviteBaseUrl()}/invite/{link.token}
                    </code>
                  </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span>
                      {t('collaboration.inviteLinks.created', {
                        date: new Date(link.created_at).toLocaleDateString(localeForLanguage(i18n.resolvedLanguage)),
                      })}
                    </span>
                    <span>{t('collaboration.inviteLinks.roleValue', { role: t(`collaboration.roles.${link.role}`) })}</span>
                    {link.use_count > 0 && (
                      <span className="text-green-600">{t('collaboration.inviteLinks.used', { count: link.use_count })}</span>
                    )}
                    {link.last_used_at && (
                      <span>
                        {t('collaboration.inviteLinks.lastUsed', {
                          date: new Date(link.last_used_at).toLocaleDateString(localeForLanguage(i18n.resolvedLanguage)),
                        })}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyLink(link.token)}
                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                    title={t('collaboration.inviteLinks.copy')}
                  >
                    {copiedToken === link.token ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRevokeLink(link.token)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    title={t('collaboration.inviteLinks.revoke')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Collaborators List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm">{t('collaboration.list.loading')}</p>
        </div>
      ) : collaborators.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 dark:text-gray-400 text-sm">{t('collaboration.list.empty')}</p>
          <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">{t('collaboration.list.emptyHint')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            {t('collaboration.list.title', { count: collaborators.length })}
          </h3>
          {collaborators.map((collaborator) => (
            <div
              key={collaborator.email}
              className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {collaborator.name || collaborator.email}
                  </p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${getRoleBadgeColor(collaborator.role)}`}>
                    {t(`collaboration.roles.${collaborator.role}`)}
                  </span>
                </div>
                {collaborator.name && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{collaborator.email}</p>
                )}
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {t('collaboration.list.invited', {
                    date: new Date(collaborator.invited_at).toLocaleDateString(localeForLanguage(i18n.resolvedLanguage)),
                  })}
                </p>
              </div>
              <select
                value={collaborator.role}
                onChange={(e) => {
                  void handleRoleChange(collaborator.email, e.target.value as CollaboratorRole);
                }}
                disabled={updatingRoleEmail === collaborator.email}
                className="ml-3 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                title={t('collaboration.list.changeRole')}
              >
                <option value="viewer">{t('collaboration.roles.viewer')}</option>
                <option value="uploader">{t('collaboration.roles.uploader')}</option>
                <option value="editor">{t('collaboration.roles.editor')}</option>
                <option value="admin">{t('collaboration.roles.admin')}</option>
              </select>
              <button
                type="button"
                onClick={() => handleRemove(collaborator.email)}
                className="ml-3 p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                title={t('collaboration.list.remove')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CollaboratorManager;
