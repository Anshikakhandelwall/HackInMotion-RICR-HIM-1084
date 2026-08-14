import React, { useState, useEffect, useRef } from 'react';
import { getUserDisplayName, getUserInitials } from '../../utils/userUtils';
import LanguageSelector from '../common/LanguageSelector';
import { useLanguage } from '../../context/LanguageContext';
import './Header.css';

/**
 * Header Component
 * Top header bar for the MediGuard Dashboard application shell.
 * Includes interactive Notification Bell 🔔 with unread count badge, dropdown panel, and outside-click handler.
 */
export const Header = ({ currentUser, isMobileMenuOpen = false, onToggleMobileMenu }) => {
  const { t } = useLanguage();
  const userName = getUserDisplayName(currentUser) || t('user');
  const userInitials = getUserInitials(currentUser);

  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 'notif-1', medicineName: 'Paracetamol', time: '08:30 AM', read: false },
    { id: 'notif-2', medicineName: 'Metformin', time: '01:00 PM', read: false },
  ]);

  const dropdownRef = useRef(null);

  // Sync sample notifications if user medicines have reminder times
  useEffect(() => {
    const meds = currentUser?.regularMedicines || currentUser?.regular_medicines || [];
    const reminderMeds = meds.filter((m) => typeof m === 'object' && (m?.reminderTime || m?.reminder_time));
    if (reminderMeds.length > 0) {
      const mapped = reminderMeds.map((m, index) => ({
        id: `user-notif-${index}`,
        medicineName: m.name || 'Medicine',
        time: m.reminderTime || m.reminder_time || '08:30 AM',
        read: false,
      }));
      setNotifications(mapped);
    }
  }, [currentUser]);

  // Outside click listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsNotificationPanelOpen(false);
      }
    };
    if (isNotificationPanelOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotificationPanelOpen]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <header className="app-header">
      <div className="header-left">
        {/* Mobile Hamburger / Menu Toggle Button */}
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={onToggleMobileMenu}
          aria-label={isMobileMenuOpen ? t('closeMenu') : t('openMenu')}
        >
          {isMobileMenuOpen ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>

        <div className="header-title-badge">
          <span className="portal-tag">{t('networkPortalTag')}</span>
        </div>
      </div>

      <div className="header-right" ref={dropdownRef}>
        {/* Language Selector */}
        <LanguageSelector />

        {/* Notification Icon Badge */}
        <button
          type="button"
          className={`header-icon-btn ${isNotificationPanelOpen ? 'active' : ''}`}
          onClick={() => setIsNotificationPanelOpen((prev) => !prev)}
          aria-label={t('notifications')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {unreadCount > 0 && (
            <span className="notification-badge-count">{unreadCount}</span>
          )}
        </button>

        {/* Notification Dropdown Panel */}
        {isNotificationPanelOpen && (
          <div className="notification-panel-dropdown" role="dialog" aria-label={t('notificationsPanelTitle')}>
            <div className="notif-panel-header">
              <h4 className="notif-panel-title">{t('notificationsPanelTitle')}</h4>
              {unreadCount > 0 && (
                <button
                  type="button"
                  className="mark-all-read-btn"
                  onClick={handleMarkAllAsRead}
                >
                  {t('markAllRead')}
                </button>
              )}
            </div>

            <div className="notif-panel-body">
              {notifications.length === 0 ? (
                <div className="notif-empty-state">
                  <div className="empty-bell-icon">🔔</div>
                  <p className="empty-title">{t('noNewNotifications')}</p>
                  <p className="empty-subtext">{t('allCaughtUp')}</p>
                </div>
              ) : (
                <ul className="notif-list">
                  {notifications.map((notif) => (
                    <li
                      key={notif.id}
                      className={`notif-card ${!notif.read ? 'unread' : 'read'}`}
                      onClick={() => handleMarkAsRead(notif.id)}
                    >
                      <div className="notif-card-header">
                        <span className="notif-category">
                          <span className="notif-pill-emoji" aria-hidden="true">💊</span>
                          {t('medicineReminderCategory')}
                        </span>
                        {!notif.read && <span className="unread-dot" title={t('clickToMarkRead')} />}
                      </div>
                      <p className="notif-message">
                        {t('notifMessagePre')}<strong>{notif.medicineName}</strong>{t('notifMessagePost')}
                      </p>
                      <div className="notif-card-footer">
                        <span className="notif-time-badge">⏰ {notif.time}</span>
                        {!notif.read && <span className="mark-read-hint">{t('clickToMarkRead')}</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* User Profile Avatar */}
        <div className="header-user-profile">
          <div className="user-avatar">{userInitials}</div>
          <span className="user-name-display">{userName}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;

