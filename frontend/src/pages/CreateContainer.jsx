import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAccessToken } from '../utils/auth';
import { API_BASE_URL, WS_BASE_URL } from '../config';

export default function CreateContainer() {
  const navigate = useNavigate();
  const { host_id } = useParams();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableVolumes, setAvailableVolumes] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    image: '',
    ports: {},
    environment: {},
    volumes: [],
    command: '',
    start: false
  });

  // Fetch available volumes for the host
  useEffect(() => {
    const fetchVolumes = async () => {
      const token = getAccessToken();
      try {
        const response = await fetch(`${API_BASE_URL}/hosts/${host_id}/volumes/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setAvailableVolumes(data);
        }
      } catch (err) {
        console.error('Failed to fetch volumes');
      }
    };
    fetchVolumes();
  }, [host_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const token = getAccessToken();
      const response = await fetch(`${API_BASE_URL}/hosts/${host_id}/containers/create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Container created successfully!');
        setTimeout(() => navigate(`/hosts/${host_id}/containers/`), 2000);
      } else {
        setError(data.message || 'Failed to create container');
      }
    } catch (err) {
      setError('Network error or server is not responding');
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
      overflowY: 'auto'
    }}>
      {/* Custom styles for volume selection */}
      <style>
        {`
          /* Custom scrollbar for volume selection */
          .volume-scroll::-webkit-scrollbar {
            width: 6px;
          }
          .volume-scroll::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 3px;
          }
          .volume-scroll::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 3px;
          }
          .volume-scroll::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.5);
          }
        `}
      </style>
      
      {/* Header */}
      <div style={{ paddingTop: '2rem', paddingBottom: '2rem', paddingLeft: '2rem', paddingRight: '2rem' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.08)', 
            backdropFilter: 'blur(12px)',
            borderRadius: '1.5rem',
            padding: '2.5rem',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
              <div>
                <h1 style={{ 
                  fontSize: '2.5rem', 
                  fontWeight: '700', 
                  color: 'white', 
                  marginBottom: '0.5rem',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                }}>
                  Create Container
                </h1>
                <p style={{ color: '#9ca3af', fontSize: '1.125rem', fontWeight: '500' }}>
                  Configure and deploy a new Docker container
                </p>
              </div>
              <button
                onClick={() => navigate(`/hosts/${host_id}/containers/`)}
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
                ← Back to Host
              </button>
            </div>

            {/* Error and Success Messages */}
            {error && (
              <div style={{ 
                backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                padding: '1rem',
                borderRadius: '0.75rem',
                marginBottom: '2rem',
                fontWeight: '500'
              }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{ 
                backgroundColor: 'rgba(16, 185, 129, 0.1)', 
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#10b981',
                padding: '1rem',
                borderRadius: '0.75rem',
                marginBottom: '2rem',
                fontWeight: '500'
              }}>
                {success}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                {/* Basic Configuration */}
                <div>
                  <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
                    Basic Configuration
                  </h3>
                  
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'white', fontWeight: '500' }}>
                      Container Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '0.5rem',
                        color: 'white',
                        fontSize: '0.875rem'
                      }}
                      placeholder="e.g., my-app, web-server"
                    />
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'white', fontWeight: '500' }}>
                      Docker Image *
                    </label>
                    <input
                      type="text"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '0.5rem',
                        color: 'white',
                        fontSize: '0.875rem'
                      }}
                      placeholder="e.g., nginx:latest, node:18-alpine"
                    />
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'white', fontWeight: '500' }}>
                      Command (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.command}
                      onChange={(e) => setFormData({ ...formData, command: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '0.5rem',
                        color: 'white',
                        fontSize: '0.875rem'
                      }}
                      placeholder="e.g., npm start, python app.py"
                    />
                  </div>
                </div>

                {/* Advanced Configuration */}
                <div>
                  <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
                    Advanced Configuration
                  </h3>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'white', fontWeight: '500' }}>
                      Port Mappings (JSON)
                    </label>
                    <textarea
                      value={JSON.stringify(formData.ports, null, 2)}
                      onChange={(e) => {
                        try {
                          const ports = JSON.parse(e.target.value);
                          setFormData({ ...formData, ports });
                        } catch {}
                      }}
                      placeholder='{"80/tcp": 8080, "443/tcp": 8443}'
                      rows="3"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '0.5rem',
                        color: 'white',
                        fontSize: '0.875rem',
                        fontFamily: 'monospace',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'white', fontWeight: '500' }}>
                      Environment Variables (JSON)
                    </label>
                    <textarea
                      value={JSON.stringify(formData.environment, null, 2)}
                      onChange={(e) => {
                        try {
                          const environment = JSON.parse(e.target.value);
                          setFormData({ ...formData, environment });
                        } catch {}
                      }}
                      placeholder='{"NODE_ENV": "production", "DB_HOST": "localhost"}'
                      rows="3"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '0.5rem',
                        color: 'white',
                        fontSize: '0.875rem',
                        fontFamily: 'monospace',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'white', fontWeight: '500' }}>
                      Attach Volumes
                    </label>
                    <div style={{ 
                      maxHeight: '200px', 
                      overflowY: 'auto',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '0.5rem',
                      padding: '0.75rem'
                    }} className="volume-scroll">
                      {availableVolumes.length === 0 ? (
                        <div style={{ 
                          color: '#9ca3af', 
                          fontSize: '0.875rem', 
                          textAlign: 'center',
                          padding: '1rem'
                        }}>
                          No volumes available on this host
                        </div>
                      ) : (
                        availableVolumes.map((volume) => (
                          <label
                            key={volume.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '0.75rem',
                              marginBottom: '0.5rem',
                              backgroundColor: formData.volumes.includes(volume.id) 
                                ? 'rgba(59, 130, 246, 0.15)' 
                                : 'rgba(255, 255, 255, 0.05)',
                              border: formData.volumes.includes(volume.id)
                                ? '1px solid rgba(59, 130, 246, 0.3)'
                                : '1px solid rgba(255, 255, 255, 0.1)',
                              borderRadius: '0.5rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              color: 'white'
                            }}
                            onMouseEnter={(e) => {
                              if (!formData.volumes.includes(volume.id)) {
                                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!formData.volumes.includes(volume.id)) {
                                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                              }
                            }}
                          >
                            <div style={{
                              width: '1.25rem',
                              height: '1.25rem',
                              borderRadius: '0.25rem',
                              border: formData.volumes.includes(volume.id)
                                ? '2px solid #3b82f6'
                                : '2px solid rgba(255, 255, 255, 0.3)',
                              backgroundColor: formData.volumes.includes(volume.id)
                                ? '#3b82f6'
                                : 'transparent',
                              marginRight: '0.75rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s ease'
                            }}>
                              {formData.volumes.includes(volume.id) && (
                                <svg 
                                  width="12" 
                                  height="12" 
                                  viewBox="0 0 24 24" 
                                  fill="none" 
                                  stroke="white" 
                                  strokeWidth="3"
                                >
                                  <polyline points="20,6 9,17 4,12"></polyline>
                                </svg>
                              )}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ 
                                fontWeight: '600', 
                                fontSize: '0.875rem',
                                color: formData.volumes.includes(volume.id) ? '#3b82f6' : 'white'
                              }}>
                                {volume.name}
                              </div>
                              <div style={{ 
                                fontSize: '0.75rem', 
                                color: '#9ca3af',
                                marginTop: '0.25rem'
                              }}>
                                Volume ID: {volume.id}
                              </div>
                            </div>
                            <input
                              type="checkbox"
                              checked={formData.volumes.includes(volume.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({ 
                                    ...formData, 
                                    volumes: [...formData.volumes, volume.id] 
                                  });
                                } else {
                                  setFormData({ 
                                    ...formData, 
                                    volumes: formData.volumes.filter(id => id !== volume.id) 
                                  });
                                }
                              }}
                              style={{ display: 'none' }}
                            />
                          </label>
                        ))
                      )}
                    </div>
                    <small style={{ color: '#9ca3af', fontSize: '0.75rem', marginTop: '0.5rem', display: 'block' }}>
                      Click to select/deselect volumes. Selected volumes will be mounted to /mnt/{'{volume_name}'}
                    </small>
                  </div>
                </div>
              </div>

              {/* Options */}
              <div style={{ 
                marginTop: '2rem', 
                padding: '1.5rem', 
                backgroundColor: 'rgba(255, 255, 255, 0.05)', 
                borderRadius: '0.75rem',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <label style={{ display: 'flex', alignItems: 'center', color: 'white', fontWeight: '500', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.start}
                    onChange={(e) => setFormData({ ...formData, start: e.target.checked })}
                    style={{ marginRight: '0.75rem', transform: 'scale(1.2)' }}
                  />
                  <span>Start container immediately after creation</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div style={{ 
                display: 'flex', 
                gap: '1rem', 
                justifyContent: 'flex-end', 
                marginTop: '2rem',
                paddingTop: '2rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <button
                  type="button"
                  onClick={() => navigate(`/hosts/${host_id}/containers/`)}
                  disabled={isSubmitting}
                  style={{
                    padding: '0.875rem 1.75rem',
                    backgroundColor: '#6b7280',
                    color: 'white',
                    borderRadius: '0.75rem',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.2s ease',
                    opacity: isSubmitting ? 0.5 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!isSubmitting) {
                      e.currentTarget.style.backgroundColor = '#4b5563';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 6px 8px -1px rgba(0, 0, 0, 0.2)';
                    }
                  }}
                  onMouseLeave={(e) => {
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
                  style={{
                    padding: '0.875rem 1.75rem',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    borderRadius: '0.75rem',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.2s ease',
                    opacity: isSubmitting ? 0.5 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!isSubmitting) {
                      e.currentTarget.style.backgroundColor = '#2563eb';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 6px 8px -1px rgba(0, 0, 0, 0.2)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSubmitting) {
                      e.currentTarget.style.backgroundColor = '#3b82f6';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                    }
                  }}
                >
                  {isSubmitting ? 'Creating...' : 'Create Container'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
