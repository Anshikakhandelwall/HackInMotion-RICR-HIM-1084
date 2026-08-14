import React, { useState, useEffect } from 'react';
import './TimePickerModal.css';

/**
 * Clock-style Time Picker Modal Component (MediGuard Theme)
 * Allows user to select Hour (1-12), Minute (00-55), and AM/PM.
 */
export const TimePickerModal = ({ isOpen, initialTime, onConfirm, onCancel }) => {
  const [selectedHour, setSelectedHour] = useState('08');
  const [selectedMinute, setSelectedMinute] = useState('30');
  const [selectedPeriod, setSelectedPeriod] = useState('AM');
  const [activeTab, setActiveTab] = useState('hour'); // 'hour' | 'minute'

  // Initialize state when modal opens or initialTime changes
  useEffect(() => {
    if (isOpen) {
      if (initialTime && typeof initialTime === 'string' && initialTime.trim()) {
        // Parse time format like "08:30 AM" or "8:30 PM"
        const parts = initialTime.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
        if (parts) {
          const h = parts[1].padStart(2, '0');
          const m = parts[2];
          const p = parts[3].toUpperCase();
          setSelectedHour(h);
          setSelectedMinute(m);
          setSelectedPeriod(p);
        }
      } else {
        setSelectedHour('08');
        setSelectedMinute('30');
        setSelectedPeriod('AM');
      }
      setActiveTab('hour');
    }
  }, [isOpen, initialTime]);

  if (!isOpen) return null;

  const hoursList = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  const minutesList = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

  const handleDone = () => {
    const formatted = `${selectedHour}:${selectedMinute} ${selectedPeriod}`;
    onConfirm(formatted);
  };

  return (
    <div className="time-picker-backdrop" onClick={onCancel}>
      <div
        className="time-picker-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Set Reminder Time"
      >
        <div className="time-picker-header">
          <h4 className="time-picker-title">Set Reminder Time</h4>
        </div>

        {/* Digital Clock Header Display */}
        <div className="time-picker-display-box">
          <div className="time-display-digits">
            <button
              type="button"
              className={`digit-btn ${activeTab === 'hour' ? 'active' : ''}`}
              onClick={() => setActiveTab('hour')}
              aria-label="Select hour"
            >
              {selectedHour}
            </button>
            <span className="colon-separator">:</span>
            <button
              type="button"
              className={`digit-btn ${activeTab === 'minute' ? 'active' : ''}`}
              onClick={() => setActiveTab('minute')}
              aria-label="Select minute"
            >
              {selectedMinute}
            </button>
          </div>

          <div className="period-selector">
            <button
              type="button"
              className={`period-btn ${selectedPeriod === 'AM' ? 'active' : ''}`}
              onClick={() => setSelectedPeriod('AM')}
            >
              AM
            </button>
            <button
              type="button"
              className={`period-btn ${selectedPeriod === 'PM' ? 'active' : ''}`}
              onClick={() => setSelectedPeriod('PM')}
            >
              PM
            </button>
          </div>
        </div>

        {/* Tab Toggle Navigation */}
        <div className="time-picker-tabs">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'hour' ? 'active' : ''}`}
            onClick={() => setActiveTab('hour')}
          >
            Select Hour
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'minute' ? 'active' : ''}`}
            onClick={() => setActiveTab('minute')}
          >
            Select Minute
          </button>
        </div>

        {/* Selection Grid */}
        <div className="picker-grid-container">
          {activeTab === 'hour' ? (
            <div className="grid-layout hours-grid">
              {hoursList.map((hour) => (
                <button
                  key={hour}
                  type="button"
                  className={`grid-item-btn ${selectedHour === hour ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedHour(hour);
                    setActiveTab('minute');
                  }}
                >
                  {hour}
                </button>
              ))}
            </div>
          ) : (
            <div className="grid-layout minutes-grid">
              {minutesList.map((min) => (
                <button
                  key={min}
                  type="button"
                  className={`grid-item-btn ${selectedMinute === min ? 'selected' : ''}`}
                  onClick={() => setSelectedMinute(min)}
                >
                  {min}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="time-picker-actions">
          <button type="button" className="picker-cancel-btn" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="picker-done-btn" onClick={handleDone}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimePickerModal;
