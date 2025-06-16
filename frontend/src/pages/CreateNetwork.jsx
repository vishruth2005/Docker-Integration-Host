import React, { useState } from 'react';
import { getAccessToken, logout } from '../utils/auth';
import { useNavigate, useParams } from 'react-router-dom';

export default function CreateNetwork() {
  const { hostId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    driver: 'bridge',
    scope: 'local',
    internal: false,
    attachable: false,
    ingress: false,
    host_id: hostId
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const token = getAccessToken();
    setError('');
    setSuccess('');
  
    fetch('http://localhost:8000/networks/create/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(form)
    })
      .then(res => res.json().then(data => ({ status: res.status, body: data })))
      .then(({ status, body }) => {
        if (status === 201) {
          // Optionally show a quick success message
          // setSuccess('Docker network created successfully');
          // Redirect to Home after short delay
          navigate('/');
        } else {
          setError(body.message || 'Failed to create network');
        }
      })
      .catch(() => setError('Network creation request failed'));
  };
  

  return (
    <div style={{ padding: '20px', maxWidth: '500px' }}>
      <h2>Create Docker Network</h2>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}

      <form onSubmit={handleSubmit}>
        <label>
          Network Name:
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
          />
        </label>
        <br /><br />

        <label>
          Driver:
          <select name="driver" value={form.driver} onChange={handleChange}>
            <option value="bridge">bridge</option>
            <option value="overlay">overlay</option>
            <option value="macvlan">macvlan</option>
            <option value="host">host</option>
            <option value="none">none</option>
          </select>
        </label>
        <br /><br />

        <label>
          Scope:
          <select name="scope" value={form.scope} onChange={handleChange}>
            <option value="local">local</option>
            <option value="global">global</option>
          </select>
        </label>
        <br /><br />

        <label>
          Host ID:
          <input type="text" value={hostId} disabled />
        </label>
        <br /><br />

        <label>
          <input
            type="checkbox"
            name="internal"
            checked={form.internal}
            onChange={handleChange}
          />
          Internal
        </label>
        <br />

        <label>
          <input
            type="checkbox"
            name="attachable"
            checked={form.attachable}
            onChange={handleChange}
          />
          Attachable
        </label>
        <br />

        <label>
          <input
            type="checkbox"
            name="ingress"
            checked={form.ingress}
            onChange={handleChange}
          />
          Ingress
        </label>
        <br /><br />

        <button type="submit">Create Network</button>
      </form>
    </div>
  );
}
