import React, { useState, useEffect } from 'react';
import MedicineSummaryCard from '../../components/dashboard/MedicineSummaryCard';
import SafetyStatusCard from '../../components/dashboard/SafetyStatusCard';
import RecentChecksCard from '../../components/dashboard/RecentChecksCard';
import QuickActions from '../../components/dashboard/QuickActions';
import { mockSafetySummary, mockMedicines } from '../../data/mockDashboardData';
import { apiFetch } from '../../services/api/apiClient';
import { getHistory } from '../../services/history/historyService';
import { getUserFirstName } from '../../utils/userUtils';
import './Dashboard.css';

/**
 * Dashboard Overview Content Component
 * Implements the responsive dashboard overview content area with:
 * - LEFT position: Current Medicines Card
 * - RIGHT position: Safety Overview Card
 * - Responsive 1-column layout stacking on mobile/tablet (Current Medicines -> Safety Overview -> Recent Safety Checks).
 */
export const Dashboard = ({ currentUser, onNavigate }) => {
  const [safetySummary, setSafetySummary] = useState(mockSafetySummary);
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

  useEffect(() => {
    const fetchDashboardOverview = async () => {
      try {
        const data = await apiFetch('/api/dashboard/overview/');
        if (data && data.success && data.safety_overview) {
          setSafetySummary(data.safety_overview);
        }
      } catch (err) {
        console.warn('Dashboard overview live fetch failed, using session data:', err);
      }
    };
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

  // Use user's saved regular medicines if available, otherwise fallback to mockMedicines
  const activeMedicines = (currentUser?.regularMedicines && currentUser.regularMedicines.length > 0)
    ? currentUser.regularMedicines
    : (currentUser?.regular_medicines && currentUser.regular_medicines.length > 0)
    ? currentUser.regular_medicines
    : mockMedicines;

  return (
    <div className="dashboard-content-area">
      {/* 1. Dashboard Greeting */}
      <section className="dashboard-greeting-section">
        <h1 className="dashboard-greeting-title">
          Good morning, {displayName}
        </h1>
        <p className="dashboard-greeting-subtitle">
          Here&apos;s your medication safety overview.
        </p>
      </section>

      {/* 2. Responsive Grid: Current Medicines (LEFT) + Safety Overview (RIGHT) */}
      <section className="dashboard-grid-section">
        <div className="grid-card-col">
          <MedicineSummaryCard medicines={activeMedicines} onNavigate={onNavigate} />
        </div>
        <div className="grid-card-col">
          <SafetyStatusCard data={safetySummary} onNavigate={onNavigate} />
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

