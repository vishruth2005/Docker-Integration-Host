import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAccessToken, logout } from '../utils/auth';
import { API_BASE_URL } from '../config';

export default function CreateImage() {
  const { host_id } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    tag: 'latest'
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
      const response = await fetch(`${API_BASE_URL}/hosts/${host_id}/images/create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess(`Image ${formData.name}:${formData.tag} pulled successfully`);
        setTimeout(() => navigate(`/hosts/${host_id}/images`), 1200);
      } else {
        setError(data.detail || 'Failed to pull image');
      }
    } catch (err) {
      setError('Network error or server not responding');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
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
            fontWeight: '600',
            fontSize: '0.875rem',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>

      {/* Back Button */}
      <div style={{ position: 'fixed', top: '2rem', left: '2rem', zIndex: 20 }}>
        <button
          onClick={() => navigate(`/hosts/${host_id}/images`)}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#6b7280',
            color: 'white',
            borderRadius: '0.75rem',
            fontWeight: '600',
            fontSize: '0.875rem',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          ← Back to Images
        </button>
      </div>

      <div style={{ padding: '5rem 2rem 2rem' }}>
        <div style={{ maxWidth: '40rem', margin: '0 auto' }}>
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(12px)',
            borderRadius: '1.5rem',
            padding: '2.5rem',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: '700',
              color: 'white',
              marginBottom: '1.5rem'
            }}>
              Pull Docker Image
            </h1>

            {error && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                padding: '1rem',
                borderRadius: '0.75rem',
                marginBottom: '2rem'
              }}>{error}</div>
            )}

            {success && (
              <div style={{
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#10b981',
                padding: '1rem',
                borderRadius: '0.75rem',
                marginBottom: '2rem'
              }}>{success}</div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Image Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., nginx, redis, alpine"
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
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Tag (optional)
                </label>
                <input
                  type="text"
                  value={formData.tag}
                  onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                  placeholder="latest"
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button
                  type="button"
                  onClick={() => navigate(`/hosts/${host_id}/images`)}
                  style={{
                    padding: '0.875rem 1.75rem',
                    backgroundColor: '#6b7280',
                    color: 'white',
                    borderRadius: '0.75rem',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.875rem 1.75rem',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    borderRadius: '0.75rem',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Pulling...' : 'Pull Image'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
