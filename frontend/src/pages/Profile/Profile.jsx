import React, { useState } from 'react';
import Button from '../../components/common/Button';
import { saveHealthProfile, getCurrentUser } from '../../services/auth/authService';
import './Profile.css';

/**
 * Profile Page Component (Route: /profile)
 * COMMIT 13 — Adds Profile Save States (Saving/loading state, Save button disable,
 * success notice, failure banner, data preservation, and retry capability).
 */
export const Profile = ({ currentUser: initialUser, onUpdateUser }) => {
  const [currentUserState, setCurrentUserState] = useState(() => initialUser || getCurrentUser());

  const activeUser = currentUserState || initialUser || {};

  // Defensive extraction of user fields from existing session data
  const userName = activeUser?.fullName || activeUser?.full_name || activeUser?.name || 'Not available';
  const userEmail = activeUser?.email || 'Not available';

  const age = activeUser?.age !== undefined && activeUser?.age !== null && activeUser?.age !== ''
    ? activeUser.age
    : 'Not available';

  const rawConditions = activeUser?.medicalConditions || activeUser?.medical_conditions;
  const medicalHistory = (rawConditions && String(rawConditions).trim().toUpperCase() !== 'NONE' && String(rawConditions).trim().length > 0)
    ? String(rawConditions).trim()
    : 'None';

  const rawMeds = activeUser?.regularMedicines || activeUser?.regular_medicines;
  let regularMedicinesList = [];
  if (Array.isArray(rawMeds)) {
    regularMedicinesList = rawMeds.filter((m) => Boolean(m && String(m).trim().length > 0 && String(m).trim().toUpperCase() !== 'NONE'));
  } else if (typeof rawMeds === 'string' && rawMeds.trim().length > 0 && rawMeds.trim().toUpperCase() !== 'NONE') {
    regularMedicinesList = [rawMeds.trim()];
  }

  const hasMedicines = regularMedicinesList.length > 0;

  // --- EDIT MODE, VALIDATION & SAVE STATES ---
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errors, setErrors] = useState({});

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
    setErrors({});
    setSaveError(null);
    setSaveSuccess(false);
    setIsEditing(true);
  };

  // Exit Edit Mode & Discard Unsaved Changes
  const handleCancelEdit = () => {
    setFormData({
      medicalHistory: medicalHistory !== 'None' ? medicalHistory : '',
      regularMedicines: hasMedicines ? regularMedicinesList.join(', ') : '',
    });
    setErrors({});
    setSaveError(null);
    setIsEditing(false);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  // Form Validation Logic
  const validateForm = () => {
    const newErrors = {};

    const trimmedConditions = (formData.medicalHistory || '').trim();
    if (!trimmedConditions) {
      newErrors.medicalHistory = 'Medical history is required. If you have no major medical history, type NONE.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // COMMIT 13: Handle Save Operation with Loading, Success, Failure & Retry Logic
  const handleSaveChanges = async (e) => {
    if (e) e.preventDefault();

    // 1. Run validation FIRST
    const isValid = validateForm();
    if (!isValid) {
      // Validation failed -> Keep user in Edit mode, display errors, preserve input
      return;
    }

    // 2. Prevent duplicate submission if already saving
    if (isSaving) return;

    // 3. Begin Saving State
    setIsSaving(true);
    setSaveError(null);

    try {
      // Parse regular medicines array
      const parsedMedicines = formData.regularMedicines
        ? formData.regularMedicines.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      // Execute existing updateProfile / saveHealthProfile service architecture
      const updatedUser = await saveHealthProfile({
        age: age !== 'Not available' ? age : '',
        medicalConditions: formData.medicalHistory,
        regularMedicines: parsedMedicines,
      });

      // 4. Success State
      setIsSaving(false);
      setSaveSuccess(true);
      setCurrentUserState(updatedUser);

      if (onUpdateUser) {
        onUpdateUser(updatedUser);
      }

      // Exit edit mode on successful save
      setIsEditing(false);

      // Auto-dismiss success notification after 4 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 4000);
    } catch (err) {
      // 5. Save Failure State: preserve input, keep in edit mode, enable retry
      setIsSaving(false);
      setSaveError(err?.message || 'Unable to save your profile. Please try again.');
    }
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
      {/* Success Notification Banner */}
      {saveSuccess && (
        <div className="profile-success-banner">
          <span>✓ Profile updated successfully.</span>
        </div>
      )}

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
          <form className="profile-edit-form" onSubmit={handleSaveChanges} noValidate>
            {/* Save Failure Error Banner */}
            {saveError && (
              <div className="save-failure-banner">
                <span>⚠️ {saveError}</span>
              </div>
            )}

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

              {/* Field: Medical History (EDITABLE & VALIDATED) */}
              <div className={`profile-field-box edit-box ${errors.medicalHistory ? 'has-error' : ''}`}>
                <label htmlFor="profileConditions" className="profile-field-label">
                  Medical History
                </label>
                <textarea
                  id="profileConditions"
                  className={`profile-edit-textarea ${errors.medicalHistory ? 'input-error' : ''}`}
                  rows={2}
                  disabled={isSaving}
                  value={formData.medicalHistory}
                  onChange={(e) => handleInputChange('medicalHistory', e.target.value)}
                  placeholder="e.g. Diabetes, Thyroid or NONE"
                />
                {errors.medicalHistory && (
                  <span className="field-error-message">
                    ⚠️ {errors.medicalHistory}
                  </span>
                )}
              </div>

              {/* Field: Regular Medicines (EDITABLE) */}
              <div className={`profile-field-box edit-box full-width-field ${errors.regularMedicines ? 'has-error' : ''}`}>
                <label htmlFor="profileMeds" className="profile-field-label">
                  Regular Medicines
                </label>
                <input
                  id="profileMeds"
                  type="text"
                  className={`profile-edit-input ${errors.regularMedicines ? 'input-error' : ''}`}
                  disabled={isSaving}
                  placeholder="e.g. Paracetamol, Metformin"
                  value={formData.regularMedicines}
                  onChange={(e) => handleInputChange('regularMedicines', e.target.value)}
                />
                {errors.regularMedicines && (
                  <span className="field-error-message">
                    ⚠️ {errors.regularMedicines}
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons: Save Changes UI & Cancel Button */}
            <div className="edit-form-actions">
              <button
                type="button"
                className="cancel-edit-btn"
                disabled={isSaving}
                onClick={handleCancelEdit}
              >
                Cancel
              </button>
              <Button
                type="submit"
                variant="primary"
                size="medium"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
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
