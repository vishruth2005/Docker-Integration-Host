import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAccessToken, logout } from '../utils/auth';

export default function CreateVolume() {
  const { host_id } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    driver: 'local',
    labels: '{}'
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const token = getAccessToken();
      const response = await fetch(`http://localhost:8000/hosts/${host_id}/volumes/create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          labels: JSON.parse(formData.labels || '{}')
        })
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess('Volume created successfully');
        setTimeout(() => navigate(`/hosts/${host_id}/volumes`), 1200);
      } else {
        setError(data.message || 'Failed to create volume');
      }
    } catch (err) {
      setError('Invalid JSON or network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
      margin: 0,
      padding: 0,
      overflowY: 'auto',
      position: 'relative'
    }}>
      {/* Logout Button */}
      <div style={{ position: 'fixed', top: '2rem', right: '2rem', zIndex: 20 }}>
        <button
          onClick={handleLogout}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#dc2626',
            color: 'white',
            borderRadius: '0.75rem',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '0.875rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = '#b91c1c';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 6px 8px -1px rgba(0, 0, 0, 0.2)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = '#dc2626';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
          }}
        >
          Logout
        </button>
      </div>
      {/* Back to Volumes Button */}
      <div style={{ position: 'fixed', top: '2rem', left: '2rem', zIndex: 20 }}>
        <button
          onClick={() => navigate(`/hosts/${host_id}/volumes`)}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#6b7280',
            color: 'white',
            borderRadius: '0.75rem',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '0.875rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = '#4b5563';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 6px 8px -1px rgba(0, 0, 0, 0.2)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = '#6b7280';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
          }}
        >
          ← Back to Volumes
        </button>
      </div>
      <div style={{ paddingTop: '3rem', paddingBottom: '2rem', paddingLeft: '2rem', paddingRight: '2rem' }}>
        <div style={{ maxWidth: '40rem', margin: '0 auto' }}>
          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(12px)', borderRadius: '1.5rem', padding: '2.5rem', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)', position: 'relative' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: '700', color: 'white', marginBottom: '1.5rem', textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)' }}>
              Create Docker Volume
            </h1>
            {error && (
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '1rem', borderRadius: '0.75rem', marginBottom: '2rem', fontWeight: '500' }}>{error}</div>
            )}
            {success && (
              <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', padding: '1rem', borderRadius: '0.75rem', marginBottom: '2rem', fontWeight: '500' }}>{success}</div>
            )}
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'white', fontWeight: '500' }}>
                  Volume Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., mydata, app-storage, database-backup"
                  required
                  style={{ width: '100%', padding: '0.75rem', backgroundColor: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '0.5rem', color: 'white', fontSize: '0.875rem' }}
                />
                <small style={{ color: '#9ca3af', fontSize: '0.75rem', marginTop: '0.5rem', display: 'block' }}>
                  Unique name for the volume. Will be mounted as /mnt/{formData.name || 'volumename'} in containers
                </small>
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'white', fontWeight: '500' }}>
                  Driver
                </label>
                <select
                  value={formData.driver}
                  onChange={(e) => setFormData({ ...formData, driver: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', backgroundColor: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '0.5rem', color: 'white', fontSize: '0.875rem', appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none', outline: 'none', boxShadow: 'none' }}
                >
                  <option value="local">local (Default - Local filesystem)</option>
                  <option value="nfs">nfs (Network File System)</option>
                  <option value="cifs">cifs (Windows SMB/CIFS)</option>
                  <option value="tmpfs">tmpfs (Temporary filesystem)</option>
                </select>
                <small style={{ color: '#9ca3af', fontSize: '0.75rem', marginTop: '0.5rem', display: 'block' }}>
                  Storage driver for the volume. 'local' is most common for persistent data
                </small>
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'white', fontWeight: '500' }}>
                  Labels (JSON Format)
                </label>
                <textarea
                  rows="4"
                  value={formData.labels}
                  onChange={(e) => setFormData({ ...formData, labels: e.target.value })}
                  placeholder='{"environment": "production", "app": "webapp", "backup": "daily"}'
                  style={{ width: '100%', padding: '0.75rem', backgroundColor: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '0.5rem', color: 'white', fontSize: '0.875rem', fontFamily: 'monospace' }}
                />
                <small style={{ color: '#9ca3af', fontSize: '0.75rem', marginTop: '0.5rem', display: 'block' }}>
                  Optional metadata as JSON. Use for organizing volumes (environment, app name, etc.)
                </small>
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <button
                  type="button"
                  onClick={() => navigate(`/hosts/${host_id}/volumes`)}
                  disabled={isSubmitting}
                  style={{ padding: '0.875rem 1.75rem', backgroundColor: '#6b7280', color: 'white', borderRadius: '0.75rem', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', transition: 'all 0.2s ease', opacity: isSubmitting ? 0.5 : 1 }}
                  onMouseEnter={e => {
                    if (!isSubmitting) {
                      e.currentTarget.style.backgroundColor = '#4b5563';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 6px 8px -1px rgba(0, 0, 0, 0.2)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isSubmitting) {
                      e.currentTarget.style.backgroundColor = '#6b7280';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                    }
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ padding: '0.875rem 1.75rem', backgroundColor: '#3b82f6', color: 'white', borderRadius: '0.75rem', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', transition: 'all 0.2s ease', opacity: isSubmitting ? 0.5 : 1 }}
                  onMouseEnter={e => {
                    if (!isSubmitting) {
                      e.currentTarget.style.backgroundColor = '#2563eb';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 6px 8px -1px rgba(0, 0, 0, 0.2)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isSubmitting) {
                      e.currentTarget.style.backgroundColor = '#3b82f6';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                    }
                  }}
                >
                  {isSubmitting ? 'Creating...' : 'Create Volume'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
