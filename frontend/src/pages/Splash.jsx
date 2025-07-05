import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Splash() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-[#1a1a1a] via-[#23272f] to-[#1a1a1a]">
      {/* Animated background blobs */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-blue-700 opacity-30 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-cyan-400 opacity-20 rounded-full blur-3xl animate-pulse-slower" />
        <div className="absolute top-[30%] left-[60%] w-[30vw] h-[30vw] bg-indigo-500 opacity-20 rounded-full blur-2xl animate-pulse" />
      </div>
      {/* Main Card */}
      <div className="relative z-10 bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/10 px-12 py-14 flex flex-col items-center fade-in">
        {/* Logo */}
        <div className="mb-8 animate-fade-in">
          <img
            src="/docker-logo.png"
            alt="Docker Logo"
            className="w-28 h-28 mx-auto drop-shadow-xl"
            style={{ filter: 'drop-shadow(0 4px 24px #2563eb88)' }}
          />
        </div>
        {/* Title */}
        <h1 className="text-5xl font-extrabold text-white mb-3 text-center drop-shadow animate-fade-in">
          Docker Integration Host
        </h1>
        <p className="text-xl text-blue-200 mb-2 text-center font-semibold animate-fade-in">
          Unified Docker Management, Simplified
        </p>
        <p className="text-lg text-gray-300 mb-10 text-center max-w-lg animate-fade-in">
          Manage your Docker hosts, containers, networks, and volumes with a secure, modern interface. Fast, intuitive, and built for teams.
        </p>
        {/* Buttons */}
        <div className="flex gap-8 w-full justify-center animate-fade-in">
          <button
            className="px-10 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg text-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-400"
            onClick={() => navigate('/login')}
          >
            Login
          </button>
          <button
            className="px-10 py-4 rounded-xl bg-gray-700 hover:bg-gray-800 text-white font-bold shadow-lg text-lg transition-all focus:outline-none focus:ring-2 focus:ring-gray-400"
            onClick={() => navigate('/register')}
          >
            Register
          </button>
        </div>
      </div>
      <div className="mt-12 text-gray-500 text-sm z-10 animate-fade-in">
        &copy; {new Date().getFullYear()} Docker Integration Host
      </div>
      {/* Animations */}
      <style>{`
        .fade-in { animation: fadeIn 1.2s cubic-bezier(0.4,0,0.2,1) both; }
        .animate-fade-in { animation: fadeIn 1.6s cubic-bezier(0.4,0,0.2,1) both; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(32px); }
          to { opacity: 1; transform: none; }
        }
        .animate-pulse-slow { animation: pulse 8s cubic-bezier(0.4,0,0.6,1) infinite alternate; }
        .animate-pulse-slower { animation: pulse 14s cubic-bezier(0.4,0,0.6,1) infinite alternate; }
        @keyframes pulse {
          0% { opacity: 0.18; transform: scale(1); }
          100% { opacity: 0.32; transform: scale(1.12); }
        }
      `}</style>
    </div>
  );
}