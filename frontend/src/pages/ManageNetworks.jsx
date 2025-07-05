import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAccessToken, logout } from '../utils/auth';

export default function ManageNetworks() {
  const { hostId } = useParams();
  const navigate = useNavigate();
  const [host, setHost] = useState(null);
  const [networks, setNetworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingNetwork, setDeletingNetwork] = useState(null);

  // Fetch host details
  const fetchHost = async () => {
    const token = getAccessToken();
    try {
      const res = await fetch(`http://localhost:8000/hosts/${hostId}/details/`, {
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

  // Fetch networks
  const fetchNetworks = async () => {
    const token = getAccessToken();
    try {
      const res = await fetch(`http://localhost:8000/hosts/${hostId}/networks/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        navigate('/login');
        return;
      }
      const data = await res.json();
      if (res.status === 200) {
        setNetworks(data);
      } else {
        setError(data.message || 'Failed to fetch networks');
      }
    } catch (err) {
      setError('Failed to fetch networks');
    }
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([fetchHost(), fetchNetworks()])
      .finally(() => setLoading(false));
  }, [hostId]);

  const handleDelete = async (networkId, networkName) => {
    if (!window.confirm(`Are you sure you want to delete network "${networkName}"?`)) return;
    setDeletingNetwork(networkId);
    const token = getAccessToken();
    try {
      const res = await fetch(`http://localhost:8000/networks/${networkId}/delete/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 204) {
        setNetworks(prev => prev.filter(n => n.id !== networkId));
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to delete network');
      }
    } catch {
      alert('Delete request failed');
    } finally {
      setDeletingNetwork(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) return (
    <div style={{ 
      minHeight: '100vh', 
      width: '100vw',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: 0,
      padding: 0,
      position: 'fixed',
      top: 0,
      left: 0
    }}>
      <div style={{ color: 'white', fontSize: '1.25rem' }}>Loading...</div>
    </div>
  );

  if (error) return (
    <div style={{ 
      minHeight: '100vh', 
      width: '100vw',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: 0,
      padding: 0,
      position: 'fixed',
      top: 0,
      left: 0
    }}>
      <div style={{ color: '#f87171', fontSize: '1.25rem' }}>Error: {error}</div>
    </div>
  );

  if (!host) return (
    <div style={{ 
      minHeight: '100vh', 
      width: '100vw',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: 0,
      padding: 0,
      position: 'fixed',
      top: 0,
      left: 0
    }}>
      <div style={{ color: 'white', fontSize: '1.25rem' }}>Host not found</div>
    </div>
  );

  return (
    <div style={{ 
      minHeight: '100vh', 
      width: '100vw',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
      margin: 0,
      padding: 0,
      position: 'fixed',
      top: 0,
      left: 0,
      overflowY: 'auto'
    }}>
      {/* Header */}
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', zIndex: 10 }}>
          <button
            onClick={() => navigate(`/hosts/${hostId}/select/`)}
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
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#4b5563';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 8px -1px rgba(0, 0, 0, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#6b7280';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
            }}
          >
            <svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
        </div>
        <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 10 }}>
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
            <div style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.08)', 
              backdropFilter: 'blur(12px)',
              borderRadius: '1.5rem',
              padding: '2.5rem',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h1 style={{ 
                    fontSize: '2.5rem', 
                    fontWeight: '700', 
                    color: 'white', 
                    marginBottom: '0.75rem',
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                  }}>
                    {host.host_name}
                  </h1>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ 
                        width: '0.875rem', 
                        height: '0.875rem', 
                        backgroundColor: '#10b981', 
                        borderRadius: '50%',
                        boxShadow: '0 0 8px rgba(16, 185, 129, 0.5)',
                        animation: 'pulse 2s infinite'
                      }}></div>
                      <span style={{ color: '#10b981', fontWeight: '600', fontSize: '0.875rem' }}>Connected</span>
                    </div>
                    <span style={{ color: '#d1d5db', fontSize: '1.125rem', fontWeight: '500' }}>
                      {host.host_ip}                      
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '2rem', fontWeight: '700', color: 'white', marginBottom: '0.25rem' }}>
                    {networks.length}
                  </div>
                  <div style={{ color: '#9ca3af', fontSize: '0.875rem', fontWeight: '500' }}>
                    Networks
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Networks Section */}
      <div style={{ paddingLeft: '2rem', paddingRight: '2rem', paddingBottom: '2rem' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'white', textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)' }}>Networks</h2>
            <button
              onClick={() => navigate(`/hosts/${hostId}/networks/create`)}
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
              <span>Create Network</span>
            </button>
          </div>
          {networks.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: '4rem', paddingBottom: '4rem' }}>
              <div style={{ color: '#9ca3af', fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: '500' }}>No networks found for this host.</div>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1.5rem'
            }}>
              {networks.map((net) => (
                <div
                  key={net.id}
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
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'white', marginBottom: '0.5rem', textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>{net.name}</h3>
                    <div style={{ color: '#9ca3af', fontSize: '0.95rem', fontWeight: '500', marginBottom: '0.5rem' }}>Driver: {net.driver}</div>
                    <div style={{ color: '#6b7280', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.5rem' }}>Scope: {net.scope}</div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                    <span style={{ padding: '0.375rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600', backgroundColor: net.internal ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)', color: net.internal ? '#ef4444' : '#10b981', border: `1px solid ${net.internal ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}` }}>Internal: {net.internal ? 'Yes' : 'No'}</span>
                    <span style={{ padding: '0.375rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600', backgroundColor: net.attachable ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: net.attachable ? '#10b981' : '#ef4444', border: `1px solid ${net.attachable ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}` }}>Attachable: {net.attachable ? 'Yes' : 'No'}</span>
                    <span style={{ padding: '0.375rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600', backgroundColor: net.ingress ? 'rgba(59, 130, 246, 0.15)' : 'rgba(107, 114, 128, 0.15)', color: net.ingress ? '#3b82f6' : '#6b7280', border: `1px solid ${net.ingress ? 'rgba(59, 130, 246, 0.3)' : 'rgba(107, 114, 128, 0.3)'}` }}>Ingress: {net.ingress ? 'Yes' : 'No'}</span>
                  </div>
                  <button
                    onClick={() => handleDelete(net.id, net.name)}
                    disabled={deletingNetwork === net.id}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#dc2626',
                      color: 'white',
                      borderRadius: '0.5rem',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      opacity: deletingNetwork === net.id ? 0.5 : 1,
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    onMouseEnter={e => {
                      if (deletingNetwork !== net.id) {
                        e.currentTarget.style.backgroundColor = '#b91c1c';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.2)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (deletingNetwork !== net.id) {
                        e.currentTarget.style.backgroundColor = '#dc2626';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 4px -1px rgba(0, 0, 0, 0.1)';
                      }
                    }}
                  >
                    {deletingNetwork === net.id ? 'Deleting...' : 'Delete'}
                  </button>
                  <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#6b7280', fontWeight: '500', fontFamily: 'monospace' }}>
                    ID: {net.id?.substring(0, 12)}...
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
