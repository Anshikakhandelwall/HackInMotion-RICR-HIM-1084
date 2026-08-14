import React, { useState, useEffect } from 'react';
import MedicineSummaryCard from '../../components/dashboard/MedicineSummaryCard';
import SafetyStatusCard from '../../components/dashboard/SafetyStatusCard';
import RecentChecksCard from '../../components/dashboard/RecentChecksCard';
import QuickActions from '../../components/dashboard/QuickActions';
import { apiFetch } from '../../services/api/apiClient';
import { getHistory } from '../../services/history/historyService';
import { getUserFirstName } from '../../utils/userUtils';
import { useLanguage } from '../../context/LanguageContext';
import './Dashboard.css';

/**
 * Dashboard Overview Content Component
 *
 * All data comes from the authenticated API.  If a fetch fails the user sees
 * a clear error message with a retry option — never fake data.
 */
export const Dashboard = ({ currentUser, onNavigate }) => {
  const { t } = useLanguage();

  // ── Safety overview (from backend) ──────────────────────────────────────
  const [safetySummary, setSafetySummary] = useState(null);
  const [safetyLoading, setSafetyLoading] = useState(true);
  const [safetyError, setSafetyError] = useState(null);

  // ── Recent checks (from local history service) ─────────────────────────
  const [recentChecks, setRecentChecks] = useState(() => {
    const saved = getHistory();
    return saved.slice(0, 3).map((item) => ({
      id: item.id,
      date: item.date,
      medicineCount: item.medicinesCount,
      status: item.status,
      variant: item.status === 'Safe' ? 'safe' : 'attention',
    }));
  });

  const fetchDashboardOverview = async () => {
    setSafetyLoading(true);
    setSafetyError(null);
    try {
      const data = await apiFetch('/api/dashboard/overview/');
      if (data && data.success && data.safety_overview) {
        setSafetySummary(data.safety_overview);
      } else {
        setSafetyError('Unexpected response from server.');
      }
    } catch (err) {
      console.error('Dashboard overview fetch failed:', err);
      setSafetyError('Unable to load your safety overview. Please try again.');
    } finally {
      setSafetyLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardOverview();

    const handleHistoryUpdate = () => {
      const saved = getHistory();
      setRecentChecks(
        saved.slice(0, 3).map((item) => ({
          id: item.id,
          date: item.date,
          medicineCount: item.medicinesCount,
          status: item.status,
          variant: item.status === 'Safe' ? 'safe' : 'attention',
        }))
      );
    };

    window.addEventListener('mediguard:history_updated', handleHistoryUpdate);
    return () => window.removeEventListener('mediguard:history_updated', handleHistoryUpdate);
  }, []);

  const displayName = getUserFirstName(currentUser);

  // Use the authenticated user's medicines — empty array when none configured
  const activeMedicines =
    (currentUser?.regularMedicines && currentUser.regularMedicines.length > 0)
      ? currentUser.regularMedicines
      : (currentUser?.regular_medicines && currentUser.regular_medicines.length > 0)
        ? currentUser.regular_medicines
        : [];

  return (
    <div className="dashboard-content-area">
      {/* 1. Dashboard Greeting */}
      <section className="dashboard-greeting-section">
        <h1 className="dashboard-greeting-title">
          {t('goodMorning')}, {displayName}
        </h1>
        <p className="dashboard-greeting-subtitle">
          {t('greetingText')}
        </p>
      </section>

      {/* 2. Responsive Grid: Current Medicines (LEFT) + Safety Overview (RIGHT) */}
      <section className="dashboard-grid-section">
        <div className="grid-card-col">
          <MedicineSummaryCard medicines={activeMedicines} onNavigate={onNavigate} />
        </div>
        <div className="grid-card-col">
          {safetyLoading && (
            <div className="dashboard-loading-card">
              <p>Loading safety overview…</p>
            </div>
          )}
          {safetyError && !safetyLoading && (
            <div className="dashboard-error-card">
              <p>{safetyError}</p>
              <button className="retry-btn" onClick={fetchDashboardOverview}>Retry</button>
            </div>
          )}
          {!safetyLoading && !safetyError && safetySummary && (
            <SafetyStatusCard data={safetySummary} onNavigate={onNavigate} />
          )}
        </div>
      </section>

      {/* 3. Recent Safety Checks */}
      <section className="dashboard-section">
        <RecentChecksCard checks={recentChecks} onNavigate={onNavigate} />
      </section>

      {/* 4. Quick Actions */}
      <section className="dashboard-section">
        <QuickActions onNavigate={onNavigate} />
      </section>
    </div>
  );
};

export default Dashboard;
