import React, { useState, useEffect, useRef } from 'react';
import { searchMedicines } from '../../services/medicines/medicineService';
import './MedicineSearch.css';

/**
 * MedicineSearch Component
 * Frontend search input interface integrated with medicineService abstraction.
 * Supports placeholder state, loading, results, empty state, duplicate checking, and error resilience.
 */
export const MedicineSearch = ({ currentMedicines = [], onAddMedicine }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [noticeMessage, setNoticeMessage] = useState('');
  const [duplicateNotice, setDuplicateNotice] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const containerRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Execute search through medicineService abstraction
  const handleSearchExecute = async (searchQuery) => {
    const trimmed = (searchQuery || '').trim();
    setDuplicateNotice('');

    if (!trimmed) {
      setSearchResults([]);
      setNoticeMessage('');
      setIsDropdownOpen(false);
      return;
    }

    setIsLoading(true);
    setIsError(false);
    setIsDropdownOpen(true);

    try {
      const response = await searchMedicines(trimmed);
      setIsLoading(false);

      if (response && response.success) {
        setSearchResults(response.results || []);
        if (response.isPlaceholder) {
          setNoticeMessage(response.message || 'Medicine search will be available when the medicine database is connected.');
        } else {
          setNoticeMessage('');
        }
      } else {
        setIsError(true);
      }
    } catch (err) {
      setIsLoading(false);
      setIsError(true);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    handleSearchExecute(value);
  };

  const handleClear = () => {
    setQuery('');
    setSearchResults([]);
    setNoticeMessage('');
    setDuplicateNotice('');
    setIsDropdownOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleClear();
    }
  };

  // Check if a medicine is already added to user's cabinet
  const isMedicineAlreadyAdded = (medName, medId) => {
    if (!Array.isArray(currentMedicines)) return false;
    const normTargetName = String(medName || '').toLowerCase().trim();
    return currentMedicines.some((existing) => {
      if (medId && existing && existing.id === medId) return true;
      const existingName = typeof existing === 'string' ? existing : existing?.name;
      return String(existingName || '').toLowerCase().trim() === normTargetName;
    });
  };

  // Add medicine from search results
  const handleAddClick = (resultItem) => {
    const medName = typeof resultItem === 'string' ? resultItem : resultItem?.name;
    const medId = resultItem?.id;

    if (isMedicineAlreadyAdded(medName, medId)) {
      setDuplicateNotice(`"${medName}" is already added.`);
      setTimeout(() => setDuplicateNotice(''), 3000);
      return;
    }

    if (onAddMedicine) {
      onAddMedicine(resultItem);
    }
    setDuplicateNotice('');
    setIsDropdownOpen(false);
    setQuery('');
  };

  return (
    <div className="medicine-search-container" ref={containerRef}>
      {/* Search Input Bar */}
      <div className="search-input-wrapper">
        <div className="search-input-icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>

        <input
          type="text"
          className="search-input-field"
          placeholder="Search medicines..."
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query.trim() && setIsDropdownOpen(true)}
          aria-label="Search medicines"
        />

        {query && (
          <button
            type="button"
            className="search-clear-btn"
            onClick={handleClear}
            aria-label="Clear search text"
          >
            &times;
          </button>
        )}
      </div>

      {/* Non-blocking Duplicate Warning Toast */}
      {duplicateNotice && (
        <div className="duplicate-notice-toast">
          <span>⚠️ {duplicateNotice}</span>
        </div>
      )}

      {/* Search Results Dropdown Overlay */}
      {isDropdownOpen && query.trim() && (
        <div className="search-results-dropdown">
          {/* 1. Loading State */}
          {isLoading && (
            <div className="search-state-box">
              <svg className="search-spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" />
              </svg>
              <span>Searching medicines...</span>
            </div>
          )}

          {/* 2. Error State */}
          {!isLoading && isError && (
            <div className="search-state-box error-state">
              <span>Unable to search medicines.</span>
              <button
                type="button"
                className="search-retry-btn"
                onClick={() => handleSearchExecute(query)}
              >
                Try Again
              </button>
            </div>
          )}

          {/* 3. Integration Placeholder Notice State */}
          {!isLoading && !isError && noticeMessage && (
            <div className="search-placeholder-box">
              <div className="placeholder-icon">ℹ️</div>
              <p className="placeholder-text">{noticeMessage}</p>
            </div>
          )}

          {/* 4. Active Results List */}
          {!isLoading && !isError && searchResults.length > 0 && (
            <ul className="search-results-list">
              {searchResults.map((res, index) => {
                  const resName = typeof res === 'string' ? res : (res?.rxnorm_name || res?.name || 'Unknown medicine');
                  const isAdded = isMedicineAlreadyAdded(resName, res?.id);

                return (
                  <li key={res?.id || `res-${index}`} className="search-result-item">
                    <div className="result-info">
                      <span className="result-name">{resName}</span>
                      {res?.genericName && (
                        <span className="result-subtext">{res.genericName}</span>
                      )}
                    </div>

                    <button
                      type="button"
                      className={`result-add-btn ${isAdded ? 'added' : ''}`}
                      disabled={isAdded}
                      onClick={() => handleAddClick(res)}
                    >
                      {isAdded ? 'Added' : '+ Add'}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {/* 5. No Results State — allow adding the typed name directly */}
          {!isLoading && !isError && !noticeMessage && searchResults.length === 0 && (
            <div className="search-state-box no-results">
              <p className="no-results-title">No medicines found</p>
              <p className="no-results-subtitle">
                Not in our database? You can still add it.
              </p>
              <button
                type="button"
                className="result-add-btn"
                style={{ marginTop: '0.5rem' }}
                onClick={() => {
                  if (onAddMedicine && query.trim()) {
                    onAddMedicine({ name: query.trim() });
                    setQuery('');
                    setIsDropdownOpen(false);
                  }
                }}
              >
                + Add "{query.trim()}"
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MedicineSearch;
