import React, { useEffect, useState } from 'react';
import { getAccessToken, logout } from '../utils/auth';
import { useNavigate } from 'react-router-dom';

// Function to decode JWT payload
function decodeToken(token) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch (e) {
    return null;
  }
}

export default function Home() {
  const [hosts, setHosts] = useState([]);
  const [role, setRole] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      navigate('/login');
      return;
    }

    const decoded = decodeToken(token);
    if (!decoded) {
      logout();
      navigate('/login');
      return;
    }
    const userRole = decoded.role || 'viewer';
    setRole(userRole);
    setUsername(decoded.username || decoded.user || 'User');

    // Determine endpoint based on role
    let endpoint = '/';
    if (userRole === 'admin') endpoint = '/admin-only/';
    else if (userRole === 'developer') endpoint = '/developer-only/';
    else if (userRole === 'viewer') endpoint = '/viewer-only/';

    setLoading(true);
    fetch(`http://localhost:8000${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (res.status === 401) {
          logout();
          navigate('/login');
        }
        return res.json();
      })
      .then(data => {
        setHosts(data);
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to fetch hosts');
        setLoading(false);
      });
  }, [navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleHostClick = (host) => {
    navigate(`/hosts/${host.id}/select`);
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
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#b91c1c';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 8px -1px rgba(0, 0, 0, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#dc2626';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
            }}
          >
            Logout
          </button>
        </div>
        
        {/* Main Header Section */}
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
                    Welcome, {username}
                  </h1>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ 
                        width: '0.875rem', 
                        height: '0.875rem', 
                        backgroundColor: '#3b82f6', 
                        borderRadius: '50%',
                        boxShadow: '0 0 8px rgba(59, 130, 246, 0.5)',
                        animation: 'pulse 2s infinite'
                      }}></div>
                      <span style={{ color: '#3b82f6', fontWeight: '600', fontSize: '0.875rem' }}>
                        Role: {role}
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '2rem', fontWeight: '700', color: 'white', marginBottom: '0.25rem' }}>
                    {hosts.length}
                  </div>
                  <div style={{ color: '#9ca3af', fontSize: '0.875rem', fontWeight: '500' }}>
                    Hosts
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hosts Section */}
      <div style={{ paddingLeft: '2rem', paddingRight: '2rem', paddingBottom: '2rem' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'white', textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)' }}>
              Your Hosts
            </h2>
            {(role === 'admin' || role === 'developer') && (
              <button
                onClick={() => navigate('/hosts/create/')}
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
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2563eb';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 8px -1px rgba(0, 0, 0, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#3b82f6';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                }}
              >
                <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Create Host</span>
              </button>
            )}
          </div>

          {hosts.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: '4rem', paddingBottom: '4rem' }}>
              <div style={{ color: '#9ca3af', fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: '500' }}>
                No hosts found
              </div>
              {(role === 'admin' || role === 'developer') && (
                <button
                  onClick={() => navigate('/hosts/create/')}
                  style={{
                    padding: '1rem 2rem',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    borderRadius: '0.75rem',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '1rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#2563eb';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 6px 8px -1px rgba(0, 0, 0, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#3b82f6';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  Create Your First Host
                </button>
              )}
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
              gap: '1.5rem'
            }}>
              {hosts.map((host) => (
                <div
                  key={host.id}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    backdropFilter: 'blur(12px)',
                    borderRadius: '1rem',
                    padding: '2rem',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 16px -1px rgba(0, 0, 0, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';  
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  }}
                  onClick={() => handleHostClick(host)}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ 
                        fontSize: '1.5rem', 
                        fontWeight: '600', 
                        color: 'white', 
                        marginBottom: '0.5rem',
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                      }}>
                        {host.host_name}
                      </h3>
                      <p style={{ 
                        fontSize: '0.875rem', 
                        color: '#9ca3af',
                        fontWeight: '500',
                        marginBottom: '0.5rem'
                      }}>
                        {host.description}
                      </p>
                      <p style={{ 
                        fontSize: '0.875rem', 
                        color: '#6b7280',
                        fontWeight: '500',
                        fontFamily: 'monospace'
                      }}>
                        {host.host_ip}
                      </p>
                    </div>
                    <div style={{ 
                      width: '0.875rem', 
                      height: '0.875rem', 
                      borderRadius: '50%',
                      marginLeft: '0.75rem',
                      backgroundColor: host.status === 'active' ? '#10b981' : '#ef4444',
                      boxShadow: host.status === 'active' ? '0 0 8px rgba(16, 185, 129, 0.5)' : '0 0 8px rgba(239, 68, 68, 0.5)'
                    }}></div>
                  </div>
                  
                  <div style={{ marginBottom: '1.5rem' }}>
                    <span style={{
                      padding: '0.375rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      backgroundColor: host.status === 'active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: host.status === 'active' ? '#10b981' : '#ef4444',
                      border: `1px solid ${host.status === 'active' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                    }}>
                      {host.status}
                    </span>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.75rem',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: '0.5rem',
                    border: '1px solid rgba(59, 130, 246, 0.2)'
                  }}>
                    <span style={{
                      color: '#3b82f6',
                      fontSize: '0.875rem',
                      fontWeight: '600'
                    }}>
                      Click to manage host
                    </span>
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