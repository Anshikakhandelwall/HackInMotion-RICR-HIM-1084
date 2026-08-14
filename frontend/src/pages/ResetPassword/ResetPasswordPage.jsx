import React, { useState } from 'react';
import BrandLogo from '../../components/common/BrandLogo';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import useAuth from '../../hooks/useAuth';

/**
 * ResetPasswordPage
 *
 * Shown when the user arrives via a Supabase password-reset link.
 * Supabase has already exchanged the token for a RECOVERY session,
 * so the user is temporarily authenticated and can call updatePassword().
 *
 * After a successful update the parent (App.jsx) signs the user out
 * and redirects to login to force a clean re-authentication.
 *
 * Props:
 *   onSuccess  () → void   — called after password is updated
 */
const ResetPasswordPage = ({ onSuccess }) => {
  const { updatePassword } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [success, setSuccess] = useState(false);

  const passwordRequirements = {
    minLength: password.length >= 8,
    hasNumber: /\d/.test(password),
    hasLetter: /[a-zA-Z]/.test(password),
  };

  const validatePassword = (val) => {
    if (!val) return 'New password is required.';
    if (val.length < 8) return 'Password must be at least 8 characters.';
    if (!/\d/.test(val)) return 'Password must contain at least one number.';
    return '';
  };

  const validateConfirm = (val) => {
    if (!val) return 'Please confirm your new password.';
    if (val !== password) return 'Passwords do not match.';
    return '';
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    if (touched.password) setErrors((p) => ({ ...p, password: validatePassword(val) }));
    if (touched.confirmPassword) setErrors((p) => ({ ...p, confirmPassword: val !== confirmPassword ? 'Passwords do not match.' : '' }));
  };

  const handleConfirmChange = (e) => {
    const val = e.target.value;
    setConfirmPassword(val);
    if (touched.confirmPassword) setErrors((p) => ({ ...p, confirmPassword: validateConfirm(val) }));
  };

  const handleBlur = (field) => {
    setTouched((p) => ({ ...p, [field]: true }));
    if (field === 'password') setErrors((p) => ({ ...p, password: validatePassword(password) }));
    if (field === 'confirmPassword') setErrors((p) => ({ ...p, confirmPassword: validateConfirm(confirmPassword) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ password: true, confirmPassword: true });
    const pErr = validatePassword(password);
    const cErr = validateConfirm(confirmPassword);
    setErrors({ password: pErr, confirmPassword: cErr });
    if (pErr || cErr) return;
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const { error } = await updatePassword(password);
    setIsSubmitting(false);

    if (error) {
      const m = error.message?.toLowerCase() ?? '';
      if (m.includes('same password') || m.includes('different from')) {
        setSubmitError('New password must be different from your current password.');
      } else if (m.includes('weak') || m.includes('should be')) {
        setSubmitError('Password is too weak. Please choose a stronger password.');
      } else {
        setSubmitError('Unable to update password. Please try again or request a new reset link.');
      }
      return;
    }

    setSuccess(true);
    setTimeout(() => { if (onSuccess) onSuccess(); }, 2000);
  };

  return (
    <div className="login-page">
      <div className="bg-shape bg-shape-top-left" aria-hidden="true" />
      <div className="bg-shape bg-shape-bottom-right" aria-hidden="true" />

      <main className="login-layout-container" style={{ justifyContent: 'center' }}>
        <div className="login-form-panel" style={{ maxWidth: '440px', width: '100%' }}>
          <div className="login-card">
            <div className="login-header">
              <div className="mobile-logo-only">
                <BrandLogo size="medium" />
              </div>
              <h1 className="login-title">Set new password</h1>
              <p className="login-subtitle">
                Choose a strong password for your MediGuard account.
              </p>
            </div>

            {success ? (
              <div className="alert alert-success" role="status" style={{ marginTop: '1rem' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span>Password updated! Redirecting you to sign in…</span>
              </div>
            ) : (
              <>
                {submitError && (
                  <div className="alert alert-error" role="alert">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>{submitError}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} noValidate className="login-form">
                  <Input
                    id="new-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    label="New Password"
                    placeholder="Create a strong password"
                    value={password}
                    onChange={handlePasswordChange}
                    onBlur={() => handleBlur('password')}
                    error={touched.password ? errors.password : ''}
                    required
                    autoComplete="new-password"
                    icon={
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    }
                    rightElement={
                      <button type="button" className="toggle-password-btn" onClick={() => setShowPassword((v) => !v)} tabIndex="-1" aria-label={showPassword ? 'Hide' : 'Show'}>
                        {showPassword ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    }
                  />

                  {password.length > 0 && (
                    <div className="password-guidance">
                      <span className="guidance-title">Password must include:</span>
                      <ul className="guidance-list">
                        <li className={passwordRequirements.minLength ? 'valid' : 'invalid'}>
                          <span className="guidance-bullet">{passwordRequirements.minLength ? '✓' : '•'}</span>
                          At least 8 characters
                        </li>
                        <li className={passwordRequirements.hasNumber ? 'valid' : 'invalid'}>
                          <span className="guidance-bullet">{passwordRequirements.hasNumber ? '✓' : '•'}</span>
                          At least one number (0–9)
                        </li>
                        <li className={passwordRequirements.hasLetter ? 'valid' : 'invalid'}>
                          <span className="guidance-bullet">{passwordRequirements.hasLetter ? '✓' : '•'}</span>
                          At least one letter
                        </li>
                      </ul>
                    </div>
                  )}

                  <Input
                    id="confirm-new-password"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    label="Confirm New Password"
                    placeholder="Re-enter your new password"
                    value={confirmPassword}
                    onChange={handleConfirmChange}
                    onBlur={() => handleBlur('confirmPassword')}
                    error={touched.confirmPassword ? errors.confirmPassword : ''}
                    required
                    autoComplete="new-password"
                    icon={
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    }
                  />

                  <Button type="submit" variant="primary" size="medium" fullWidth isLoading={isSubmitting} className="login-submit-btn">
                    Update password
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResetPasswordPage;
