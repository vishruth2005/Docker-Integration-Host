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
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Create Docker Volume</h2>
      {error && <div style={{ color: 'red', padding: '10px', backgroundColor: '#ffe6e6', borderRadius: '4px', marginBottom: '15px' }}>{error}</div>}
      {success && <div style={{ color: 'green', padding: '10px', backgroundColor: '#e6ffe6', borderRadius: '4px', marginBottom: '15px' }}>{success}</div>}

      <form onSubmit={handleSubmit} style={{ backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px' }}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Volume Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., mydata, app-storage, database-backup"
            required
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
          <small style={{ color: '#666', fontSize: '0.9em' }}>
            Unique name for the volume. Will be mounted as /mnt/{formData.name || 'volumename'} in containers
          </small>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Driver
          </label>
          <select
            value={formData.driver}
            onChange={(e) => setFormData({ ...formData, driver: e.target.value })}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            <option value="local">local (Default - Local filesystem)</option>
            <option value="nfs">nfs (Network File System)</option>
            <option value="cifs">cifs (Windows SMB/CIFS)</option>
            <option value="tmpfs">tmpfs (Temporary filesystem)</option>
          </select>
          <small style={{ color: '#666', fontSize: '0.9em' }}>
            Storage driver for the volume. 'local' is most common for persistent data
          </small>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Labels (JSON Format)
          </label>
          <textarea
            rows="4"
            value={formData.labels}
            onChange={(e) => setFormData({ ...formData, labels: e.target.value })}
            placeholder='{"environment": "production", "app": "webapp", "backup": "daily"}'
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', fontFamily: 'monospace' }}
          />
          <small style={{ color: '#666', fontSize: '0.9em' }}>
            Optional metadata as JSON. Use for organizing volumes (environment, app name, etc.)
          </small>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => navigate(`/hosts/${host_id}/volumes`)}
            disabled={isSubmitting}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#6c757d', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer' 
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer' 
            }}
          >
            {isSubmitting ? 'Creating...' : 'Create Volume'}
          </button>
        </div>
      </form>

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e7f3ff', borderRadius: '4px' }}>
        <h4 style={{ marginTop: '0' }}>Volume Usage Information</h4>
        <ul style={{ margin: '0', paddingLeft: '20px' }}>
          <li>Volumes persist data even when containers are removed</li>
          <li>When attached to containers, volumes are mounted at <code>/mnt/volumename</code></li>
          <li>Use descriptive names like "database-data" or "app-logs"</li>
          <li>Labels help organize and identify volumes across your infrastructure</li>
        </ul>
      </div>
    </div>
  );
}
