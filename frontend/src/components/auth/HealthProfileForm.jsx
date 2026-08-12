import React, { useState } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';
import BrandLogo from '../common/BrandLogo';
import { saveHealthProfile } from '../../services/auth/authService';
import './HealthProfileForm.css';

/**
 * HealthProfileForm Component
 * First-login onboarding form collecting basic user health profile:
 * Age, Medical Conditions, and conditional Regular Medicines chips.
 */
export const HealthProfileForm = ({ onSuccess }) => {
  const [age, setAge] = useState('');
  const [medicalConditions, setMedicalConditions] = useState('');
  const [regularMedicines, setRegularMedicines] = useState([]);
  const [medicineInput, setMedicineInput] = useState('');

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Check if medical conditions equals 'NONE' (case-insensitive, space-trimmed)
  const isNoneCondition = (val) => {
    if (!val) return false;
    const cleaned = val.trim().toUpperCase().replace(/^["']|["']$/g, '');
    return cleaned === 'NONE';
  };

  const isNoneActive = isNoneCondition(medicalConditions);

  // Validate Age field
  const validateAge = (val) => {
    const ageStr = String(val).trim();
    if (!ageStr) {
      return 'Age is required';
    }
    const num = Number(ageStr);
    if (isNaN(num) || !Number.isInteger(num)) {
      return 'Age must be a valid whole number';
    }
    if (num <= 0) {
      return 'Age must be greater than zero';
    }
    if (num > 120) {
      return 'Please enter a realistic age (1-120)';
    }
    return '';
  };

  // Validate Medical Conditions field
  const validateConditions = (val) => {
    const trimmed = val ? val.trim() : '';
    if (!trimmed) {
      return 'Medical conditions is required. Type "NONE" if no major history.';
    }
    return '';
  };

  // Handle Medical Conditions text change
  const handleConditionsChange = (e) => {
    const value = e.target.value;
    setMedicalConditions(value);

    if (touched.medicalConditions) {
      setErrors((prev) => ({ ...prev, medicalConditions: validateConditions(value) }));
    }

    // If condition changes to NONE, clear regular medicines list & form data
    if (isNoneCondition(value)) {
      setRegularMedicines([]);
      setMedicineInput('');
    }
  };

  const handleAgeChange = (e) => {
    const value = e.target.value;
    setAge(value);
    if (touched.age) {
      setErrors((prev) => ({ ...prev, age: validateAge(value) }));
    }
  };

  const handleBlur = (field, value) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (field === 'age') {
      setErrors((prev) => ({ ...prev, age: validateAge(value) }));
    } else if (field === 'medicalConditions') {
      setErrors((prev) => ({ ...prev, medicalConditions: validateConditions(value) }));
    }
  };

  // Medicine Chip Handlers
  const handleAddMedicine = () => {
    const trimmed = medicineInput.trim();
    if (!trimmed) return;

    // Prevent duplicate medicine chips (case-insensitive)
    const exists = regularMedicines.some((m) => m.toLowerCase() === trimmed.toLowerCase());
    if (!exists) {
      setRegularMedicines((prev) => [...prev, trimmed]);
    }
    setMedicineInput('');
  };

  const handleMedicineKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddMedicine();
    }
  };

  const handleRemoveMedicine = (indexToRemove) => {
    setRegularMedicines((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Form Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    // Touch all required fields
    setTouched({ age: true, medicalConditions: true });

    const ageErr = validateAge(age);
    const condErr = validateConditions(medicalConditions);

    if (ageErr || condErr) {
      setErrors({ age: ageErr, medicalConditions: condErr });
      return;
    }

    setIsSubmitting(true);

    const profilePayload = {
      age: Number(age),
      medicalConditions: medicalConditions.trim(),
      regularMedicines: isNoneActive ? [] : regularMedicines,
      profileCompleted: true,
    };

    try {
      const updatedUser = await saveHealthProfile(profilePayload);
      if (onSuccess) {
        onSuccess(updatedUser);
      }
    } catch (err) {
      // Friendly, non-crashing error handling
      setSubmitError('Something went wrong while saving your information. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="health-profile-card">
      {/* Brand & Header */}
      <div className="onboarding-header">
        <BrandLogo size="medium" />
        <h1 className="onboarding-title">Tell us a little about yourself</h1>
        <p className="onboarding-subtitle">
          Help us personalize your medication safety experience.
        </p>
      </div>

      {/* Error Alert Banner */}
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

      {/* Form Body */}
      <form onSubmit={handleSubmit} noValidate className="onboarding-form">
        {/* Field 1: Age */}
        <Input
          id="age"
          name="age"
          type="number"
          label="Age"
          placeholder="e.g. 28"
          value={age}
          onChange={handleAgeChange}
          onBlur={(e) => handleBlur('age', e.target.value)}
          error={touched.age ? errors.age : ''}
          required
          min="1"
          max="120"
        />

        {/* Field 2: Medical Conditions */}
        <div className="form-group-with-hint">
          <Input
            id="medicalConditions"
            name="medicalConditions"
            type="text"
            label="Medical Conditions"
            placeholder="e.g. Diabetes, Asthma, or NONE"
            value={medicalConditions}
            onChange={handleConditionsChange}
            onBlur={(e) => handleBlur('medicalConditions', e.target.value)}
            error={touched.medicalConditions ? errors.medicalConditions : ''}
            required
          />
          <p className="field-hint-text">
            If no major medical history, type &quot;NONE&quot;.
          </p>
        </div>

        {/* Conditional Field: Regular Medicines (Hidden when conditions === NONE) */}
        {!isNoneActive && medicalConditions.trim().length > 0 && (
          <div className="conditional-medicines-section">
            <label className="section-label">Regular Medicines</label>

            <div className="medicine-input-row">
              <input
                type="text"
                className="medicine-input-field"
                placeholder="Search/type medicine name..."
                value={medicineInput}
                onChange={(e) => setMedicineInput(e.target.value)}
                onKeyDown={handleMedicineKeyDown}
              />
              <button
                type="button"
                className="add-medicine-btn"
                onClick={handleAddMedicine}
                disabled={!medicineInput.trim()}
              >
                Add
              </button>
            </div>

            {/* Medicine Tag Chips */}
            {regularMedicines.length > 0 && (
              <div className="medicine-chips-wrapper">
                {regularMedicines.map((med, idx) => (
                  <span key={`${med}-${idx}`} className="medicine-chip">
                    <span className="chip-text">{med}</span>
                    <button
                      type="button"
                      className="chip-remove-btn"
                      onClick={() => handleRemoveMedicine(idx)}
                      aria-label={`Remove ${med}`}
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Confirm Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="large"
          fullWidth
          isLoading={isSubmitting}
          className="confirm-onboarding-btn"
        >
          Confirm
        </Button>
      </form>
    </div>
  );
};

export default HealthProfileForm;
