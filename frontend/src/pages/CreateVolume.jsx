import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAccessToken } from '../utils/auth';

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
        setTimeout(() => navigate(`/hosts/${host_id}/volumes`), 2000);
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
    <div style={{ padding: '20px' }}>
      <h2>Create Volume</h2>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {success && <div style={{ color: 'green' }}>{success}</div>}

      <form onSubmit={handleSubmit}>
        <div>
          <label>Volume Name:</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <br /><br />

        <div>
          <label>Driver:</label>
          <input
            type="text"
            value={formData.driver}
            onChange={(e) => setFormData({ ...formData, driver: e.target.value })}
          />
        </div>
        <br /><br />

        <div>
          <label>Labels (JSON)</label>
          <textarea
            rows="2"
            value={formData.labels}
            onChange={(e) => setFormData({ ...formData, labels: e.target.value })}
            placeholder='{"env": "prod"}'
          />
        </div>
        <br /><br />

        <div>
          <button
            type="button"
            onClick={() => navigate('/')}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <> Creating... </>
            ) : (
              'Create Volume'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
