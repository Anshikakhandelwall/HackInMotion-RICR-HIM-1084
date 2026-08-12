import React from 'react';
import RegisterForm from '../../components/auth/RegisterForm';
import './Signup.css';

/**
 * Signup Page Component
 * Wraps the RegisterForm in a sleek, responsive page container with a calm, modern SaaS aesthetic.
 */
export const Signup = ({ onNavigateToLogin, onSuccess }) => {
  return (
    <div className="signup-page">
      {/* Subtle Background Glow Orbs */}
      <div className="bg-glow bg-glow-top-left" aria-hidden="true" />
      <div className="bg-glow bg-glow-bottom-right" aria-hidden="true" />

      <main className="signup-container">
        <RegisterForm
          onNavigateToLogin={onNavigateToLogin}
          onSuccess={onSuccess}
        />
      </main>
    </div>
  );
};

export default Signup;
