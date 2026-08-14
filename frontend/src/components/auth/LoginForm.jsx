import React, { useState } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';
import BrandLogo from '../common/BrandLogo';
import useAuth from '../../hooks/useAuth';
import './LoginForm.css';

/** Map raw Supabase error messages to user-friendly text. */
const friendlyLoginError = (msg = '') => {
  if (!msg) return 'Unable to sign in. Please try again.';
  const m = msg.toLowerCase();
  if (m.includes('invalid login credentials') || m.includes('invalid credentials') || m.includes('wrong password'))
    return 'Invalid email or password.';
  if (m.includes('email not confirmed'))
    return 'Please confirm your email address before signing in.';
  if (m.includes('too many requests') || m.includes('rate limit'))
    return 'Too many attempts. Please wait a moment and try again.';
  if (m.includes('network') || m.includes('fetch'))
    return 'Network error. Please check your connection and try again.';
  return 'Unable to sign in. Please try again.';
};

/**
 * LoginForm Component
 * Renders the compact, elegant MediGuard login form.
 */
export const LoginForm = ({ onNavigateToSignup, onSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Field validation function
  const validateField = (name, value) => {
    let error = '';

    switch (name) {
      case 'email':
        if (!value.trim()) {
          error = 'Email address is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = 'Please enter a valid email address';
        }
        break;

      case 'password':
        if (!value) {
          error = 'Password is required';
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
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const fieldError = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: fieldError }));
  };

  const { signIn } = useAuth();

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

    const { data, error } = await signIn(formData.email, formData.password);

    if (error) {
      setSubmitError(friendlyLoginError(error.message));
      setIsSubmitting(false);
      return;
    }

    // Auth state is updated globally by AuthContext's onAuthStateChange listener.
    // Pass the session user to onSuccess so App.jsx can handle routing.
    if (onSuccess) {
      onSuccess({ user: data.session?.user ?? null });
    }

    setIsSubmitting(false);
  };

  return (
    <div className="login-card">
      {/* Brand Header */}
      <div className="login-header">
        <div className="mobile-logo-only">
          <BrandLogo size="medium" />
        </div>
        <h1 className="login-title">Welcome Back</h1>
        <p className="login-subtitle">
          Login to your account to manage your medication safety.
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

      {/* Login Form */}
      <form onSubmit={handleSubmit} noValidate className="login-form">
        {/* Email Address */}
        <Input
          id="email"
          name="email"
          type="email"
          label="Email"
          placeholder="name@example.com"
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
          label="Password"
          placeholder="Enter your password"
          value={formData.password}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.password ? errors.password : ''}
          required
          autoComplete="current-password"
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
              aria-label={showPassword ? 'Hide password' : 'Show password'}
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

        {/* Login Button */}
        <Button
          type="submit"
          variant="primary"
          size="medium"
          isLoading={isSubmitting}
          fullWidth
          className="login-submit-btn"
        >
          Login
        </Button>
      </form>

      {/* Footer & Sign Up Link */}
      <div className="login-footer">
        <p className="signup-prompt">
          Don&apos;t have an account?{' '}
          <button
            type="button"
            className="link-button"
            onClick={onNavigateToSignup}
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
