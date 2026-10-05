export const DEFAULT_AVATAR = '/brand/default-avatar.svg';

/**
 * Validates an avatar URL. If it's empty, null, undefined, or an expired blob URL,
 * returns a safe fallback.
 */
export function getSafeAvatar(target, fallback = DEFAULT_AVATAR) {
  if (!target) return fallback;

  // If passed an object (user / creator / account)
  if (typeof target === 'object') {
    const raw = target.avatar_url || target.avatar || target.userAvatar || target.creatorAvatar;
    return getSafeAvatar(raw, fallback);
  }

  if (typeof target === 'string') {
    const trimmed = target.trim();
    if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return fallback;
    // Expired or invalid blob URLs that cannot survive page refresh
    if (trimmed.startsWith('blob:')) return fallback;
    return trimmed;
  }

  return fallback;
}

/**
 * Standard onError image handler to prevent broken image icons
 */
export function handleAvatarError(e, fallback = DEFAULT_AVATAR) {
  if (e && e.currentTarget) {
    e.currentTarget.onerror = null; // Prevent infinite loop if fallback fails
    e.currentTarget.src = fallback;
  }
}
