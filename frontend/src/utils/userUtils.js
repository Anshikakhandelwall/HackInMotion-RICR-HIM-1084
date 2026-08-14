/**
 * Helper utilities to extract user display name, first name, and avatar initials
 * consistently across all MediGuard components.
 */

/**
 * Gets the user's full display name (e.g. "Anshul Sharma").
 * Falls back to email or empty string if not found.
 */
export const getUserDisplayName = (user) => {
  if (!user) return '';

  // Direct properties
  if (typeof user.fullName === 'string' && user.fullName.trim()) return user.fullName.trim();
  if (typeof user.full_name === 'string' && user.full_name.trim()) return user.full_name.trim();
  if (typeof user.name === 'string' && user.name.trim()) return user.name.trim();

  // Supabase user_metadata
  const meta = user.user_metadata;
  if (meta) {
    if (typeof meta.full_name === 'string' && meta.full_name.trim()) return meta.full_name.trim();
    if (typeof meta.name === 'string' && meta.name.trim()) return meta.name.trim();
    if (typeof meta.displayName === 'string' && meta.displayName.trim()) return meta.displayName.trim();
  }

  // Fallback to email
  if (typeof user.email === 'string' && user.email.trim()) {
    return user.email.trim();
  }

  return '';
};

/**
 * Gets the user's first name for greetings (e.g. "Anshul").
 */
export const getUserFirstName = (user) => {
  const displayName = getUserDisplayName(user);
  if (!displayName) return 'there';

  if (displayName.includes('@')) {
    return displayName.split('@')[0];
  }

  return displayName.trim().split(/\s+/)[0];
};

/**
 * Gets 2-letter avatar initials for the user (e.g. "AS").
 */
export const getUserInitials = (user) => {
  const displayName = getUserDisplayName(user);
  if (!displayName) return 'MG';

  if (displayName.includes('@')) {
    const prefix = displayName.split('@')[0];
    return prefix.slice(0, 2).toUpperCase();
  }

  const parts = displayName.trim().split(/\s+/);
  if (parts.length >= 2 && parts[0][0] && parts[1][0]) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return displayName.slice(0, 2).toUpperCase();
};
