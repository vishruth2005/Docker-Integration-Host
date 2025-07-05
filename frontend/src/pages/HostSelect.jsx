import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAccessToken, logout } from '../utils/auth';
import { API_BASE_URL } from '../config';

export default function HostSelect() {
    const { host_id } = useParams();  
    const navigate = useNavigate();
    const [host, setHost] = useState(null);
    const [hostStats, setHostStats] = useState({
        containers: 0,
        volumes: 0,
        networks: 0,
        images: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchHostDetails = async () => {
            const token = getAccessToken();
            try {
                const response = await fetch(`${API_BASE_URL}/hosts/${host_id}/details/`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.status === 401) {
                    navigate('/login');
                    return;
                }

                if (!response.ok) {
                    throw new Error('Failed to fetch host details');
                }

                const data = await response.json();
                setHost(data.host);
                setHostStats(data.stats || {
                    containers: 0,
                    volumes: 0,
                    networks: 0,
                    images: 0
                });
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchHostDetails();
    }, [host_id, navigate]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const managementOptions = [
        {
            title: 'Containers',
            description: 'Manage Docker containers',
            count: hostStats.containers,
            icon: (
                <svg style={{ width: '2.5rem', height: '2.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
            ),
            color: '#3b82f6',
            bgColor: 'rgba(59, 130, 246, 0.15)',
            borderColor: 'rgba(59, 130, 246, 0.3)',
            shadowColor: 'rgba(59, 130, 246, 0.5)',
            onClick: () => navigate(`/hosts/${host_id}/containers`)
        },
        {
            title: 'Volumes',
            description: 'Manage Docker volumes',
            count: hostStats.volumes,
            icon: (
                <svg style={{ width: '2.5rem', height: '2.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            ),
            color: '#10b981',
            bgColor: 'rgba(16, 185, 129, 0.15)',
            borderColor: 'rgba(16, 185, 129, 0.3)',
            shadowColor: 'rgba(16, 185, 129, 0.5)',
            onClick: () => navigate(`/hosts/${host_id}/volumes`)
        },
        {
            title: 'Networks',
            description: 'Manage Docker networks',
            count: hostStats.networks,
            icon: (
                <svg style={{ width: '2.5rem', height: '2.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                </svg>
            ),
            color: '#f59e0b',
            bgColor: 'rgba(245, 158, 11, 0.15)',
            borderColor: 'rgba(245, 158, 11, 0.3)',
            shadowColor: 'rgba(245, 158, 11, 0.5)',
            onClick: () => navigate(`/hosts/${host_id}/networks`)
        },
        {
            title: 'Images',
            description: 'Manage Docker images',
            count: hostStats.images,
            icon: (
                <svg style={{ width: '2.5rem', height: '2.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            ),
            color: '#06b6d4',
            bgColor: 'rgba(6, 182, 212, 0.15)',
            borderColor: 'rgba(6, 182, 212, 0.3)',
            shadowColor: 'rgba(6, 182, 212, 0.5)',
            onClick: () => navigate(`/hosts/${host_id}/images/`)
        }
    ];

    if (loading) return (
        <div style={{ 
            minHeight: '100vh', 
            width: '100vw',
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: 0,
            padding: 0,
            position: 'fixed',
            top: 0,
            left: 0
        }}>
            <div style={{ color: 'white', fontSize: '1.25rem' }}>Loading...</div>
        </div>
    );
    
    if (error) return (
        <div style={{ 
            minHeight: '100vh', 
            width: '100vw',
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: 0,
            padding: 0,
            position: 'fixed',
            top: 0,
            left: 0
        }}>
            <div style={{ color: '#f87171', fontSize: '1.25rem' }}>Error: {error}</div>
        </div>
    );
    
    if (!host) return (
        <div style={{ 
            minHeight: '100vh', 
            width: '100vw',
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: 0,
            padding: 0,
            position: 'fixed',
            top: 0,
            left: 0
        }}>
            <div style={{ color: 'white', fontSize: '1.25rem' }}>Host not found</div>
        </div>
    );

    return (
        <div style={{ 
            minHeight: '100vh', 
            width: '100vw',
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
            margin: 0,
            padding: 0,
            position: 'absolute',
            top: 0,
            left: 0,
            overflowY: 'auto'
        }}>
            {/* Header */}
            <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', zIndex: 10 }}>
                    <button
                        onClick={() => navigate('/home')}
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#6b7280',
                            color: 'white',
                            borderRadius: '0.75rem',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '0.875rem',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#4b5563';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 6px 8px -1px rgba(0, 0, 0, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#6b7280';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                        }}
                    >
                        <svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back
                    </button>
                </div>
                <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 10 }}>
                    <button
                        onClick={handleLogout}
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
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#b91c1c';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 6px 8px -1px rgba(0, 0, 0, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#dc2626';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                        }}
                    >
                        Logout
                    </button>
                </div>
                
                {/* Host Info Section */}
                <div style={{ paddingTop: '3rem', paddingBottom: '3rem', paddingLeft: '2rem', paddingRight: '2rem' }}>
                    <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
                        <div style={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.08)', 
                            backdropFilter: 'blur(12px)',
                            borderRadius: '1.5rem',
                            padding: '3rem',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                            textAlign: 'left'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                <div>
                                    <h1 style={{ 
                                        fontSize: '3rem', 
                                        fontWeight: '700', 
                                        color: 'white', 
                                        marginBottom: '1rem',
                                        textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                                    }}>
                                        {host.host_name}
                                    </h1>
                                    {host.description && (
                                        <p style={{ 
                                            color: '#9ca3af', 
                                            fontSize: '1.125rem', 
                                            maxWidth: '40rem',
                                            lineHeight: '1.6',
                                            marginBottom: '1.5rem'
                                        }}>
                                            {host.description}
                                        </p>
                                    )}
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                        <div style={{ 
                                            width: '1rem', 
                                            height: '1rem', 
                                            backgroundColor: '#10b981', 
                                            borderRadius: '50%',
                                            boxShadow: '0 0 8px rgba(16, 185, 129, 0.5)',
                                            animation: 'pulse 2s infinite'
                                        }}></div>
                                        <span style={{ color: '#10b981', fontWeight: '600', fontSize: '1rem' }}>Connected</span>
                                    </div>
                                    <span style={{ color: '#d1d5db', fontSize: '1.25rem', fontWeight: '500' }}>
                                        {host.host_ip}
                                    </span>
                                </div>
                            </div>

                            {/* Stats Overview */}
                            <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                                gap: '1.5rem',
                                marginTop: '2rem'
                            }}>
                                <div style={{ 
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                    borderRadius: '1rem',
                                    padding: '1.5rem',
                                    border: '1px solid rgba(255, 255, 255, 0.1)'
                                }}>
                                    <div style={{ fontSize: '2rem', fontWeight: '700', color: '#3b82f6', marginBottom: '0.5rem' }}>
                                        {hostStats.containers}
                                    </div>
                                    <div style={{ color: '#9ca3af', fontSize: '0.875rem', fontWeight: '500' }}>
                                        Containers
                                    </div>
                                </div>
                                <div style={{ 
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                    borderRadius: '1rem',
                                    padding: '1.5rem',
                                    border: '1px solid rgba(255, 255, 255, 0.1)'
                                }}>
                                    <div style={{ fontSize: '2rem', fontWeight: '700', color: '#10b981', marginBottom: '0.5rem' }}>
                                        {hostStats.volumes}
                                    </div>
                                    <div style={{ color: '#9ca3af', fontSize: '0.875rem', fontWeight: '500' }}>
                                        Volumes
                                    </div>
                                </div>
                                <div style={{ 
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                    borderRadius: '1rem',
                                    padding: '1.5rem',
                                    border: '1px solid rgba(255, 255, 255, 0.1)'
                                }}>
                                    <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f59e0b', marginBottom: '0.5rem' }}>
                                        {hostStats.networks}
                                    </div>
                                    <div style={{ color: '#9ca3af', fontSize: '0.875rem', fontWeight: '500' }}>
                                        Networks
                                    </div>
                                </div>
                                <div style={{ 
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                    borderRadius: '1rem',
                                    padding: '1.5rem',
                                    border: '1px solid rgba(255, 255, 255, 0.1)'
                                }}>
                                    <div style={{ fontSize: '2rem', fontWeight: '700', color: '#06b6d4', marginBottom: '0.5rem' }}>
                                        {hostStats.images}
                                    </div>
                                    <div style={{ color: '#9ca3af', fontSize: '0.875rem', fontWeight: '500' }}>
                                        Images
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Management Options Section */}
            <div style={{ paddingLeft: '2rem', paddingRight: '2rem', paddingBottom: '3rem' }}>
                <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
                    <h2 style={{ 
                        fontSize: '2rem', 
                        fontWeight: '700', 
                        color: 'white', 
                        textAlign: 'center',
                        marginBottom: '3rem',
                        textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)' 
                    }}>
                        Manage Docker Resources
                    </h2>
                    
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '1.5rem',
                        maxWidth: '80rem',
                        margin: '0 auto'
                    }}>
                        {managementOptions.map((option, index) => (
                            <div
                                key={index}
                                style={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                                    backdropFilter: 'blur(12px)',
                                    borderRadius: '1rem',
                                    padding: '1.75rem',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                    textAlign: 'center'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = `0 8px 16px -1px rgba(0, 0, 0, 0.2), 0 0 12px ${option.shadowColor}`;
                                    e.currentTarget.style.borderColor = option.borderColor;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                                }}
                                onClick={option.onClick}
                            >
                                <div style={{ 
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '3rem',
                                    height: '3rem',
                                    backgroundColor: option.bgColor,
                                    borderRadius: '0.75rem',
                                    marginBottom: '1rem',
                                    color: option.color,
                                    border: `1px solid ${option.borderColor}`
                                }}>
                                    <div style={{ transform: 'scale(0.8)' }}>
                                        {option.icon}
                                    </div>
                                </div>
                                
                                <h3 style={{ 
                                    fontSize: '1.25rem', 
                                    fontWeight: '600', 
                                    color: 'white', 
                                    marginBottom: '0.5rem',
                                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                                }}>
                                    {option.title}
                                </h3>
                                
                                <p style={{ 
                                    fontSize: '0.875rem', 
                                    color: '#9ca3af',
                                    marginBottom: '1rem',
                                    fontWeight: '500'
                                }}>
                                    {option.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}