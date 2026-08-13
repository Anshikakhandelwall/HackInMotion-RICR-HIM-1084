import React from 'react';
import MedicineSummaryCard from '../../components/dashboard/MedicineSummaryCard';
import SafetyStatusCard from '../../components/dashboard/SafetyStatusCard';
import RecentChecksCard from '../../components/dashboard/RecentChecksCard';
import QuickActions from '../../components/dashboard/QuickActions';
import { mockSafetySummary, mockMedicines, mockRecentChecks } from '../../data/mockDashboardData';
import './Dashboard.css';

/**
 * Dashboard Overview Content Component
 * Implements the dashboard overview content area consuming structured mock data
 * with graceful error resilience and strict visual hierarchy.
 */
export const Dashboard = ({ currentUser, onNavigate }) => {
  // Extract user first name safely without crashing
  const getFirstName = () => {
    if (!currentUser) return 'there';
    const fullName = currentUser.fullName || currentUser.full_name || currentUser.name;
    if (typeof fullName === 'string' && fullName.trim().length > 0) {
      return fullName.trim().split(' ')[0];
    }
    if (typeof currentUser.email === 'string' && currentUser.email.includes('@')) {
      return currentUser.email.split('@')[0];
    }
    return 'there';
  };

  const displayName = getFirstName();

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

      {/* 2. Grid: Safety Overview + Current Medicines */}
      <section className="dashboard-grid-section">
        <div className="grid-card-col">
          <SafetyStatusCard data={mockSafetySummary} onNavigate={onNavigate} />
        </div>
        <div className="grid-card-col">
          <MedicineSummaryCard medicines={activeMedicines} onNavigate={onNavigate} />
        </div>
      </section>

      {/* 3. Recent Safety Checks */}
      <section className="dashboard-section">
        <RecentChecksCard checks={mockRecentChecks} onNavigate={onNavigate} />
      </section>

      {/* 4. Quick Actions */}
      <section className="dashboard-section">
        <QuickActions onNavigate={onNavigate} />
      </section>
    </div>
  );
};

export default Dashboard;
