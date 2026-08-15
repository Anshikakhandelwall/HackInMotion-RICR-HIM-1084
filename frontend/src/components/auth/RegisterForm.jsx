import React, { useState } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';
import BrandLogo from '../common/BrandLogo';
import useAuth from '../../hooks/useAuth';
import { useLanguage } from '../../context/LanguageContext';
import './RegisterForm.css';


/** Map raw Supabase error messages to user-friendly text. */
const friendlySignupError = (msg = '') => {
  if (!msg) return 'Unable to create account. Please try again.';
  const m = msg.toLowerCase();
  if (m.includes('already registered') || m.includes('already exists') || m.includes('user already'))
    return 'An account with this email already exists. Please sign in instead.';
  if (m.includes('password should be') || m.includes('password must') || m.includes('weak password'))
    return 'Password does not meet the requirements. Please choose a stronger password.';
  if (m.includes('invalid email') || m.includes('unable to validate email'))
    return 'Please enter a valid email address.';
  if (m.includes('network') || m.includes('fetch'))
    return 'Network error. Please check your connection and try again.';
  return msg;
};

/**
 * RegisterForm Component
 * Renders the MediGuard account creation form.
 * Upon successful registration, navigates to the Login page.
 * DO NOT navigate directly to Health Profile from registration.
 */
export const RegisterForm = ({ onNavigateToLogin, onSuccess }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Password requirement checks
  const passwordRequirements = {
    minLength: formData.password.length >= 8,
    hasNumber: /\d/.test(formData.password),
    hasLetter: /[a-zA-Z]/.test(formData.password),
  };

  // Field validation function
  const validateField = (name, value) => {
    let error = '';

    switch (name) {
      case 'fullName':
        if (!value.trim()) {
          error = t('fullNameRequired');
        } else if (value.trim().length < 2) {
          error = t('nameMinLength');
        }
        break;

      case 'email':
        if (!value.trim()) {
          error = t('emailRequired');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = t('validEmail');
        }
        break;

      case 'password':
        if (!value) {
          error = t('passwordRequired');
        } else if (value.length < 8) {
          error = t('passwordMinLength');
        } else if (!/\d/.test(value)) {
          error = t('passwordNumRequired');
        }
        break;

      case 'confirmPassword':
        if (!value) {
          error = t('confirmPasswordRequired');
        } else if (value !== formData.password) {
          error = t('passwordsDontMatch');
        }
        break;

      default:
        break;
    }

    return error;
  };


  // Validate entire form
  const validateForm = () => {
    const newErrors = {};

    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Re-validate touched field dynamically
    if (touched[name]) {
      const fieldError = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: fieldError }));
    }

    // Also revalidate confirmPassword if password changes
    if (name === 'password' && touched.confirmPassword) {
      if (formData.confirmPassword && value !== formData.confirmPassword) {
        setErrors((prev) => ({ ...prev, confirmPassword: t('passwordsDontMatch') }));
      } else {
        setErrors((prev) => ({ ...prev, confirmPassword: '' }));
      }
    }

  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const fieldError = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: fieldError }));
  };

  const { signUp } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    // Mark all fields as touched
    const allTouched = Object.keys(formData).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);

    if (!validateForm()) {
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    const { data, error } = await signUp(formData.email, formData.password, {
      full_name: formData.fullName,
    });

    setIsSubmitting(false);

    if (error) {
      setSubmitError(friendlySignupError(error.message));
      return;
    }


    // Email confirmation required: user record exists but no active session yet.
    if (data.user && !data.session) {
      setSubmitSuccess(true);
      // Stay on the signup page showing the confirmation message; do not navigate.
      return;
    }

    // Immediate session (email confirmation disabled in Supabase project settings).
    setSubmitSuccess(true);
    if (onSuccess) {
      onSuccess({ user: data.session?.user ?? null });
    } else if (onNavigateToLogin) {
      onNavigateToLogin();
    }
  };

  return (
    <div className="register-card">
      {/* Brand Header */}
      <div className="register-header">
        <BrandLogo size="medium" />
        <h1 className="register-title">{t('createAccountTitle')}</h1>
        <p className="register-subtitle">
          {t('registerSubtitle')}
        </p>
      </div>

      {/* Global Form Alerts */}
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

      {submitSuccess && (
        <div className="alert alert-success" role="status">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span>
            {t('registerSuccessMsg')}
          </span>
        </div>
      )}

      {/* Registration Form */}
      <form onSubmit={handleSubmit} noValidate className="register-form">
        {/* Full Name */}
        <Input
          id="fullName"
          name="fullName"
          type="text"
          label={t('fullNameLabel')}
          placeholder={t('fullNamePlaceholder')}
          value={formData.fullName}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.fullName ? errors.fullName : ''}
          required
          autoComplete="name"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          }
        />

        {/* Email Address */}
        <Input
          id="email"
          name="email"
          type="email"
          label={t('email')}
          placeholder={t('emailPlaceholder')}
          value={formData.email}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.email ? errors.email : ''}
          required
          autoComplete="email"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          }
        />

        {/* Password */}
        <Input
          id="password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          label={t('password')}
          placeholder={t('passwordPlaceholder')}
          value={formData.password}
          onChange={handleChange}
          onBlur={handleBlur}
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
            <button
              type="button"
              className="toggle-password-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? t('hidePassword') : t('showPassword')}
              tabIndex="-1"
            >
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          }
        />

        {/* Password Strength Requirements Guidance */}
        {formData.password.length > 0 && (
          <div className="password-guidance">
            <span className="guidance-title">{t('passwordMustInclude')}</span>
            <ul className="guidance-list">
              <li className={passwordRequirements.minLength ? 'valid' : 'invalid'}>
                <span className="guidance-bullet">{passwordRequirements.minLength ? '✓' : '•'}</span>
                {t('minChars')}
              </li>
              <li className={passwordRequirements.hasNumber ? 'valid' : 'invalid'}>
                <span className="guidance-bullet">{passwordRequirements.hasNumber ? '✓' : '•'}</span>
                {t('minNumber')}
              </li>
              <li className={passwordRequirements.hasLetter ? 'valid' : 'invalid'}>
                <span className="guidance-bullet">{passwordRequirements.hasLetter ? '✓' : '•'}</span>
                {t('minLetter')}
              </li>
            </ul>
          </div>
        )}

        {/* Confirm Password */}
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type={showConfirmPassword ? 'text' : 'password'}
          label={t('confirmPasswordLabel')}
          placeholder={t('confirmPasswordPlaceholder')}
          value={formData.confirmPassword}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.confirmPassword ? errors.confirmPassword : ''}
          required
          autoComplete="new-password"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          }
          rightElement={
            <button
              type="button"
              className="toggle-password-btn"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? t('hidePassword') : t('showPassword')}
              tabIndex="-1"
            >
              {showConfirmPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          }
        />

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="large"
          fullWidth
          isLoading={isSubmitting}
          className="register-submit-btn"
        >
          {t('createAccountBtn')}
        </Button>
      </form>

      {/* Footer Navigation Link */}
      <div className="register-footer">
        <p className="login-prompt">
          {t('alreadyHaveAccount')}{' '}
          <button
            type="button"
            onClick={onNavigateToLogin}
            className="link-button"
          >
            {t('login')}
          </button>
        </p>
      </div>

      {/* Professional Safety & Privacy Disclaimer */}
      <div className="register-disclaimer">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="disclaimer-icon">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <p>
          {t('registerDisclaimer')}
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;

