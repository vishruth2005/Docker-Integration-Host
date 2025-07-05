import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setTokens } from '../utils/auth';
import { API_BASE_URL } from '../config';

export default function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'viewer',
  });

  const navigate = useNavigate();

  const handleChange = e =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    const res = await fetch(`${API_BASE_URL}/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const data = await res.json();
    if (res.ok) {
      setTokens(data.tokens);
      navigate('/home');
    } else {
      alert(data.detail || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#1a1a1a] via-[#2d2d2d] to-[#1a1a1a] flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl border border-white/10 p-8"
      >
        <h2 className="text-3xl font-bold text-white mb-8 text-center drop-shadow">
          Register
        </h2>
        <div className="mb-5">
          <label className="block text-white font-medium mb-2">Username</label>
          <input
            name="username"
            placeholder="Username"
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mb-5">
          <label className="block text-white font-medium mb-2">Email</label>
          <input
            name="email"
            placeholder="Email"
            type="email"
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mb-5">
          <label className="block text-white font-medium mb-2">Password</label>
          <input
            name="password"
            placeholder="Password"
            type="password"
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mb-8">
          <label className="block text-white font-medium mb-2">Role</label>
          <select
            name="role"
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.role}
          >
            <option className="text-black" value="viewer">Viewer</option>
            <option className="text-black" value="developer">Developer</option>
            <option className="text-black" value="admin">Admin</option>
          </select>
        </div>
        <button
          type="submit"
          className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow transition-all"
        >
          Register
        </button>
        <div className="mt-6 text-center">
          <span className="text-gray-400">Already have an account?</span>
          <button
            type="button"
            className="ml-2 text-blue-400 hover:underline"
            onClick={() => navigate('/login')}
          >
            Login
          </button>
        </div>
      </form>
    </div>
  );
}