import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAccessToken } from '../utils/auth';

export default function HostDetail() {
    const { host_id } = useParams();  
    const navigate = useNavigate();
    const [host, setHost] = useState(null);
    const [containers, setContainers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchHostDetails = async () => {
            const token = getAccessToken();
            try {
                const response = await fetch(`http://localhost:8000/hosts/${host_id}/containers/`, {
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
                setContainers(data.containers);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchHostDetails();
    }, [host_id, navigate]);  

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!host) return <div>Host not found</div>;

    return (
        <div>
            <div>
                <h2>Host Details</h2>
                <div>
                    <div>
                        <div>
                            <h3>Name</h3>
                            <p>{host.host_name}</p>
                        </div>
                        <div>
                            <h3>IP Address</h3>
                            <p>{host.host_ip}</p>
                        </div>
                        <div>
                            <h3>Status</h3>
                            <p>{host.status}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <h2>Containers</h2>
                <div>
                    <table style={{width: '60%'}}>
                        <thead>
                            <tr>
                            <th style={{textAlign: 'left'}}>Name</th>
                            <th style={{textAlign: 'left'}}>Image</th>
                            <th style={{textAlign: 'left'}}>Status</th>
                            <th style={{textAlign: 'left'}}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {containers.map((container) => (
                            <tr key={container.id}>
                                <td>
                                    <div>{container.name}</div>
                                    <div>{container.id}</div>
                                </td>
                                <td>{container.image}</td>
                                <td>
                                    <span>{container.status}</span>
                                </td>
                                <td>
                                    <button onClick={() => navigate(`/${host.id}/${container.container_id}`)}>
                                        View Details
                                    </button>
                                </td>
                            </tr>
                            ))}
                        </tbody>        
                    </table>
                </div>
            </div>
        </div>
    );
}