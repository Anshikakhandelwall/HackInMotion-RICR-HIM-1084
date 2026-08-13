import React from 'react';
import MedicineSummaryCard from '../../components/dashboard/MedicineSummaryCard';
import SafetyStatusCard from '../../components/dashboard/SafetyStatusCard';
import RecentChecksCard from '../../components/dashboard/RecentChecksCard';
import QuickActions from '../../components/dashboard/QuickActions';
import './Dashboard.css';

/**
 * Dashboard Page Component
 * Main overview dashboard layout rendering current medicines, risk status, recent checks, and quick actions.
 */
export const Dashboard = ({ currentUser, onNavigate }) => {
  return (
    <div className="dashboard-page-content">
      {/* Quick Action Pills */}
      <QuickActions onNavigate={onNavigate} />

      {/* Main Grid: Medicine Summary & Safety Risk Status */}
      <div className="dashboard-grid-row">
        <div className="grid-col col-left">
          <MedicineSummaryCard currentUser={currentUser} onNavigate={onNavigate} />
        </div>
        <div className="grid-col col-right">
          <SafetyStatusCard onNavigate={onNavigate} />
        </div>
      </div>

      {/* Bottom Section: Recent screening history */}
      <div className="dashboard-full-row">
        <RecentChecksCard onNavigate={onNavigate} />
      </div>
    </div>
  );
};

export default Dashboard;
