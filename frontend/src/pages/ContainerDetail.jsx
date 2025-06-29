import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAccessToken, logout } from '../utils/auth';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

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
  const [restartNeeded, setRestartNeeded] = useState(false);

  // Chart data state
  const [cpuData, setCpuData] = useState({
    labels: [],
    datasets: [{
      label: 'CPU Usage (%)',
      data: [],
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
      fill: true
    }]
  });

  const [memoryData, setMemoryData] = useState({
    labels: [],
    datasets: [{
      label: 'Memory Usage (MB)',
      data: [],
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      tension: 0.4,
      fill: true
    }]
  });

  const [networkData, setNetworkData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Network RX (MB)',
        data: [],
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.4,
        fill: false
      },
      {
        label: 'Network TX (MB)',
        data: [],
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        fill: false
      }
    ]
  });

  const navigate = useNavigate();

  // Function to update chart data
  const updateChartData = (newStats) => {
    const now = new Date().toLocaleTimeString();
    
    // Update CPU data
    setCpuData(prev => ({
      ...prev,
      labels: [...prev.labels.slice(-19), now],
      datasets: [{
        ...prev.datasets[0],
        data: [...prev.datasets[0].data.slice(-19), newStats.cpu_total_time_sec || 0]
      }]
    }));

    // Update Memory data
    setMemoryData(prev => ({
      ...prev,
      labels: [...prev.labels.slice(-19), now],
      datasets: [{
        ...prev.datasets[0],
        data: [...prev.datasets[0].data.slice(-19), newStats.memory_usage_mb || 0]
      }]
    }));

    // Update Network data
    setNetworkData(prev => ({
      ...prev,
      labels: [...prev.labels.slice(-19), now],
      datasets: [
        {
          ...prev.datasets[0],
          data: [...prev.datasets[0].data.slice(-19), newStats.network_rx_mb || 0]
        },
        {
          ...prev.datasets[1],
          data: [...prev.datasets[1].data.slice(-19), newStats.network_tx_mb || 0]
        }
      ]
    }));
  };

  // Function to get status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'running':
        return '#10b981';
      case 'stopped':
        return '#ef4444';
      case 'created':
        return '#f59e0b';
      case 'exited':
        return '#6b7280';
      default:
        return '#9ca3af';
    }
  };

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
      console.log('Connected networks response:', connectedData);
      setConnectedNetworks(connectedData);
  
      // Get all available networks
      const allRes = await fetch(`http://localhost:8000/hosts/${host_id}/networks/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const allData = await allRes.json();
      console.log('All networks response:', allData);
      setAllNetworks(allData);
    } catch (err) {
      console.error('Fetch networks error:', err);
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
        setRestartNeeded(false);
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
        updateChartData(data);
        setShowStats(true);
      } else {
        throw new Error(data.message || 'Failed to fetch stats');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Fetch stats periodically when container is running
  useEffect(() => {
    let interval;
    if (container && container.status === 'running') {
      // Fetch initial stats
      handleViewStats();
      
      // Set up periodic fetching every 5 seconds
      interval = setInterval(() => {
        handleViewStats();
      }, 5000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [container?.status]);

  const handleConnectNetwork = async () => {
    const token = getAccessToken();
    try {
      console.log('Connecting to network:', selectedNetwork, 'for container:', container.container_id);
      console.log('Selected network details:', selectedNetwork);
      console.log('All networks data:', allNetworks);
      console.log('Connected networks data:', connectedNetworks);
      
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
      console.log('Connect response:', res.status, data);
      
      if (res.status === 200) {
        setMessage(data.message);
        setSelectedNetwork('');
        fetchNetworks(); // Refresh connected and all networks
      } else {
        throw new Error(data.message || 'Failed to connect to network');
      }
    } catch (err) {
      console.error('Connect network error:', err);
      setError(err.message);
    }
  };

  const handleDisconnectNetwork = async (networkId) => {
    const token = getAccessToken();
    try {
      console.log('Disconnecting from network:', networkId, 'for container:', container.container_id);
      
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
      console.log('Disconnect response:', res.status, data);
      
      if (res.status === 200) {
        setMessage(data.message);
        fetchNetworks(); // Refresh network list
      } else {
        // Handle 404 errors specifically
        if (res.status === 404) {
          setError(`${data.message} ${data.suggestion || ''}`);
          // Refresh networks to get updated list
          setTimeout(() => {
            fetchNetworks();
            setError('');
          }, 3000);
        } else {
          throw new Error(data.message || 'Failed to disconnect from network');
        }
      }
    } catch (err) {
      console.error('Disconnect network error:', err);
      setError(err.message);
    }
  };

  // Function to clean up invalid network references
  const cleanupInvalidNetworks = async () => {
    const token = getAccessToken();
    try {
      const res = await fetch(`http://localhost:8000/${host_id}/${container_id}/networks/cleanup/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setMessage(data.message);
        if (data.requires_restart) {
          setError('Note: Container restart may be needed to fully clear invalid network references.');
          setRestartNeeded(true);
        }
        fetchNetworks(); // Refresh the network list
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to cleanup network references');
      }
    } catch (err) {
      setError('Failed to cleanup network references');
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

  // Auto-clear messages after 5 seconds
  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        setMessage('');
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, error]);

  if (error) return <p>Error: {error}</p>;
  if (!container) return <p>Loading container details...</p>;

  const unconnectedNetworks = allNetworks.filter(
    net => !connectedNetworks.some(cn => cn.name === net.name) // Using 'name' to compare
  );

  // Debug logging
  console.log('All networks:', allNetworks);
  console.log('Connected networks:', connectedNetworks);
  console.log('Unconnected networks:', unconnectedNetworks);

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
      margin: 0,
      padding: 0,
      overflowY: 'auto',
      position: 'relative'
    }}>
      {/* Custom styles for network dropdown */}
      <style>
        {`
          .network-select {
            background-color: rgba(255, 255, 255, 0.08) !important;
            color: white !important;
            border: 1px solid rgba(255, 255, 255, 0.2) !important;
          }
          .network-select option {
            background-color: #2d2d2d !important;
            color: white !important;
            padding: 8px !important;
          }
          .network-select option:hover {
            background-color: #3b82f6 !important;
          }
          .network-select:focus {
            outline: none !important;
            border-color: #3b82f6 !important;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2) !important;
          }
        `}
      </style>
      
      {/* Logout Button */}
      <div style={{ position: 'absolute', top: '2rem', right: '2rem', zIndex: 10 }}>
        <button
          onClick={() => { logout(); navigate('/login'); }}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#dc2626',
            color: 'white',
            borderRadius: '0.75rem',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '0.875rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = '#b91c1c';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 6px 8px -1px rgba(0, 0, 0, 0.2)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = '#dc2626';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
          }}
        >
          Logout
        </button>
      </div>
      {/* Main Card */}
      <div style={{
        maxWidth: '80rem',
        margin: '4rem auto 0 auto',
        backgroundColor: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(12px)',
        borderRadius: '1.5rem',
        padding: '2.5rem',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
      }}>
        {/* Message Display */}
        {message && (
          <div style={{
            padding: '1rem',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '0.75rem',
            marginBottom: '2rem',
            color: '#10b981',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}>
            {message}
          </div>
        )}
        {error && (
          <div style={{
            padding: '1rem',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '0.75rem',
            marginBottom: '2rem',
            color: '#ef4444',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}>
            {error}
            {restartNeeded && (
              <div style={{ marginTop: '0.5rem' }}>
                <button
                  onClick={() => handleAction('stop').then(() => setTimeout(() => handleAction('start'), 1000))}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#f59e0b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '0.75rem',
                    marginTop: '0.5rem'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#d97706'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f59e0b'}
                >
                  Restart Container to Clear References
                </button>
              </div>
            )}
          </div>
        )}
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: '700', color: 'white', marginBottom: '0.5rem', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
              {container.name}
            </h1>
            <p style={{ color: '#9ca3af', fontSize: '1.125rem', fontWeight: '500', fontFamily: 'monospace' }}>
              {container.container_id}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
              <div style={{ 
                width: '0.875rem', 
                height: '0.875rem', 
                borderRadius: '50%',
                backgroundColor: getStatusColor(container.status),
                marginRight: '0.75rem',
                boxShadow: `0 0 8px ${getStatusColor(container.status)}40`
              }}></div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'white' }}>
                {container.status}
              </div>
            </div>
            <div style={{ color: '#9ca3af', fontSize: '0.875rem', fontWeight: '500' }}>
              {container.image}
            </div>
          </div>
        </div>
        {/* Details grid placeholder - will fill in next step */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {/* Left column: details, volumes, networks */}
          <div>
            {/* Container Details */}
            <div style={{
              background: 'rgba(255,255,255,0.06)',
              borderRadius: '1rem',
              padding: '1.5rem',
              marginBottom: '2rem',
              border: '1px solid rgba(255,255,255,0.08)'
            }}>
              <h2 style={{ color: 'white', fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>Container Info</h2>
              <div style={{ color: '#d1d5db', fontSize: '1rem', marginBottom: '0.5rem' }}><b>State:</b> {container.state}</div>
              <div style={{ color: '#d1d5db', fontSize: '1rem', marginBottom: '0.5rem' }}><b>Created At:</b> {container.created_at}</div>
              <div style={{ color: '#d1d5db', fontSize: '1rem', marginBottom: '0.5rem' }}><b>Restarted Count:</b> {container.restarted_count}</div>
              <div style={{ color: '#d1d5db', fontSize: '1rem', marginBottom: '0.5rem' }}><b>Internal Ports:</b> {container.internal_ports}</div>
              <div style={{ color: '#d1d5db', fontSize: '1rem', marginBottom: '0.5rem' }}><b>Port Bindings:</b> {container.port_bindings}</div>
              <div style={{ color: '#d1d5db', fontSize: '1rem', marginBottom: '0.5rem' }}><b>Host:</b> {container.host?.host_name || 'N/A'}</div>
            </div>

            {/* Volumes Section */}
            <div style={{
              background: 'rgba(255,255,255,0.06)',
              borderRadius: '1rem',
              padding: '1.5rem',
              marginBottom: '2rem',
              border: '1px solid rgba(255,255,255,0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h2 style={{ color: 'white', fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>Volumes</h2>
                <button 
                  onClick={fetchVolumeBindings}
                  style={{ 
                    padding: '0.5rem 1rem',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2563eb'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#3b82f6'}
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>

              {/* Database Volumes */}
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem', 
                  marginBottom: '1rem',
                  color: '#9ca3af',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                  Associated Volumes (Database)
                </div>
                
                {container.volumes && container.volumes.length > 0 ? (
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {container.volumes.map((vol) => (
                      <div key={vol.id} style={{
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '0.75rem',
                        padding: '1rem',
                        border: '1px solid rgba(255,255,255,0.08)',
                        transition: 'all 0.2s'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <div style={{ color: 'white', fontWeight: '600', fontSize: '0.875rem' }}>
                            {vol.name}
                          </div>
                          <div style={{ 
                            padding: '0.25rem 0.5rem',
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            color: '#10b981',
                            borderRadius: '0.375rem',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}>
                            Database
                          </div>
                        </div>
                        <div style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                          {vol.mountpoint && <>Mountpoint: {vol.mountpoint}</>}
                          {vol.driver && vol.mountpoint && <> • </>}
                          {vol.driver && <>Driver: {vol.driver}</>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '2rem',
                    color: '#6b7280',
                    fontSize: '0.875rem'
                  }}>
                    No volumes associated with this container in the database.
                  </div>
                )}
              </div>

              {/* Active Volume Bindings */}
              <div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem', 
                  marginBottom: '1rem',
                  color: '#9ca3af',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Active Volume Bindings (Container)
                </div>
                
                {volumeBindings.length > 0 ? (
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {volumeBindings.map((binding, index) => (
                      <div key={index} style={{
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '0.75rem',
                        padding: '1rem',
                        border: '1px solid rgba(255,255,255,0.08)',
                        transition: 'all 0.2s'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <div style={{ color: 'white', fontWeight: '600', fontSize: '0.875rem' }}>
                            {binding.volume_name}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {binding.in_database ? (
                              <div style={{ 
                                padding: '0.25rem 0.5rem',
                                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                color: '#10b981',
                                borderRadius: '0.375rem',
                                fontSize: '0.75rem',
                                fontWeight: '600'
                              }}>
                                Database
                              </div>
                            ) : (
                              <div style={{ 
                                padding: '0.25rem 0.5rem',
                                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                                color: '#f59e0b',
                                borderRadius: '0.375rem',
                                fontSize: '0.75rem',
                                fontWeight: '600'
                              }}>
                                ⚠ External
                              </div>
                            )}
                          </div>
                        </div>
                        <div style={{ color: '#9ca3af', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                          Mount Point: <span style={{ color: 'white', fontFamily: 'monospace' }}>{binding.mount_point}</span>
                        </div>
                        <div style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                          Mode: <span style={{ color: 'white' }}>{binding.mode}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '2rem',
                    color: '#6b7280',
                    fontSize: '0.875rem'
                  }}>
                    No active volume bindings found in the container.
                  </div>
                )}
              </div>
            </div>

            {/* Networks Section */}
            <div style={{
              background: 'rgba(255,255,255,0.06)',
              borderRadius: '1rem',
              padding: '1.5rem',
              marginBottom: '2rem',
              border: '1px solid rgba(255,255,255,0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h2 style={{ color: 'white', fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>Networks</h2>
                <button 
                  onClick={cleanupInvalidNetworks}
                  style={{ 
                    padding: '0.5rem 1rem',
                    backgroundColor: '#f59e0b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#d97706'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f59e0b'}
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Cleanup
                </button>
              </div>

              {/* Connected Networks */}
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem', 
                  marginBottom: '1rem',
                  color: '#9ca3af',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                  </svg>
                  Connected Networks
                </div>
                
                {connectedNetworks.length > 0 ? (
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {connectedNetworks.map(net => (
                      <div key={net.name} style={{
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '0.75rem',
                        padding: '1rem',
                        border: '1px solid rgba(255,255,255,0.08)',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ 
                            width: '0.5rem', 
                            height: '0.5rem', 
                            borderRadius: '50%',
                            backgroundColor: '#10b981'
                          }}></div>
                          <div style={{ color: 'white', fontWeight: '600', fontSize: '0.875rem' }}>
                            {net.name}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDisconnectNetwork(net.id)}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '0.75rem',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#b91c1c'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#ef4444'}
                        >
                          Disconnect
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '2rem',
                    color: '#6b7280',
                    fontSize: '0.875rem'
                  }}>
                    Not connected to any network.
                  </div>
                )}
              </div>

              {/* Connect to Network */}
              <div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem', 
                  marginBottom: '1rem',
                  color: '#9ca3af',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Connect to Network
                </div>
                
                {unconnectedNetworks.length === 0 ? (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '2rem',
                    color: '#6b7280',
                    fontSize: '0.875rem'
                  }}>
                    All networks are already connected.
                  </div>
                ) : (
                  <div style={{
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '0.75rem',
                    padding: '1rem',
                    border: '1px solid rgba(255,255,255,0.08)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                      <select value={selectedNetwork} onChange={e => setSelectedNetwork(e.target.value)}
                        className="network-select"
                        style={{
                          flex: 1,
                          padding: '0.75rem',
                          borderRadius: '0.5rem',
                          backgroundColor: 'rgba(255,255,255,0.08)',
                          color: 'white',
                          border: '1px solid rgba(255,255,255,0.2)',
                          fontSize: '0.875rem'
                        }}
                      >
                        <option value="">Select a network</option>
                        {unconnectedNetworks.map(net => (
                          <option key={net.name} value={net.id}>{net.name}</option>
                        ))}
                      </select>
                      <button
                        onClick={handleConnectNetwork}
                        disabled={!selectedNetwork}
                        style={{
                          padding: '0.75rem 1.5rem',
                          backgroundColor: selectedNetwork ? '#3b82f6' : '#6b7280',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.5rem',
                          cursor: selectedNetwork ? 'pointer' : 'not-allowed',
                          fontWeight: '600',
                          fontSize: '0.875rem',
                          transition: 'all 0.2s',
                          whiteSpace: 'nowrap'
                        }}
                        onMouseEnter={e => { if (selectedNetwork) e.currentTarget.style.backgroundColor = '#2563eb'; }}
                        onMouseLeave={e => { if (selectedNetwork) e.currentTarget.style.backgroundColor = '#3b82f6'; }}
                      >
                        Connect
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right column: stats, actions, modal triggers */}
          <div>
            {/* Stats Section (Graph placeholders) */}
            <div style={{
              background: 'rgba(255,255,255,0.06)',
              borderRadius: '1rem',
              padding: '1.5rem',
              marginBottom: '2rem',
              border: '1px solid rgba(255,255,255,0.08)'
            }}>
              <h2 style={{ color: 'white', fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem' }}>Live Stats</h2>
              
              {/* CPU Chart */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ color: '#9ca3af', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>CPU Usage</div>
                <div style={{ height: '120px', position: 'relative' }}>
                  <Line 
                    data={cpuData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false
                        }
                      },
                      scales: {
                        x: {
                          display: false
                        },
                        y: {
                          beginAtZero: true,
                          grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                          },
                          ticks: {
                            color: '#9ca3af',
                            font: {
                              size: 10
                            }
                          }
                        }
                      },
                      elements: {
                        point: {
                          radius: 0
                        }
                      }
                    }}
                  />
                </div>
              </div>

              {/* Memory Chart */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ color: '#9ca3af', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Memory Usage</div>
                <div style={{ height: '120px', position: 'relative' }}>
                  <Line 
                    data={memoryData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false
                        }
                      },
                      scales: {
                        x: {
                          display: false
                        },
                        y: {
                          beginAtZero: true,
                          grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                          },
                          ticks: {
                            color: '#9ca3af',
                            font: {
                              size: 10
                            }
                          }
                        }
                      },
                      elements: {
                        point: {
                          radius: 0
                        }
                      }
                    }}
                  />
                </div>
              </div>

              {/* Network Chart */}
              <div>
                <div style={{ color: '#9ca3af', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Network I/O</div>
                <div style={{ height: '120px', position: 'relative' }}>
                  <Line 
                    data={networkData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: true,
                          position: 'top',
                          labels: {
                            color: '#9ca3af',
                            font: {
                              size: 10
                            },
                            usePointStyle: true,
                            pointStyle: 'line'
                          }
                        }
                      },
                      scales: {
                        x: {
                          display: false
                        },
                        y: {
                          beginAtZero: true,
                          grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                          },
                          ticks: {
                            color: '#9ca3af',
                            font: {
                              size: 10
                            }
                          }
                        }
                      },
                      elements: {
                        point: {
                          radius: 0
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Actions Section */}
            <div style={{
              background: 'rgba(255,255,255,0.06)',
              borderRadius: '1rem',
              padding: '1.5rem',
              marginBottom: '2rem',
              border: '1px solid rgba(255,255,255,0.08)'
            }}>
              <h2 style={{ color: 'white', fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem' }}>Actions</h2>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {container.status === 'running' ? (
                  <button onClick={() => handleAction('stop')}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      borderRadius: '0.75rem',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '0.95rem',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#b91c1c'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#ef4444'}
                  >
                    Stop Container
                  </button>
                ) : (
                  <button onClick={() => handleAction('start')}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#10b981',
                      color: 'white',
                      borderRadius: '0.75rem',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '0.95rem',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#059669'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#10b981'}
                  >
                    Start Container
                  </button>
                )}
                <button onClick={() => setShowLogs(true)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    borderRadius: '0.75rem',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '0.95rem',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2563eb'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#3b82f6'}
                >
                  View Logs
                </button>
                <button onClick={() => setShowTerminal(true)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#6366f1',
                    color: 'white',
                    borderRadius: '0.75rem',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '0.95rem',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#4338ca'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#6366f1'}
                >
                  Execute Command
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Logs Modal */}
      {showLogs && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '2rem'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
            borderRadius: '1rem',
            padding: '2rem',
            maxWidth: '80%',
            maxHeight: '80%',
            width: '100%',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
              paddingBottom: '1rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h2 style={{ color: 'white', fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>
                Container Logs
              </h2>
              <button
                onClick={() => {
                  setShowLogs(false);
                  if (ws) ws.close();
                  setLiveLogs([]);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9ca3af',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'white'}
                onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}
              >
                ×
              </button>
            </div>
            <div style={{
              flex: 1,
              backgroundColor: '#000',
              color: '#0f0',
              padding: '1rem',
              borderRadius: '0.5rem',
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              overflowY: 'auto',
              minHeight: '400px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              {liveLogs.length === 0 ? (
                <div style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
                  Waiting for logs...
                </div>
              ) : (
                liveLogs.map((log, idx) => (
                  <div key={idx} style={{ marginBottom: '0.25rem' }}>{log}</div>
                ))
              )}
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '1rem',
              paddingTop: '1rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                {liveLogs.length} log entries
              </span>
              <button
                onClick={handleViewLogs}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2563eb'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#3b82f6'}
              >
                Refresh Logs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terminal Modal */}
      {showTerminal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '2rem'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
            borderRadius: '1rem',
            padding: '2rem',
            maxWidth: '90%',
            maxHeight: '90%',
            width: '100%',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
              paddingBottom: '1rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h2 style={{ color: 'white', fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>
                Terminal - {container.name}
              </h2>
              <button
                onClick={() => {
                  setShowTerminal(false);
                  if (terminalWs) terminalWs.close();
                  setTerminalOutput('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9ca3af',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'white'}
                onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}
              >
                ×
              </button>
            </div>
            <div style={{
              flex: 1,
              backgroundColor: '#000',
              color: '#0f0',
              padding: '1rem',
              borderRadius: '0.5rem',
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              overflowY: 'auto',
              minHeight: '400px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              marginBottom: '1rem'
            }}>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{terminalOutput}</pre>
            </div>
            <div style={{
              display: 'flex',
              gap: '1rem',
              alignItems: 'center'
            }}>
              <input
                type="text"
                value={command}
                onChange={e => setCommand(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSendCommand();
                }}
                placeholder="Type command and press Enter..."
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '0.5rem',
                  color: 'white',
                  fontSize: '0.875rem',
                  fontFamily: 'monospace'
                }}
              />
              <button
                onClick={handleSendCommand}
                disabled={!command.trim()}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: command.trim() ? '#10b981' : '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: command.trim() ? 'pointer' : 'not-allowed',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                  if (command.trim()) e.currentTarget.style.backgroundColor = '#059669';
                }}
                onMouseLeave={e => {
                  if (command.trim()) e.currentTarget.style.backgroundColor = '#10b981';
                }}
              >
                Send
              </button>
              <button
                onClick={handleOpenTerminal}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2563eb'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#3b82f6'}
              >
                Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
