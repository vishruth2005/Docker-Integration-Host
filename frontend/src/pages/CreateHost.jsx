import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAccessToken } from '../utils/auth';

export default function CreateHost() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    host_name: '',
    host_ip: '',
    docker_api_url: '',
    port: '2375',
    connection_protocol: 'tcp',
    auth_type: 'none',
    description: '',
    tls_cert: '',
    tls_key: '',
    tls_ca_cert: '',
    ssh_username: '',
    ssh_private_key: '',
    ssh_password: '',
    api_token: '',
    labels: '',
    operating_system: '',
    docker_version: '',
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    if (!formData.host_name || !formData.host_ip || !formData.port) {
      setError('Please fill in all required fields');
      return false;
    }

    if (formData.auth_type === 'tls' && (!formData.tls_cert || !formData.tls_key)) {
      setError('TLS authentication requires certificate and key');
      return false;
    }

    if (formData.auth_type === 'ssh' && (!formData.ssh_username || (!formData.ssh_private_key && !formData.ssh_password))) {
      setError('SSH authentication requires username and either private key or password');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    const token = getAccessToken();

    try {
      const response = await fetch('http://localhost:8000/hosts/create/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Docker host created successfully!');
        // Wait for 2 seconds to show success message before redirecting
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        switch (response.status) {
          case 400:
            setError(data.message || 'Could not connect to Docker host. Please check your configuration.');
            break;
          case 401:
            setError('Authentication failed. Please log in again.');
            navigate('/login');
            break;
          case 403:
            setError('You do not have permission to create Docker hosts.');
            break;
          default:
            setError(data.message || 'An error occurred while creating the host.');
        }
      }
    } catch (err) {
      setError('Network error or server is not responding');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h2>Create Docker Host</h2>
      
      {/* Success Message */}
      {success && (
        <div> {success} </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div> {error} </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Required Fields Section */}
        <div>
          <h3>Required Fields</h3>
          <div>
            <div>
              <label>Host Name</label>
              <input
                type="text"
                value={formData.host_name}
                onChange={(e) => setFormData({ ...formData, host_name: e.target.value })}
                required
              />
            </div>

            <div>
              <label>Host IP</label>
              <input
                type="text"
                value={formData.host_ip}
                onChange={(e) => setFormData({ ...formData, host_ip: e.target.value })}
                required
              />
            </div>

            <div>
                <label>Docker API URL</label>
                <input
                    type="text"
                    value={formData.docker_api_url}
                    onChange={(e) => setFormData({...formData, docker_api_url: e.target.value})}
                />
                </div>

            <div>
              <label>Port</label>
              <input
                type="number"
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                required
              />
            </div>

            <div>
              <label>Connection Protocol</label>
              <select
                value={formData.connection_protocol}
                onChange={(e) => setFormData({ ...formData, connection_protocol: e.target.value })}
              >
                <option value="tcp">TCP</option>
                <option value="unix">Unix Socket</option>
                <option value="ssh">SSH</option>
              </select>
            </div>
          </div>
        </div>

        {/* Authentication Section */}
        <div>
          <h3>Authentication</h3>
          <div>
            <div>
              <label>Authentication Type</label>
              <select
                value={formData.auth_type}
                onChange={(e) => setFormData({ ...formData, auth_type: e.target.value })}
              >
                <option value="none">None</option>
                <option value="tls">TLS</option>
                <option value="ssh">SSH</option>
              </select>
            </div>

            {formData.auth_type === 'tls' && (
              <>
                <div>
                  <label>TLS Certificate</label>
                  <textarea
                    value={formData.tls_cert}
                    onChange={(e) => setFormData({ ...formData, tls_cert: e.target.value })}
                    rows="3"
                  />
                </div>
                <div>
                  <label>TLS Key</label>
                  <textarea
                    value={formData.tls_key}
                    onChange={(e) => setFormData({ ...formData, tls_key: e.target.value })}
                    rows="3"
                  />
                </div>
                <div>
                  <label>CA Certificate</label>
                  <textarea
                    value={formData.tls_ca_cert}
                    onChange={(e) => setFormData({ ...formData, tls_ca_cert: e.target.value })}
                    rows="3"
                  />
                </div>
              </>
            )}

            {formData.auth_type === 'ssh' && (
              <>
                <div>
                  <label>SSH Username</label>
                  <input
                    type="text"
                    value={formData.ssh_username}
                    onChange={(e) => setFormData({ ...formData, ssh_username: e.target.value })}
                  />
                </div>
                <div>
                  <label>SSH Private Key</label>
                  <textarea
                    value={formData.ssh_private_key}
                    onChange={(e) => setFormData({ ...formData, ssh_private_key: e.target.value })}
                    rows="3"
                  />
                </div>
                <div>
                  <label>SSH Password</label>
                  <input
                    type="password"
                    value={formData.ssh_password}
                    onChange={(e) => setFormData({ ...formData, ssh_password: e.target.value })}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Optional Fields Section */}
        <div>
          <h3>Optional Details</h3>
          <div>
            <div>
              <label>Labels (comma-separated)</label>
              <input
                type="text"
                value={formData.labels}
                onChange={(e) => setFormData({ ...formData, labels: e.target.value })}
                placeholder="prod, web-server, etc."
              />
            </div>

            <div>
              <label>Operating System</label>
              <input
                type="text"
                value={formData.operating_system}
                onChange={(e) => setFormData({ ...formData, operating_system: e.target.value })}
                placeholder="Linux, Windows, etc."
              />
            </div>

            <div>
              <label>Docker Version</label>
              <input
                type="text"
                value={formData.docker_version}
                onChange={(e) => setFormData({ ...formData, docker_version: e.target.value })}
                placeholder="20.10.8"
              />
            </div>

            <div>
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="3"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div>
          <button
            type="button"
            onClick={() => navigate('/')}
            disabled={isSubmitting}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}>
            {isSubmitting ? (<>Creating...</>) : ('Create Host')}
          </button>
        </div>
      </form>
    </div>
  );
}
