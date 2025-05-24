// src/pages/Home.jsx
import React, { useEffect, useState } from 'react';
import { getAccessToken, logout } from '../utils/auth';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      navigate('/login');
      return;
    }

    fetch('http://localhost:8000/', {
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
      <p>{message}</p>
      <button onClick={() => { logout(); navigate('/login'); }}>
        Logout
      </button>
    </div>
  );
}
