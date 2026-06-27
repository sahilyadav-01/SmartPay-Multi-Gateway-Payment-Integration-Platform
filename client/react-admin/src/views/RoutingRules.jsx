import React, { useEffect, useState } from 'react';
import { api } from '../api/api';

export default function RoutingRules() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('ANY');
  const [minAmount, setMinAmount] = useState('0');
  const [maxAmount, setMaxAmount] = useState('');
  const [targetGateway, setTargetGateway] = useState('stripe');
  const [priority, setPriority] = useState('10');
  const [isActive, setIsActive] = useState(true);

  // Simulator state
  const [simAmount, setSimAmount] = useState('150');
  const [simCurrency, setSimCurrency] = useState('USD');
  const [simStripeStatus, setSimStripeStatus] = useState('online');
  const [simRazorpayStatus, setSimRazorpayStatus] = useState('online');
  const [simPaypalStatus, setSimPaypalStatus] = useState('online');
  const [simResult, setSimResult] = useState(null);
  const [simTrace, setSimTrace] = useState([]);
  const [simLoading, setSimLoading] = useState(false);

  const fetchRules = async () => {
    try {
      const res = await api.routing.list();
      if (res.success) {
        setRules(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load routing rules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleToggleActive = async (rule) => {
    try {
      const res = await api.routing.update(rule._id, { ...rule, isActive: !rule.isActive });
      if (res.success) {
        fetchRules();
      }
    } catch (err) {
      alert(err.message || 'Failed to toggle rule state');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this routing rule?')) return;
    try {
      const res = await api.routing.delete(id);
      if (res.success) {
        fetchRules();
      }
    } catch (err) {
      alert(err.message || 'Failed to delete routing rule');
    }
  };

  const handleEditClick = (rule) => {
    setEditingId(rule._id);
    setName(rule.name);
    setCurrency(rule.conditions.currency);
    setMinAmount(rule.conditions.minAmount.toString());
    setMaxAmount(rule.conditions.maxAmount === null || rule.conditions.maxAmount === undefined || rule.conditions.maxAmount === Infinity ? '' : rule.conditions.maxAmount.toString());
    setTargetGateway(rule.targetGateway);
    setPriority(rule.priority.toString());
    setIsActive(rule.isActive);
    setShowModal(true);
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setName('');
    setCurrency('ANY');
    setMinAmount('0');
    setMaxAmount('');
    setTargetGateway('stripe');
    setPriority('10');
    setIsActive(true);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name,
      conditions: {
        currency: currency.toUpperCase(),
        minAmount: parseFloat(minAmount || 0),
        maxAmount: maxAmount ? parseFloat(maxAmount) : Infinity
      },
      targetGateway,
      priority: parseInt(priority || 0),
      isActive
    };

    try {
      let res;
      if (editingId) {
        res = await api.routing.update(editingId, payload);
      } else {
        res = await api.routing.create(payload);
      }

      if (res.success) {
        alert(editingId ? 'Routing rule updated successfully' : 'Routing rule created successfully');
        setShowModal(false);
        fetchRules();
      }
    } catch (err) {
      alert(err.message || 'Action failed');
    }
  };

  const runSimulation = async () => {
    const amount = parseFloat(simAmount || 0);
    if (isNaN(amount) || amount < 0) return;

    try {
      setSimLoading(true);
      const statusOverrides = {
        stripe: simStripeStatus,
        razorpay: simRazorpayStatus,
        paypal: simPaypalStatus
      };

      const res = await api.routing.simulate(amount, simCurrency, statusOverrides);
      if (res.success) {
        setSimResult({
          gateway: res.data.gateway,
          matchedRule: res.data.trace.find(line => line.includes('MATCH FOUND') || line.includes('default currency routing')) || 'Default Fallback Policy'
        });
        setSimTrace(res.data.trace);
      }
    } catch (err) {
      console.error(err);
      setSimTrace([`[SIMULATOR ERROR] ${err.message}`]);
    } finally {
      setSimLoading(false);
    }
  };

  useEffect(() => {
    if (rules.length > 0) {
      runSimulation();
    }
  }, [simAmount, simCurrency, simStripeStatus, simRazorpayStatus, simPaypalStatus, rules]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* Simulation test sandbox */}
      <div className="glass-panel" style={{ padding: 20 }}>
        <h4 style={{ margin: '0 0 10px 0', color: 'var(--primary-color)' }}>Smart Router Simulator Playground</h4>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '0 0 15px 0' }}>
          Test transaction parameters, mock channel outages, and inspect the decision path of the routing engine.
        </p>

        <div style={{ display: 'flex', gap: 20, flexDirection: 'column' }}>
          {/* Controls row */}
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ margin: 0, width: 140 }}>
              <label className="form-label" style={{ fontSize: 11 }}>Simulated Amount</label>
              <input 
                type="number" 
                className="form-input" 
                value={simAmount} 
                onChange={(e) => setSimAmount(e.target.value)} 
                style={{ margin: 0 }}
              />
            </div>
            <div className="form-group" style={{ margin: 0, width: 100 }}>
              <label className="form-label" style={{ fontSize: 11 }}>Currency</label>
              <select 
                className="form-input" 
                value={simCurrency} 
                onChange={(e) => setSimCurrency(e.target.value)}
                style={{ margin: 0 }}
              >
                <option value="USD">USD</option>
                <option value="INR">INR</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>

            {/* Outage Simulators */}
            <div style={{ display: 'flex', gap: 15, background: 'rgba(255,255,255,0.02)', padding: '10px 15px', borderRadius: 8, border: '1px solid var(--border-color)', height: 'fit-content' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Stripe:</span>
                <select 
                  className="form-input" 
                  value={simStripeStatus} 
                  onChange={(e) => setSimStripeStatus(e.target.value)} 
                  style={{ margin: 0, padding: '4px 8px', fontSize: 12, width: 85 }}
                >
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Razorpay:</span>
                <select 
                  className="form-input" 
                  value={simRazorpayStatus} 
                  onChange={(e) => setSimRazorpayStatus(e.target.value)} 
                  style={{ margin: 0, padding: '4px 8px', fontSize: 12, width: 85 }}
                >
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>PayPal:</span>
                <select 
                  className="form-input" 
                  value={simPaypalStatus} 
                  onChange={(e) => setSimPaypalStatus(e.target.value)} 
                  style={{ margin: 0, padding: '4px 8px', fontSize: 12, width: 85 }}
                >
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                </select>
              </div>
            </div>

            {/* Target Display Card */}
            <div style={{ flex: 1, minWidth: 220, padding: '12px 18px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px dashed var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 10, color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>Target Gateway</span>
                <span style={{ fontSize: 18, fontWeight: 700, textTransform: 'capitalize', color: simResult?.gateway === 'stripe' ? 'var(--stripe-color, #635bff)' : simResult?.gateway === 'razorpay' ? 'var(--razorpay-color, #11b1ff)' : 'var(--paypal-color, #ffc439)' }}>
                  {simLoading ? 'Evaluating...' : simResult?.gateway || '-'}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 10, color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>Matching Decision</span>
                <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>
                  {simLoading ? 'Evaluating...' : simResult?.matchedRule?.replace('[SIMULATOR] MATCH FOUND: ', '').replace('[SIMULATOR] MATCH FOUND: Rule ', '') || 'No Match'}
                </span>
              </div>
            </div>
          </div>

          {/* Trace Console block */}
          <div>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 6, fontWeight: 600 }}>Routing Engine Decision Trace Logs</span>
            <div style={{ 
              background: 'rgba(0,0,0,0.5)', padding: 15, borderRadius: 8, 
              border: '1px solid var(--border-color)', fontFamily: 'monospace', 
              fontSize: 12, maxHeight: 180, overflowY: 'auto', display: 'flex', 
              flexDirection: 'column', gap: 6, color: '#e2e8f0', borderLeft: '3px solid var(--primary-color)'
            }}>
              {simTrace.length > 0 ? (
                simTrace.map((line, idx) => {
                  let color = '#cbd5e1';
                  if (line.includes('MATCH FOUND')) color = 'var(--success-color)';
                  else if (line.includes('WARNING')) color = '#fbbf24';
                  else if (line.includes('ERROR') || line.includes('OFFLINE')) color = 'var(--error-color)';
                  else if (line.includes('Failover SUCCESS')) color = '#34d399';
                  return (
                    <div key={idx} style={{ color }}>{line}</div>
                  );
                })
              ) : (
                <div style={{ color: 'var(--text-muted)' }}>Enter amount or toggle status options to generate logs...</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main rules grid */}
      <div className="glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0 }}>Smart Payment Gateway Rules</h3>
          <button onClick={handleOpenAddModal} className="btn">
            + Create Routing Rule
          </button>
        </div>

        {loading ? (
          <div>Loading routing policies...</div>
        ) : error ? (
          <div style={{ color: 'var(--error-color)' }}>{error}</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: 12 }}>Rule Name</th>
                <th style={{ padding: 12 }}>Currency Matching</th>
                <th style={{ padding: 12 }}>Amount Criteria</th>
                <th style={{ padding: 12 }}>Target Gateway</th>
                <th style={{ padding: 12 }}>Priority</th>
                <th style={{ padding: 12 }}>Status</th>
                <th style={{ padding: 12, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.length > 0 ? (
                rules.map((rule) => (
                  <tr key={rule._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: 12, fontWeight: 600 }}>{rule.name}</td>
                    <td style={{ padding: 12 }}>
                      <span className="stream-status-badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)' }}>
                        {rule.conditions.currency}
                      </span>
                    </td>
                    <td style={{ padding: 12 }}>
                      {rule.conditions.minAmount} to {rule.conditions.maxAmount === Infinity || rule.conditions.maxAmount === null || rule.conditions.maxAmount === undefined ? 'Max' : rule.conditions.maxAmount}
                    </td>
                    <td style={{ padding: 12, textTransform: 'capitalize', fontWeight: 600, color: rule.targetGateway === 'stripe' ? 'var(--stripe-color, #635bff)' : rule.targetGateway === 'razorpay' ? 'var(--razorpay-color, #11b1ff)' : 'var(--paypal-color, #ffc439)' }}>
                      {rule.targetGateway}
                    </td>
                    <td style={{ padding: 12 }}>{rule.priority}</td>
                    <td style={{ padding: 12 }}>
                      <span 
                        onClick={() => handleToggleActive(rule)}
                        className={`stream-status-badge badge-${rule.isActive ? 'success' : 'failed'}`}
                        style={{ cursor: 'pointer' }}
                      >
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: 12, textAlign: 'right' }}>
                      <button 
                        onClick={() => handleEditClick(rule)} 
                        className="btn btn-secondary" 
                        style={{ padding: '4px 8px', fontSize: 11, marginRight: 8 }}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(rule._id)} 
                        className="btn btn-secondary" 
                        style={{ padding: '4px 8px', fontSize: 11, color: 'var(--error-color)' }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
                    No routing rules configured. Default system policies apply.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Rules Modal Form */}
      {showModal && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: 500, padding: 30, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h3 style={{ margin: 0 }}>{editingId ? 'Edit Routing Rule' : 'Create Routing Rule'}</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              <div className="form-group">
                <label className="form-label">Rule Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="e.g. Stripe for USD checkouts" 
                  required 
                />
              </div>

              <div style={{ display: 'flex', gap: 15 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Currency Target</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={currency} 
                    onChange={(e) => setCurrency(e.target.value)} 
                    placeholder="e.g. USD, INR, ANY" 
                    required 
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Execution Priority</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={priority} 
                    onChange={(e) => setPriority(e.target.value)} 
                    placeholder="Lower numbers execute first" 
                    required 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 15 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Min Checkout Amount</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={minAmount} 
                    onChange={(e) => setMinAmount(e.target.value)} 
                    placeholder="0" 
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Max Checkout Amount</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={maxAmount} 
                    onChange={(e) => setMaxAmount(e.target.value)} 
                    placeholder="Infinity" 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Target Gateway</label>
                  <select 
                    className="form-input" 
                    value={targetGateway} 
                    onChange={(e) => setTargetGateway(e.target.value)}
                  >
                    <option value="stripe">Stripe</option>
                    <option value="razorpay">Razorpay</option>
                    <option value="paypal">PayPal</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, marginTop: 20 }}>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={isActive} 
                      onChange={() => setIsActive(!isActive)} 
                    />
                    <span className="slider"></span>
                  </label>
                  <span className="form-label" style={{ margin: 0 }}>Active State</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 10 }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn">
                  {editingId ? 'Save Changes' : 'Create Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
