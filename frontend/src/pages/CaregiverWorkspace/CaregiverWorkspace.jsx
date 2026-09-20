import React, { useState, useEffect, useCallback } from 'react';
import { caregiverService } from '../../services/caregiver/caregiverService';
import { saveHistoryRecord } from '../../services/history/historyService';
import './CaregiverWorkspace.css';

// ── helpers ──────────────────────────────────────────────────────────────────

const severityClass = (s) => {
  const k = (s || '').toLowerCase();
  if (k === 'major' || k === 'severe') return 'sev-major';
  if (k === 'moderate') return 'sev-moderate';
  return 'sev-minor';
};

// ── Onboarding welcome screen ─────────────────────────────────────────────────

function CaregiverOnboarding({ onDone }) {
  return (
    <div className="cg-onboarding-page">
      <div className="bg-glow bg-glow-top-left" aria-hidden="true" />
      <div className="bg-glow bg-glow-bottom-right" aria-hidden="true" />
      <div className="cg-onboarding-card">
        <div className="cg-onboarding-icon">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <h1 className="cg-onboarding-title">Welcome, Caregiver</h1>
        <p className="cg-onboarding-desc">
          You can monitor medication safety for patients who approve your connection.
          Your own health data is never used when running checks for a patient —
          only the patient's own medicines, conditions, and allergies are used.
        </p>
        <ol className="cg-onboarding-steps">
          <li><span className="step-num">1</span>Generate a connection code in your workspace</li>
          <li><span className="step-num">2</span>Share the code with your patient</li>
          <li><span className="step-num">3</span>The patient enters the code in their app to approve</li>
          <li><span className="step-num">4</span>Run safety checks using the patient's own health context</li>
        </ol>
        <button className="cg-onboarding-btn" onClick={onDone}>
          Go to My Workspace
        </button>
      </div>
    </div>
  );
}

// ── Safety result panel ───────────────────────────────────────────────────────

function SafetyResultPanel({ result, onClose }) {
  if (!result) return null;
  const { drug_interactions, patient_condition_warnings = [], allergy_warnings = [], summary } = result;
  const interactions = drug_interactions?.interactions || [];
  const allWarnings = [...interactions, ...allergy_warnings, ...patient_condition_warnings];
  const hasMajor = summary?.major_warnings > 0;

  return (
    <div className="safety-result-overlay" onClick={onClose}>
      <div className="safety-result-panel" onClick={(e) => e.stopPropagation()}>
        <div className="safety-result-header">
          <h2 className="safety-result-title">Safety Check Results</h2>
          <button className="safety-result-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className={`safety-result-badge ${hasMajor ? 'badge-danger' : summary?.moderate_warnings > 0 ? 'badge-warning' : 'badge-safe'}`}>
          {hasMajor
            ? `⚠ ${summary.major_warnings} Major Warning${summary.major_warnings !== 1 ? 's' : ''}`
            : summary?.moderate_warnings > 0
              ? `⚠ ${summary.moderate_warnings} Moderate Warning${summary.moderate_warnings !== 1 ? 's' : ''}`
              : '✓ All Clear'}
        </div>

        <div className="safety-result-stats">
          <span>{summary?.total_medicines_checked || 0} medicines checked</span>
          <span>{summary?.drug_interactions_count || 0} drug interactions</span>
          {summary?.allergy_warnings_count > 0 && <span>{summary.allergy_warnings_count} allergy alerts</span>}
          {summary?.condition_warnings_count > 0 && <span>{summary.condition_warnings_count} condition warnings</span>}
        </div>

        {allWarnings.length === 0 ? (
          <p className="safety-no-warnings">No interactions or warnings found for this medicine combination.</p>
        ) : (
          <ul className="safety-warning-list">
            {interactions.map((w, i) => (
              <li key={`int-${i}`} className={`safety-warning-item ${severityClass(w.severity)}`}>
                <span className="warning-type-label">Drug Interaction</span>
                <strong>{w.drug_a} + {w.drug_b}</strong>
                <span className="warning-severity">{w.severity}</span>
                {w.description && <span className="warning-desc">{w.description}</span>}
              </li>
            ))}
            {allergy_warnings.map((w, i) => (
              <li key={`alg-${i}`} className={`safety-warning-item ${severityClass(w.severity)}`}>
                <span className="warning-type-label">Allergy Alert</span>
                <strong>{w.title}</strong>
                <span className="warning-desc">{w.description}</span>
              </li>
            ))}
            {patient_condition_warnings.map((w, i) => (
              <li key={`cond-${i}`} className={`safety-warning-item ${severityClass(w.severity)}`}>
                <span className="warning-type-label">Condition Warning</span>
                <strong>{w.title}</strong>
                <span className="warning-desc">{w.description}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ── Patient detail panel ──────────────────────────────────────────────────────

function PatientDetail({ patient, onBack, onPatientUpdated }) {
  const [addMed, setAddMed] = useState('');
  const [saving, setSaving] = useState(false);
  const [checkLoading, setCheckLoading] = useState(false);
  const [safetyResult, setSafetyResult] = useState(null);
  const [error, setError] = useState(null);
  const [localMeds, setLocalMeds] = useState(patient.regular_medicines || []);

  // keep in sync when parent updates
  useEffect(() => {
    setLocalMeds(patient.regular_medicines || []);
  }, [patient.regular_medicines]);

  const handleAddMed = async () => {
    const med = addMed.trim();
    if (!med || localMeds.includes(med)) return;
    const updated = [...localMeds, med];
    setSaving(true);
    setError(null);
    try {
      await caregiverService.updatePatientMedicines(patient.patient_id, updated);
      setLocalMeds(updated);
      onPatientUpdated({ ...patient, regular_medicines: updated });
      setAddMed('');
    } catch {
      setError('Could not update medicines. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMed = async (med) => {
    const updated = localMeds.filter((m) => m !== med);
    setSaving(true);
    setError(null);
    try {
      await caregiverService.updatePatientMedicines(patient.patient_id, updated);
      setLocalMeds(updated);
      onPatientUpdated({ ...patient, regular_medicines: updated });
    } catch {
      setError('Could not update medicines. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleRunCheck = async () => {
    if (localMeds.length === 0) { setError('No medicines to check.'); return; }
    setCheckLoading(true);
    setError(null);
    try {
      const result = await caregiverService.runPatientSafetyCheck(patient.patient_id);
      setSafetyResult(result);
      // persist to local history
      saveHistoryRecord({
        id: `caregiver-${patient.patient_id}-${Date.now()}`,
        medicines: localMeds,
        interactions: result.drug_interactions?.interactions || [],
        interactionsCount: result.summary?.drug_interactions_count || 0,
        status: result.has_warnings ? 'Attention Required' : 'Safe',
        variant: result.has_warnings ? 'attention' : 'safe',
      });
    } catch (err) {
      setError(err.message || 'Safety check failed.');
    } finally {
      setCheckLoading(false);
    }
  };

  return (
    <div className="cg-patient-detail">
      <button className="cg-back-btn" onClick={onBack}>
        ← Back to patients
      </button>

      {/* Patient header */}
      <div className="cg-detail-header">
        <div className="cg-detail-avatar">
          {(patient.full_name || patient.email).charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="cg-detail-name">{patient.full_name || patient.email}</h2>
          <span className="cg-detail-email">{patient.email}</span>
        </div>
      </div>

      {/* Health context — read-only, provided by patient */}
      <div className="cg-context-grid">
        <div className="cg-context-card">
          <span className="cg-context-label">Age</span>
          <span className="cg-context-value">{patient.age ?? '—'}</span>
        </div>
        <div className="cg-context-card">
          <span className="cg-context-label">Medical Conditions</span>
          <span className="cg-context-value">{patient.medical_conditions || 'None reported'}</span>
        </div>
        <div className="cg-context-card cg-context-card--allergy">
          <span className="cg-context-label">Known Allergies</span>
          <span className="cg-context-value">{patient.known_allergies || 'None reported'}</span>
        </div>
      </div>

      {error && <div className="cg-error">{error}</div>}

      {/* Medicine management */}
      <div className="cg-section">
        <h3 className="cg-section-title">Medicines</h3>
        <p className="cg-section-hint">
          These medicines are used as the full context when running a safety check.
        </p>
        {localMeds.length === 0
          ? <p className="cg-empty-hint">No medicines listed yet.</p>
          : (
            <ul className="cg-med-list">
              {localMeds.map((m) => (
                <li key={m} className="cg-med-item">
                  <span>{m}</span>
                  <button
                    className="cg-med-remove"
                    onClick={() => handleRemoveMed(m)}
                    disabled={saving}
                    aria-label={`Remove ${m}`}
                  >✕</button>
                </li>
              ))}
            </ul>
          )
        }
        <div className="cg-add-med-row">
          <input
            type="text"
            className="cg-add-med-input"
            placeholder="Add medicine name…"
            value={addMed}
            onChange={(e) => setAddMed(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddMed())}
            disabled={saving}
          />
          <button className="cg-add-med-btn" onClick={handleAddMed} disabled={saving || !addMed.trim()}>
            {saving ? '…' : 'Add'}
          </button>
        </div>
      </div>

      {/* Safety check trigger */}
      <div className="cg-section">
        <div className="cg-safety-bar">
          <div>
            <h3 className="cg-section-title" style={{ margin: 0 }}>Safety Check</h3>
            <p className="cg-section-hint" style={{ margin: 0 }}>
              Uses this patient's medicines, conditions, and allergies — not yours.
            </p>
          </div>
          <button
            className="cg-run-check-btn"
            onClick={handleRunCheck}
            disabled={checkLoading || localMeds.length === 0}
          >
            {checkLoading ? 'Running…' : 'Run Safety Check'}
          </button>
        </div>
      </div>

      {safetyResult && (
        <SafetyResultPanel result={safetyResult} onClose={() => setSafetyResult(null)} />
      )}
    </div>
  );
}

// ── Connection management panel ───────────────────────────────────────────────

function ConnectionPanel({ onGenerate }) {
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await onGenerate();
      setCode(data.connection_code);
    } catch {
      setError('Could not generate code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (code) {
      navigator.clipboard.writeText(code).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="cg-connection-panel">
      <h3 className="cg-connection-title">Connect a Patient</h3>
      <p className="cg-connection-desc">
        Generate an invite code and share it with your patient. They enter it in their MediGuard app to approve access.
      </p>
      {error && <div className="cg-error" style={{ marginBottom: '0.5rem' }}>{error}</div>}
      {code ? (
        <div className="cg-code-display">
          <span className="cg-code-value">{code}</span>
          <button className="cg-copy-btn" onClick={handleCopy}>
            {copied ? '✓ Copied' : 'Copy'}
          </button>
          <button className="cg-new-code-link" onClick={() => setCode(null)}>Generate another</button>
        </div>
      ) : (
        <button className="cg-gen-btn" onClick={handleGenerate} disabled={loading}>
          {loading ? 'Generating…' : '+ Generate Connection Code'}
        </button>
      )}
    </div>
  );
}

// ── Patient card (list item) ──────────────────────────────────────────────────

function PatientCard({ patient, onSelect, onRemove }) {
  return (
    <div className="cg-patient-card">
      <button className="cg-patient-card-body" onClick={() => onSelect(patient)}>
        <div className="cg-patient-avatar">
          {(patient.full_name || patient.email).charAt(0).toUpperCase()}
        </div>
        <div className="cg-patient-info">
          <span className="cg-patient-name">{patient.full_name || patient.email}</span>
          <span className="cg-patient-meta">
            {patient.age ? `Age ${patient.age} · ` : ''}
            {patient.regular_medicines?.length || 0} medicine{patient.regular_medicines?.length !== 1 ? 's' : ''}
          </span>
          {patient.medical_conditions && (
            <span className="cg-patient-conditions">{patient.medical_conditions}</span>
          )}
        </div>
        <svg className="cg-card-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
      <button
        className="cg-remove-btn"
        onClick={(e) => { e.stopPropagation(); onRemove(patient.connection_id); }}
        aria-label="Remove patient"
      >
        Remove
      </button>
    </div>
  );
}

// ── Root component ────────────────────────────────────────────────────────────

const CaregiverWorkspace = ({ currentUser, onNavigate, onOnboardingComplete, isOnboarding }) => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Patient approve-code panel (for patient role)
  const [approveCode, setApproveCode] = useState('');
  const [approveLoading, setApproveLoading] = useState(false);
  const [approveMessage, setApproveMessage] = useState(null);

  const isPatient   = currentUser?.role === 'patient';
  const isCaregiver = currentUser?.role === 'caregiver';

  const loadPatients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await caregiverService.getConnections();
      setPatients(data.patients || []);
    } catch {
      setError('Could not load your patient list.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isCaregiver && !isOnboarding) loadPatients();
  }, [isCaregiver, isOnboarding, loadPatients]);

  const handleRemovePatient = async (connectionId) => {
    if (!window.confirm('Remove this patient from your care list?')) return;
    try {
      await caregiverService.removeConnection(connectionId);
      setPatients((prev) => prev.filter((p) => p.connection_id !== connectionId));
      if (selectedPatient?.connection_id === connectionId) setSelectedPatient(null);
    } catch {
      setError('Failed to remove patient.');
    }
  };

  const handlePatientUpdated = (updated) => {
    setPatients((prev) => prev.map((p) => p.patient_id === updated.patient_id ? updated : p));
    setSelectedPatient(updated);
  };

  const handleApproveCode = async (e) => {
    e.preventDefault();
    setApproveLoading(true);
    setApproveMessage(null);
    try {
      const data = await caregiverService.approveConnection(approveCode.trim());
      setApproveMessage({ type: 'success', text: `Connected! Your caregiver: ${data.caregiver_email}` });
      setApproveCode('');
    } catch (err) {
      setApproveMessage({ type: 'error', text: err.message || 'Invalid or expired code.' });
    } finally {
      setApproveLoading(false);
    }
  };

  // ── Onboarding ──────────────────────────────────────────────────────────────
  if (isOnboarding) {
    return <CaregiverOnboarding onDone={onOnboardingComplete} />;
  }

  // ── Patient: approve a caregiver connection ─────────────────────────────────
  if (isPatient) {
    return (
      <div className="cg-workspace">
        <div className="cg-workspace-header">
          <h1 className="cg-workspace-title">Caregiver Access</h1>
          <p className="cg-workspace-subtitle">Enter the connection code your caregiver shared with you.</p>
        </div>
        <div className="cg-approve-card">
          <h2 className="cg-approve-title">Enter Connection Code</h2>
          {approveMessage && (
            <div className={`cg-alert cg-alert--${approveMessage.type}`}>{approveMessage.text}</div>
          )}
          <form className="cg-approve-form" onSubmit={handleApproveCode}>
            <input
              type="text"
              className="cg-approve-input"
              value={approveCode}
              onChange={(e) => setApproveCode(e.target.value.toUpperCase())}
              placeholder="e.g. ABCD1234"
              maxLength={10}
              required
            />
            <button type="submit" className="cg-approve-btn" disabled={approveLoading}>
              {approveLoading ? 'Connecting…' : 'Approve Connection'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Caregiver: selected patient detail view ─────────────────────────────────
  if (selectedPatient) {
    return (
      <PatientDetail
        patient={selectedPatient}
        onBack={() => setSelectedPatient(null)}
        onPatientUpdated={handlePatientUpdated}
      />
    );
  }

  // ── Caregiver: main workspace ───────────────────────────────────────────────
  return (
    <div className="cg-workspace">
      <div className="cg-workspace-header">
        <div>
          <h1 className="cg-workspace-title">My Patients</h1>
          <p className="cg-workspace-subtitle">Select a patient to view their health context and run safety checks.</p>
        </div>
      </div>

      {error && <div className="cg-error">{error}</div>}

      <div className="cg-workspace-body">
        {/* Patient list */}
        <div className="cg-patient-list-col">
          {loading ? (
            <div className="cg-loading">Loading patients…</div>
          ) : patients.length === 0 ? (
            <div className="cg-empty">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <p>No connected patients yet.</p>
              <p className="cg-empty-hint">Generate a connection code below and share it with a patient.</p>
            </div>
          ) : (
            <div className="cg-patient-cards">
              {patients.map((p) => (
                <PatientCard
                  key={p.connection_id}
                  patient={p}
                  onSelect={setSelectedPatient}
                  onRemove={handleRemovePatient}
                />
              ))}
            </div>
          )}
        </div>

        {/* Connection panel */}
        <div className="cg-sidebar-col">
          <ConnectionPanel onGenerate={caregiverService.generateCode} />
        </div>
      </div>
    </div>
  );
};

export default CaregiverWorkspace;
