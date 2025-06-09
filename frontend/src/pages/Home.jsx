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
  const [containers, setContainers] = useState([]);
  const [role, setRole] = useState('');
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

    const userRole = decoded.role || 'viewer'; // fallback if role isn't in token
    setRole(userRole);

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
        setContainers(data);
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to fetch containers');
        setLoading(false);
      });
  }, []);

  const handleViewContainer = (container) => {
    navigate(`${container.host.id}/${container.container_id}`);
  };

  const handleCreateHost = () => {
    navigate(`hosts/create/`);
  };

  const handleCreateContainer = () => {
    navigate(`${host_id}/containers/create/`);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <div>
        <h2>Home</h2>
        <p><strong>Role:</strong> {role}</p>
        <button onClick={() => { logout(); navigate('/login'); }}>
          Logout
        </button>

        {(role === 'admin' || role === 'developer') && (
          <>
            <button onClick={handleCreateHost}>
              Create Host
            </button>
            <button onClick={handleCreateContainer}>
              Create Container
            </button>
          </>
        )}
        
      </div>

      <div>
        <table style={{width: '60%'}}>
          <thead>
            <tr>
              <th style={{textAlign: 'left'}}>Name</th>
              <th style={{textAlign: 'left'}}>Image</th>
              <th style={{textAlign: 'left'}}>Status</th>
              <th style={{textAlign: 'left'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {containers.map((container) => (
              <tr key={container.id}>
                <td>
                  <div>{container.name}</div>
                  <div>{container.id}</div>
                </td>
                <td>{container.image}</td>
                <td>
                  <span>{container.status}</span>
                </td>
                <td>
                  <button onClick={() => handleViewContainer(container)}>
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

  );
}
