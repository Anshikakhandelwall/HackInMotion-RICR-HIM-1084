/**
 * ThemeContext — Light / Dark / System theme support for MediGuard.
 *
 * Theme is applied by setting data-theme="light" or data-theme="dark"
 * on the <html> element. All colours resolve from CSS custom properties
 * in global.css, so every existing component picks up dark mode
 * automatically via the [data-theme="dark"] selector overrides.
 *
 * Priority:
 *   1. User's explicit choice persisted in localStorage ('light' | 'dark' | 'system')
 *   2. On 'system' — respects prefers-color-scheme media query
 *   3. Falls back to 'system' if nothing stored
 *
 * The context exposes:
 *   theme         — the stored preference: 'light' | 'dark' | 'system'
 *   resolvedTheme — the actually-applied theme: 'light' | 'dark'
 *   setTheme(t)   — update preference (also persists to localStorage)
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'mediguard_theme';

const ThemeContext = createContext(null);

const getSystemTheme = () =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

const resolve = (theme) => (theme === 'system' ? getSystemTheme() : theme);

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
    } catch {
      // localStorage not available
    }
    return 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState(() => resolve(theme));

  // Apply data-theme attribute whenever resolved theme changes
  useEffect(() => {
    const resolved = resolve(theme);
    setResolvedTheme(resolved);
    document.documentElement.setAttribute('data-theme', resolved);
  }, [theme]);

  // Listen for OS-level preference changes when mode is 'system'
  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => {
      const next = e.matches ? 'dark' : 'light';
      setResolvedTheme(next);
      document.documentElement.setAttribute('data-theme', next);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  const setTheme = useCallback((newTheme) => {
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch {
      // ignore
    }
    setThemeState(newTheme);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
};

export default ThemeContext;
