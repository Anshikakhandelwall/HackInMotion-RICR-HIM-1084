import React, { useState, useEffect, useRef } from 'react';
import Button from '../../components/common/Button';
import { checkInteractions, checkPersonalizedSafety } from '../../services/interactions/interactionService';
import { searchMedicines } from '../../services/medicines/medicineService';
import { saveHistoryRecord } from '../../services/history/historyService';
import './SafetyCheck.css';

// ── Helpers ──────────────────────────────────────────────────────────────────

const getMedName = (med) =>
  typeof med === 'string' ? med : (med?.rxnorm_name || med?.name || '');

const getMedKey = (med) =>
  getMedName(med).toLowerCase().trim();

const getInitial = (name) =>
  (name || '?').charAt(0).toUpperCase();

const INITIAL_COLORS = [
  '#A63D35', '#2D8A56', '#7C5CD8', '#D97706', '#0369A1',
  '#BE185D', '#065F46', '#92400E', '#4338CA', '#B45309',
];
const colorFor = (name) =>
  INITIAL_COLORS[(name?.charCodeAt(0) || 0) % INITIAL_COLORS.length];

// ── Severity config ───────────────────────────────────────────────────────────

const getSeverityConfig = (severity) => {
  const key = (severity || '').toLowerCase();
  const map = {
    major:    { label: 'Severe',   colorClass: 'severe',   colorHex: 'var(--color-error)',   icon: '🔴', badgeClass: 'severity-severe-badge' },
    severe:   { label: 'Severe',   colorClass: 'severe',   colorHex: 'var(--color-error)',   icon: '🔴', badgeClass: 'severity-severe-badge' },
    moderate: { label: 'Moderate', colorClass: 'moderate', colorHex: '#E27E36',              icon: '🟠', badgeClass: 'severity-moderate-badge' },
    minor:    { label: 'Minor',    colorClass: 'safe',     colorHex: 'var(--color-success)', icon: '🟡', badgeClass: 'severity-safe-badge' },
    safe:     { label: 'Safe',     colorClass: 'safe',     colorHex: 'var(--color-success)', icon: '🟢', badgeClass: 'severity-safe-badge' },
  };
  return map[key] || { label: 'Unknown', colorClass: 'unknown', colorHex: '#A3A3A3', icon: '⚪', badgeClass: 'severity-unknown-badge' };
};

// ── SafetyCheck component ─────────────────────────────────────────────────────

export const SafetyCheck = ({ currentUser, onNavigate, onViewDetails }) => {
  // --- User's existing medicines ---
  const profileMeds = Array.isArray(currentUser?.regularMedicines)
    ? currentUser.regularMedicines
    : Array.isArray(currentUser?.regular_medicines)
    ? currentUser.regular_medicines
    : [];
  const medicalConditions =
    currentUser?.medicalConditions || currentUser?.medical_conditions || '';

  // --- Selection state ---
  // selectedKeys: Set of lowercase med name keys selected from profile
  const [selectedKeys, setSelectedKeys] = useState(new Set());
  // extraMeds: medicines added via search (NOT from profile), for this check only
  const [extraMeds, setExtraMeds] = useState([]);

  // --- Search state ---
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const searchRef = useRef(null);

  // --- Check state ---
  const [phase, setPhase] = useState('idle'); // 'idle' | 'loading' | 'results' | 'error'
  const [interactions, setInteractions] = useState([]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Search handler
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      setDropdownOpen(false);
      return;
    }
    let cancelled = false;
    const run = async () => {
      setSearchLoading(true);
      setSearchError(false);
      setDropdownOpen(true);
      try {
        const res = await searchMedicines(query.trim());
        if (!cancelled) {
          setSearchResults(res?.results || []);
          setSearchLoading(false);
        }
      } catch {
        if (!cancelled) {
          setSearchError(true);
          setSearchLoading(false);
        }
      }
    };
    const timer = setTimeout(run, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query]);

  // ── Derived list of all medicines for this check ──────────────────────────
  const selectedFromProfile = profileMeds.filter(
    (m) => selectedKeys.has(getMedKey(m))
  );
  const allSelected = [...selectedFromProfile, ...extraMeds];
  const allSelectedKeys = new Set(allSelected.map(getMedKey));

  // ── Handlers ──────────────────────────────────────────────────────────────

  const toggleProfile = (med) => {
    const key = getMedKey(med);
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
    setPhase('idle');
  };

  const selectAll = () => {
    setSelectedKeys(new Set(profileMeds.map(getMedKey)));
    setPhase('idle');
  };

  const clearAll = () => {
    setSelectedKeys(new Set());
    setPhase('idle');
  };

  const addFromSearch = (item) => {
    const name = getMedName(item);
    if (!name) return;
    const key = name.toLowerCase().trim();
    if (allSelectedKeys.has(key)) return; // already selected
    setExtraMeds((prev) => [...prev, { name, rxcui: item.rxcui || '', source: 'search' }]);
    setQuery('');
    setDropdownOpen(false);
    setPhase('idle');
  };

  const addManually = () => {
    const name = query.trim();
    if (!name) return;
    const key = name.toLowerCase().trim();
    if (allSelectedKeys.has(key)) return;
    setExtraMeds((prev) => [...prev, { name, source: 'manual' }]);
    setQuery('');
    setDropdownOpen(false);
    setPhase('idle');
  };

  const removeSelected = (med) => {
    const key = getMedKey(med);
    if (selectedKeys.has(key)) {
      setSelectedKeys((prev) => { const n = new Set(prev); n.delete(key); return n; });
    } else {
      setExtraMeds((prev) => prev.filter((m) => getMedKey(m) !== key));
    }
    setPhase('idle');
  };

  // ── Run check ─────────────────────────────────────────────────────────────

  const runCheck = async () => {
    if (allSelected.length < 1) return;
    setPhase('loading');

    try {
      let res;
      let usedPersonalized = false;
      try {
        res = await checkInteractions(allSelected);
      } catch {
        res = await checkPersonalizedSafety(allSelected, medicalConditions);
        usedPersonalized = true;
      }

      if (res?.success) {
        const evidenceByDrug = {};
        if (!usedPersonalized && Array.isArray(res.supporting_evidence)) {
          res.supporting_evidence.forEach((e) => {
            if (e.drug) evidenceByDrug[e.drug.toLowerCase()] = e;
          });
        }

        const drugInts = usedPersonalized
          ? (res.drug_interactions?.interactions || res.interactions || [])
          : (res.interactions || []);
        const condWarns = usedPersonalized ? (res.patient_condition_warnings || []) : [];

        const formattedDrug = drugInts.map((item, idx) => {
          const nameA = item.medicine_a?.name || item.medicine_a?.rxnorm_name || 'Medicine A';
          const nameB = item.medicine_b?.name || item.medicine_b?.rxnorm_name || 'Medicine B';
          return {
            id: item.id || `int-${idx}`,
            drugA: nameA,
            drugB: nameB,
            severity: item.severity || item.level || 'Moderate',
            description: item.description || 'Potential interaction detected.',
            evidenceA: evidenceByDrug[nameA.toLowerCase()] || null,
            evidenceB: evidenceByDrug[nameB.toLowerCase()] || null,
          };
        });

        const formattedCond = condWarns.map((item, idx) => ({
          id: `cond-${idx}`,
          drugA: item.title || 'Condition Warning',
          drugB: 'Medical Profile',
          severity: item.severity || 'Moderate',
          description: item.description || 'Caution recommended based on medical profile.',
          evidenceA: null,
          evidenceB: null,
        }));

        const allCards = [...formattedDrug, ...formattedCond];
        setInteractions(allCards);
        setPhase('results');

        const medNames = allSelected.map(getMedName);
        saveHistoryRecord({
          id: `check-${Date.now()}`,
          date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          medicinesCount: medNames.length,
          interactionsCount: allCards.length,
          status: allCards.length > 0 ? 'Attention Required' : 'Safe',
          medicines: medNames,
          interactions: allCards,
        });
      } else {
        setPhase('error');
      }
    } catch {
      setPhase('error');
    }
  };

  // ── Severity summary ──────────────────────────────────────────────────────
  const summary = interactions.reduce(
    (acc, i) => {
      const s = (i.severity || '').toLowerCase();
      if (s === 'major' || s === 'severe') acc.severe++;
      else if (s === 'moderate') acc.moderate++;
      else acc.safe++;
      return acc;
    },
    { severe: 0, moderate: 0, safe: 0 }
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="sc-page">

      {/* ── PAGE HEADER ── */}
      <div className="sc-page-header">
        <div>
          <h1 className="sc-page-title">Safety Check</h1>
          <p className="sc-page-subtitle">
            Check multiple medicines for interactions and personalized safety risks.
          </p>
        </div>
        <div className="sc-watch-card">
          <p className="sc-watch-title">We check for:</p>
          <ul className="sc-watch-list">
            <li><span className="sc-check-icon">✓</span> Drug-Drug Interactions (DDInter 2.0)</li>
            <li><span className="sc-check-icon">✓</span> Allergy &amp; Contraindications</li>
            <li><span className="sc-check-icon">✓</span> Patient-specific risks based on your profile</li>
          </ul>
        </div>
      </div>

      {/* ── SELECTION GRID ── */}
      <div className="sc-selection-grid">

        {/* LEFT: Select from My Medicines */}
        <div className="sc-panel">
          <div className="sc-panel-header">
            <div className="sc-step-badge">1</div>
            <div>
              <h2 className="sc-panel-title">Select from My Medicines</h2>
              <p className="sc-panel-subtitle">Choose medicines from your current list.</p>
            </div>
          </div>

          {profileMeds.length === 0 ? (
            <div className="sc-empty-panel">
              <p>No medicines in your list yet.</p>
              <button
                type="button"
                className="sc-link-btn"
                onClick={() => onNavigate && onNavigate('/medicines')}
              >
                Add medicines →
              </button>
            </div>
          ) : (
            <>
              <ul className="sc-med-list">
                {profileMeds.map((med, idx) => {
                  const name = getMedName(med);
                  const key = getMedKey(med);
                  const checked = selectedKeys.has(key);
                  return (
                    <li key={`profile-${idx}`} className={`sc-med-item ${checked ? 'sc-med-item--checked' : ''}`}>
                      <label className="sc-med-label">
                        <input
                          type="checkbox"
                          className="sc-checkbox"
                          checked={checked}
                          onChange={() => toggleProfile(med)}
                        />
                        <span className="sc-med-name">{name}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
              <div className="sc-panel-footer">
                <span className="sc-selected-count">
                  {selectedKeys.size} of {profileMeds.length} selected
                </span>
                {selectedKeys.size < profileMeds.length ? (
                  <button type="button" className="sc-link-btn" onClick={selectAll}>
                    Select All
                  </button>
                ) : (
                  <button type="button" className="sc-link-btn sc-link-btn--danger" onClick={clearAll}>
                    Clear selection
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* RIGHT: Search & Add Another */}
        <div className="sc-panel">
          <div className="sc-panel-header">
            <div className="sc-step-badge">2</div>
            <div>
              <h2 className="sc-panel-title">Search &amp; Add Another Medicine</h2>
              <p className="sc-panel-subtitle">Search by medicine name or brand.</p>
            </div>
          </div>

          <div className="sc-search-wrap" ref={searchRef}>
            <div className="sc-search-input-row">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sc-search-icon">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="sc-search-input"
                placeholder="Search medicines..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Escape' && setQuery('')}
                onFocus={() => query.trim() && setDropdownOpen(true)}
              />
              {query && (
                <button type="button" className="sc-search-clear" onClick={() => { setQuery(''); setDropdownOpen(false); }}>×</button>
              )}
            </div>

            {/* Dropdown */}
            {dropdownOpen && query.trim() && (
              <div className="sc-search-dropdown">
                {searchLoading && (
                  <div className="sc-search-state">
                    <div className="sc-spinner" />
                    <span>Searching...</span>
                  </div>
                )}
                {!searchLoading && searchError && (
                  <div className="sc-search-state sc-search-state--error">
                    Unable to search. <button type="button" className="sc-link-btn" onClick={() => setQuery(query)}>Retry</button>
                  </div>
                )}
                {!searchLoading && !searchError && searchResults.length > 0 && (
                  <ul className="sc-search-results">
                    {searchResults.map((res, idx) => {
                      const name = getMedName(res);
                      const alreadyIn = allSelectedKeys.has(name.toLowerCase().trim());
                      return (
                        <li key={res?.id || idx} className="sc-search-result-item">
                          <div className="sc-result-icon">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
                            </svg>
                          </div>
                          <div className="sc-result-info">
                            <span className="sc-result-name">{name}</span>
                            {res?.rxnorm_name && res.rxnorm_name !== name && (
                              <span className="sc-result-sub">{res.rxnorm_name}</span>
                            )}
                          </div>
                          <button
                            type="button"
                            className={`sc-result-add-btn ${alreadyIn ? 'sc-result-add-btn--added' : ''}`}
                            disabled={alreadyIn}
                            onClick={() => addFromSearch(res)}
                          >
                            {alreadyIn ? 'Added' : '+ Add'}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {!searchLoading && !searchError && searchResults.length === 0 && (
                  <div className="sc-search-state sc-search-noresult">
                    <p>No results found.</p>
                    <button type="button" className="sc-link-btn" onClick={addManually}>
                      Add "{query.trim()}" manually
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {extraMeds.length > 0 && (
            <div className="sc-extra-list">
              <p className="sc-extra-label">Added for this check:</p>
              {extraMeds.map((m, idx) => (
                <div key={idx} className="sc-extra-item">
                  <span>{getMedName(m)}</span>
                  <button type="button" className="sc-remove-btn" onClick={() => removeSelected(m)}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── SELECTED MEDICINES ── */}
      <div className="sc-selected-section">
        <div className="sc-selected-header">
          <div className="sc-panel-header" style={{ gap: '0.75rem' }}>
            <div className="sc-step-badge">3</div>
            <div>
              <h2 className="sc-panel-title">Medicines Selected for This Check</h2>
              <p className="sc-panel-subtitle">Review medicines you want to check.</p>
            </div>
          </div>
          {allSelected.length > 0 && (
            <span className="sc-selected-count-badge">{allSelected.length} medicine{allSelected.length !== 1 ? 's' : ''} selected</span>
          )}
        </div>

        {allSelected.length === 0 ? (
          <div className="sc-empty-chips">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>No medicines selected yet. Select from your list or search above.</span>
          </div>
        ) : (
          <div className="sc-chips">
            {allSelected.map((med, idx) => {
              const name = getMedName(med);
              const fromProfile = selectedKeys.has(getMedKey(med));
              return (
                <div key={idx} className="sc-chip">
                  <div className="sc-chip-avatar" style={{ background: colorFor(name) }}>
                    {getInitial(name)}
                  </div>
                  <div className="sc-chip-info">
                    <span className="sc-chip-name">{name}</span>
                    <span className="sc-chip-source">
                      {fromProfile ? 'From My Medicines' : 'Added for this check'}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="sc-chip-remove"
                    onClick={() => removeSelected(med)}
                    aria-label={`Remove ${name}`}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── INFO + CTA ── */}
      <div className="sc-action-row">
        <div className="sc-info-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sc-info-icon">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span>
            <strong>Important:</strong> This check is for informational purposes only and does not replace professional medical advice.
          </span>
        </div>

        <button
          type="button"
          className="sc-cta-btn"
          onClick={runCheck}
          disabled={allSelected.length === 0 || phase === 'loading'}
        >
          <div className="sc-cta-inner">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" />
            </svg>
            <span className="sc-cta-label">
              {phase === 'loading' ? 'Checking...' : 'Check Safety'}
            </span>
          </div>
          <span className="sc-cta-sub">Run interaction &amp; safety check</span>
        </button>
      </div>

      {/* ── RESULTS ── */}
      {phase === 'loading' && (
        <div className="sc-results-card">
          <div className="sc-loading-row">
            <div className="safety-loading-spinner" />
            <span className="safety-loading-text">Analyzing interactions...</span>
          </div>
          <div className="skeleton-interactions-list" style={{ marginTop: '1.5rem' }}>
            <div className="skeleton-card" />
            <div className="skeleton-card" />
          </div>
        </div>
      )}

      {phase === 'error' && (
        <div className="sc-results-card sc-results-card--error">
          <div className="safety-error-icon-warning" style={{ margin: '0 auto 0.75rem' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <h3 className="safety-error-title" style={{ textAlign: 'center' }}>Check failed</h3>
          <p className="safety-error-subtitle" style={{ textAlign: 'center' }}>Unable to reach the server. Please try again.</p>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
            <Button type="button" variant="primary" size="medium" onClick={runCheck}>Try Again</Button>
          </div>
        </div>
      )}

      {phase === 'results' && (
        <div className="sc-results-card">
          {/* Summary */}
          <div className="safety-summary-cards-container" style={{ marginBottom: '1.5rem' }}>
            <div className="status-card status-card-severe">
              <div className="status-card-header"><span style={{ fontSize: '1rem' }}>🔴</span><span className="status-card-label">Severe</span></div>
              <span className="status-card-count">{summary.severe}</span>
            </div>
            <div className="status-card status-card-moderate">
              <div className="status-card-header"><span style={{ fontSize: '1rem' }}>🟠</span><span className="status-card-label">Moderate</span></div>
              <span className="status-card-count">{summary.moderate}</span>
            </div>
            <div className="status-card status-card-safe">
              <div className="status-card-header"><span style={{ fontSize: '1rem' }}>🟢</span><span className="status-card-label">Safe</span></div>
              <span className="status-card-count">{summary.safe}</span>
            </div>
          </div>

          {interactions.length === 0 ? (
            <div className="safety-empty-container" style={{ border: 'none', boxShadow: 'none', padding: '1.5rem' }}>
              <div className="safety-empty-content">
                <div className="safety-empty-icon-shield">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" />
                  </svg>
                </div>
                <h2 className="safety-empty-title">No interactions found</h2>
                <p className="safety-empty-subtitle">Your current medicines have no interactions to display.</p>
              </div>
            </div>
          ) : (
            <div className="safety-interactions-list">
              {interactions.map((interaction) => {
                const cfg = getSeverityConfig(interaction.severity);
                return (
                  <div
                    key={interaction.id}
                    className={`interaction-result-card interaction-severity-${cfg.colorClass}`}
                    style={{ '--severity-accent-color': cfg.colorHex, cursor: onViewDetails ? 'pointer' : 'default' }}
                    role={onViewDetails ? 'button' : undefined}
                    tabIndex={onViewDetails ? 0 : undefined}
                    onClick={() => onViewDetails && onViewDetails(interaction)}
                    onKeyDown={(e) => {
                      if (onViewDetails && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        onViewDetails(interaction);
                      }
                    }}
                  >
                    <div className="interaction-card-info-row">
                      <span className={`interaction-severity-badge ${cfg.badgeClass}`}>
                        <span style={{ marginRight: '0.2rem' }}>{cfg.icon}</span>{cfg.label}
                      </span>
                    </div>
                    <div className="interaction-drugs-row">
                      <span className="drug-name-a">{interaction.drugA}</span>
                      <span className="interaction-arrow-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="m17 8 4 4-4 4" /><path d="M3 12h18" /><path d="m7 16-4-4 4-4" />
                        </svg>
                      </span>
                      <span className="drug-name-b">{interaction.drugB}</span>
                    </div>
                    <p className="interaction-card-description">{interaction.description}</p>
                    {onViewDetails && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                          type="button"
                          variant="secondary"
                          size="small"
                          onClick={(e) => { e.stopPropagation(); onViewDetails(interaction); }}
                        >
                          View Details
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── DISCLAIMER ── */}
      <div className="sc-disclaimer">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, color: '#D97706' }}>
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <span>
          <strong>Disclaimer:</strong> MediGuard provides information only and is not a substitute for professional medical advice.
          Always consult your doctor or pharmacist before making any changes to your medication.
        </span>
      </div>
    </div>
  );
};

export default SafetyCheck;
