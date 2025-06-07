import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAccessToken, logout } from '../utils/auth';

export default function ContainerDetail() {
  const { host_id, container_id } = useParams();
  const [container, setContainer] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [logs, setLogs] = useState('');
  const [showLogs, setShowLogs] = useState(false);
  const navigate = useNavigate();

  const fetchContainerDetails = () => {
    const token = getAccessToken();
    fetch(`http://localhost:8000/${host_id}/${container_id}/`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => {
        if (res.status === 401) {
          logout();
          navigate('/login');
        }
        if (!res.ok) {
          throw new Error('Container not found');
        }
        return res.json();
      })
      .then(data => {
        setContainer(data);
        setError('');
      })
      .catch(err => setError(err.message));
  };

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      navigate('/login');
      return;
    }

    fetchContainerDetails();
  }, [container_id, navigate]);

  const handleAction = async (action) => {
    const token = getAccessToken();
    const endpoint = action === 'start' ? 'start' : 'stop';

    try {
      const res = await fetch(`http://localhost:8000/${host_id}/${container_id}/${endpoint}/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (res.status === 200) {
        setMessage(data.message);
        fetchContainerDetails(); // Refresh container details
      } else {
        throw new Error(data.message || 'Action failed');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleViewLogs = async () => {
    const token = getAccessToken();

    try {
      const res = await fetch(`http://localhost:8000/${host_id}/${container_id}/logs/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (res.status === 200) {
        setLogs(data.logs || 'No logs available.');
        setShowLogs(true);
      } else {
        throw new Error(data.message || 'Failed to fetch logs');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  if (error) return <p>Error: {error}</p>;
  if (!container) return <p>Loading container details...</p>;

  return (
    <div>
      <h2>Container Detail</h2>
      {message && <p style={{ color: 'green' }}>{message}</p>}
      <p><strong>ID:</strong> {container.container_id}</p>
      <p><strong>Name:</strong> {container.name}</p>
      <p><strong>Image:</strong> {container.image}</p>
      <p><strong>Status:</strong> {container.status}</p>
      <p><strong>State:</strong> {container.state}</p>
      <p><strong>Created At:</strong> {container.created_at}</p>
      <p><strong>Restarted Count:</strong> {container.restarted_count}</p>
      <p><strong>Internal Ports:</strong> {container.internal_ports}</p>
      <p><strong>Port Bindings:</strong> {container.port_bindings}</p>
      <p><strong>Host:</strong> {container.host?.name || 'N/A'}</p>
      <p><strong>Created By:</strong> {container.created_by}</p>
      <p><strong>Editable By:</strong> {Array.isArray(container.editable_by) ? container.editable_by.join(', ') : 'N/A'}</p>
      <p><strong>Viewable By:</strong> {Array.isArray(container.viewable_by) ? container.viewable_by.join(', ') : 'N/A'}</p>
      <p><strong>Last Updated:</strong> {container.last_updated}</p>
      <p><strong>Is Active:</strong> {container.is_active ? 'Yes' : 'No'}</p>

      {container.status === 'running' ? (
        <button onClick={() => handleAction('stop')} style={{ marginTop: '10px', marginRight: '10px' }}>
          Stop Container
        </button>
      ) : (
        <button onClick={() => handleAction('start')} style={{ marginTop: '10px', marginRight: '10px' }}>
          Start Container
        </button>
      )}

      <button onClick={handleViewLogs} style={{ marginTop: '10px' }}>
        View Logs
      </button>

      {showLogs && (
        <div style={{ marginTop: '20px', whiteSpace: 'pre-wrap', background: '#f4f4f4', padding: '10px', borderRadius: '5px' }}>
          <h3>Logs:</h3>
          <code>{logs}</code>
        </div>
      )}
    </div>
  );
}
