import React from 'react';
import './Header.css';

/**
 * Header Component
 * Top header bar for the MediGuard Dashboard application shell.
 */
export const Header = ({ currentUser, onToggleMobileMenu }) => {
  const userName = currentUser?.fullName || currentUser?.full_name || currentUser?.email || 'User';
  
  // Extract initials for avatar badge
  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return 'MG';
    const parts = name.trim().split(' ');
    if (parts.length >= 2 && parts[0][0] && parts[1][0]) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="app-header">
      <div className="header-left">
        {/* Mobile Hamburger Toggle Button */}
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={onToggleMobileMenu}
          aria-label="Open menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div className="header-title-badge">
          <span className="portal-tag">MediGuard Safety Network</span>
        </div>
      </div>

      <div className="header-right">
        {/* Notification Icon Badge */}
        <button type="button" className="header-icon-btn" aria-label="Notifications">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className="notification-badge-dot" />
        </button>

        {/* User Profile Avatar */}
        <div className="header-user-profile">
          <div className="user-avatar">{getInitials(userName)}</div>
          <span className="user-name-display">{userName}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
