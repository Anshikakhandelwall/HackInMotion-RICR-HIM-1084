import React, { useState, useEffect } from 'react';
import Button from '../../components/common/Button';
import useAuth from '../../hooks/useAuth';
import { getProfile, updateProfile } from '../../services/profile/profileService';
import './Profile.css';

/**
 * Profile Page Component (Route: /profile)
 * Loads the authenticated user's health profile from Django backend.
 * Supports inline editing of medical conditions and regular medicines.
 */
export const Profile = () => {
  const { user } = useAuth();

  // ── Remote profile state ──────────────────────────────────────────────────
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Derive display values from Supabase user + backend profile
  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email ||
    'Not available';
  const userEmail = user?.email || 'Not available';

  const age = profile?.age ?? 'Not available';

  const rawConditions = profile?.medicalConditions || '';
  const medicalHistory =
    rawConditions && rawConditions.trim().toUpperCase() !== 'NONE' && rawConditions.trim().length > 0
      ? rawConditions.trim()
      : 'None';

  const rawMeds = profile?.regularMedicines ?? [];
  const regularMedicinesList = Array.isArray(rawMeds)
    ? rawMeds.filter((m) => m && m.trim().length > 0 && m.trim().toUpperCase() !== 'NONE')
    : [];
  const hasMedicines = regularMedicinesList.length > 0;

  // ── Edit mode state ───────────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({ medicalHistory: '', regularMedicines: '' });

  // ── Load profile on mount ─────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoadingProfile(true);
    setLoadError(null);

    getProfile()
      .then((res) => {
        if (!cancelled) {
          setProfile(res.profile ?? null);
          setLoadingProfile(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          // 404 = no profile yet; treat as empty, not an error
          setProfile(null);
          setLoadingProfile(false);
        }
      });

    return () => { cancelled = true; };
  }, []);

  // ── Edit mode helpers ─────────────────────────────────────────────────────
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

  const handleCancelEdit = () => {
    setErrors({});
    setSaveError(null);
    setIsEditing(false);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!(formData.medicalHistory || '').trim()) {
      newErrors.medicalHistory = 'Medical history is required. If you have no major medical history, type NONE.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Save handler — PATCH /api/profile/ ───────────────────────────────────
  const handleSaveChanges = async (e) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;
    if (isSaving) return;

    setIsSaving(true);
    setSaveError(null);

    const parsedMedicines = formData.regularMedicines
      ? formData.regularMedicines.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    try {
      const result = await updateProfile({
        medicalConditions: formData.medicalHistory,
        regularMedicines: parsedMedicines,
      });

      setProfile(result.profile);
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      setSaveError(err?.message || 'Unable to save your profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Initials helper ───────────────────────────────────────────────────────
  const getInitials = (name) => {
    if (!name || name === 'Not available') return 'MG';
    const parts = name.trim().split(' ');
    if (parts.length >= 2 && parts[0][0] && parts[1][0]) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // ── Loading / error states ────────────────────────────────────────────────
  if (loadingProfile) {
    return (
      <div className="profile-page-container">
        <p style={{ padding: '2rem', color: '#57606a' }}>Loading profile…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="profile-page-container">
        <p style={{ padding: '2rem', color: '#c0392b' }}>{loadError}</p>
      </div>
    );
  }

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
          <div className="profile-avatar-circle">{getInitials(userName)}</div>
          <div className="profile-banner-text">
            <h2 className="profile-user-name">{userName}</h2>
            <p className="profile-user-email">{userEmail}</p>
          </div>
        </div>

        {/* Profile Information Section */}
        {isEditing ? (
          <form className="profile-edit-form" onSubmit={handleSaveChanges} noValidate>
            {saveError && (
              <div className="save-failure-banner">
                <span>⚠️ {saveError}</span>
              </div>
            )}

            <div className="profile-info-grid">
              {/* Name — read-only */}
              <div className="profile-field-box locked-box">
                <div className="field-label-group">
                  <span className="profile-field-label">Name</span>
                  <span className="locked-badge">(Read-only)</span>
                </div>
                <span className="profile-field-value locked-value">{userName}</span>
              </div>

              {/* Email — read-only */}
              <div className="profile-field-box locked-box">
                <div className="field-label-group">
                  <span className="profile-field-label">Email</span>
                  <span className="locked-badge">(Read-only)</span>
                </div>
                <span className="profile-field-value locked-value">{userEmail}</span>
              </div>

              {/* Age — read-only */}
              <div className="profile-field-box locked-box">
                <div className="field-label-group">
                  <span className="profile-field-label">Age</span>
                  <span className="locked-badge">(Read-only)</span>
                </div>
                <span className="profile-field-value locked-value">{age}</span>
              </div>

              {/* Medical History — editable */}
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
                  <span className="field-error-message">⚠️ {errors.medicalHistory}</span>
                )}
              </div>

              {/* Regular Medicines — editable */}
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
                  <span className="field-error-message">⚠️ {errors.regularMedicines}</span>
                )}
              </div>
            </div>

            <div className="edit-form-actions">
              <button
                type="button"
                className="cancel-edit-btn"
                disabled={isSaving}
                onClick={handleCancelEdit}
              >
                Cancel
              </button>
              <Button type="submit" variant="primary" size="medium" disabled={isSaving}>
                {isSaving ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="profile-info-grid">
            <div className="profile-field-box">
              <span className="profile-field-label">Name</span>
              <span className="profile-field-value">{userName}</span>
            </div>
            <div className="profile-field-box">
              <span className="profile-field-label">Email</span>
              <span className="profile-field-value">{userEmail}</span>
            </div>
            <div className="profile-field-box">
              <span className="profile-field-label">Age</span>
              <span className="profile-field-value">{age}</span>
            </div>
            <div className="profile-field-box">
              <span className="profile-field-label">Medical History</span>
              <span className="profile-field-value text-wrap">{medicalHistory}</span>
            </div>
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
