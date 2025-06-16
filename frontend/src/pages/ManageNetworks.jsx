import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getAccessToken } from '../utils/auth';

export default function ManageNetworks() {
  const { hostId } = useParams();
  const [networks, setNetworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNetworks = () => {
    const token = getAccessToken();
    fetch(`http://localhost:8000/hosts/${hostId}/networks/`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json().then(data => ({ status: res.status, body: data })))
      .then(({ status, body }) => {
        if (status === 200) {
          setNetworks(body);
        } else {
          setError(body.message || 'Failed to fetch networks');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch networks');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchNetworks();
  }, [hostId]);

  const handleDelete = (networkId) => {
    const token = getAccessToken();
    fetch(`http://localhost:8000/networks/${networkId}/delete/`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => {
        if (res.status === 204) {
          // Refresh the network list
          fetchNetworks();
        } else {
          res.json().then(data => {
            alert(data.message || 'Failed to delete network');
          });
        }
      })
      .catch(() => alert('Delete request failed'));
  };

  if (loading) return <div>Loading networks...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Networks for Host {hostId}</h2>
      {networks.length === 0 ? (
        <p>No networks found for this host.</p>
      ) : (
        <table style={{ width: '80%' }}>
          <thead>
            <tr>
              <th style={{textAlign: 'left'}}>Name</th>
              <th style={{textAlign: 'left'}}>Driver</th>
              <th style={{textAlign: 'left'}}>Scope</th>
              <th style={{textAlign: 'left'}}>Internal</th>
              <th style={{textAlign: 'left'}}>Attachable</th>
              <th style={{textAlign: 'left'}}>Ingress</th>
              <th style={{textAlign: 'left'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {networks.map(net => (
              <tr key={net.id}>
                <td>{net.name}</td>
                <td>{net.driver}</td>
                <td>{net.scope}</td>
                <td>{net.internal ? 'Yes' : 'No'}</td>
                <td>{net.attachable ? 'Yes' : 'No'}</td>
                <td>{net.ingress ? 'Yes' : 'No'}</td>
                <td>
                  <button onClick={() => handleDelete(net.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
