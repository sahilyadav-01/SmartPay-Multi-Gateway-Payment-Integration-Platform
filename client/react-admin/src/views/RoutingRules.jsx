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
  const [simResult, setSimResult] = useState(null);

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

  const runSimulation = () => {
    const amount = parseFloat(simAmount || 0);
    const curr = simCurrency.toUpperCase();
    
    // Evaluate simulation frontend-side based on the current fetched rules
    const activeRules = rules.filter(r => r.isActive).sort((a, b) => a.priority - b.priority);
    let matchedRule = null;
    let gateway = '';

    for (const rule of activeRules) {
      const { currency: targetCurrency, minAmount: ruleMin, maxAmount: ruleMax } = rule.conditions;
      const currencyMatch = targetCurrency === 'ANY' || targetCurrency === curr;
      const amountMatch = amount >= ruleMin && amount <= (ruleMax === null || ruleMax === undefined ? Infinity : ruleMax);

      if (currencyMatch && amountMatch) {
        matchedRule = rule;
        gateway = rule.targetGateway;
        break;
      }
    }

    if (!gateway) {
      gateway = curr === 'INR' ? 'razorpay' : 'stripe';
    }

    setSimResult({
      gateway,
      matchedRule: matchedRule ? matchedRule.name : 'Default Fallback Policy',
      priority: matchedRule ? matchedRule.priority : 'N/A'
    });
  };

  useEffect(() => {
    if (rules.length > 0) {
      runSimulation();
    }
  }, [simAmount, simCurrency, rules]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* Simulation test sandbox */}
      <div className="glass-panel" style={{ padding: 20 }}>
        <h4 style={{ margin: '0 0 10px 0', color: 'var(--primary-color)' }}>Smart Router Simulator Sandbox</h4>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '0 0 15px 0' }}>
          Test transaction inputs to inspect the gateway decision computed by the routing policy.
        </p>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ margin: 0, minWidth: 150 }}>
            <label className="form-label" style={{ fontSize: 11 }}>Simulated Amount</label>
            <input 
              type="number" 
              className="form-input" 
              value={simAmount} 
              onChange={(e) => setSimAmount(e.target.value)} 
            />
          </div>
          <div className="form-group" style={{ margin: 0, minWidth: 150 }}>
            <label className="form-label" style={{ fontSize: 11 }}>Currency</label>
            <select 
              className="form-input" 
              value={simCurrency} 
              onChange={(e) => setSimCurrency(e.target.value)}
            >
              <option value="USD">USD</option>
              <option value="INR">INR</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 200, padding: 15, background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px dashed var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Target Gateway</span>
              <span style={{ fontSize: 18, fontWeight: 700, textTransform: 'capitalize', color: simResult?.gateway === 'stripe' ? 'var(--stripe-color, #635bff)' : simResult?.gateway === 'razorpay' ? 'var(--razorpay-color, #11b1ff)' : 'var(--paypal-color, #ffc439)' }}>
                {simResult?.gateway}
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Matching Rule</span>
              <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>
                {simResult?.matchedRule} {simResult?.priority !== 'N/A' && `(Priority: ${simResult?.priority})`}
              </span>
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
