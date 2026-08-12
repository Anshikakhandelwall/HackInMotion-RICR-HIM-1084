import React from 'react';
import LoginForm from '../../components/auth/LoginForm';
import './Login.css';

/**
 * Login Page Component
 * Wraps the LoginForm in a sleek, responsive page container with a calm, modern SaaS aesthetic.
 */
export const Login = ({ onNavigateToSignup, onSuccess }) => {
  return (
    <div className="login-page">
      {/* Subtle Background Glow Orbs */}
      <div className="bg-glow bg-glow-top-left" aria-hidden="true" />
      <div className="bg-glow bg-glow-bottom-right" aria-hidden="true" />

      <main className="login-container">
        <LoginForm
          onNavigateToSignup={onNavigateToSignup}
          onSuccess={onSuccess}
        />
      </main>
    </div>
  );
};

export default Login;
