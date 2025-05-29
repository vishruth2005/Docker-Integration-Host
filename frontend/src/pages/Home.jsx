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
  const [message, setMessage] = useState('');
  const [role, setRole] = useState('');
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
      .then(data => setMessage(data.message))
      .catch(() => {
        logout();
        navigate('/login');
      });
  }, []);

  return (
    <div>
      <h2>Home</h2>
      <p><strong>Role:</strong> {role}</p>
      <p>{message}</p>
      <button onClick={() => { logout(); navigate('/login'); }}>
        Logout
      </button>
    </div>
  );
}
