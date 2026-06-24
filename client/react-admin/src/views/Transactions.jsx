import React, { useEffect, useState } from 'react';
import { api } from '../api/api';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Refund processing modal state
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [activeTx, setActiveTx] = useState(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');

  const fetchTransactions = async () => {
    try {
      // Fetch from analytics stats recent logs
      const res = await api.analytics.getStats();
      if (res.success) {
        setTransactions(res.data.recentTransactions || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load transaction history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const openRefundModal = (tx) => {
    setActiveTx(tx);
    setRefundAmount(tx.amount.toString());
    setRefundReason('Customer return');
    setShowRefundModal(true);
  };

  const handleRefundSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      transactionId: activeTx.transactionId,
      amount: parseFloat(refundAmount),
      reason: refundReason
    };

    try {
      const res = await api.refunds.create(payload);
      if (res.success) {
        alert(res.message);
        setShowRefundModal(false);
        fetchTransactions();
      }
    } catch (err) {
      alert(err.message || 'Refund processing failed');
    }
  };

  return (
    <div className="glass-panel">
      <h3 style={{ marginBottom: 20 }}>Transaction Ledger</h3>

      {loading ? (
        <div>Loading transaction history...</div>
      ) : error ? (
        <div style={{ color: 'var(--error-color)' }}>{error}</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
              <th style={{ padding: 12 }}>Transaction ID</th>
              <th style={{ padding: 12 }}>Customer</th>
              <th style={{ padding: 12 }}>Gateway</th>
              <th style={{ padding: 12 }}>Amount</th>
              <th style={{ padding: 12 }}>Refunded</th>
              <th style={{ padding: 12 }}>Date</th>
              <th style={{ padding: 12 }}>Status</th>
              <th style={{ padding: 12, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length > 0 ? (
              transactions.map((tx) => (
                <tr key={tx._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                    {tx.transactionId}
                  </td>
                  <td style={{ padding: 12 }}>
                    <div>{tx.customerName || tx.userId?.name || 'Customer'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{tx.customerEmail || tx.userId?.email}</div>
                  </td>
                  <td style={{ padding: 12, textTransform: 'uppercase', fontSize: 12 }}>{tx.gateway}</td>
                  <td style={{ padding: 12, fontWeight: 600 }}>${tx.amount.toFixed(2)}</td>
                  <td style={{ padding: 12, color: tx.refundAmount > 0 ? 'var(--error-color)' : 'inherit' }}>
                    ${tx.refundAmount?.toFixed(2) || '0.00'}
                  </td>
                  <td style={{ padding: 12, fontSize: 13 }}>{new Date(tx.timestamp).toLocaleString()}</td>
                  <td style={{ padding: 12 }}>
                    <span className={`stream-status-badge badge-${tx.status}`}>
                      {tx.status}
                    </span>
                  </td>
                  <td style={{ padding: 12, textAlign: 'right' }}>
                    {tx.status !== 'refunded' && tx.status !== 'failed' ? (
                      <button 
                        onClick={() => openRefundModal(tx)} 
                        className="btn btn-secondary" 
                        style={{ padding: '6px 12px', fontSize: 12 }}
                      >
                        Refund
                      </button>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Locked</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No payment ledger found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {showRefundModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 100
        }}>
          <div className="glass-panel" style={{ width: 450, backgroundColor: 'var(--bg-surface-solid)' }}>
            <h3 style={{ marginBottom: 20 }}>Process Refund</h3>
            <form onSubmit={handleRefundSubmit}>
              <div className="form-group">
                <label className="form-label">Transaction ID</label>
                <input 
                  type="text" 
                  value={activeTx?.transactionId || ''} 
                  disabled 
                  className="form-input" 
                  style={{ opacity: 0.7 }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Refund Amount ($) (Max: ${(activeTx?.amount - (activeTx?.refundAmount || 0)).toFixed(2)})</label>
                <input 
                  type="number" 
                  step="0.01" 
                  max={activeTx?.amount - (activeTx?.refundAmount || 0)}
                  value={refundAmount} 
                  onChange={(e) => setRefundAmount(e.target.value)} 
                  className="form-input" 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Refund Reason</label>
                <input 
                  type="text" 
                  value={refundReason} 
                  onChange={(e) => setRefundReason(e.target.value)} 
                  className="form-input" 
                  required 
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
                <button type="button" onClick={() => setShowRefundModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-danger">
                  Initiate Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
