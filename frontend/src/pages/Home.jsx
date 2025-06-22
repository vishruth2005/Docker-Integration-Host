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
  const [hosts, setHosts] = useState([]);
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
        setHosts(data);
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to fetch hosts');
        setLoading(false);
      });
  }, []);

  const handleViewHost = (host) => {
    navigate(`/${host.id}/containers`);
  };

  const handleCreateHost = () => {
    navigate(`hosts/create/`);
  };

  const handleCreateContainer = () => {
    navigate(`containers/create/`);
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

        <h2>Docker Hosts</h2>
        {(role === 'admin' || role === 'developer') && (
          <>
            <button onClick={handleCreateHost}>
              Create Host
            </button>
          </>
        )}
      </div>

      <div>
        <table style={{width: '60%'}}>
          <thead>
            <tr>
              <th style={{textAlign: 'left'}}>Host Name</th>
              <th style={{textAlign: 'left'}}>IP Address</th>
              <th style={{textAlign: 'left'}}>Status</th>
              <th style={{textAlign: 'left'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
          {hosts.map((host) => (
            <tr key={host.id}>
              <td>
                <div>{host.host_name}</div>
                <div>{host.description}</div>
              </td>
              <td>{host.host_ip}</td>
              <td>{host.status}</td>
              <td>
                <button onClick={() => navigate(`/hosts/${host.id}/containers`)}>
                  View Containers
                </button>
                {(role === 'admin' || role === 'developer') && (
                  <>
                    <button onClick={() => navigate(`/hosts/${host.id}/containers/create`)}>
                      Create Container
                    </button>
                    <button onClick={() => navigate(`/hosts/${host.id}/networks/create`)}>
                      Create Network
                    </button>
                    <button onClick={() => navigate(`/hosts/${host.id}/networks`)}>
                      Manage Network
                    </button>
                    <button onClick={() => navigate(`/hosts/${host.id}/volumes/create`)}>
                      Create Volume
                    </button>
                    <button onClick={() => navigate(`/hosts/${host.id}/volumes`)}>
                      Manage Volumes
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>
    </div>
  );
}
