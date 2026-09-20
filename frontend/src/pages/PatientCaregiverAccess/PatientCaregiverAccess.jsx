import React, { useState, useEffect, useCallback } from 'react';
import { caregiverService } from '../../services/caregiver/caregiverService';
import './PatientCaregiverAccess.css';

/**
 * PatientCaregiverAccess page — /patient-caregivers (patient role only)
 *
 * Lets a patient:
 *   1. See which caregivers currently have access to their profile.
 *   2. Revoke a caregiver's access.
 *   3. Approve a new caregiver by entering the connection code they shared.
 */
const PatientCaregiverAccess = () => {
  const [caregivers, setCaregivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [revoking, setRevoking] = useState(null); // connection_id being revoked

  // Approve-code form
  const [approveCode, setApproveCode] = useState('');
  const [approveLoading, setApproveLoading] = useState(false);
  const [approveMsg, setApproveMsg] = useState(null); // { type: 'success'|'error', text }

  const loadCaregivers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await caregiverService.getMyCaregivers();
      setCaregivers(data.caregivers || []);
    } catch {
      setError('Could not load your caregiver list. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCaregivers(); }, [loadCaregivers]);

  const handleRevoke = async (connectionId, email) => {
    if (!window.confirm(`Remove ${email} from your caregivers? They will no longer be able to view your profile or run safety checks on your behalf.`)) return;
    setRevoking(connectionId);
    try {
      await caregiverService.revokeCaregiverAccess(connectionId);
      setCaregivers((prev) => prev.filter((c) => c.connection_id !== connectionId));
    } catch {
      setError('Failed to revoke access. Please try again.');
    } finally {
      setRevoking(null);
    }
  };

  const handleApprove = async (e) => {
    e.preventDefault();
    setApproveLoading(true);
    setApproveMsg(null);
    try {
      const data = await caregiverService.approveConnection(approveCode.trim().toUpperCase());
      setApproveMsg({ type: 'success', text: `Connected! ${data.caregiver_email} now has access to your profile.` });
      setApproveCode('');
      // Refresh the list so the new caregiver appears immediately
      await loadCaregivers();
    } catch (err) {
      setApproveMsg({ type: 'error', text: err.message || 'Invalid or expired connection code.' });
    } finally {
      setApproveLoading(false);
    }
  };

  return (
    <div className="pca-page">
      {/* Header */}
      <div className="pca-header">
        <h1 className="pca-title">My Caregivers</h1>
        <p className="pca-subtitle">
          Caregivers you have approved can view your health profile and run medication safety checks on your behalf.
          You can revoke access at any time.
        </p>
      </div>

      {error && (
        <div className="pca-alert pca-alert--error">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      <div className="pca-body">
        {/* Left: connected caregivers */}
        <section className="pca-list-section">
          <h2 className="pca-section-title">Connected Caregivers</h2>

          {loading ? (
            <div className="pca-loading">Loading…</div>
          ) : caregivers.length === 0 ? (
            <div className="pca-empty">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <p>No caregivers connected yet.</p>
              <p className="pca-empty-hint">Use the form on the right to approve a caregiver using the code they share with you.</p>
            </div>
          ) : (
            <ul className="pca-caregiver-list">
              {caregivers.map((cg) => (
                <li key={cg.connection_id} className="pca-caregiver-item">
                  <div className="pca-caregiver-avatar">
                    {(cg.full_name || cg.email).charAt(0).toUpperCase()}
                  </div>
                  <div className="pca-caregiver-info">
                    <span className="pca-caregiver-name">{cg.full_name || cg.email}</span>
                    <span className="pca-caregiver-email">{cg.email}</span>
                    <span className="pca-caregiver-since">
                      Access granted {new Date(cg.connected_since).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    className="pca-revoke-btn"
                    onClick={() => handleRevoke(cg.connection_id, cg.email)}
                    disabled={revoking === cg.connection_id}
                    aria-label={`Revoke ${cg.email}'s access`}
                  >
                    {revoking === cg.connection_id ? 'Removing…' : 'Revoke Access'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Right: approve new caregiver */}
        <aside className="pca-approve-section">
          <h2 className="pca-section-title">Approve a Caregiver</h2>
          <p className="pca-approve-desc">
            Enter the connection code your caregiver generated in their MediGuard workspace.
          </p>

          {approveMsg && (
            <div className={`pca-alert pca-alert--${approveMsg.type}`}>
              {approveMsg.type === 'success' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              )}
              {approveMsg.text}
            </div>
          )}

          <form className="pca-approve-form" onSubmit={handleApprove}>
            <label className="pca-code-label" htmlFor="caregiver-code">Connection Code</label>
            <input
              id="caregiver-code"
              type="text"
              className="pca-code-input"
              value={approveCode}
              onChange={(e) => setApproveCode(e.target.value.toUpperCase())}
              placeholder="e.g. ABCD1234"
              maxLength={10}
              required
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="submit"
              className="pca-approve-btn"
              disabled={approveLoading || !approveCode.trim()}
            >
              {approveLoading ? 'Connecting…' : 'Approve Connection'}
            </button>
          </form>

          <p className="pca-privacy-note">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Approved caregivers can view your medicines, conditions, and allergies but cannot change your account settings or password.
          </p>
        </aside>
      </div>
    </div>
  );
};

export default PatientCaregiverAccess;
