import React, { useState, useRef } from 'react';
import Button from '../../components/common/Button';
import './SafetyCheckResults.css';

// ── Helpers ───────────────────────────────────────────────────────────────────

const getMedName = (med) =>
  typeof med === 'string' ? med : (med?.rxnorm_name || med?.name || '');

const INITIAL_COLORS = [
  '#A63D35', '#2D8A56', '#7C5CD8', '#D97706', '#0369A1',
  '#BE185D', '#065F46', '#92400E', '#4338CA', '#B45309',
];
const colorFor = (name) =>
  INITIAL_COLORS[(name?.charCodeAt(0) || 0) % INITIAL_COLORS.length];

const getInitial = (name) => (name || '?').charAt(0).toUpperCase();

/**
 * Normalises a severity string to one of: 'major' | 'moderate' | 'minor' | 'none'
 */
const normaliseSeverity = (s) => {
  const key = (s || '').toLowerCase();
  if (key === 'major' || key === 'severe') return 'major';
  if (key === 'moderate') return 'moderate';
  if (key === 'minor' || key === 'safe') return 'minor';
  return 'none';
};

const SEVERITY_DISPLAY = {
  major: {
    label: 'Major',
    badgeClass: 'scr-badge--major',
    cardClass: 'scr-issue-card--major',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  moderate: {
    label: 'Moderate',
    badgeClass: 'scr-badge--moderate',
    cardClass: 'scr-issue-card--moderate',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
  minor: {
    label: 'Mild',
    badgeClass: 'scr-badge--minor',
    cardClass: 'scr-issue-card--minor',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
  },
  none: {
    label: 'No Interaction',
    badgeClass: 'scr-badge--none',
    cardClass: 'scr-issue-card--none',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
};

// ── Matrix cell colour mapping ─────────────────────────────────────────────────
const MATRIX_CELL = {
  major:    { bg: '#FDF2F2', color: '#A63D35', label: 'Major',          symbol: '⚠' },
  moderate: { bg: '#FFF9F3', color: '#C97121', label: 'Moderate',       symbol: '!' },
  minor:    { bg: '#F0FDF4', color: '#2D8A56', label: 'Mild',           symbol: '~' },
  none:     { bg: '#F7F8FA', color: '#6E6462', label: 'No Interaction', symbol: '—' },
  self:     { bg: 'transparent', color: '#6E6462', label: '', symbol: '—' },
};

// ── Donut SVG chart ───────────────────────────────────────────────────────────
const DonutChart = ({ segments, total }) => {
  const SIZE = 120;
  const R = 42;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const circumference = 2 * Math.PI * R;
  let offset = 0;
  const slices = [];

  const COLORS = {
    major:    '#D9383A',
    moderate: '#E27E36',
    minor:    '#2D8A56',
    none:     '#A3A3A3',
  };

  segments.forEach(({ key, count }) => {
    if (count === 0) return;
    const pct = total > 0 ? count / total : 0;
    const dashLength = pct * circumference;
    slices.push(
      <circle
        key={key}
        cx={CX}
        cy={CY}
        r={R}
        fill="none"
        stroke={COLORS[key] || '#A3A3A3'}
        strokeWidth="22"
        strokeDasharray={`${dashLength} ${circumference - dashLength}`}
        strokeDashoffset={-(offset * circumference)}
        style={{ transform: 'rotate(-90deg)', transformOrigin: `${CX}px ${CY}px` }}
        aria-label={`${key}: ${count}`}
      />
    );
    offset += pct;
  });

  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label="Risk distribution donut chart">
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--color-border-default)" strokeWidth="22" />
      {slices}
      <text x={CX} y={CY - 6} textAnchor="middle" fontSize="20" fontWeight="800" fill="var(--color-text-primary)">{total}</text>
      <text x={CX} y={CY + 11} textAnchor="middle" fontSize="10" fill="var(--color-text-secondary)">Total</text>
    </svg>
  );
};

// ── Collapsible clinical details ──────────────────────────────────────────────
const ClinicalDetails = ({ interaction }) => {
  const [open, setOpen] = useState(false);
  const bodyRef = useRef(null);

  const medA = interaction.medicine_a || {};
  const medB = interaction.medicine_b || {};

  const hasDetails =
    medA.rxcui || medB.rxcui || interaction.description;

  if (!hasDetails) return null;

  return (
    <div className="scr-clinical-wrap">
      <button
        type="button"
        className="scr-clinical-toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span>View Clinical Details</span>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="scr-clinical-body" ref={bodyRef}>
          {interaction.description && (
            <div className="scr-clinical-row">
              <span className="scr-clinical-label">Mechanism</span>
              <span className="scr-clinical-value">{interaction.description}</span>
            </div>
          )}
          <div className="scr-clinical-row">
            <span className="scr-clinical-label">Management</span>
            <span className="scr-clinical-value">
              Consult your doctor or pharmacist before continuing or changing any medication regimen.
              Do not change your medication without professional guidance.
            </span>
          </div>
          {(medA.rxcui || medA.name) && (
            <div className="scr-clinical-row">
              <span className="scr-clinical-label">
                {interaction.drugA || medA.name || 'Medicine A'} — RxCUI
              </span>
              <span className="scr-clinical-value scr-clinical-mono">
                {medA.rxcui || 'N/A'}
              </span>
            </div>
          )}
          {(medB.rxcui || medB.name) && (
            <div className="scr-clinical-row">
              <span className="scr-clinical-label">
                {interaction.drugB || medB.name || 'Medicine B'} — RxCUI
              </span>
              <span className="scr-clinical-value scr-clinical-mono">
                {medB.rxcui || 'N/A'}
              </span>
            </div>
          )}
          <div className="scr-clinical-row">
            <span className="scr-clinical-label">Source</span>
            <span className="scr-clinical-value">DDInter 2.0</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────

/**
 * SafetyCheckResults
 *
 * Props:
 *   result       – the raw object returned by checkInteractions / checkPersonalizedSafety
 *   medicines    – array of medicine objects/strings that were checked
 *   checkMeta    – { checkId, timestamp }
 *   currentUser  – user profile object
 *   onBack       – () => void  — back to Safety Check page
 *   onDownload   – () => void  — optional report download handler
 */
export const SafetyCheckResults = ({
  result,
  medicines = [],
  checkMeta = {},
  currentUser,
  onBack,
  onDownload,
  onViewInteraction: _onViewInteraction,
}) => {
  const issueRefs = useRef({});

  // ── Normalise the API response into a clean shape ─────────────────────────

  const isPersonalized = !!(result?.drug_interactions);
  const rawInteractions = isPersonalized
    ? (result?.drug_interactions?.interactions || [])
    : (result?.interactions || []);
  const condWarnings = isPersonalized
    ? (result?.patient_condition_warnings || [])
    : [];

  // Build full interaction list
  const drugInteractions = rawInteractions.map((item, idx) => ({
    id: item.id || `int-${idx}`,
    drugA: item.medicine_a?.name || item.medicine_a?.rxnorm_name || 'Medicine A',
    drugB: item.medicine_b?.name || item.medicine_b?.rxnorm_name || 'Medicine B',
    severity: normaliseSeverity(item.severity || item.level),
    description: item.description || '',
    medicine_a: item.medicine_a || {},
    medicine_b: item.medicine_b || {},
    source: 'DDInter 2.0',
  }));

  const conditionIssues = condWarnings.map((item, idx) => ({
    id: `cond-${idx}`,
    drugA: item.title || 'Condition Warning',
    drugB: 'Your Medical Profile',
    severity: normaliseSeverity(item.severity || 'Moderate'),
    description: item.description || '',
    medicine_a: {},
    medicine_b: {},
    isConditionWarning: true,
    source: 'Patient Profile',
  }));

  const allIssues = [...drugInteractions, ...conditionIssues];

  // ── Checked medicines list ─────────────────────────────────────────────────
  const checkedMeds = isPersonalized
    ? (result?.drug_interactions?.checked_medicines || [])
    : (result?.checked_medicines || []);

  // Use passed medicines array as display names (they retain original names)
  const medDisplayList = medicines.length > 0 ? medicines : checkedMeds;

  // ── Summary counts ─────────────────────────────────────────────────────────
  const counts = allIssues.reduce(
    (acc, i) => { acc[i.severity] = (acc[i.severity] || 0) + 1; return acc; },
    {}
  );

  // Pairs that have no interaction
  const pairsChecked = isPersonalized
    ? (result?.drug_interactions?.summary?.pairs_checked || 0)
    : (result?.summary?.pairs_checked || 0);
  const interactionsFound = allIssues.filter(
    (i) => !i.isConditionWarning
  ).length;
  const noInteractionCount = Math.max(0, pairsChecked - interactionsFound);

  // ── Allergy conflict (not yet in backend — show based on allergies + meds) ─
  const allergies = (
    currentUser?.allergies ||
    currentUser?.known_allergies ||
    ''
  );
  const allergyList = typeof allergies === 'string'
    ? allergies.split(/[,;]/).map((a) => a.trim().toLowerCase()).filter(Boolean)
    : [];
  const allergyConflicts = allergyList.filter((a) =>
    medDisplayList.some((m) => getMedName(m).toLowerCase().includes(a))
  );

  // ── Risk distribution segments ─────────────────────────────────────────────
  const distSegments = [
    { key: 'major',    count: counts.major    || 0, label: 'Major' },
    { key: 'moderate', count: counts.moderate || 0, label: 'Moderate' },
    { key: 'minor',    count: counts.minor    || 0, label: 'Mild' },
    { key: 'none',     count: noInteractionCount,   label: 'No Interaction' },
  ].filter((s) => s.count > 0 || s.key === 'none');
  const distTotal = distSegments.reduce((s, d) => s + d.count, 0);

  // ── Interaction matrix ─────────────────────────────────────────────────────
  // Use medicine names from the check
  const matrixMeds = medDisplayList.map((m, idx) => ({
    key: `med-${idx}`,
    name: getMedName(m),
  }));

  const getMatrixSeverity = (nameA, nameB) => {
    if (nameA === nameB) return 'self';
    const match = drugInteractions.find(
      (i) =>
        (i.drugA.toLowerCase() === nameA.toLowerCase() && i.drugB.toLowerCase() === nameB.toLowerCase()) ||
        (i.drugA.toLowerCase() === nameB.toLowerCase() && i.drugB.toLowerCase() === nameA.toLowerCase())
    );
    return match ? match.severity : 'none';
  };

  // ── Timestamp / check meta ─────────────────────────────────────────────────
  const checkId = checkMeta.checkId || `MG-${Date.now().toString(36).toUpperCase()}`;
  const ts = checkMeta.timestamp ? new Date(checkMeta.timestamp) : new Date();
  const checkDate = ts.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const checkTime = ts.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  // ── Patient context ────────────────────────────────────────────────────────
  const profileAge = currentUser?.age;
  const profileConditions = currentUser?.medicalConditions || currentUser?.medical_conditions || '';
  const profileAllergies = allergies;
  const profileMedCount = Array.isArray(currentUser?.regularMedicines)
    ? currentUser.regularMedicines.length
    : Array.isArray(currentUser?.regular_medicines)
    ? currentUser.regular_medicines.length
    : null;

  const hasProfileData = profileAge || profileConditions || profileAllergies || profileMedCount !== null;

  // ── Scroll to issue on matrix click ───────────────────────────────────────
  const scrollToIssue = (issueId) => {
    setTimeout(() => {
      const el = issueRefs.current[issueId];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 60);
  };

  const handleMatrixClick = (nameA, nameB) => {
    const match = drugInteractions.find(
      (i) =>
        (i.drugA.toLowerCase() === nameA.toLowerCase() && i.drugB.toLowerCase() === nameB.toLowerCase()) ||
        (i.drugA.toLowerCase() === nameB.toLowerCase() && i.drugB.toLowerCase() === nameA.toLowerCase())
    );
    if (match) scrollToIssue(match.id);
  };

  // ── Download handler ───────────────────────────────────────────────────────
  const handleDownload = () => {
    if (onDownload) { onDownload(); return; }
    // UI-level abstraction — PDF generation is a separate feature.
    alert('Report download will be available in a future update. You can use your browser\'s print function (Ctrl+P / ⌘+P) to save this page as PDF.');
  };

  // ── Error state ────────────────────────────────────────────────────────────
  if (!result) {
    return (
      <div className="scr-page">
        <div className="scr-error-state">
          <div className="scr-error-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <h2>No results available</h2>
          <p>Run a safety check first to see results.</p>
          {onBack && (
            <Button variant="primary" size="medium" onClick={onBack} style={{ marginTop: '1rem' }}>
              Back to Safety Check
            </Button>
          )}
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="scr-page">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="scr-header">
        <div className="scr-header-left">
          <button type="button" className="scr-back-btn" onClick={onBack} aria-label="Back to Safety Check">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
            Back to Safety Check
          </button>
          <div className="scr-title-row">
            <h1 className="scr-page-title">Safety Check Results</h1>
            <span className="scr-status-badge" aria-label="Check status: Completed">Completed</span>
          </div>
          <p className="scr-meta">
            Checked on {checkDate} · {checkTime}
            <span className="scr-meta-sep">·</span>
            Check ID: {checkId}
          </p>
        </div>
        <button type="button" className="scr-download-btn" onClick={handleDownload} aria-label="Download report">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download Report
        </button>
      </div>

      {/* ── SUMMARY CARDS ──────────────────────────────────────────────────── */}
      <div className="scr-summary-grid" role="list" aria-label="Safety check summary">
        <div className="scr-summary-card scr-summary-card--major" role="listitem">
          <div className="scr-summary-card-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div className="scr-summary-card-body">
            <span className="scr-summary-card-label">Major Interaction</span>
            <span className="scr-summary-card-count" aria-label={`${counts.major || 0} major interactions`}>
              {counts.major || 0}
            </span>
            <span className="scr-summary-card-note">High-risk interaction needs attention</span>
          </div>
        </div>

        <div className="scr-summary-card scr-summary-card--moderate" role="listitem">
          <div className="scr-summary-card-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div className="scr-summary-card-body">
            <span className="scr-summary-card-label">Moderate Concern</span>
            <span className="scr-summary-card-count" aria-label={`${counts.moderate || 0} moderate concerns`}>
              {counts.moderate || 0}
            </span>
            <span className="scr-summary-card-note">Patient-specific consideration</span>
          </div>
        </div>

        <div className="scr-summary-card scr-summary-card--none" role="listitem">
          <div className="scr-summary-card-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <div className="scr-summary-card-body">
            <span className="scr-summary-card-label">No Interaction</span>
            <span className="scr-summary-card-count" aria-label={`${noInteractionCount} pairs with no interaction`}>
              {noInteractionCount}
            </span>
            <span className="scr-summary-card-note">No DDI identified</span>
          </div>
        </div>

        <div className="scr-summary-card scr-summary-card--allergy" role="listitem">
          <div className="scr-summary-card-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18.364 5.636A9 9 0 1 0 5.636 18.364 9 9 0 0 0 18.364 5.636z" />
              <path d="M12 8v4m0 4h.01" />
            </svg>
          </div>
          <div className="scr-summary-card-body">
            <span className="scr-summary-card-label">Allergy Conflict</span>
            <span className="scr-summary-card-count" aria-label={`${allergyConflicts.length} allergy conflicts`}>
              {allergyConflicts.length}
            </span>
            <span className="scr-summary-card-note">
              {allergyList.length === 0
                ? 'No allergy data in profile'
                : allergyConflicts.length === 0
                ? 'No known allergy conflicts'
                : 'Possible allergy conflict'}
            </span>
          </div>
        </div>
      </div>

      {/* ── TWO-COLUMN LAYOUT (chart + matrix) ─────────────────────────────── */}
      <div className="scr-two-col">

        {/* Risk Distribution */}
        <div className="scr-card scr-dist-card">
          <h2 className="scr-section-title">Risk Distribution</h2>
          <div className="scr-dist-inner">
            <DonutChart segments={distSegments} total={distTotal} />
            <ul className="scr-dist-legend" aria-label="Risk distribution legend">
              {distSegments.map(({ key, count, label }) => (
                <li key={key} className="scr-dist-legend-item">
                  <span className={`scr-dist-dot scr-dist-dot--${key}`} aria-hidden="true" />
                  <span className="scr-dist-label">{label} ({count})</span>
                  <span className="scr-dist-pct">
                    {distTotal > 0 ? `${((count / distTotal) * 100).toFixed(1)}%` : '0%'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Interaction Matrix */}
        <div className="scr-card scr-matrix-card">
          <h2 className="scr-section-title">Interaction Matrix</h2>
          {matrixMeds.length < 2 ? (
            <p className="scr-muted-note">
              At least two medicines are needed to display a matrix.
            </p>
          ) : (
            <div className="scr-matrix-scroll" role="region" aria-label="Interaction matrix">
              <table className="scr-matrix" aria-describedby="matrix-desc">
                <caption id="matrix-desc" className="scr-visually-hidden">
                  Drug interaction matrix showing severity between each pair of checked medicines
                </caption>
                <thead>
                  <tr>
                    <th className="scr-matrix-corner" scope="col" aria-label="Medicine pairs" />
                    {matrixMeds.map((m) => (
                      <th key={m.key} scope="col" className="scr-matrix-col-header" title={m.name}>
                        <div className="scr-matrix-avatar" style={{ background: colorFor(m.name) }}>
                          {getInitial(m.name)}
                        </div>
                        <span className="scr-matrix-col-name">{m.name}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrixMeds.map((rowMed) => (
                    <tr key={rowMed.key}>
                      <th scope="row" className="scr-matrix-row-header">
                        <div className="scr-matrix-avatar" style={{ background: colorFor(rowMed.name) }}>
                          {getInitial(rowMed.name)}
                        </div>
                        <span className="scr-matrix-row-name">{rowMed.name}</span>
                      </th>
                      {matrixMeds.map((colMed) => {
                        const sev = getMatrixSeverity(rowMed.name, colMed.name);
                        const cell = MATRIX_CELL[sev] || MATRIX_CELL.none;
                        const isSelf = sev === 'self';
                        const isClickable = !isSelf && sev !== 'none';
                        return (
                          <td
                            key={colMed.key}
                            className={`scr-matrix-cell ${isClickable ? 'scr-matrix-cell--clickable' : ''}`}
                            style={{ background: cell.bg, color: cell.color }}
                            title={isSelf ? '' : `${rowMed.name} + ${colMed.name}: ${cell.label}`}
                            onClick={
                              isClickable
                                ? () => handleMatrixClick(rowMed.name, colMed.name)
                                : undefined
                            }
                            role={isClickable ? 'button' : 'cell'}
                            tabIndex={isClickable ? 0 : undefined}
                            aria-label={
                              isSelf
                                ? `${rowMed.name} — same medicine`
                                : `${rowMed.name} and ${colMed.name}: ${cell.label}`
                            }
                            onKeyDown={
                              isClickable
                                ? (e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault();
                                      handleMatrixClick(rowMed.name, colMed.name);
                                    }
                                  }
                                : undefined
                            }
                          >
                            <span className="scr-matrix-symbol" aria-hidden="true">{cell.symbol}</span>
                            <span className="scr-visually-hidden">{cell.label}</span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Legend */}
              <div className="scr-matrix-legend" aria-label="Matrix legend">
                {[
                  { sev: 'major',    label: 'Major' },
                  { sev: 'moderate', label: 'Moderate' },
                  { sev: 'none',     label: 'No Interaction' },
                ].map(({ sev, label }) => {
                  const c = MATRIX_CELL[sev];
                  return (
                    <span key={sev} className="scr-matrix-legend-item">
                      <span
                        className="scr-matrix-legend-dot"
                        style={{ background: c.color }}
                        aria-hidden="true"
                      />
                      {label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── DETECTED ISSUES ────────────────────────────────────────────────── */}
      <div className="scr-card" id="detected-issues">
        <h2 className="scr-section-title">Detected Issues</h2>
        {allIssues.length === 0 ? (
          <div className="scr-empty-state">
            <div className="scr-empty-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <p className="scr-empty-title">No interactions detected</p>
            <p className="scr-empty-sub">
              No drug-drug interactions were identified for the checked medicines based on the available data.
            </p>
          </div>
        ) : (
          <div className="scr-issues-list">
            {allIssues.map((issue) => {
              const sev = SEVERITY_DISPLAY[issue.severity] || SEVERITY_DISPLAY.none;
              return (
                <div
                  key={issue.id}
                  id={`issue-${issue.id}`}
                  className={`scr-issue-card ${sev.cardClass}`}
                  ref={(el) => { issueRefs.current[issue.id] = el; }}
                >
                  {/* Card header */}
                  <div className="scr-issue-header">
                    <div className="scr-issue-drugs">
                      <span className="scr-drug-pill">{issue.drugA}</span>
                      <span className="scr-issue-plus" aria-hidden="true">+</span>
                      <span className="scr-drug-pill">{issue.drugB}</span>
                    </div>
                    <span className={`scr-badge ${sev.badgeClass}`} role="img" aria-label={`Severity: ${sev.label}`}>
                      <span aria-hidden="true">{sev.icon}</span>
                      {sev.label}
                    </span>
                  </div>

                  {/* What this means */}
                  {issue.description && (
                    <div className="scr-issue-section">
                      <p className="scr-issue-section-label">What this means</p>
                      <p className="scr-issue-section-text">{issue.description}</p>
                    </div>
                  )}

                  {/* Possible effects */}
                  <div className="scr-issue-section">
                    <p className="scr-issue-section-label">Possible effects</p>
                    <p className="scr-issue-section-text">
                      {issue.severity === 'major'
                        ? 'This combination may significantly increase the risk of adverse effects. Potential for increased bleeding, toxicity, or altered drug efficacy.'
                        : issue.severity === 'moderate'
                        ? 'This combination may require monitoring or dose adjustment. Effects may be manageable with professional guidance.'
                        : issue.severity === 'minor'
                        ? 'This combination has a low potential for interaction. Monitor for any unusual symptoms.'
                        : 'No significant interaction effects identified based on available data.'}
                    </p>
                  </div>

                  {/* What you can do */}
                  <div className="scr-issue-section">
                    <p className="scr-issue-section-label">What you can do</p>
                    <p className="scr-issue-section-text">
                      {issue.severity === 'major'
                        ? 'Consult your doctor or pharmacist before continuing this combination. Do not stop or change your medication without professional guidance.'
                        : issue.severity === 'moderate'
                        ? 'Seek professional medical advice. Your doctor may recommend monitoring or a dose adjustment.'
                        : 'Discuss with your healthcare professional if you have concerns. Continue medication as prescribed unless advised otherwise.'}
                    </p>
                  </div>

                  {/* Source */}
                  <p className="scr-issue-source">
                    Source: <strong>{issue.source || 'DDInter 2.0'}</strong>
                  </p>

                  {/* Clinical Details (expandable) */}
                  {!issue.isConditionWarning && (
                    <ClinicalDetails interaction={issue} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* No-interaction pairs section */}
        {noInteractionCount > 0 && drugInteractions.length < pairsChecked && (
          <div className="scr-no-int-section">
            <h3 className="scr-no-int-title">Pairs with No Detected Interaction</h3>
            {(() => {
              const interactingPairs = new Set(
                drugInteractions.flatMap((i) => [
                  `${i.drugA.toLowerCase()}|${i.drugB.toLowerCase()}`,
                  `${i.drugB.toLowerCase()}|${i.drugA.toLowerCase()}`,
                ])
              );
              const noIntPairs = [];
              for (let a = 0; a < matrixMeds.length; a++) {
                for (let b = a + 1; b < matrixMeds.length; b++) {
                  const nameA = matrixMeds[a].name;
                  const nameB = matrixMeds[b].name;
                  const key = `${nameA.toLowerCase()}|${nameB.toLowerCase()}`;
                  if (!interactingPairs.has(key)) {
                    noIntPairs.push({ nameA, nameB });
                  }
                }
              }
              return noIntPairs.map(({ nameA, nameB }, idx) => (
                <div key={idx} className="scr-no-int-card">
                  <div className="scr-no-int-header">
                    <span className="scr-drug-pill scr-drug-pill--neutral">{nameA}</span>
                    <span className="scr-issue-plus" aria-hidden="true">+</span>
                    <span className="scr-drug-pill scr-drug-pill--neutral">{nameB}</span>
                    <span className={`scr-badge ${SEVERITY_DISPLAY.none.badgeClass}`}>
                      <span aria-hidden="true">{SEVERITY_DISPLAY.none.icon}</span>
                      No Interaction
                    </span>
                  </div>
                  <p className="scr-no-int-text">
                    No interaction was identified between these medicines based on the available interaction data.
                  </p>
                </div>
              ));
            })()}
          </div>
        )}
      </div>

      {/* ── BOTTOM TWO-COLUMN: Patient Context + Allergy + Help ─────────────── */}
      <div className="scr-two-col">

        {/* Patient Safety Context */}
        <div className="scr-card">
          <h2 className="scr-section-title">Patient Safety Context</h2>
          <p className="scr-context-note">
            This assessment is based on the information available in your profile at the time of this check.
          </p>
          {!hasProfileData ? (
            <div className="scr-missing-profile">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Patient profile information was not available. Patient-specific analysis could not be completed.
            </div>
          ) : (
            <ul className="scr-context-list" aria-label="Patient profile information considered">
              {profileAge != null && (
                <li className="scr-context-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="scr-context-icon" aria-hidden="true">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                  <span className="scr-context-field">Age</span>
                  <span className="scr-context-value">{profileAge} years</span>
                </li>
              )}
              {profileConditions && (
                <li className="scr-context-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="scr-context-icon" aria-hidden="true">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                  <span className="scr-context-field">Medical Conditions</span>
                  <span className="scr-context-value">{profileConditions}</span>
                </li>
              )}
              {allergyList.length > 0 && (
                <li className="scr-context-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="scr-context-icon" aria-hidden="true">
                    <path d="M18.364 5.636A9 9 0 1 0 5.636 18.364 9 9 0 0 0 18.364 5.636z" />
                    <path d="M12 8v4m0 4h.01" />
                  </svg>
                  <span className="scr-context-field">Allergies</span>
                  <span className="scr-context-value">{allergyList.join(', ')}</span>
                </li>
              )}
              {profileMedCount !== null && (
                <li className="scr-context-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="scr-context-icon" aria-hidden="true">
                    <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
                  </svg>
                  <span className="scr-context-field">Total Current Medicines</span>
                  <span className="scr-context-value">{profileMedCount}</span>
                </li>
              )}
            </ul>
          )}

          {/* Allergy Check */}
          <h3 className="scr-subsection-title">Allergy Check</h3>
          {allergyList.length === 0 ? (
            <div className="scr-allergy-state scr-allergy-state--unknown">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Allergy information was not available in your profile. Allergy screening could not be completed.
            </div>
          ) : allergyConflicts.length > 0 ? (
            <div className="scr-allergy-state scr-allergy-state--conflict" role="alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <div>
                <strong>Possible allergy conflict identified.</strong>
                <p>
                  One or more checked medicines may conflict with your recorded allergies ({allergyConflicts.join(', ')}).
                  Consult your doctor or pharmacist before taking these medicines.
                </p>
              </div>
            </div>
          ) : (
            <div className="scr-allergy-state scr-allergy-state--ok">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" />
              </svg>
              No known allergy conflict identified based on the allergies recorded in your profile.
              Reviewed medicines against {allergyList.length} recorded {allergyList.length === 1 ? 'allergy' : 'allergies'}.
            </div>
          )}
        </div>

        {/* What to Do Next */}
        <div className="scr-card">
          <h2 className="scr-section-title">What to Do Next</h2>
          <ul className="scr-next-list" aria-label="Recommended next steps">
            <li className="scr-next-item">
              <span className="scr-next-icon" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </span>
              Do not stop or change any medication without consulting your doctor or pharmacist first.
            </li>
            <li className="scr-next-item">
              <span className="scr-next-icon" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              Consult your doctor or pharmacist about the interactions shown.
            </li>
            {allIssues.length > 0 && (
              <li className="scr-next-item">
                <span className="scr-next-icon" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </span>
                Show them this report if needed.
              </li>
            )}
            <li className="scr-next-item">
              <span className="scr-next-icon" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" /><path d="M21 21v-2a4 4 0 0 0-3-3.87" />
                </svg>
              </span>
              Update your profile if your health information has changed.
            </li>
          </ul>
        </div>
      </div>

      {/* ── DISCLAIMER ─────────────────────────────────────────────────────── */}
      <div className="scr-disclaimer" role="note">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, color: '#D97706' }} aria-hidden="true">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <span>
          MediGuard provides medication safety information and does not replace professional medical advice.
          Always consult your doctor or pharmacist before making changes to your medication.
        </span>
      </div>

    </div>
  );
};

export default SafetyCheckResults;
