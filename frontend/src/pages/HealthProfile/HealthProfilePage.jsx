import React from 'react';
import HealthProfileForm from '../../components/auth/HealthProfileForm';
import './HealthProfilePage.css';

/**
 * HealthProfilePage Component
 * Full-page container for the first-login onboarding experience.
 */
export const HealthProfilePage = ({ onSuccess }) => {
  return (
    <div className="health-profile-page">
      {/* Subtle Background Glow Orbs (Warm rose tint) */}
      <div className="bg-glow bg-glow-top-left" aria-hidden="true" />
      <div className="bg-glow bg-glow-bottom-right" aria-hidden="true" />

      <main className="health-profile-container">
        <HealthProfileForm onSuccess={onSuccess} />
      </main>
    </div>
  );
};

export default HealthProfilePage;
