import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAccessToken, logout } from '../utils/auth';

export default function ManageVolumes() {
  const { host_id } = useParams();
  const navigate = useNavigate();
  const [host, setHost] = useState(null);
  const [volumes, setVolumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingVolume, setDeletingVolume] = useState(null);

  // Fetch host details
  const fetchHost = async () => {
    const token = getAccessToken();
    try {
      const res = await fetch(`http://localhost:8000/hosts/${host_id}/details/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        navigate('/login');
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch host details');
      const data = await res.json();
      setHost(data.host);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchVolumes = () => {
    const token = getAccessToken();
    fetch(`http://localhost:8000/hosts/${host_id}/volumes/`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json().then(data => ({ status: res.status, body: data })))
      .then(({ status, body }) => {
        if (status === 200) {
          setVolumes(body);
        } else {
          setError(body.message || 'Failed to fetch volumes');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch volumes');
        setLoading(false);
      });
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([fetchHost(), fetchVolumes()])
      .finally(() => setLoading(false));
  }, [host_id]);

  const handleDelete = (volume_id) => {
    if (!window.confirm('Are you sure you want to delete this volume?')) return;
    setDeletingVolume(volume_id);
    const token = getAccessToken();
    fetch(`http://localhost:8000/volumes/${volume_id}/delete/`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => {
        if (res.status === 204) {
          setVolumes(prev => prev.filter(v => v.id !== volume_id));
        } else {
          res.json().then(data => {
            alert(data.message || 'Failed to delete volume');
          });
        }
      })
      .catch(() => alert('Delete request failed'))
      .finally(() => setDeletingVolume(null));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', width: '100vw', background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0 }}>
      <div style={{ color: 'white', fontSize: '1.25rem' }}>Loading volumes...</div>
    </div>
  );
  if (error) return (
    <div style={{ minHeight: '100vh', width: '100vw', background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0 }}>
      <div style={{ color: '#f87171', fontSize: '1.25rem' }}>Error: {error}</div>
    </div>
  );
  if (!host) return (
    <div style={{ minHeight: '100vh', width: '100vw', background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0 }}>
      <div style={{ color: 'white', fontSize: '1.25rem' }}>Host not found</div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', width: '100vw', background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)', margin: 0, padding: 0, position: 'fixed', top: 0, left: 0, overflowY: 'auto' }}>
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
      {/* Host Info Section */}
      <div style={{ paddingTop: '3rem', paddingBottom: '2rem', paddingLeft: '2rem', paddingRight: '2rem' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(12px)', borderRadius: '1.5rem', padding: '2.5rem', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h1 style={{ fontSize: '2.5rem', fontWeight: '700', color: 'white', marginBottom: '0.75rem', textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)' }}>
                  {host.host_name}
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '0.875rem', height: '0.875rem', backgroundColor: '#10b981', borderRadius: '50%', boxShadow: '0 0 8px rgba(16, 185, 129, 0.5)', animation: 'pulse 2s infinite' }}></div>
                    <span style={{ color: '#10b981', fontWeight: '600', fontSize: '0.875rem' }}>Connected</span>
                  </div>
                  <span style={{ color: '#d1d5db', fontSize: '1.125rem', fontWeight: '500' }}>
                    {host.host_ip}
                  </span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '2rem', fontWeight: '700', color: 'white', marginBottom: '0.25rem' }}>
                  {volumes.length}
                </div>
                <div style={{ color: '#9ca3af', fontSize: '0.875rem', fontWeight: '500' }}>
                  Volumes
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Volumes Section */}
      <div style={{ paddingLeft: '2rem', paddingRight: '2rem', paddingBottom: '2rem' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'white', textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)' }}>Volumes</h2>
            <button
              onClick={() => navigate(`/hosts/${host_id}/volumes/create`)}
              style={{
                padding: '0.875rem 1.75rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                borderRadius: '0.75rem',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = '#2563eb';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 8px -1px rgba(0, 0, 0, 0.2)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = '#3b82f6';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
              }}
            >
              <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Create Volume</span>
            </button>
          </div>
          {volumes.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: '4rem', paddingBottom: '4rem' }}>
              <div style={{ color: '#9ca3af', fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: '500' }}>No volumes found for this host.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {volumes.map((vol) => (
                <div
                  key={vol.id}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    backdropFilter: 'blur(12px)',
                    borderRadius: '1rem',
                    padding: '1.75rem',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 16px -1px rgba(0, 0, 0, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  }}
                >
                  <div style={{ marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'white', marginBottom: '0.5rem', textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>{vol.name}</h3>
                    <div style={{ color: '#9ca3af', fontSize: '0.95rem', fontWeight: '500', marginBottom: '0.5rem' }}>Driver: {vol.driver}</div>
                    <div style={{ color: '#6b7280', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.5rem' }}>Mountpoint: {vol.mountpoint || '—'}</div>
                    <div style={{ color: '#6b7280', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.5rem' }}>Labels: {JSON.stringify(vol.labels || {})}</div>
                  </div>
                  <button
                    onClick={() => handleDelete(vol.id)}
                    disabled={deletingVolume === vol.id}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#dc2626',
                      color: 'white',
                      borderRadius: '0.5rem',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      opacity: deletingVolume === vol.id ? 0.5 : 1,
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    onMouseEnter={e => {
                      if (deletingVolume !== vol.id) {
                        e.currentTarget.style.backgroundColor = '#b91c1c';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.2)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (deletingVolume !== vol.id) {
                        e.currentTarget.style.backgroundColor = '#dc2626';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 4px -1px rgba(0, 0, 0, 0.1)';
                      }
                    }}
                  >
                    {deletingVolume === vol.id ? 'Deleting...' : 'Delete'}
                  </button>
                  <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#6b7280', fontWeight: '500', fontFamily: 'monospace' }}>
                    ID: {vol.id ? String(vol.id).substring(0, 12) : ''}...
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
