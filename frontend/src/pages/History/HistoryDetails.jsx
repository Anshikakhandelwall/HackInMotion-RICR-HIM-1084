import React, { useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';

// ── Helpers ───────────────────────────────────────────────────────────────────

const normaliseSeverity = (s) => {
  const key = (s || '').toLowerCase();
  if (key === 'major' || key === 'severe') return 'major';
  if (key === 'moderate') return 'moderate';
  if (key === 'minor') return 'minor';
  return 'none';
};

const SEVERITY_META = {
  major:    { label: 'Major',          color: '#A63D35', bg: '#FDF2F2', border: 'rgba(217,56,58,0.18)',  accentBar: '#D9383A' },
  moderate: { label: 'Moderate',       color: '#C97121', bg: '#FFF9F3', border: 'rgba(226,126,54,0.18)', accentBar: '#E27E36' },
  minor:    { label: 'Mild',           color: '#2D8A56', bg: '#F0FDF4', border: 'rgba(45,138,86,0.18)',  accentBar: '#2D8A56' },
  none:     { label: 'No Interaction', color: '#6E6462', bg: '#F7F8FA', border: 'var(--color-border-default)', accentBar: '#D1D5DB' },
};

const INITIAL_COLORS = [
  '#A63D35', '#2D8A56', '#7C5CD8', '#D97706', '#0369A1',
  '#BE185D', '#065F46', '#92400E', '#4338CA', '#B45309',
];
const colorFor = (name) =>
  INITIAL_COLORS[(name?.charCodeAt(0) || 0) % INITIAL_COLORS.length];
const getInitial = (name) => (name || '?').charAt(0).toUpperCase();

// ── Print / Download ──────────────────────────────────────────────────────────
const downloadReport = (record) => {
  window.print();
};

// ── HistoryDetails Component ──────────────────────────────────────────────────
export const HistoryDetails = ({ record, onBack, currentUser }) => {
  const { t } = useLanguage();
  const printRef = useRef(null);
  const isSafe = record.status === 'Safe';

  const interactions = Array.isArray(record.interactions) ? record.interactions : [];
  const medicines = Array.isArray(record.medicines) ? record.medicines : [];

  // ── Summary counts from stored interactions ───────────────────────────────
  const counts = interactions.reduce((acc, i) => {
    const s = normaliseSeverity(i.severity);
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const interactionPairsCount = interactions.filter(
    (i) => !i.isConditionWarning && i.drugA !== 'Condition Warning'
  ).length;
  const pairsTotal = Math.max(
    record.pairsChecked || 0,
    (medicines.length * (medicines.length - 1)) / 2
  );
  const noInteractionCount = Math.max(0, pairsTotal - interactionPairsCount);

  // ── Matrix ────────────────────────────────────────────────────────────────
  const matrixMeds = medicines.map((m, idx) => ({
    key: `m-${idx}`,
    name: typeof m === 'string' ? m : (m?.name || m?.rxnorm_name || ''),
  })).filter((m) => m.name);

  const getMatrixSev = (nameA, nameB) => {
    if (nameA === nameB) return 'self';
    const match = interactions.find(
      (i) =>
        (i.drugA?.toLowerCase() === nameA.toLowerCase() && i.drugB?.toLowerCase() === nameB.toLowerCase()) ||
        (i.drugA?.toLowerCase() === nameB.toLowerCase() && i.drugB?.toLowerCase() === nameA.toLowerCase())
    );
    return match ? normaliseSeverity(match.severity) : 'none';
  };

  const MATRIX_CELL = {
    major:    { bg: '#FDF2F2', color: '#A63D35', symbol: '⚠', label: 'Major' },
    moderate: { bg: '#FFF9F3', color: '#C97121', symbol: '!', label: 'Moderate' },
    minor:    { bg: '#F0FDF4', color: '#2D8A56', symbol: '~', label: 'Mild' },
    none:     { bg: '#F7F8FA', color: '#6E6462', symbol: '—', label: 'No Interaction' },
    self:     { bg: 'transparent', color: '#6E6462', symbol: '—', label: '' },
  };

  // ── Patient context ───────────────────────────────────────────────────────
  const profileAge = currentUser?.age;
  const profileConditions = currentUser?.medicalConditions || currentUser?.medical_conditions || '';
  const profileAllergies = currentUser?.allergies || currentUser?.known_allergies || '';
  const allergyList = typeof profileAllergies === 'string'
    ? profileAllergies.split(/[,;]/).map((a) => a.trim().toLowerCase()).filter(Boolean)
    : [];

  return (
    <>
      {/* ── Print styles injected inline ─────────────────────────────────── */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .hd-print-area, .hd-print-area * { visibility: visible; }
          .hd-print-area { position: fixed; top: 0; left: 0; width: 100%; padding: 1.5rem 2rem; }
          .hd-no-print { display: none !important; }
          .hd-print-area .hd-page { box-shadow: none !important; }
        }
      `}</style>

      <div className="history-details-container hd-print-area" ref={printRef}>

        {/* ── Back + Download ─────────────────────────────────────────────── */}
        <div className="hd-topbar hd-no-print">
          <button type="button" className="back-to-history-btn" onClick={onBack}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
            {t('backToHistory')}
          </button>
          <button type="button" className="hd-download-btn" onClick={() => downloadReport(record)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download Report
          </button>
        </div>

        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <div className="hd-header-card">
          <div>
            <div className="hd-title-row">
              <h1 className="hd-page-title">Safety Check Results</h1>
              <span className={`hd-status-badge ${isSafe ? 'hd-status-badge--safe' : 'hd-status-badge--attention'}`}>
                {isSafe ? 'Safe' : 'Attention Required'}
              </span>
            </div>
            <p className="hd-meta">
              Checked on {record.date} · {record.time}
              {record.id && <><span className="hd-meta-sep">·</span>Check ID: {record.id}</>}
            </p>
          </div>
          <button type="button" className="hd-download-btn hd-download-btn--header hd-no-print" onClick={() => downloadReport(record)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download Report
          </button>
        </div>

        {/* ── SUMMARY CARDS ───────────────────────────────────────────────── */}
        <div className="hd-summary-grid">
          <div className="hd-summary-card hd-summary-card--major">
            <div className="hd-summary-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <div className="hd-summary-body">
              <span className="hd-summary-label">Major Interaction</span>
              <span className="hd-summary-count">{counts.major || 0}</span>
              <span className="hd-summary-note">High-risk interaction</span>
            </div>
          </div>

          <div className="hd-summary-card hd-summary-card--moderate">
            <div className="hd-summary-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <div className="hd-summary-body">
              <span className="hd-summary-label">Moderate Concern</span>
              <span className="hd-summary-count">{counts.moderate || 0}</span>
              <span className="hd-summary-note">Patient consideration</span>
            </div>
          </div>

          <div className="hd-summary-card hd-summary-card--none">
            <div className="hd-summary-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
            </div>
            <div className="hd-summary-body">
              <span className="hd-summary-label">No Interaction</span>
              <span className="hd-summary-count">{noInteractionCount}</span>
              <span className="hd-summary-note">No DDI identified</span>
            </div>
          </div>

          <div className="hd-summary-card hd-summary-card--meds">
            <div className="hd-summary-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/></svg>
            </div>
            <div className="hd-summary-body">
              <span className="hd-summary-label">Medicines Checked</span>
              <span className="hd-summary-count">{record.medicinesCount || medicines.length}</span>
              <span className="hd-summary-note">In this check</span>
            </div>
          </div>
        </div>

        {/* ── TWO-COLUMN: Medicines + Matrix ───────────────────────────────── */}
        <div className="hd-two-col">

          {/* Medicines Checked */}
          <div className="hd-card">
            <h2 className="hd-section-title">Medicines Checked</h2>
            <div className="hd-med-grid">
              {medicines.map((med, idx) => {
                const name = typeof med === 'string' ? med : (med?.name || med?.rxnorm_name || '');
                return (
                  <div key={idx} className="hd-med-chip">
                    <div className="hd-med-avatar" style={{ background: colorFor(name) }}>
                      {getInitial(name)}
                    </div>
                    <span className="hd-med-name">{name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interaction Matrix */}
          <div className="hd-card">
            <h2 className="hd-section-title">Interaction Matrix</h2>
            {matrixMeds.length < 2 ? (
              <p className="hd-muted">At least two medicines needed to show a matrix.</p>
            ) : (
              <div className="hd-matrix-scroll">
                <table className="hd-matrix">
                  <thead>
                    <tr>
                      <th className="hd-matrix-corner" />
                      {matrixMeds.map((m) => (
                        <th key={m.key} className="hd-matrix-col-head" title={m.name}>
                          <div className="hd-matrix-avatar" style={{ background: colorFor(m.name) }}>{getInitial(m.name)}</div>
                          <span className="hd-matrix-col-name">{m.name}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {matrixMeds.map((rowMed) => (
                      <tr key={rowMed.key}>
                        <th className="hd-matrix-row-head">
                          <div className="hd-matrix-avatar" style={{ background: colorFor(rowMed.name) }}>{getInitial(rowMed.name)}</div>
                          <span className="hd-matrix-row-name">{rowMed.name}</span>
                        </th>
                        {matrixMeds.map((colMed) => {
                          const sev = getMatrixSev(rowMed.name, colMed.name);
                          const cell = MATRIX_CELL[sev] || MATRIX_CELL.none;
                          return (
                            <td
                              key={colMed.key}
                              className="hd-matrix-cell"
                              style={{ background: cell.bg, color: cell.color }}
                              title={sev !== 'self' ? `${rowMed.name} + ${colMed.name}: ${cell.label}` : ''}
                              aria-label={sev !== 'self' ? `${rowMed.name} and ${colMed.name}: ${cell.label}` : `${rowMed.name}`}
                            >
                              <span aria-hidden="true">{cell.symbol}</span>
                              <span className="hd-visually-hidden">{cell.label}</span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="hd-matrix-legend">
                  {[
                    { sev: 'major', label: 'Major', color: '#A63D35' },
                    { sev: 'moderate', label: 'Moderate', color: '#C97121' },
                    { sev: 'none', label: 'No Interaction', color: '#6E6462' },
                  ].map(({ sev, label, color }) => (
                    <span key={sev} className="hd-matrix-legend-item">
                      <span className="hd-matrix-legend-dot" style={{ background: color }} aria-hidden="true" />
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── DETECTED ISSUES ─────────────────────────────────────────────── */}
        <div className="hd-card">
          <h2 className="hd-section-title">Detected Issues</h2>

          {interactions.length === 0 ? (
            <div className="hd-empty-state">
              <div className="hd-empty-icon">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>
                </svg>
              </div>
              <p className="hd-empty-title">No interactions detected</p>
              <p className="hd-empty-sub">
                No drug-drug interactions were identified for the checked medicines based on available data.
              </p>
            </div>
          ) : (
            <div className="hd-issues-list">
              {interactions.map((issue, idx) => {
                const sev = normaliseSeverity(issue.severity);
                const meta = SEVERITY_META[sev] || SEVERITY_META.none;
                return (
                  <div
                    key={issue.id || idx}
                    className="hd-issue-card"
                    style={{ '--hd-accent': meta.accentBar, borderColor: meta.border, background: meta.bg }}
                  >
                    <div className="hd-issue-header">
                      <div className="hd-issue-drugs">
                        <span className="hd-drug-pill">{issue.drugA}</span>
                        <span className="hd-plus" aria-hidden="true">+</span>
                        <span className="hd-drug-pill">{issue.drugB}</span>
                      </div>
                      <span
                        className="hd-sev-badge"
                        style={{ color: meta.color, background: 'transparent', border: `1px solid ${meta.border}` }}
                        aria-label={`Severity: ${meta.label}`}
                      >
                        {meta.label}
                      </span>
                    </div>

                    {issue.description && (
                      <div className="hd-issue-section">
                        <p className="hd-issue-label">What this means</p>
                        <p className="hd-issue-text">{issue.description}</p>
                      </div>
                    )}

                    <div className="hd-issue-section">
                      <p className="hd-issue-label">What you can do</p>
                      <p className="hd-issue-text">
                        {sev === 'major'
                          ? 'Consult your doctor or pharmacist before continuing this combination. Do not stop or change your medication without professional guidance.'
                          : sev === 'moderate'
                          ? 'Seek professional medical advice. Your doctor may recommend monitoring or a dose adjustment.'
                          : 'Discuss with your healthcare professional if you have concerns. Continue medication as prescribed unless advised otherwise.'}
                      </p>
                    </div>

                    <p className="hd-issue-source">Source: <strong>DDInter 2.0</strong></p>
                  </div>
                );
              })}
            </div>
          )}

          {/* No-interaction pairs */}
          {noInteractionCount > 0 && medicines.length >= 2 && (
            <div className="hd-no-int-section">
              <h3 className="hd-no-int-title">Pairs with No Detected Interaction</h3>
              {(() => {
                const interactingPairs = new Set(
                  interactions.flatMap((i) => [
                    `${(i.drugA || '').toLowerCase()}|${(i.drugB || '').toLowerCase()}`,
                    `${(i.drugB || '').toLowerCase()}|${(i.drugA || '').toLowerCase()}`,
                  ])
                );
                const noIntPairs = [];
                for (let a = 0; a < matrixMeds.length; a++) {
                  for (let b = a + 1; b < matrixMeds.length; b++) {
                    const nA = matrixMeds[a].name;
                    const nB = matrixMeds[b].name;
                    if (!interactingPairs.has(`${nA.toLowerCase()}|${nB.toLowerCase()}`)) {
                      noIntPairs.push({ nA, nB });
                    }
                  }
                }
                return noIntPairs.map(({ nA, nB }, idx) => (
                  <div key={idx} className="hd-no-int-card">
                    <div className="hd-issue-drugs">
                      <span className="hd-drug-pill hd-drug-pill--neutral">{nA}</span>
                      <span className="hd-plus" aria-hidden="true">+</span>
                      <span className="hd-drug-pill hd-drug-pill--neutral">{nB}</span>
                      <span className="hd-sev-badge hd-sev-badge--none">No Interaction</span>
                    </div>
                    <p className="hd-no-int-text">
                      No interaction was identified between these medicines based on the available interaction data.
                    </p>
                  </div>
                ));
              })()}
            </div>
          )}
        </div>

        {/* ── BOTTOM TWO-COL: Patient Context + What to Do ────────────────── */}
        <div className="hd-two-col">

          {/* Patient Safety Context */}
          <div className="hd-card">
            <h2 className="hd-section-title">Patient Safety Context</h2>
            <p className="hd-context-note">
              This assessment is based on the information available in your profile at the time of this check.
            </p>
            {!(profileAge || profileConditions || profileAllergies) ? (
              <div className="hd-missing-profile">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Profile information not available for this check.
              </div>
            ) : (
              <ul className="hd-context-list">
                {profileAge != null && (
                  <li className="hd-context-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    <span className="hd-context-field">Age</span>
                    <span className="hd-context-val">{profileAge} years</span>
                  </li>
                )}
                {profileConditions && (
                  <li className="hd-context-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                    <span className="hd-context-field">Medical Conditions</span>
                    <span className="hd-context-val">{profileConditions}</span>
                  </li>
                )}
                {allergyList.length > 0 && (
                  <li className="hd-context-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M18.364 5.636A9 9 0 1 0 5.636 18.364 9 9 0 0 0 18.364 5.636z"/><path d="M12 8v4m0 4h.01"/></svg>
                    <span className="hd-context-field">Allergies</span>
                    <span className="hd-context-val">{allergyList.join(', ')}</span>
                  </li>
                )}
                {medicines.length > 0 && (
                  <li className="hd-context-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/></svg>
                    <span className="hd-context-field">Medicines in Check</span>
                    <span className="hd-context-val">{medicines.length}</span>
                  </li>
                )}
              </ul>
            )}

            {/* Allergy check */}
            <h3 className="hd-subsection-title">Allergy Check</h3>
            {allergyList.length === 0 ? (
              <div className="hd-allergy hd-allergy--unknown">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Allergy information was not available in your profile.
              </div>
            ) : (
              <div className="hd-allergy hd-allergy--ok">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
                No known allergy conflict identified based on the allergies recorded in your profile.
                Reviewed medicines against {allergyList.length} recorded {allergyList.length === 1 ? 'allergy' : 'allergies'}.
              </div>
            )}
          </div>

          {/* What to Do Next */}
          <div className="hd-card">
            <h2 className="hd-section-title">What to Do Next</h2>
            <ul className="hd-next-list">
              <li className="hd-next-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Do not stop or change any medication without consulting your doctor or pharmacist first.
              </li>
              <li className="hd-next-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Consult your doctor or pharmacist about the interactions shown.
              </li>
              {interactions.length > 0 && (
                <li className="hd-next-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Show them this report if needed.
                </li>
              )}
              <li className="hd-next-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/><path d="M21 21v-2a4 4 0 0 0-3-3.87"/></svg>
                Update your profile if your health information has changed.
              </li>
            </ul>
          </div>
        </div>

        {/* ── DISCLAIMER ──────────────────────────────────────────────────── */}
        <div className="hd-disclaimer">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, color: '#D97706' }} aria-hidden="true">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span>
            MediGuard provides medication safety information and does not replace professional medical advice.
            Always consult your doctor or pharmacist before making changes to your medication.
          </span>
        </div>

      </div>
    </>
  );
};

export default HistoryDetails;
