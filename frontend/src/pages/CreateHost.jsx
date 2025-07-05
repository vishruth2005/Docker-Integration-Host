import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAccessToken } from '../utils/auth';
import { API_BASE_URL } from '../config';

export default function CreateHost() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    host_name: '',
    host_ip: '',
    docker_api_url: '',
    port: '2375',
    connection_protocol: 'tcp',
    auth_type: 'none',
    description: '',
    tls_cert: '',
    tls_key: '',
    tls_ca_cert: '',
    ssh_username: '',
    ssh_private_key: '',
    ssh_password: '',
    api_token: '',
    labels: '',
    operating_system: '',
    docker_version: '',
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    if (!formData.host_name || !formData.host_ip || !formData.port) {
      setError('Please fill in all required fields');
      return false;
    }
    if (formData.auth_type === 'tls' && (!formData.tls_cert || !formData.tls_key)) {
      setError('TLS authentication requires certificate and key');
      return false;
    }
    if (formData.auth_type === 'ssh' && (!formData.ssh_username || (!formData.ssh_private_key && !formData.ssh_password))) {
      setError('SSH authentication requires username and either private key or password');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!validateForm()) return;
    setIsSubmitting(true);
    const token = getAccessToken();

    try {
      const response = await fetch(`${API_BASE_URL}/hosts/create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Docker host created successfully!');
        setTimeout(() => {
          navigate('/home');
        }, 2000);
      } else {
        switch (response.status) {
          case 400:
            setError(data.message || 'Could not connect to Docker host. Please check your configuration.');
            break;
          case 401:
            setError('Authentication failed. Please log in again.');
            navigate('/login');
            break;
          case 403:
            setError('You do not have permission to create Docker hosts.');
            break;
          default:
            setError(data.message || 'An error occurred while creating the host.');
        }
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
                  Create Docker Host
                </h1>
                <p style={{ color: '#9ca3af', fontSize: '1.125rem', fontWeight: '500' }}>
                  Register a new Docker host for management
                </p>
              </div>
              <button
                onClick={() => navigate('/home')}
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
                ← Back to Home
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

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                {/* Basic Configuration */}
                <div>
                  <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
                    Basic Configuration
                  </h3>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'white', fontWeight: '500' }}>
                      Host Name *
                    </label>
                    <input
                      type="text"
                      value={formData.host_name}
                      onChange={e => setFormData({ ...formData, host_name: e.target.value })}
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
                      placeholder="e.g., prod-host-1"
                    />
                  </div>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'white', fontWeight: '500' }}>
                      Host IP *
                    </label>
                    <input
                      type="text"
                      value={formData.host_ip}
                      onChange={e => setFormData({ ...formData, host_ip: e.target.value })}
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
                      placeholder="e.g., 192.168.1.100"
                    />
                  </div>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'white', fontWeight: '500' }}>
                      Docker API URL
                    </label>
                    <input
                      type="text"
                      value={formData.docker_api_url}
                      onChange={e => setFormData({ ...formData, docker_api_url: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '0.5rem',
                        color: 'white',
                        fontSize: '0.875rem'
                      }}
                      placeholder="e.g., tcp://192.168.1.100:2375"
                    />
                  </div>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'white', fontWeight: '500' }}>
                      Port *
                    </label>
                    <input
                      type="number"
                      value={formData.port}
                      onChange={e => setFormData({ ...formData, port: e.target.value })}
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
                      placeholder="2375"
                    />
                  </div>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'white', fontWeight: '500' }}>
                      Connection Protocol
                    </label>
                    <select
                      value={formData.connection_protocol}
                      onChange={e => setFormData({ ...formData, connection_protocol: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '0.5rem',
                        color: 'white', 
                        fontSize: '0.875rem'
                      }}
                    >
                      <option className="text-black" value="tcp">TCP</option>
                      <option className="text-black" value="unix">Unix Socket</option>
                      <option className="text-black" value="ssh">SSH</option>
                    </select>
                  </div>
                </div>

                {/* Authentication Section */}
                <div>
                  <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
                    Authentication
                  </h3>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'white', fontWeight: '500' }}>
                      Authentication Type
                    </label>
                    <select
                      value={formData.auth_type}
                      onChange={e => setFormData({ ...formData, auth_type: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '0.5rem',
                        color: 'white',
                        fontSize: '0.875rem'
                      }}
                    >
                      <option className="text-black" value="none">None</option>
                      <option className="text-black" value="tls">TLS</option>
                      <option className="text-black" value="ssh">SSH</option>
                    </select>
                  </div>
                  {formData.auth_type === 'tls' && (
                    <>
                      <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'white', fontWeight: '500' }}>
                          TLS Certificate
                        </label>
                        <textarea
                          value={formData.tls_cert}
                          onChange={e => setFormData({ ...formData, tls_cert: e.target.value })}
                          rows="3"
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '0.5rem',
                            color: 'white',
                            fontSize: '0.875rem',
                            fontFamily: 'monospace'
                          }}
                        />
                      </div>
                      <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'white', fontWeight: '500' }}>
                          TLS Key
                        </label>
                        <textarea
                          value={formData.tls_key}
                          onChange={e => setFormData({ ...formData, tls_key: e.target.value })}
                          rows="3"
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '0.5rem',
                            color: 'white',
                            fontSize: '0.875rem',
                            fontFamily: 'monospace'
                          }}
                        />
                      </div>
                      <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'white', fontWeight: '500' }}>
                          CA Certificate
                        </label>
                        <textarea
                          value={formData.tls_ca_cert}
                          onChange={e => setFormData({ ...formData, tls_ca_cert: e.target.value })}
                          rows="3"
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '0.5rem',
                            color: 'white',
                            fontSize: '0.875rem',
                            fontFamily: 'monospace'
                          }}
                        />
                      </div>
                    </>
                  )}
                  {formData.auth_type === 'ssh' && (
                    <>
                      <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'white', fontWeight: '500' }}>
                          SSH Username
                        </label>
                        <input
                          type="text"
                          value={formData.ssh_username}
                          onChange={e => setFormData({ ...formData, ssh_username: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '0.5rem',
                            color: 'white',
                            fontSize: '0.875rem'
                          }}
                        />
                      </div>
                      <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'white', fontWeight: '500' }}>
                          SSH Private Key
                        </label>
                        <textarea
                          value={formData.ssh_private_key}
                          onChange={e => setFormData({ ...formData, ssh_private_key: e.target.value })}
                          rows="3"
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '0.5rem',
                            color: 'white',
                            fontSize: '0.875rem',
                            fontFamily: 'monospace'
                          }}
                        />
                      </div>
                      <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'white', fontWeight: '500' }}>
                          SSH Password
                        </label>
                        <input
                          type="password"
                          value={formData.ssh_password}
                          onChange={e => setFormData({ ...formData, ssh_password: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '0.5rem',
                            color: 'white',
                            fontSize: '0.875rem'
                          }}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Optional Fields Section */}
              <div style={{
                marginTop: '2rem',
                padding: '1.5rem',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '0.75rem',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <h3 style={{ color: 'white', fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>
                  Optional Details
                </h3>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.5rem'
                  }}
                >
                  <div>
                    <label style={{ color: 'white', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>
                      Labels (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formData.labels}
                      onChange={e => setFormData({ ...formData, labels: e.target.value })}
                      placeholder="prod, web-server, etc."
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '0.5rem',
                        color: 'white',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ color: 'white', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>
                      Operating System
                    </label>
                    <input
                      type="text"
                      value={formData.operating_system}
                      onChange={e => setFormData({ ...formData, operating_system: e.target.value })}
                      placeholder="Linux, Windows, etc."
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '0.5rem',
                        color: 'white',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ color: 'white', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>
                      Docker Version
                    </label>
                    <input
                      type="text"
                      value={formData.docker_version}
                      onChange={e => setFormData({ ...formData, docker_version: e.target.value })}
                      placeholder="20.10.8"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '0.5rem',
                        color: 'white',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ color: 'white', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      rows="3"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '0.5rem',
                        color: 'white',
                        fontSize: '0.875rem',
                        fontFamily: 'monospace'
                      }}
                    />
                  </div>
                </div>
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
                  onClick={() => navigate('/home')}
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
                  {isSubmitting ? 'Creating...' : 'Create Host'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
