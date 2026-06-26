import React, { useEffect, useState } from 'react';
import { api } from '../api/api';

export default function WebhookLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPayload, setSelectedPayload] = useState(null);
  const [retryStates, setRetryStates] = useState({}); // tracking retries per log ID

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.webhooks.getLogs();
      if (res.success) {
        setLogs(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch webhook logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleRetry = async (id) => {
    try {
      setRetryStates(prev => ({ ...prev, [id]: true }));
      const res = await api.webhooks.retryWebhook(id);
      if (res.success) {
        alert('Webhook event re-processed successfully!');
        fetchLogs();
      }
    } catch (err) {
      alert(err.message || 'Failed to retry webhook');
      fetchLogs();
    } finally {
      setRetryStates(prev => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div className="glass-panel" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ margin: 0 }}>Webhook Event Logs & Retry Audit</h3>
        <button onClick={fetchLogs} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: 13 }} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh Logs'}
        </button>
      </div>

      {error && (
        <div style={{ color: 'var(--error-color)', padding: 10, background: 'rgba(239,68,68,0.1)', borderRadius: 8, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {loading && logs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>Loading webhook logs...</div>
      ) : logs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>No webhook events recorded yet.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: 12 }}>Time</th>
                <th style={{ padding: 12 }}>Gateway</th>
                <th style={{ padding: 12 }}>Event Type</th>
                <th style={{ padding: 12 }}>Status</th>
                <th style={{ padding: 12 }}>Error Details</th>
                <th style={{ padding: 12 }}>Retries</th>
                <th style={{ padding: 12, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const isRetrying = retryStates[log._id];
                return (
                  <tr key={log._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: 12, whiteSpace: 'nowrap' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td style={{ padding: 12, textTransform: 'capitalize', fontWeight: 600 }}>
                      <span style={{ color: log.gateway === 'stripe' ? 'var(--stripe-color)' : log.gateway === 'razorpay' ? 'var(--razorpay-color)' : 'var(--paypal-color)' }}>
                        {log.gateway}
                      </span>
                    </td>
                    <td style={{ padding: 12, fontFamily: 'monospace', fontSize: 12 }}>
                      {log.eventType}
                    </td>
                    <td style={{ padding: 12 }}>
                      <span className={`stream-status-badge badge-${log.status === 'processed' ? 'success' : log.status === 'failed' ? 'failed' : 'warning'}`}>
                        {log.status}
                      </span>
                    </td>
                    <td style={{ padding: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)', fontSize: 13 }}>
                      {log.errorMessage || '-'}
                    </td>
                    <td style={{ padding: 12, textAlign: 'center' }}>
                      {log.retriesCount}
                    </td>
                    <td style={{ padding: 12, textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => setSelectedPayload(log.payload)}
                          className="btn btn-secondary" 
                          style={{ padding: '4px 8px', fontSize: 11 }}
                        >
                          Payload
                        </button>
                        <button 
                          onClick={() => handleRetry(log._id)}
                          className="btn" 
                          style={{ 
                            padding: '4px 8px', 
                            fontSize: 11, 
                            background: log.status === 'processed' ? 'rgba(255,255,255,0.05)' : 'var(--primary-color)',
                            color: log.status === 'processed' ? 'var(--text-secondary)' : 'white' 
                          }}
                          disabled={isRetrying}
                        >
                          {isRetrying ? 'Retrying...' : 'Retry'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Payload Modal */}
      {selectedPayload && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
          background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', 
          alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)'
        }}>
          <div className="glass-panel" style={{ width: 600, maxHeight: '80vh', overflowY: 'auto', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
              <h4 style={{ margin: 0 }}>Webhook Raw Payload</h4>
              <button 
                onClick={() => setSelectedPayload(null)} 
                className="btn btn-secondary" 
                style={{ padding: '4px 8px', fontSize: 12 }}
              >
                Close
              </button>
            </div>
            <pre style={{
              background: 'rgba(0,0,0,0.4)', padding: 15, borderRadius: 8, 
              border: '1px solid var(--border-color)', overflowX: 'auto', 
              fontSize: 12, color: '#a78bfa', fontFamily: 'monospace'
            }}>
              {JSON.stringify(selectedPayload, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
