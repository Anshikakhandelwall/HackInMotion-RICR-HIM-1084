import React from 'react';
import './Profile.css';

/**
 * Profile Page Component (Route: /profile)
 * COMMIT 10 — Updated read-only layout presenting user's Name, Email, Age,
 * Medical History, and Regular Medicines in a unified, balanced container.
 */
export const Profile = ({ currentUser }) => {
  // Defensive extraction of user fields from existing session data
  const userName = currentUser?.fullName || currentUser?.full_name || currentUser?.name || 'Not available';
  const userEmail = currentUser?.email || 'Not available';

  const age = currentUser?.age !== undefined && currentUser?.age !== null && currentUser?.age !== ''
    ? currentUser.age
    : 'Not available';

  const rawConditions = currentUser?.medicalConditions || currentUser?.medical_conditions;
  const medicalHistory = (rawConditions && String(rawConditions).trim().toUpperCase() !== 'NONE' && String(rawConditions).trim().length > 0)
    ? String(rawConditions).trim()
    : 'None';

  const rawMeds = currentUser?.regularMedicines || currentUser?.regular_medicines;
  let regularMedicinesList = [];
  if (Array.isArray(rawMeds)) {
    regularMedicinesList = rawMeds.filter((m) => Boolean(m && String(m).trim().length > 0 && String(m).trim().toUpperCase() !== 'NONE'));
  } else if (typeof rawMeds === 'string' && rawMeds.trim().length > 0 && rawMeds.trim().toUpperCase() !== 'NONE') {
    regularMedicinesList = [rawMeds.trim()];
  }

  const hasMedicines = regularMedicinesList.length > 0;

  // Extract initials for header avatar
  const getInitials = (name) => {
    if (!name || name === 'Not available') return 'MG';
    const parts = name.trim().split(' ');
    if (parts.length >= 2 && parts[0][0] && parts[1][0]) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="profile-page-container">
      {/* Page Header */}
      <div className="profile-page-header">
        <h1 className="profile-page-title">Profile</h1>
        <p className="profile-page-subtitle">Your personal health information</p>
      </div>

      {/* Main Unified Profile Container */}
      <div className="profile-main-container">
        {/* Banner Header */}
        <div className="profile-banner-header">
          <div className="profile-avatar-circle">
            {getInitials(userName)}
          </div>
          <div className="profile-banner-text">
            <h2 className="profile-user-name">{userName}</h2>
            <p className="profile-user-email">{userEmail}</p>
          </div>
        </div>

        {/* Profile Information Grid */}
        <div className="profile-info-grid">
          {/* Field: Name */}
          <div className="profile-field-box">
            <span className="profile-field-label">Name</span>
            <span className="profile-field-value">{userName}</span>
          </div>

          {/* Field: Email */}
          <div className="profile-field-box">
            <span className="profile-field-label">Email</span>
            <span className="profile-field-value">{userEmail}</span>
          </div>

          {/* Field: Age */}
          <div className="profile-field-box">
            <span className="profile-field-label">Age</span>
            <span className="profile-field-value">{age}</span>
          </div>

          {/* Field: Medical History */}
          <div className="profile-field-box">
            <span className="profile-field-label">Medical History</span>
            <span className="profile-field-value text-wrap">{medicalHistory}</span>
          </div>

          {/* Field: Regular Medicines */}
          <div className="profile-field-box full-width-field">
            <span className="profile-field-label">Regular Medicines</span>
            {hasMedicines ? (
              <div className="regular-medicines-tags">
                {regularMedicinesList.map((med, idx) => (
                  <span key={`profile-med-tag-${idx}`} className="profile-med-pill">
                    {med}
                  </span>
                ))}
              </div>
            ) : (
              <span className="profile-field-value empty-text">None</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
