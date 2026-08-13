import React from 'react';

export const Profile = ({ currentUser }) => {
  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#24201F' }}>User Health Profile</h1>
        <p style={{ color: '#6E6462', fontSize: '0.875rem' }}>Your personal health parameters and account details</p>
      </div>

      <div style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '18px', border: '1px solid #E9DDD9', boxShadow: '0 12px 36px -8px rgba(166, 61, 53, 0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #F6ECE9' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#FDF3F2', color: '#A63D35', fontWeight: 700, fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E9DDD9' }}>
            {currentUser?.fullName?.[0] || currentUser?.email?.[0] || 'U'}
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#24201F' }}>
              {currentUser?.fullName || currentUser?.full_name || 'Patient'}
            </h2>
            <p style={{ color: '#6E6462', fontSize: '0.85rem' }}>{currentUser?.email}</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
          <p style={{ margin: 0 }}><strong>Age:</strong> {currentUser?.age || 'Not specified'}</p>
          <p style={{ margin: 0 }}><strong>Medical History:</strong> {currentUser?.medicalConditions || currentUser?.medical_conditions || 'None'}</p>
          <p style={{ margin: 0 }}>
            <strong>Regular Medicines:</strong> {(currentUser?.regularMedicines || currentUser?.regular_medicines || []).join(', ') || 'None'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
