import React, { useEffect, useState } from 'react';
import { api } from '../api/api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const res = await api.analytics.getStats();
        if (res.success) {
          setStats(res.data);
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  if (loading) return <div style={{ padding: 20 }}>Loading analytics dashboard data...</div>;
  if (error) return <div style={{ padding: 20, color: 'var(--error-color)' }}>Error: {error}</div>;

  const { summary, gatewaySplit, recentTransactions } = stats || {};

  return (
    <div>
      <div className="stats-grid">
        <div className="glass-panel stat-card">
          <div className="stat-header">
            <span className="stat-label">Total Volume</span>
            <div className="stat-icon-wrapper">
              <span style={{ fontSize: 16 }}>💰</span>
            </div>
          </div>
          <div className="stat-value-container">
            <span className="stat-value">${summary?.totalRevenue?.toFixed(2) || '0.00'}</span>
            <span className="stat-trend trend-up">
              ↑ 12.4%
            </span>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-header">
            <span className="stat-label">Success Rate</span>
            <div className="stat-icon-wrapper">
              <span style={{ fontSize: 16 }}>⚡</span>
            </div>
          </div>
          <div className="stat-value-container">
            <span className="stat-value">{summary?.successRate || 100}%</span>
            <span className="stat-trend trend-up">
              ↑ 0.8%
            </span>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-header">
            <span className="stat-label">Active Subscriptions</span>
            <div className="stat-icon-wrapper">
              <span style={{ fontSize: 16 }}>🔄</span>
            </div>
          </div>
          <div className="stat-value-container">
            <span className="stat-value">{summary?.activeSubscriptions || 0}</span>
            <span className="stat-trend trend-up" style={{ color: 'var(--text-secondary)' }}>Active</span>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-header">
            <span className="stat-label">Refund Amount</span>
            <div className="stat-icon-wrapper">
              <span style={{ fontSize: 16 }}>⏪</span>
            </div>
          </div>
          <div className="stat-value-container">
            <span className="stat-value">${summary?.totalRefund?.toFixed(2) || '0.00'}</span>
            <span className="stat-trend trend-down">
              ↓ ${(summary?.totalRefund || 0) > 0 ? 'Active' : '0.00'}
            </span>
          </div>
        </div>
      </div>

      <div className="dashboard-layout-grid">
        {/* Dynamic Chart */}
        <div className="glass-panel">
          <div className="chart-header">
            <h3 className="panel-subtitle">Gateway Revenue Share</h3>
            <div className="chart-legends">
              <div className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: 'var(--stripe-color)' }}></span>
                Stripe: ${gatewaySplit?.stripe?.toFixed(2) || '0.00'}
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: 'var(--razorpay-color)' }}></span>
                Razorpay: ${gatewaySplit?.razorpay?.toFixed(2) || '0.00'}
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: 'var(--paypal-color)' }}></span>
                PayPal: ${gatewaySplit?.paypal?.toFixed(2) || '0.00'}
              </div>
            </div>
          </div>
          <div className="chart-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Visual HTML SVG representation of gateway volume */}
            <svg className="svg-chart" viewBox="0 0 800 250">
              <rect x="50" y="50" width="150" height="150" fill="var(--stripe-color)" opacity="0.8" rx="8" />
              <rect x="250" y="50" width="150" height="150" fill="var(--razorpay-color)" opacity="0.8" rx="8" />
              <rect x="450" y="50" width="150" height="150" fill="var(--paypal-color)" opacity="0.8" rx="8" />
              
              <text x="125" y="130" fill="white" fontSize="16" fontWeight="bold" textAnchor="middle">Stripe</text>
              <text x="125" y="160" fill="white" fontSize="14" textAnchor="middle">${gatewaySplit?.stripe || 0}</text>
              
              <text x="325" y="130" fill="white" fontSize="16" fontWeight="bold" textAnchor="middle">Razorpay</text>
              <text x="325" y="160" fill="white" fontSize="14" textAnchor="middle">${gatewaySplit?.razorpay || 0}</text>

              <text x="525" y="130" fill="white" fontSize="16" fontWeight="bold" textAnchor="middle">PayPal</text>
              <text x="525" y="160" fill="white" fontSize="14" textAnchor="middle">${gatewaySplit?.paypal || 0}</text>
            </svg>
          </div>
        </div>

        {/* Live Ticker Feed */}
        <div className="glass-panel stream-panel">
          <div className="stream-title">
            Recent Payments
            <div className="pulse-circle"></div>
          </div>
          <ul className="stream-items" style={{ margin: 0, padding: 0 }}>
            {recentTransactions && recentTransactions.length > 0 ? (
              recentTransactions.map((tx) => (
                <li key={tx._id} className="stream-item">
                  <div className="stream-customer-details">
                    <div 
                      className="stream-gateway-badge" 
                      style={{ 
                        backgroundColor: 
                          tx.gateway === 'stripe' ? 'var(--stripe-color)' :
                          tx.gateway === 'razorpay' ? 'var(--razorpay-color)' : 
                          'var(--paypal-color)',
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 'bold'
                      }}
                    >
                      {tx.gateway.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="stream-name">{tx.customerName || tx.userId?.name || 'Customer'}</div>
                      <div className="stream-meta">{new Date(tx.timestamp).toLocaleTimeString()} • {tx.transactionId.substring(0, 12)}...</div>
                    </div>
                  </div>
                  <div className="stream-amount-info">
                    <div className="stream-amount">${tx.amount.toFixed(2)}</div>
                    <span className={`stream-status-badge badge-${tx.status}`}>
                      {tx.status}
                    </span>
                  </div>
                </li>
              ))
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', marginTop: 50 }}>
                No recent transactions processed.
              </div>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
