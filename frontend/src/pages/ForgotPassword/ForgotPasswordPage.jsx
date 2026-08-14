import React, { useState } from 'react';
import BrandLogo from '../../components/common/BrandLogo';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import useAuth from '../../hooks/useAuth';

/**
 * ForgotPasswordPage
 *
 * Sends a Supabase password-reset email.
 * On success, shows a confirmation message and stays on this page
 * so the user knows to check their inbox.
 *
 * Props:
 *   onBackToLogin  () → void   — navigate back to the login view
 *   onSuccess      () → void   — called after email is sent (optional)
 */
const ForgotPasswordPage = ({ onBackToLogin, onSuccess }) => {
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [touched, setTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [sent, setSent] = useState(false);

  const validateEmail = (val) => {
    if (!val.trim()) return 'Email address is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Please enter a valid email address.';
    return '';
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    if (touched) setEmailError(validateEmail(val));
  };

  const handleBlur = () => {
    setTouched(true);
    setEmailError(validateEmail(email));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    const err = validateEmail(email);
    if (err) { setEmailError(err); return; }
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const { error } = await resetPassword(email.trim().toLowerCase());
    setIsSubmitting(false);

    if (error) {
      // Supabase does NOT reveal whether the email exists (prevents enumeration).
      // We show a generic error only for clear technical failures.
      if (error.message?.toLowerCase().includes('rate limit') || error.message?.toLowerCase().includes('too many')) {
        setSubmitError('Too many attempts. Please wait a moment and try again.');
      } else {
        // For any other error, still show the success message to prevent
        // email enumeration — the email may or may not exist.
        setSent(true);
        if (onSuccess) onSuccess();
      }
      return;
    }

    setSent(true);
    if (onSuccess) onSuccess();
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
              <h1 className="login-title">Reset your password</h1>
              <p className="login-subtitle">
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            {/* Success state */}
            {sent ? (
              <div style={{ padding: '1rem 0' }}>
                <div className="alert alert-success" role="status">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <span>
                    If an account with that email exists, you'll receive a reset link shortly.
                    Check your inbox (and spam folder).
                  </span>
                </div>
                <button
                  type="button"
                  className="link-button"
                  style={{ marginTop: '1rem', display: 'block' }}
                  onClick={onBackToLogin}
                >
                  ← Back to sign in
                </button>
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
                    id="reset-email"
                    name="email"
                    type="email"
                    label="Email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched ? emailError : ''}
                    required
                    autoComplete="email"
                    icon={
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    }
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="medium"
                    fullWidth
                    isLoading={isSubmitting}
                    className="login-submit-btn"
                  >
                    Send reset link
                  </Button>
                </form>

                <div className="login-footer">
                  <p className="signup-prompt">
                    <button type="button" className="link-button" onClick={onBackToLogin}>
                      ← Back to sign in
                    </button>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ForgotPasswordPage;
