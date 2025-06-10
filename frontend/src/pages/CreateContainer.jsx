import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAccessToken } from '../utils/auth';

export default function CreateContainer() {
  const navigate = useNavigate();
  const [hosts, setHosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    host_id: '',
    name: '',
    image: '',
    ports: {},
    environment: {},
    volumes: [],
    command: '',
    start: false
  });

  // Fetch available hosts when component mounts
  useEffect(() => {
    const fetchHosts = async () => {
      const token = getAccessToken();
      try {
        const response = await fetch('http://localhost:8000/docker-hosts/my/', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.status === 401) {
          navigate('/login');
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch hosts');
        }

        const data = await response.json();
        setHosts(data);
      } catch (err) {
        setError('Failed to load Docker hosts');
      } finally {
        setLoading(false);
      }
    };

    fetchHosts();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const token = getAccessToken();
      const response = await fetch('http://localhost:8000/containers/create/', {
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

  if (loading) return <div>Loading available hosts...</div>;

  return (
    <div>
      <h2>Create Container</h2>

      {error && ( <div> {error} </div> )}

      {success && ( <div> {success} </div> )}

      <form onSubmit={handleSubmit} >
        <div>
          <label>Select Host</label>
          <select
            value={formData.host_id}
            onChange={(e) => setFormData({ ...formData, host_id: e.target.value })}
            required
          >
            <option value="">Select a Docker host</option>
            {hosts.map((host) => (
              <option key={host.id} value={host.id}> {host.host_name} </option>
            ))}
          </select>
        </div>

        <div>
          <label>Container Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div>
          <label>Image</label>
          <input
            type="text"
            value={formData.image}
            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            placeholder="e.g., nginx:latest"
            required
          />
        </div>

        <div>
          <label>Port Mappings (JSON)</label>
          <textarea
            value={JSON.stringify(formData.ports)}
            onChange={(e) => {
              try {
                const ports = JSON.parse(e.target.value);
                setFormData({ ...formData, ports });
              } catch {} // Ignore invalid JSON
            }}
            placeholder='{"80/tcp": 8080}'
            rows="2"
          />
        </div>

        <div>
          <label>Environment Variables (JSON)</label>
          <textarea
            value={JSON.stringify(formData.environment)}
            onChange={(e) => {
              try {
                const environment = JSON.parse(e.target.value);
                setFormData({ ...formData, environment });
              } catch {} // Ignore invalid JSON
            }}
            placeholder='{"NODE_ENV": "production"}'
            rows="2"
          />
        </div>

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
              'Create Container'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}