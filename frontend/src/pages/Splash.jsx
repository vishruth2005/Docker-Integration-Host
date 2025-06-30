import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Splash() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-[#1a1a1a] via-[#2d2d2d] to-[#1a1a1a]">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl border border-white/10 p-10 flex flex-col items-center">
        {/* Logo */}
        <div className="mb-6">
          <img
            src="/docker-logo.png"
            alt="Docker Logo"
            className="w-24 h-24 mx-auto drop-shadow-lg"
            style={{ filter: 'drop-shadow(0 4px 16px #2563eb88)' }}
          />
        </div>
        {/* Title */}
        <h1 className="text-4xl font-extrabold text-white mb-4 text-center drop-shadow">
          Welcome to Docker Host Integration
        </h1>
        <p className="text-lg text-gray-300 mb-8 text-center max-w-md">
          Manage your Docker hosts, containers, networks, and volumes with a unified, secure interface.
        </p>
        {/* Buttons */}
        <div className="flex gap-6">
          <button
            className="px-8 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow transition-all text-lg"
            onClick={() => navigate('/login')}
          >
            Login
          </button>
          <button
            className="px-8 py-3 rounded-lg bg-gray-700 hover:bg-gray-800 text-white font-semibold shadow transition-all text-lg"
            onClick={() => navigate('/register')}
          >
            Register
          </button>
        </div>
      </div>
      <div className="mt-10 text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} Docker Integration Host
      </div>
    </div>
  );
}