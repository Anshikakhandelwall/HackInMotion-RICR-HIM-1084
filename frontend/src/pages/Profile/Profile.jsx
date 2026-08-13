import React, { useState } from 'react';
import Button from '../../components/common/Button';
import './Profile.css';

/**
 * Profile Page Component (Route: /profile)
 * COMMIT 11 — Adds Profile Editing UI for Medical History and Regular Medicines ONLY.
 * Name, Email, and Age remain STRICTLY LOCKED as read-only.
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

  // --- COMMIT 11: EDIT MODE STATE FOR MEDICAL HISTORY & REGULAR MEDICINES ONLY ---
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    medicalHistory: medicalHistory !== 'None' ? medicalHistory : '',
    regularMedicines: hasMedicines ? regularMedicinesList.join(', ') : '',
  });

  // Enter Edit Mode & Pre-fill editable fields
  const handleEnterEditMode = () => {
    setFormData({
      medicalHistory: medicalHistory !== 'None' ? medicalHistory : '',
      regularMedicines: hasMedicines ? regularMedicinesList.join(', ') : '',
    });
    setIsEditing(true);
  };

  // Exit Edit Mode & Discard Unsaved Changes
  const handleCancelEdit = () => {
    setFormData({
      medicalHistory: medicalHistory !== 'None' ? medicalHistory : '',
      regularMedicines: hasMedicines ? regularMedicinesList.join(', ') : '',
    });
    setIsEditing(false);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

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
        <div className="header-titles">
          <h1 className="profile-page-title">Profile</h1>
          <p className="profile-page-subtitle">Your personal health information</p>
        </div>

        {/* Edit Profile Button */}
        {!isEditing && (
          <Button
            type="button"
            variant="primary"
            size="medium"
            className="edit-profile-btn"
            onClick={handleEnterEditMode}
          >
            Edit Profile
          </Button>
        )}
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

        {/* Profile Information Section */}
        {isEditing ? (
          /* EDIT MODE FORM */
          <div className="profile-edit-form">
            <div className="profile-info-grid">
              {/* Field: Name (LOCKED - Read Only) */}
              <div className="profile-field-box locked-box">
                <div className="field-label-group">
                  <span className="profile-field-label">Name</span>
                  <span className="locked-badge">(Read-only)</span>
                </div>
                <span className="profile-field-value locked-value">{userName}</span>
              </div>

              {/* Field: Email (LOCKED - Read Only) */}
              <div className="profile-field-box locked-box">
                <div className="field-label-group">
                  <span className="profile-field-label">Email</span>
                  <span className="locked-badge">(Read-only)</span>
                </div>
                <span className="profile-field-value locked-value">{userEmail}</span>
              </div>

              {/* Field: Age (LOCKED - Read Only) */}
              <div className="profile-field-box locked-box">
                <div className="field-label-group">
                  <span className="profile-field-label">Age</span>
                  <span className="locked-badge">(Read-only)</span>
                </div>
                <span className="profile-field-value locked-value">{age}</span>
              </div>

              {/* Field: Medical History (EDITABLE) */}
              <div className="profile-field-box edit-box">
                <label htmlFor="profileConditions" className="profile-field-label">
                  Medical History
                </label>
                <textarea
                  id="profileConditions"
                  className="profile-edit-textarea"
                  rows={2}
                  value={formData.medicalHistory}
                  onChange={(e) => handleInputChange('medicalHistory', e.target.value)}
                />
              </div>

              {/* Field: Regular Medicines (EDITABLE) */}
              <div className="profile-field-box edit-box full-width-field">
                <label htmlFor="profileMeds" className="profile-field-label">
                  Regular Medicines
                </label>
                <input
                  id="profileMeds"
                  type="text"
                  className="profile-edit-input"
                  placeholder="e.g. Paracetamol, Metformin"
                  value={formData.regularMedicines}
                  onChange={(e) => handleInputChange('regularMedicines', e.target.value)}
                />
              </div>
            </div>

            {/* Action Buttons: Save Changes UI & Cancel Button */}
            <div className="edit-form-actions">
              <button
                type="button"
                className="cancel-edit-btn"
                onClick={handleCancelEdit}
              >
                Cancel
              </button>
              <Button
                type="button"
                variant="primary"
                size="medium"
                onClick={() => {
                  /* UI state only for Commit 11 - no backend API call or validation */
                  setIsEditing(false);
                }}
              >
                Save Changes
              </Button>
            </div>
          </div>
        ) : (
          /* READ-ONLY VIEW */
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
        )}
      </div>
    </div>
  );
};

export default Profile;
