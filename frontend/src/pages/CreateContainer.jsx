import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAccessToken } from '../utils/auth';

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
        const response = await fetch(`http://localhost:8000/hosts/${host_id}/volumes/`, {
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
      const response = await fetch(`http://localhost:8000/hosts/${host_id}/containers/create/`, {
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
        setTimeout(() => navigate('/'), 2000);
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
    <div style={{ padding: '20px' }}>
      <h2>Create Container</h2>

      {error && <div>{error}</div>}
      {success && <div>{success}</div>}

      <form onSubmit={handleSubmit} >
        <div>
          <label>Container Name:</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <br /><br />

        <div>
          <label>Image:</label>
          <input
            type="text"
            value={formData.image}
            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            placeholder="e.g., nginx:latest"
            required
          />
        </div>
        <br /><br />

        <div>
          <label>Port Mappings (JSON):</label>
          <textarea
            value={JSON.stringify(formData.ports)}
            onChange={(e) => {
              try {
                const ports = JSON.parse(e.target.value);
                setFormData({ ...formData, ports });
              } catch {}
            }}
            placeholder='{"80/tcp": 8080}'
            rows="2"
          />
        </div>
        <br /><br />

        <div>
          <label>Environment Variables (JSON):</label>
          <textarea
            value={JSON.stringify(formData.environment)}
            onChange={(e) => {
              try {
                const environment = JSON.parse(e.target.value);
                setFormData({ ...formData, environment });
              } catch {}
            }}
            placeholder='{"NODE_ENV": "production"}'
            rows="2"
          />
        </div>
        <br /><br />

        <div>
          <label>Attach Volumes:</label>
          <select
            multiple
            value={formData.volumes}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, opt => opt.value);
              setFormData({ ...formData, volumes: selected });
            }}
          >
            {availableVolumes.map((volume) => (
              <option key={volume.id} value={volume.id}>
                {volume.name}
              </option>
            ))}
          </select>
        </div>
        <br /><br />

        <div>
          <label>
            <input
              type="checkbox"
              checked={formData.start}
              onChange={(e) => setFormData({ ...formData, start: e.target.checked })}
            />
            <span>Start container after creation</span>
          </label>
        </div>
        <br />

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
            {isSubmitting ? 'Creating...' : 'Create Container'}
          </button>
        </div>
      </form>
    </div>
  );
}
