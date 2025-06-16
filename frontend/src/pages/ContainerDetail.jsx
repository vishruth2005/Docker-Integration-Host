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
  const [stats, setStats] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [allNetworks, setAllNetworks] = useState([]);
  const [connectedNetworks, setConnectedNetworks] = useState([]);
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const navigate = useNavigate();

  const fetchContainerDetails = async () => {
    const token = getAccessToken();
    try {
      const res = await fetch(`http://localhost:8000/${host_id}/${container_id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        logout();
        navigate('/login');
        return;
      }
      if (!res.ok) throw new Error('Container not found');
      const data = await res.json();
      setContainer(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchNetworks = async () => {
    const token = getAccessToken();
    try {
      // Get connected networks
      const res = await fetch(`http://localhost:8000/${host_id}/${container_id}/networks/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        logout();
        navigate('/login');
        return;
      }
      const connectedData = await res.json();
      setConnectedNetworks(connectedData);
  
      // Get all available networks
      const allRes = await fetch(`http://localhost:8000/hosts/${host_id}/networks/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const allData = await allRes.json();
      setAllNetworks(allData);
    } catch (err) {
      setError('Failed to fetch networks');
    }
  };
  

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      navigate('/login');
      return;
    }
    fetchContainerDetails();
    fetchNetworks();
  }, [container_id, navigate]);

  const handleAction = async (action) => {
    const token = getAccessToken();
    const endpoint = action === 'start' ? 'start' : 'stop';
    try {
      const res = await fetch(`http://localhost:8000/${host_id}/${container_id}/${endpoint}/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.status === 200) {
        setMessage(data.message);
        fetchContainerDetails();
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
        headers: { Authorization: `Bearer ${token}` }
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

  const handleViewStats = async () => {
    const token = getAccessToken();
    try {
      const res = await fetch(`http://localhost:8000/${host_id}/${container_id}/stats/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.status === 200) {
        setStats(data);
        setShowStats(true);
      } else {
        throw new Error(data.message || 'Failed to fetch stats');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleConnectNetwork = async () => {
    const token = getAccessToken();
    try {
      const res = await fetch('http://localhost:8000/networks/connect/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          container_id: container.container_id,
          network_id: selectedNetwork
        })
      });

      const data = await res.json();
      if (res.status === 200) {
        setMessage(data.message);
        setSelectedNetwork('');
        fetchNetworks(); // Refresh connected and all networks
      } else {
        throw new Error(data.message || 'Failed to connect to network');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDisconnectNetwork = async (networkId) => {
    const token = getAccessToken();
    try {
      const res = await fetch('http://localhost:8000/networks/disconnect/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          container_id: container.container_id,
          network_id: networkId
        })
      });
  
      const data = await res.json();
      if (res.status === 200) {
        setMessage(data.message);
        fetchNetworks(); // Refresh network list
      } else {
        throw new Error(data.message || 'Failed to disconnect from network');
      }
    } catch (err) {
      setError(err.message);
    }
  };
  

  if (error) return <p>Error: {error}</p>;
  if (!container) return <p>Loading container details...</p>;

  const unconnectedNetworks = allNetworks.filter(
    net => !connectedNetworks.some(cn => cn.name === net.name) // Using 'name' to compare
  );

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

      <div style={{ marginTop: '20px' }}>
        <h4>Connected Networks:</h4>
        {connectedNetworks.length > 0 ? (
          <ul>
            {connectedNetworks.map(net => (
              <li key={net.name} style={{ marginBottom: '8px' }}>
                {net.name}
                <button
                  onClick={() => handleDisconnectNetwork(net.id)}
                  style={{
                    marginLeft: '10px',
                    padding: '2px 8px',
                    backgroundColor: '#f55',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Disconnect
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>Not connected to any network.</p>
        )}
      </div>


      <div style={{ marginTop: '20px' }}>
        <h4>Connect to a Network</h4>
        {unconnectedNetworks.length === 0 ? (
          <p>All networks are already connected.</p>
        ) : (
          <>
            <select value={selectedNetwork} onChange={e => setSelectedNetwork(e.target.value)}>
              <option value="">Select a network</option>
              {unconnectedNetworks.map(net => (
                <option key={net.name} value={net.id}>{net.name}</option>
              ))}
            </select>
            <button
              onClick={handleConnectNetwork}
              disabled={!selectedNetwork}
              style={{ marginLeft: '10px' }}
            >
              Connect
            </button>
          </>
        )}
      </div>


      {container.status === 'running' ? (
        <>
          <button onClick={() => handleAction('stop')} style={{ marginTop: '10px', marginRight: '10px' }}>
            Stop Container
          </button>
          <button onClick={handleViewStats} style={{ marginTop: '10px', marginRight: '10px' }}>
            View Stats
          </button>
        </>
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

      {showStats && stats && (
        <div style={{ marginTop: '20px', background: '#eef', padding: '10px', borderRadius: '5px' }}>
          <h3>Container Stats</h3>
          <p><strong>CPU Time Used:</strong> {stats.cpu_total_time_sec} sec</p>
          <p><strong>Memory Usage:</strong> {stats.memory_usage_mb} MB / {stats.memory_limit_mb} MB</p>
          <p><strong>Processes (PIDs):</strong> {stats.pids}</p>
          <p><strong>Network RX:</strong> {stats.network_rx_mb} MB</p>
          <p><strong>Network TX:</strong> {stats.network_tx_mb} MB</p>
          <p><strong>Timestamp:</strong> {new Date(stats.timestamp).toLocaleString()}</p>
        </div>
      )}
    </div>
  );
}
