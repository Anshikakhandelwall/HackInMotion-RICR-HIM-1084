/**
 * SettingsPage — MediGuard Account Settings
 *
 * Sections:
 *   1. Account & Security  — live email from Supabase auth; password reset via Supabase
 *   2. Notifications       — four toggles backed by /api/settings/ (PATCH)
 *   3. Privacy & Data      — data export, clear history, delete account
 *   4. Preferences         — language (uses existing LanguageContext), default safety check
 *   5. Safety Information  — static responsible-use notice
 *
 * Rules enforced here:
 *   - All data comes from the authenticated user only (useAuth + apiFetch)
 *   - No hardcoded user info, no mock JSON
 *   - Every backend mutation has optimistic UI + rollback on failure
 *   - Every destructive action requires a confirmation modal
 *   - Toast feedback for all operations
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import useAuth from '../../hooks/useAuth';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import {
  getSettings,
  updateSettings,
  exportUserData,
  deleteAccount,
} from '../../services/settings/settingsService';
import { clearHistory } from '../../services/history/historyService';
import './SettingsPage.css';

// ── Small reusable pieces ──────────────────────────────────────────────────

/** Toggle switch with ON/OFF label */
const Toggle = ({ checked, onChange, disabled, id }) => (
  <div className="settings-toggle-wrap">
    <label className="settings-toggle" htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      <span className="settings-toggle-slider" />
    </label>
    <span className="settings-toggle-label">{checked ? 'ON' : 'OFF'}</span>
  </div>
);

/** Confirmation modal */
const ConfirmModal = ({ title, body, warning, confirmLabel, onConfirm, onCancel, isLoading }) => (
  <div className="settings-modal-overlay" role="dialog" aria-modal="true">
    <div className="settings-modal">
      <h2 className="settings-modal-title">{title}</h2>
      <p className="settings-modal-body">{body}</p>
      {warning && <div className="settings-modal-warning">{warning}</div>}
      <div className="settings-modal-actions">
        <button
          type="button"
          className="settings-modal-cancel"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="button"
          className="settings-modal-confirm"
          onClick={onConfirm}
          disabled={isLoading}
        >
          {isLoading ? 'Please wait…' : confirmLabel}
        </button>
      </div>
    </div>
  </div>
);

// ── Toast ──────────────────────────────────────────────────────────────────

const useToast = () => {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const showToast = useCallback((message, type = 'success') => {
    clearTimeout(timerRef.current);
    setToast({ message, type });
    timerRef.current = setTimeout(() => setToast(null), 3800);
  }, []);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return { toast, showToast };
};

// ── Section card ───────────────────────────────────────────────────────────

const SettingsCard = ({ iconClass, iconSvg, title, desc, children }) => (
  <div className="settings-card">
    <div className="settings-card-header">
      <div className={`settings-card-icon ${iconClass}`}>{iconSvg}</div>
      <div className="settings-card-header-text">
        <p className="settings-card-title">{title}</p>
        <p className="settings-card-desc">{desc}</p>
      </div>
    </div>
    {children}
  </div>
);

// ── Loading skeleton rows ──────────────────────────────────────────────────

const SkeletonRows = ({ count = 3 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="settings-loading-row">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
          <div className="skeleton-text" style={{ width: '40%' }} />
          <div className="skeleton-text" style={{ width: '62%', opacity: 0.6 }} />
        </div>
        <div className="skeleton-btn" />
      </div>
    ))}
  </>
);

// ── Main component ─────────────────────────────────────────────────────────

export const SettingsPage = () => {
  const { user, signOut, resetPassword } = useAuth();
  const { setLanguage } = useLanguage();
  const { theme: localTheme, setTheme: setLocalTheme } = useTheme();

  // ── Remote settings state ──────────────────────────────────────────────
  const [settings, setSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsError, setSettingsError] = useState(null);

  const { toast, showToast } = useToast();

  // ── Modal states ───────────────────────────────────────────────────────
  const [modal, setModal] = useState(null); // 'clearHistory' | 'deleteAccount'
  const [modalLoading, setModalLoading] = useState(false);

  // ── Password reset loading ─────────────────────────────────────────────
  const [pwResetSent, setPwResetSent] = useState(false);
  const [pwResetLoading, setPwResetLoading] = useState(false);

  // ── Data export loading ────────────────────────────────────────────────
  const [exportLoading, setExportLoading] = useState(false);

  // ── Toggle update in-flight tracker ───────────────────────────────────
  const [togglingField, setTogglingField] = useState(null);

  // ── Fetch settings on mount ────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setSettingsLoading(true);
    setSettingsError(null);

    getSettings()
      .then((res) => {
        if (!cancelled) {
          setSettings(res.settings);
          setSettingsLoading(false);
          // Sync appearance stored on server → ThemeContext
          if (res.settings?.appearance) {
            setLocalTheme(res.settings.appearance);
          }
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setSettingsError(err?.message || 'Unable to load settings.');
          setSettingsLoading(false);
        }
      });

    return () => { cancelled = true; };
  // setLocalTheme is a stable useCallback ref from ThemeContext
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setLocalTheme]);

  // ── Notification toggle handler ────────────────────────────────────────
  const handleToggle = async (field, newValue) => {
    if (togglingField) return;
    const previous = settings[field];

    // Optimistic update
    setSettings((prev) => ({ ...prev, [field]: newValue }));
    setTogglingField(field);

    try {
      const res = await updateSettings({ [field]: newValue });
      setSettings(res.settings);
      showToast('Settings saved.', 'success');
    } catch (err) {
      // Rollback on failure
      setSettings((prev) => ({ ...prev, [field]: previous }));
      showToast(err?.message || 'Failed to save settings. Please try again.', 'error');
    } finally {
      setTogglingField(null);
    }
  };

  // ── Preference change handler (language, appearance, default_safety_check)
  const handlePrefChange = async (field, value) => {
    const previous = settings[field];
    setSettings((prev) => ({ ...prev, [field]: value }));

    // Propagate to live contexts so the UI responds immediately
    if (field === 'language') setLanguage(value);
    if (field === 'appearance') setLocalTheme(value);

    try {
      const res = await updateSettings({ [field]: value });
      setSettings(res.settings);
      showToast('Preference saved.', 'success');
    } catch (err) {
      setSettings((prev) => ({ ...prev, [field]: previous }));
      if (field === 'language') setLanguage(previous);
      if (field === 'appearance') setLocalTheme(previous);
      showToast(err?.message || 'Failed to save preference.', 'error');
    }
  };

  // ── Password reset via Supabase ────────────────────────────────────────
  const handlePasswordReset = async () => {
    if (!user?.email || pwResetLoading) return;
    setPwResetLoading(true);
    try {
      const { error } = await resetPassword(user.email, window.location.origin);
      if (error) throw new Error(error.message);
      setPwResetSent(true);
      showToast('Password reset email sent. Check your inbox.', 'success');
    } catch (err) {
      showToast(err?.message || 'Failed to send password reset email.', 'error');
    } finally {
      setPwResetLoading(false);
    }
  };

  // ── Data export ────────────────────────────────────────────────────────
  const handleExportData = async () => {
    setExportLoading(true);
    try {
      const res = await exportUserData();
      const blob = new Blob([JSON.stringify(res.export, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mediguard-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast('Data exported successfully.', 'success');
    } catch (err) {
      showToast(err?.message || 'Data export failed. Please try again.', 'error');
    } finally {
      setExportLoading(false);
    }
  };

  // ── Clear history (localStorage) ──────────────────────────────────────
  const handleClearHistory = () => {
    setModalLoading(true);
    clearHistory(); // localStorage-based synchronous call
    showToast('Safety check history cleared.', 'success');
    setModalLoading(false);
    setModal(null);
  };

  // ── Delete account ─────────────────────────────────────────────────────
  const handleDeleteAccount = async () => {
    setModalLoading(true);
    try {
      await deleteAccount();
      // Sign out from Supabase after backend deletion
      await signOut();
    } catch (err) {
      showToast(err?.message || 'Account deletion failed. Please try again.', 'error');
      setModalLoading(false);
      setModal(null);
    }
  };

  // ── Render helpers ─────────────────────────────────────────────────────
  const userEmail = user?.email || '';

  const notifRows = settings
    ? [
        {
          field: 'notify_safety_alerts',
          label: 'Safety Alerts',
          desc: 'Notify me when a potential medication safety risk is detected.',
        },
        {
          field: 'notify_medicine_reminders',
          label: 'Medicine Reminders',
          desc: 'Receive reminders for scheduled medicines.',
        },
        {
          field: 'notify_safety_check_updates',
          label: 'Safety Check Updates',
          desc: 'Notify me when a previous medication check needs attention.',
        },
        {
          field: 'notify_email',
          label: 'Email Notifications',
          desc: 'Receive important MediGuard updates by email.',
        },
      ]
    : [];

  return (
    <div className="settings-page">
      {/* Toast */}
      {toast && (
        <div className={`settings-toast ${toast.type}`} role="alert">
          {toast.type === 'success' ? '✓' : '⚠'} {toast.message}
        </div>
      )}

      {/* Modals */}
      {modal === 'clearHistory' && (
        <ConfirmModal
          title="Clear Safety Check History"
          body="This will permanently remove all your previous safety-check records. Your medicines, allergies, and profile information will not be affected."
          warning="This action cannot be undone."
          confirmLabel="Clear History"
          onConfirm={handleClearHistory}
          onCancel={() => setModal(null)}
          isLoading={modalLoading}
        />
      )}

      {modal === 'deleteAccount' && (
        <ConfirmModal
          title="Delete Your Account"
          body={
            <>
              Are you sure you want to permanently delete your MediGuard account associated with{' '}
              <strong>{userEmail}</strong>?{' '}
              This will delete your health profile, medicines, allergies, settings, and all associated data.
            </>
          }
          warning="This action is irreversible. Your account cannot be recovered after deletion."
          confirmLabel="Delete My Account"
          onConfirm={handleDeleteAccount}
          onCancel={() => setModal(null)}
          isLoading={modalLoading}
        />
      )}

      {/* Page header */}
      <div className="settings-header">
        <h1 className="settings-title">Account Settings</h1>
        <p className="settings-subtitle">
          Manage your account, security, notifications, privacy and preferences.
        </p>
      </div>

      {/* ── 1. Account & Security ───────────────────────────────────────── */}
      <SettingsCard
        iconClass="icon-security"
        iconSvg={
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        }
        title="Account & Security"
        desc="Manage your account details and keep it secure."
      >
        {/* Email */}
        <div className="settings-row">
          <div className="settings-row-info">
            <span className="settings-row-label">Email</span>
            <span className="settings-row-desc">Your account email</span>
          </div>
          <div className="settings-row-action">
            <span className="settings-value-badge">{userEmail || '—'}</span>
            <a
              href={`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/user`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none' }}
              onClick={(e) => {
                // Use Supabase's updateUser for email change — redirect to account portal
                e.preventDefault();
                showToast(
                  'To change your email, use the "Change Password" flow below — a reset link will be sent to your current address.',
                  'error'
                );
              }}
            >
              <button type="button" className="settings-btn-outline">
                Change Email
              </button>
            </a>
          </div>
        </div>

        {/* Password */}
        <div className="settings-row">
          <div className="settings-row-info">
            <span className="settings-row-label">Password</span>
            <span className="settings-row-desc">
              {pwResetSent
                ? 'Reset link sent — check your inbox.'
                : 'Reset your password via email link.'}
            </span>
          </div>
          <div className="settings-row-action">
            <button
              type="button"
              className="settings-btn-outline"
              onClick={handlePasswordReset}
              disabled={pwResetLoading || pwResetSent}
            >
              {pwResetLoading ? 'Sending…' : pwResetSent ? 'Link Sent ✓' : 'Change Password'}
            </button>
          </div>
        </div>

        {/* Two-Factor Auth — not yet implemented in Supabase project */}
        <div className="settings-row">
          <div className="settings-row-info">
            <span className="settings-row-label">Two-Factor Authentication</span>
            <span className="settings-row-desc">
              Add an extra layer of security to your account.
            </span>
          </div>
          <div className="settings-row-action">
            <span className="settings-badge-unavailable">Coming soon</span>
          </div>
        </div>

        {/* Active Sessions — not tracked server-side in this architecture */}
        <div className="settings-row">
          <div className="settings-row-info">
            <span className="settings-row-label">Active Sessions</span>
            <span className="settings-row-desc">
              Session management is handled by your authentication provider (Supabase).
            </span>
          </div>
          <div className="settings-row-action">
            <span className="settings-badge-unavailable">Managed by Supabase</span>
          </div>
        </div>
      </SettingsCard>

      {/* ── 2. Notifications ──────────────────────────────────────────────── */}
      <SettingsCard
        iconClass="icon-notifications"
        iconSvg={
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        }
        title="Notifications"
        desc="Choose what you want to be notified about."
      >
        {settingsLoading && <SkeletonRows count={4} />}

        {settingsError && (
          <div className="settings-error-banner">
            ⚠ {settingsError}
          </div>
        )}

        {!settingsLoading && settings && notifRows.map(({ field, label, desc }) => (
          <div key={field} className="settings-row">
            <div className="settings-row-info">
              <span className="settings-row-label">{label}</span>
              <span className="settings-row-desc">{desc}</span>
            </div>
            <div className="settings-row-action">
              <Toggle
                id={`toggle-${field}`}
                checked={settings[field]}
                onChange={(val) => handleToggle(field, val)}
                disabled={togglingField === field}
              />
            </div>
          </div>
        ))}
      </SettingsCard>

      {/* ── 3. Privacy & Data ─────────────────────────────────────────────── */}
      <SettingsCard
        iconClass="icon-privacy"
        iconSvg={
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        }
        title="Privacy & Data"
        desc="Manage your data and privacy preferences."
      >
        {/* Privacy notice */}
        <div className="settings-privacy-info" style={{ marginTop: '0.25rem' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2D8A56" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <p className="settings-privacy-info-text">
            Your health profile, medicines, allergies, and safety-check history are associated with
            your account and stored securely. MediGuard does not sell or share your personal health
            information with third parties.
          </p>
        </div>

        {/* Download My Data */}
        <div className="settings-row">
          <div className="settings-row-info">
            <span className="settings-row-label">Download My Data</span>
            <span className="settings-row-desc">
              Get a copy of your MediGuard profile, medicines, and settings as a JSON file.
            </span>
          </div>
          <div className="settings-row-action">
            <button
              type="button"
              className="settings-btn-outline"
              onClick={handleExportData}
              disabled={exportLoading}
            >
              {exportLoading ? 'Exporting…' : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download Data
                </>
              )}
            </button>
          </div>
        </div>

        {/* Clear Safety Check History */}
        <div className="settings-row">
          <div className="settings-row-info">
            <span className="settings-row-label">Clear Safety Check History</span>
            <span className="settings-row-desc">
              Permanently remove your previous safety-check records. Medicines and profile are unaffected.
            </span>
          </div>
          <div className="settings-row-action">
            <button
              type="button"
              className="settings-btn-outline danger"
              onClick={() => setModal('clearHistory')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4h6v2" />
              </svg>
              Clear History
            </button>
          </div>
        </div>

        {/* Delete Account */}
        <div className="settings-row">
          <div className="settings-row-info">
            <span className="settings-row-label">Delete Account</span>
            <span className="settings-row-desc">
              Permanently delete your MediGuard account and all associated health data. This cannot be undone.
            </span>
          </div>
          <div className="settings-row-action">
            <button
              type="button"
              className="settings-btn-outline danger"
              onClick={() => setModal('deleteAccount')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4h6v2" />
              </svg>
              Delete Account
            </button>
          </div>
        </div>
      </SettingsCard>

      {/* ── 4. Preferences ────────────────────────────────────────────────── */}
      <SettingsCard
        iconClass="icon-prefs"
        iconSvg={
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        }
        title="Preferences"
        desc="Customize your MediGuard experience."
      >
        {settingsLoading && <SkeletonRows count={3} />}

        {!settingsLoading && settings && (
          <>
            {/* Language */}
            <div className="settings-row">
              <div className="settings-row-info">
                <span className="settings-row-label">Language</span>
                <span className="settings-row-desc">Choose your preferred language.</span>
              </div>
              <div className="settings-row-action">
                <select
                  className="settings-select"
                  value={settings.language}
                  onChange={(e) => handlePrefChange('language', e.target.value)}
                >
                  <option value="en">English</option>
                  <option value="hi">हिन्दी</option>
                </select>
              </div>
            </div>

            {/* Appearance — light / dark / system */}
            <div className="settings-row">
              <div className="settings-row-info">
                <span className="settings-row-label">Appearance</span>
                <span className="settings-row-desc">
                  Choose your preferred colour theme. System follows your OS setting.
                </span>
              </div>
              <div className="settings-row-action">
                <select
                  className="settings-select"
                  value={settings.appearance ?? localTheme}
                  onChange={(e) => handlePrefChange('appearance', e.target.value)}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
              </div>
            </div>

            {/* Default Safety Check */}
            <div className="settings-row">
              <div className="settings-row-info">
                <span className="settings-row-label">Default Safety Check</span>
                <span className="settings-row-desc">
                  Automatically check medicines in my current medicine cabinet.
                </span>
              </div>
              <div className="settings-row-action">
                <Toggle
                  id="toggle-default-safety-check"
                  checked={settings.default_safety_check}
                  onChange={(val) => handlePrefChange('default_safety_check', val)}
                  disabled={togglingField === 'default_safety_check'}
                />
              </div>
            </div>
          </>
        )}
      </SettingsCard>

      {/* ── 5. Safety Information ─────────────────────────────────────────── */}
      <div className="settings-safety-card">
        <div className="settings-safety-header">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <h3 className="settings-safety-title">Important Safety Information</h3>
        </div>
        <p className="settings-safety-body">
          MediGuard provides medication safety information based on available clinical drug
          interaction data (DDInter 2.0) and the information you supply. Results depend on
          the accuracy and completeness of the data you provide. MediGuard does not replace
          professional medical advice, diagnosis, or treatment from a qualified doctor or
          pharmacist. Always consult a healthcare professional before making changes to your
          medication regimen.
        </p>
        <div className="settings-safety-emergency">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.69a16 16 0 0 0 6.29 6.29l1.8-1.8a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          For a medical emergency, contact your local emergency services immediately.
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
