import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const NotificationContext = createContext(null);

const NOTIF_STORAGE_KEY = 'mediguard_notifications_v1';

export const NotificationProvider = ({ children, currentUser }) => {
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem(NOTIF_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save to localStorage on state update
  useEffect(() => {
    try {
      localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(notifications));
    } catch {
      // Ignore storage errors
    }
  }, [notifications]);

  // Request browser Web Notification permission
  const requestBrowserPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch (err) {
        console.warn('Browser notification permission error:', err);
      }
    }
  }, []);

  // Trigger immediate or scheduled desktop browser alert
  const triggerBrowserAlert = useCallback((title, options = {}) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          ...options,
        });
      } catch (err) {
        console.warn('Failed to trigger browser notification:', err);
      }
    }
  }, []);

  // Add a new notification
  const addNotification = useCallback((notif) => {
    const newNotif = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title: notif.title || 'Medicine Reminder',
      message: notif.message || 'Time to take your medication.',
      medicineName: notif.medicineName || '',
      time: notif.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      category: notif.category || 'Medicine',
      type: notif.type || 'info', // 'info' | 'warning' | 'success'
      read: false,
      timestamp: Date.now(),
    };

    setNotifications((prev) => [newNotif, ...prev]);

    // Trigger browser alert if supported
    triggerBrowserAlert(`💊 ${newNotif.title}`, {
      body: newNotif.message,
    });
  }, [triggerBrowserAlert]);

  // Sync notifications with currentUser's regular medicines
  useEffect(() => {
    const meds = currentUser?.regularMedicines || currentUser?.regular_medicines || [];
    if (!Array.isArray(meds) || meds.length === 0) return;

    meds.forEach((m) => {
      const name = typeof m === 'string' ? m : (m?.name || m?.rxnorm_name || '');
      const time = typeof m === 'object' ? (m?.reminderTime || m?.reminder_time || '08:30 AM') : '08:30 AM';
      const dosage = typeof m === 'object' ? (m?.dosage || '') : '';

      if (!name) return;

      setNotifications((prev) => {
        const exists = prev.some((n) => n.medicineName.toLowerCase() === name.toLowerCase() && n.time === time);
        if (exists) return prev;

        const dosageText = dosage ? ` (${dosage})` : '';
        return [
          {
            id: `notif-med-${name}-${time}`,
            title: 'Dose Reminder',
            message: `Time to take ${name}${dosageText} scheduled for ${time}.`,
            medicineName: name,
            time: time,
            category: 'Medicine Reminder',
            type: 'info',
            read: false,
            timestamp: Date.now(),
          },
          ...prev,
        ];
      });
    });
  }, [currentUser]);

  const markAsRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearAll,
        requestBrowserPermission,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    return {
      notifications: [],
      unreadCount: 0,
      addNotification: () => {},
      markAsRead: () => {},
      markAllAsRead: () => {},
      clearAll: () => {},
      requestBrowserPermission: () => {},
    };
  }
  return ctx;
};

export default NotificationContext;
