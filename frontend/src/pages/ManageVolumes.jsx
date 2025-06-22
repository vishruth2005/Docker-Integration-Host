import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getAccessToken } from '../utils/auth';

export default function ManageVolumes() {
  const { host_id } = useParams();
  const [volumes, setVolumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchVolumes = () => {
    const token = getAccessToken();
    fetch(`http://localhost:8000/hosts/${host_id}/volumes/`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json().then(data => ({ status: res.status, body: data })))
      .then(({ status, body }) => {
        if (status === 200) {
          setVolumes(body);
        } else {
          setError(body.message || 'Failed to fetch volumes');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch volumes');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchVolumes();
  }, [host_id]);

  const handleDelete = (volume_id) => {
      const token = getAccessToken();
      fetch(`http://localhost:8000/volumes/${volume_id}/delete/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then(res => {
          if (res.status === 204) {
            // Refresh the volume list
            fetchVolumes();
          } else {
            res.json().then(data => {
              alert(data.message || 'Failed to delete volume');
            });
          }
        })
        .catch(() => alert('Delete request failed'));
    };

  if (loading) return <div>Loading volumes...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Docker Volumes for Host {host_id}</h2>

      {error && <div style={{ color: 'red' }}>{error}</div>}

      {volumes.length === 0 ? (
        <p>No volumes found for this host.</p>
      ) : (

      <table style={{ width: '80%' }}>
        <thead>
          <tr>
            <th style={{textAlign: 'left'}}>Name</th>
            <th style={{textAlign: 'left'}}>Driver</th>
            <th style={{textAlign: 'left'}}>Mountpoint</th>
            <th style={{textAlign: 'left'}}>Labels</th>
            <th style={{textAlign: 'left'}}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {volumes.map((vol) => (
            <tr key={vol.id}>
              <td>{vol.name}</td>
              <td>{vol.driver}</td>
              <td>{vol.mountpoint || '—'}</td>
              <td>{JSON.stringify(vol.labels || {})}</td>
              <td>
                <button onClick={() => handleDelete(vol.id)}>
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
