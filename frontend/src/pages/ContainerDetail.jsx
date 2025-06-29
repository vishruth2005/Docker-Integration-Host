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
  const [liveLogs, setLiveLogs] = useState([]);
  const [ws, setWs] = useState(null);
  const [terminalWs, setTerminalWs] = useState(null);
  const [terminalOutput, setTerminalOutput] = useState('');
  const [command, setCommand] = useState('');
  const [showTerminal, setShowTerminal] = useState(false);
  const [volumeBindings, setVolumeBindings] = useState([]);
  const [showVolumeBindings, setShowVolumeBindings] = useState(false);

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

  const fetchVolumeBindings = async () => {
    const token = getAccessToken();
    try {
      const res = await fetch(`http://localhost:8000/${host_id}/${container_id}/volumes/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        logout();
        navigate('/login');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setVolumeBindings(data.volume_bindings || []);
      } else {
        console.error('Failed to fetch volume bindings:', res.status, res.statusText);
        setVolumeBindings([]);
      }
    } catch (err) {
      console.error('Failed to fetch volume bindings:', err);
      setVolumeBindings([]);
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
    fetchVolumeBindings();
  }, [container_id, navigate]);

  useEffect(() => {
    return () => {
      if (terminalWs) terminalWs.close();
    };
  }, [terminalWs]);
  
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

  const handleViewLogs = () => {
    const socket = new WebSocket('ws://localhost:8000/ws/socket-server/');
    
    socket.onopen = () => {
      console.log('WebSocket connected');
      socket.send(JSON.stringify({ container_id: container.container_id }));  // Just to trigger backend send
    };
  
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'log') {
        setLiveLogs(prev => [...prev, data.message]);
      }
    };
  
    socket.onerror = (err) => {
      console.error('WebSocket error:', err);
    };
  
    socket.onclose = () => {
      console.log('WebSocket disconnected');
    };
  
    setWs(socket);
    setShowLogs(true);
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

  // 1. Open terminal: create exec session and open websocket
  const handleOpenTerminal = async () => {
    const token = getAccessToken();
    setTerminalOutput('');
    setShowTerminal(true);

    // Step 1: Create exec session via REST API
    const res = await fetch(`http://localhost:8000/${host_id}/${container_id}/exec/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok || !data.exec_id) {
      setTerminalOutput('Failed to create exec session');
      return;
    }
    const exec_id = data.exec_id;

    // Step 2: Open WebSocket to terminal endpoint
    const wsUrl = `ws://localhost:8000/ws/terminal/${container_id}/${exec_id}/`;
    const ws = new window.WebSocket(wsUrl);

    ws.onopen = () => {
      setTerminalOutput('Connected to terminal.\n');
    };

    ws.onmessage = (event) => {
      setTerminalOutput(prev => prev + event.data);
    };

    ws.onerror = (e) => {
      setTerminalOutput(prev => prev + '\nWebSocket error\n');
    };

    ws.onclose = () => {
      setTerminalOutput(prev => prev + '\nTerminal closed\n');
    };

    setTerminalWs(ws);
  };

  // 2. Send command over websocket
  const handleSendCommand = () => {
    if (terminalWs && terminalWs.readyState === WebSocket.OPEN && command.trim() !== '') {
      terminalWs.send(command + '\n');
      setCommand('');
    }
  };

  // 3. Close terminal websocket
  const handleCloseTerminal = () => {
    if (terminalWs) terminalWs.close();
    setShowTerminal(false);
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
      
      {/* Enhanced Volume Display */}
      <div style={{ marginTop: '20px' }}>
        <h4>Volume Information</h4>
        
        {/* Refresh Button */}
        <button 
          onClick={fetchVolumeBindings}
          style={{ 
            marginBottom: '15px',
            padding: '5px 10px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.9em'
          }}
        >
          🔄 Refresh Volume Bindings
        </button>
        
        {/* Database Volumes */}
        <div style={{ marginBottom: '15px' }}>
          <h5>Associated Volumes (Database)</h5>
          {container.volumes && container.volumes.length > 0 ? (
            <ul>
              {container.volumes.map((vol) => (
                <li key={vol.id} style={{ marginBottom: '8px' }}>
                  <strong>{vol.name}</strong>
                  {vol.mountpoint && <> (Mountpoint: {vol.mountpoint})</>}
                  {vol.driver && <> - Driver: {vol.driver}</>}
                </li>
              ))}
            </ul>
          ) : (
            <p>No volumes associated with this container in the database.</p>
          )}
        </div>

        {/* Actual Volume Bindings */}
        <div style={{ marginBottom: '15px' }}>
          <h5>Active Volume Bindings (Container)</h5>
          {volumeBindings.length > 0 ? (
            <ul>
              {volumeBindings.map((binding, index) => (
                <li key={index} style={{ marginBottom: '8px' }}>
                  <strong>{binding.volume_name}</strong>
                  <br />
                  <span style={{ marginLeft: '20px', fontSize: '0.9em', color: '#666' }}>
                    Mount Point: {binding.mount_point}
                  </span>
                  <br />
                  <span style={{ marginLeft: '20px', fontSize: '0.9em', color: '#666' }}>
                    Mode: {binding.mode}
                  </span>
                  {binding.in_database ? (
                    <span style={{ marginLeft: '10px', color: 'green', fontSize: '0.8em' }}>
                      ✓ In Database
                    </span>
                  ) : (
                    <span style={{ marginLeft: '10px', color: 'orange', fontSize: '0.8em' }}>
                      ⚠ Not in Database
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p>No active volume bindings found in the container.</p>
          )}
        </div>

        {/* Volume Binding Summary */}
        <div style={{ 
          background: '#f5f5f5', 
          padding: '10px', 
          borderRadius: '5px',
          fontSize: '0.9em'
        }}>
          <strong>Summary:</strong>
          <br />
          • Database volumes: {container.volumes ? container.volumes.length : 0}
          <br />
          • Active bindings: {volumeBindings.length}
          <br />
          • Expected mount points: {container.volumes ? container.volumes.map(v => `/mnt/${v.name}`).join(', ') : 'None'}
        </div>
      </div>

      <p><strong>Host:</strong> {container.host?.host_name || 'N/A'}</p>

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

      <button style={{ marginTop: '10px', marginLeft: '10px' }} onClick={handleOpenTerminal}>Execute Command</button>

      {showTerminal && (
        <div style={{
          marginTop: '20px',
          background: '#222',
          color: '#0f0',
          padding: '10px',
          borderRadius: '5px',
          fontFamily: 'monospace'
        }}>
          <h3>Terminal</h3>
          <pre style={{ minHeight: 100, maxHeight: 300, overflowY: 'auto' }}>{terminalOutput}</pre>
          <input
            type="text"
            value={command}
            onChange={e => setCommand(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSendCommand();
            }}
            style={{ width: '80%', marginRight: 8 }}
            placeholder="Type command and press Enter"
          />
          <button onClick={handleSendCommand}>Send</button>
          <button onClick={handleCloseTerminal} style={{ marginLeft: 10 }}>Close</button>
        </div>
      )}

      {showLogs && (
        <div style={{
          marginTop: '20px',
          background: '#000',
          color: '#0f0',
          padding: '10px',
          borderRadius: '5px',
          height: '300px',
          overflowY: 'scroll',
          fontFamily: 'monospace'
        }}>
          <h3 style={{ color: '#fff' }}>Live Logs:</h3>
          {liveLogs.map((log, idx) => (
            <div key={idx}>{log}</div>
          ))}
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
