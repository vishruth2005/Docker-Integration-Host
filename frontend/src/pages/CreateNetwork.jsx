import React, { useState } from 'react';
import { getAccessToken, logout } from '../utils/auth';
import { useNavigate, useParams } from 'react-router-dom';

export default function CreateNetwork() {
  const { hostId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    driver: 'bridge',
    scope: 'local',
    internal: false,
    attachable: false,
    ingress: false,
    host_id: hostId
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const token = getAccessToken();
    setError('');
    setSuccess('');
    setIsSubmitting(true);
  
    fetch('http://localhost:8000/networks/create/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(form)
    })
      .then(res => res.json().then(data => ({ status: res.status, body: data })))
      .then(({ status, body }) => {
        if (status === 201) {
          setSuccess('Docker network created successfully!');
          setTimeout(() => {
            navigate(`/hosts/${hostId}/networks`);
          }, 1200);
        } else {
          setError(body.message || 'Failed to create network');
        }
      })
      .catch(() => setError('Network creation request failed'))
      .finally(() => setIsSubmitting(false));
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
      <div style={{ position: 'fixed', top: '2rem', right: '2rem', zIndex: 20 }}>
        <button
          onClick={() => navigate(`/hosts/${hostId}/networks`)}
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
          ← Back to Networks
        </button>
      </div>
      <div style={{ paddingTop: '2rem', paddingBottom: '2rem', paddingLeft: '2rem', paddingRight: '2rem' }}>
        <div style={{ maxWidth: '40rem', margin: '0 auto' }}>
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(12px)',
            borderRadius: '1.5rem',
            padding: '2.5rem',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            position: 'relative'
          }}>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: '700',
              color: 'white',
              marginBottom: '1.5rem',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
            }}>
              Create Docker Network
            </h1>
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
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'white', fontWeight: '500' }}>
                  Network Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
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
                  placeholder="e.g., my-network"
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'white', fontWeight: '500' }}>
                  Driver
                </label>
                <select
                  name="driver"
                  value={form.driver}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '0.5rem',
                    color: 'white',
                    fontSize: '0.875rem',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                    outline: 'none',
                    boxShadow: 'none'
                  }}
                >
                  <option className="text-black" value="bridge">bridge</option>
                  <option className="text-black" value="overlay">overlay</option>
                  <option className="text-black" value="macvlan">macvlan</option>
                  <option className="text-black" value="host">host</option>
                  <option className="text-black" value="none">none</option>
                </select>
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'white', fontWeight: '500' }}>
                  Scope
                </label>
                <select
                  name="scope"
                  value={form.scope}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '0.5rem',
                    color: 'white',
                    fontSize: '0.875rem',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                    outline: 'none',
                    boxShadow: 'none'
                  }}
                >
                  <option className="text-black" value="local">local</option>
                  <option className="text-black" value="global">global</option>
                </select>
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'white', fontWeight: '500' }}>
                  Host ID
                </label>
                <input
                  type="text"
                  value={hostId}
                  disabled
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
              <div style={{
                marginBottom: '2rem',
                padding: '1.25rem',
                background: 'rgba(31,41,55,0.5)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                <div style={{ color: 'white', fontWeight: '600', marginBottom: '0.5rem', fontSize: '1.05rem' }}>
                  Network Options
                </div>
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                  {[
                    { label: 'Internal', name: 'internal', checked: form.internal },
                    { label: 'Attachable', name: 'attachable', checked: form.attachable },
                    { label: 'Ingress', name: 'ingress', checked: form.ingress }
                  ].map(opt => (
                    <label key={opt.name} style={{ color: 'white', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <span style={{
                        width: '1.25rem',
                        height: '1.25rem',
                        borderRadius: '0.25rem',
                        border: opt.checked ? '2px solid #3b82f6' : '2px solid rgba(255,255,255,0.3)',
                        backgroundColor: opt.checked ? '#3b82f6' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                        marginRight: '0.5rem'
                      }}>
                        {opt.checked && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                            <polyline points="20,6 9,17 4,12"></polyline>
                          </svg>
                        )}
                      </span>
                      <input
                        type="checkbox"
                        name={opt.name}
                        checked={opt.checked}
                        onChange={handleChange}
                        style={{ display: 'none' }}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <button
                  type="button"
                  onClick={() => navigate(`/hosts/${hostId}/networks`)}
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
                  {isSubmitting ? 'Creating...' : 'Create Network'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
