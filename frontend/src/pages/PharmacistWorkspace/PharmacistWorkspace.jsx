import React, { useState, useEffect } from 'react';
import { pharmacistService } from '../../services/pharmacist/pharmacistService';
import { saveHistoryRecord } from '../../services/history/historyService';
import './PharmacistWorkspace.css';

// ── helpers ───────────────────────────────────────────────────────────────────

const severityClass = (s) => {
  const k = (s || '').toLowerCase();
  if (k === 'major' || k === 'severe') return 'ph-sev-major';
  if (k === 'moderate') return 'ph-sev-moderate';
  return 'ph-sev-minor';
};

// ── Inline safety results ─────────────────────────────────────────────────────

function SafetyResults({ result, patientContextUsed, patientContext }) {
  if (!result) return null;
  const { drug_interactions, patient_condition_warnings = [], allergy_warnings = [], summary } = result;
  const interactions = drug_interactions?.interactions || [];
  const hasMajor = summary?.major_warnings > 0;

  return (
    <div className="ph-check-results">
      {/* Summary badge */}
      <div className={`ph-result-badge ${hasMajor ? 'ph-badge-danger' : summary?.moderate_warnings > 0 ? 'ph-badge-warning' : 'ph-badge-safe'}`}>
        {hasMajor
          ? `⚠ ${summary.major_warnings} Major Warning${summary.major_warnings !== 1 ? 's' : ''}`
          : summary?.moderate_warnings > 0
            ? `⚠ ${summary.moderate_warnings} Moderate Warning${summary.moderate_warnings !== 1 ? 's' : ''}`
            : '✓ All Clear — No interactions found'}
      </div>

      {/* Patient context notice */}
      {patientContextUsed && patientContext && (
        <div className="ph-context-notice">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          Patient context used:
          {patientContext.has_conditions && ' conditions'}
          {patientContext.has_conditions && patientContext.has_allergies && ' +'}
          {patientContext.has_allergies && ' allergies'}
          {patientContext.age && `, age ${patientContext.age}`}
        </div>
      )}

      {/* Stats row */}
      <div className="ph-result-stats">
        <span>{summary?.total_medicines_checked || 0} medicines checked</span>
        {summary?.drug_interactions_count > 0 && <span>{summary.drug_interactions_count} drug interaction{summary.drug_interactions_count !== 1 ? 's' : ''}</span>}
        {summary?.allergy_warnings_count > 0 && <span>{summary.allergy_warnings_count} allergy alert{summary.allergy_warnings_count !== 1 ? 's' : ''}</span>}
        {summary?.condition_warnings_count > 0 && <span>{summary.condition_warnings_count} condition warning{summary.condition_warnings_count !== 1 ? 's' : ''}</span>}
      </div>

      {interactions.length === 0 && allergy_warnings.length === 0 && patient_condition_warnings.length === 0 ? (
        <p className="ph-no-warnings">No interactions or warnings detected for these medicines.</p>
      ) : (
        <ul className="ph-warning-list">
          {interactions.map((w, i) => (
            <li key={`int-${i}`} className={`ph-warning-item ${severityClass(w.severity)}`}>
              <span className="ph-warning-tag">Drug Interaction</span>
              <strong className="ph-warning-drugs">{w.drug_a} + {w.drug_b}</strong>
              <span className="ph-warning-sev">{w.severity}</span>
              {w.description && <span className="ph-warning-desc">{w.description}</span>}
            </li>
          ))}
          {allergy_warnings.map((w, i) => (
            <li key={`alg-${i}`} className={`ph-warning-item ${severityClass(w.severity)}`}>
              <span className="ph-warning-tag">Allergy Alert</span>
              <strong className="ph-warning-drugs">{w.title}</strong>
              <span className="ph-warning-desc">{w.description}</span>
            </li>
          ))}
          {patient_condition_warnings.map((w, i) => (
            <li key={`cond-${i}`} className={`ph-warning-item ${severityClass(w.severity)}`}>
              <span className="ph-warning-tag">Condition Warning</span>
              <strong className="ph-warning-drugs">{w.title}</strong>
              <span className="ph-warning-desc">{w.description}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Case detail panel ─────────────────────────────────────────────────────────

function CaseDetail({ caseData, onCaseUpdated, onDelete }) {
  const [addMed, setAddMed] = useState('');
  const [checkLoading, setCheckLoading] = useState(false);
  const [patientCtxLoading, setPatientCtxLoading] = useState(false);
  const [error, setError] = useState(null);
  const [safetyResult, setSafetyResult] = useState(caseData.interaction_result || null);
  const [patientContextUsed, setPatientContextUsed] = useState(false);
  const [patientContext, setPatientContext] = useState(null);

  // Reset safety result when case changes
  useEffect(() => {
    setSafetyResult(caseData.interaction_result || null);
    setPatientContextUsed(false);
    setPatientContext(null);
  }, [caseData.id]);

  const updateCase = async (patch) => {
    try {
      const updated = await pharmacistService.updateCase(caseData.id, patch);
      onCaseUpdated(updated);
      return updated;
    } catch {
      setError('Could not save changes.');
      return null;
    }
  };

  const handleAddMed = async () => {
    const med = addMed.trim();
    if (!med || caseData.medicines?.includes(med)) return;
    const updated = await updateCase({ medicines: [...(caseData.medicines || []), med] });
    if (updated) setAddMed('');
  };

  const handleRemoveMed = (med) => {
    updateCase({ medicines: caseData.medicines.filter((m) => m !== med) });
  };

  const handleRunCheck = async () => {
    if (!caseData.medicines?.length) { setError('Add at least one medicine first.'); return; }
    setCheckLoading(true);
    setError(null);
    try {
      const res = await pharmacistService.runSafetyCheck(caseData.id);
      setSafetyResult(res);
      setPatientContextUsed(res.patient_context_used || false);
      setPatientContext(res.patient_context || null);
      // persist to history
      saveHistoryRecord({
        id: `pharmacist-case-${caseData.id}-${Date.now()}`,
        medicines: caseData.medicines,
        interactions: res.drug_interactions?.interactions || [],
        interactionsCount: res.summary?.drug_interactions_count || 0,
        status: res.has_warnings ? 'Attention Required' : 'Safe',
        variant: res.has_warnings ? 'attention' : 'safe',
      });
      onCaseUpdated({ ...caseData, interaction_result: res });
    } catch (err) {
      setError(err.message || 'Safety check failed.');
    } finally {
      setCheckLoading(false);
    }
  };

  const handleUnlinkPatient = async () => {
    setPatientCtxLoading(true);
    const updated = await updateCase({ patient_id: null });
    if (updated) setSafetyResult(null);
    setPatientCtxLoading(false);
  };

  return (
    <div className="ph-case-detail">
      {/* Case header */}
      <div className="ph-case-detail-header">
        <div>
          <h2 className="ph-case-title">{caseData.title || `Case #${caseData.id}`}</h2>
          {caseData.notes && <p className="ph-case-notes">{caseData.notes}</p>}
        </div>
        <button className="ph-delete-btn" onClick={() => onDelete(caseData.id)}>Delete case</button>
      </div>

      {error && <div className="ph-error">{error}</div>}

      {/* Patient context */}
      <div className="ph-section">
        <div className="ph-section-header">
          <h3 className="ph-section-title">Patient Context</h3>
          {caseData.patient_id && (
            <button
              className="ph-unlink-btn"
              onClick={handleUnlinkPatient}
              disabled={patientCtxLoading}
            >
              {patientCtxLoading ? 'Removing…' : 'Remove patient context'}
            </button>
          )}
        </div>
        {caseData.patient_id ? (
          <div className="ph-patient-ctx-active">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            Patient context linked (ID #{caseData.patient_id}). Conditions and allergies will be included in the safety check.
          </div>
        ) : (
          <p className="ph-patient-ctx-empty">
            No patient linked. The safety check will cover drug–drug interactions only.
            To include patient-specific allergy and condition warnings, a patient must be linked to this case via their patient ID.
          </p>
        )}
      </div>

      {/* Medicines */}
      <div className="ph-section">
        <h3 className="ph-section-title">Medicines</h3>
        {(!caseData.medicines || caseData.medicines.length === 0)
          ? <p className="ph-empty-hint">No medicines added yet.</p>
          : (
            <ul className="ph-med-list">
              {caseData.medicines.map((m) => (
                <li key={m} className="ph-med-item">
                  <span>{m}</span>
                  <button className="ph-med-remove" onClick={() => handleRemoveMed(m)} aria-label={`Remove ${m}`}>✕</button>
                </li>
              ))}
            </ul>
          )
        }
        <div className="ph-add-med-row">
          <input
            type="text"
            className="ph-add-input"
            placeholder="Add medicine name…"
            value={addMed}
            onChange={(e) => setAddMed(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddMed())}
          />
          <button className="ph-add-btn" onClick={handleAddMed} disabled={!addMed.trim()}>Add</button>
        </div>
      </div>

      {/* Safety check */}
      <div className="ph-section">
        <div className="ph-safety-bar">
          <div>
            <h3 className="ph-section-title" style={{ margin: 0 }}>Safety Check</h3>
            <p className="ph-section-hint" style={{ margin: 0 }}>
              {caseData.patient_id
                ? 'Will include patient allergies and condition warnings.'
                : 'Drug–drug interactions only (no patient context linked).'}
            </p>
          </div>
          <button
            className="ph-run-btn"
            onClick={handleRunCheck}
            disabled={checkLoading || !caseData.medicines?.length}
          >
            {checkLoading ? 'Running…' : 'Run Safety Check'}
          </button>
        </div>
        <SafetyResults
          result={safetyResult}
          patientContextUsed={patientContextUsed}
          patientContext={patientContext}
        />
      </div>
    </div>
  );
}

// ── Root component ────────────────────────────────────────────────────────────

const PharmacistWorkspace = ({ currentUser }) => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCase, setSelectedCase] = useState(null);

  // New case form
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => { loadCases(); }, []);

  const loadCases = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await pharmacistService.getCases();
      setCases(data.cases || []);
    } catch {
      setError('Could not load cases.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCase = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const created = await pharmacistService.createCase({ title: newTitle.trim(), notes: newNotes.trim() });
      setCases((prev) => [created, ...prev]);
      setNewTitle('');
      setNewNotes('');
      setShowNewForm(false);
      setSelectedCase(created);
    } catch {
      setError('Failed to create case.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCase = async (id) => {
    if (!window.confirm('Delete this case permanently?')) return;
    try {
      await pharmacistService.deleteCase(id);
      setCases((prev) => prev.filter((c) => c.id !== id));
      if (selectedCase?.id === id) setSelectedCase(null);
    } catch {
      setError('Failed to delete case.');
    }
  };

  const handleCaseUpdated = (updated) => {
    setCases((prev) => prev.map((c) => c.id === updated.id ? updated : c));
    setSelectedCase(updated);
  };

  return (
    <div className="ph-workspace">
      {/* Left panel */}
      <div className="ph-case-panel">
        <div className="ph-panel-header">
          <h2 className="ph-panel-title">Screening Cases</h2>
          <button className="ph-new-btn" onClick={() => setShowNewForm((v) => !v)}>
            {showNewForm ? '✕ Cancel' : '+ New Case'}
          </button>
        </div>

        {showNewForm && (
          <form className="ph-new-form" onSubmit={handleCreateCase}>
            <input
              className="ph-form-input"
              type="text"
              placeholder="Case title (e.g. Patient A review)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
            />
            <textarea
              className="ph-form-textarea"
              placeholder="Notes (optional)"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              rows={2}
            />
            <button type="submit" className="ph-create-btn" disabled={creating}>
              {creating ? 'Creating…' : 'Create Case'}
            </button>
          </form>
        )}

        {error && <div className="ph-error">{error}</div>}

        {loading ? (
          <div className="ph-loading">Loading…</div>
        ) : cases.length === 0 ? (
          <div className="ph-empty-sm">No cases yet. Create one to start screening.</div>
        ) : (
          <ul className="ph-case-list">
            {cases.map((c) => (
              <li
                key={c.id}
                className={`ph-case-item${selectedCase?.id === c.id ? ' ph-case-item--active' : ''}`}
                onClick={() => setSelectedCase(c)}
              >
                <div className="ph-case-item-title">{c.title || `Case #${c.id}`}</div>
                <div className="ph-case-item-meta">
                  {c.medicines?.length || 0} medicine{c.medicines?.length !== 1 ? 's' : ''}
                  {c.patient_id ? ' · Patient linked' : ''}
                  {c.interaction_result ? ' · Checked' : ''}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Right panel */}
      <div className="ph-detail-panel">
        {!selectedCase ? (
          <div className="ph-detail-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
              <path d="m8.5 8.5 7 7" />
            </svg>
            <p>Select a case from the list, or create a new one.</p>
          </div>
        ) : (
          <CaseDetail
            key={selectedCase.id}
            caseData={selectedCase}
            onCaseUpdated={handleCaseUpdated}
            onDelete={handleDeleteCase}
          />
        )}
      </div>
    </div>
  );
};

export default PharmacistWorkspace;
