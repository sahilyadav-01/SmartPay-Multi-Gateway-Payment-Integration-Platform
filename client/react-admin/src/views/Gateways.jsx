import React, { useEffect, useState } from 'react';
import { api } from '../api/api';

export default function Gateways() {
  const [gatewayHealth, setGatewayHealth] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchHealth = async () => {
    try {
      const res = await api.gateways.getHealthStatus();
      if (res.success) {
        setGatewayHealth(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch gateway health status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const handleToggleStatus = async (name, currentStatus) => {
    const nextStatus = currentStatus === 'online' ? 'offline' : 'online';
    try {
      setLoading(true);
      const res = await api.gateways.toggleHealthStatus(name, nextStatus);
      if (res.success) {
        fetchHealth();
        alert(`Gateway "${name}" set to ${nextStatus.toUpperCase()} successfully.`);
      }
    } catch (err) {
      alert(err.message || 'Failed to toggle status');
      setLoading(false);
    }
  };

  const getGatewayConfig = (name) => {
    const health = gatewayHealth.find(g => g.name === name);
    return {
      status: health?.status || 'online',
      latency: health?.latencyMs || 120,
      errorRate: health?.errorRate || 0,
    };
  };

  return (
    <div className="glass-panel" style={{ maxWidth: 850 }}>
      <h3 style={{ marginBottom: 20 }}>Payment Gateway Channels & Health Overrides</h3>
      
      {error && <div style={{ color: 'var(--error-color)', marginBottom: 20 }}>{error}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        {/* Stripe Configuration card */}
        {(() => {
          const config = getGatewayConfig('stripe');
          return (
            <div style={{ padding: 20, background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <h4 style={{ margin: 0, color: 'var(--stripe-color)', display: 'inline-block', marginRight: 10 }}>Stripe Integration</h4>
                  <span className={`stream-status-badge badge-${config.status === 'online' ? 'success' : 'failed'}`}>
                    {config.status === 'online' ? 'ONLINE / HEALTHY' : 'SIMULATED OUTAGE / DOWN'}
                  </span>
                </div>
                <button 
                  onClick={() => handleToggleStatus('stripe', config.status)}
                  className="btn btn-secondary" 
                  style={{ padding: '8px 12px', fontSize: 12, color: config.status === 'online' ? 'var(--error-color)' : 'var(--success-color)' }}
                  disabled={loading}
                >
                  {config.status === 'online' ? 'Simulate Outage / Set Down' : 'Restore Online / Healthy'}
                </button>
              </div>

              <div style={{ display: 'flex', gap: 20, marginBottom: 15, background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 8, fontSize: 13 }}>
                <div style={{ flex: 1 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Average Latency:</span>{' '}
                  <strong>{config.status === 'online' ? `${config.latency}ms` : 'Timeout'}</strong>
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Error Rate:</span>{' '}
                  <strong>{config.errorRate}%</strong>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Stripe Publishable Key</label>
                <input type="text" className="form-input" placeholder="pk_test_stripe_..." defaultValue="pk_test_stripe_51N3a4e9z8Fq012x" disabled />
              </div>
              <div className="form-group">
                <label className="form-label">Stripe Secret Key</label>
                <input type="password" className="form-input" placeholder="sk_test_stripe_..." defaultValue="••••••••••••••••••••••••••••••••" disabled />
              </div>
            </div>
          );
        })()}

        {/* Razorpay Configuration card */}
        {(() => {
          const config = getGatewayConfig('razorpay');
          return (
            <div style={{ padding: 20, background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <h4 style={{ margin: 0, color: 'var(--razorpay-color)', display: 'inline-block', marginRight: 10 }}>Razorpay (Primary India Route)</h4>
                  <span className={`stream-status-badge badge-${config.status === 'online' ? 'success' : 'failed'}`}>
                    {config.status === 'online' ? 'ONLINE / HEALTHY' : 'SIMULATED OUTAGE / DOWN'}
                  </span>
                </div>
                <button 
                  onClick={() => handleToggleStatus('razorpay', config.status)}
                  className="btn btn-secondary" 
                  style={{ padding: '8px 12px', fontSize: 12, color: config.status === 'online' ? 'var(--error-color)' : 'var(--success-color)' }}
                  disabled={loading}
                >
                  {config.status === 'online' ? 'Simulate Outage / Set Down' : 'Restore Online / Healthy'}
                </button>
              </div>

              <div style={{ display: 'flex', gap: 20, marginBottom: 15, background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 8, fontSize: 13 }}>
                <div style={{ flex: 1 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Average Latency:</span>{' '}
                  <strong>{config.status === 'online' ? `${config.latency}ms` : 'Timeout'}</strong>
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Error Rate:</span>{' '}
                  <strong>{config.errorRate}%</strong>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Razorpay Key ID</label>
                <input type="text" className="form-input" placeholder="rzp_test_..." defaultValue="rzp_test_key_51N3a4e9" disabled />
              </div>
              <div className="form-group">
                <label className="form-label">Razorpay Key Secret</label>
                <input type="password" className="form-input" placeholder="rzp_secret_..." defaultValue="••••••••••••••••••••••••" disabled />
              </div>
            </div>
          );
        })()}

        {/* PayPal Configuration card */}
        {(() => {
          const config = getGatewayConfig('paypal');
          return (
            <div style={{ padding: 20, background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <h4 style={{ margin: 0, color: 'var(--paypal-color)', display: 'inline-block', marginRight: 10 }}>PayPal Integration</h4>
                  <span className={`stream-status-badge badge-${config.status === 'online' ? 'success' : 'failed'}`}>
                    {config.status === 'online' ? 'ONLINE / HEALTHY' : 'SIMULATED OUTAGE / DOWN'}
                  </span>
                </div>
                <button 
                  onClick={() => handleToggleStatus('paypal', config.status)}
                  className="btn btn-secondary" 
                  style={{ padding: '8px 12px', fontSize: 12, color: config.status === 'online' ? 'var(--error-color)' : 'var(--success-color)' }}
                  disabled={loading}
                >
                  {config.status === 'online' ? 'Simulate Outage / Set Down' : 'Restore Online / Healthy'}
                </button>
              </div>

              <div style={{ display: 'flex', gap: 20, marginBottom: 15, background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 8, fontSize: 13 }}>
                <div style={{ flex: 1 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Average Latency:</span>{' '}
                  <strong>{config.status === 'online' ? `${config.latency}ms` : 'Timeout'}</strong>
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Error Rate:</span>{' '}
                  <strong>{config.errorRate}%</strong>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">PayPal Client ID</label>
                <input type="text" className="form-input" placeholder="paypal_client_id_..." defaultValue="paypal_client_id_placeholder" disabled />
              </div>
            </div>
          );
        })()}

      </div>
    </div>
  );
}
