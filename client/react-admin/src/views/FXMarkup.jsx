import React, { useEffect, useState } from 'react';
import { api } from '../api/api';

export default function FXMarkup() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [baseCurrency, setBaseCurrency] = useState('USD');
  const [targetCurrency, setTargetCurrency] = useState('INR');
  const [exchangeRate, setExchangeRate] = useState('');
  const [markupPercentage, setMarkupPercentage] = useState('0');
  const [isActive, setIsActive] = useState(true);

  // Converter playground state
  const [playAmount, setPlayAmount] = useState('100');
  const [playTargetCurrency, setPlayTargetCurrency] = useState('INR');
  const [conversionResult, setConversionResult] = useState(null);

  const fetchConfigs = async () => {
    try {
      const res = await api.fx.list();
      if (res.success) {
        setConfigs(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load FX configurations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleToggleActive = async (config) => {
    try {
      const res = await api.fx.update(config._id, { ...config, isActive: !config.isActive });
      if (res.success) {
        fetchConfigs();
      }
    } catch (err) {
      alert(err.message || 'Failed to toggle configuration state');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this FX configuration?')) return;
    try {
      const res = await api.fx.delete(id);
      if (res.success) {
        fetchConfigs();
      }
    } catch (err) {
      alert(err.message || 'Failed to delete FX configuration');
    }
  };

  const handleEditClick = (config) => {
    setEditingId(config._id);
    setBaseCurrency(config.baseCurrency);
    setTargetCurrency(config.targetCurrency);
    setExchangeRate(config.exchangeRate.toString());
    setMarkupPercentage(config.markupPercentage.toString());
    setIsActive(config.isActive);
    setShowModal(true);
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setBaseCurrency('USD');
    setTargetCurrency('INR');
    setExchangeRate('');
    setMarkupPercentage('0.0');
    setIsActive(true);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      baseCurrency: baseCurrency.toUpperCase(),
      targetCurrency: targetCurrency.toUpperCase(),
      exchangeRate: parseFloat(exchangeRate),
      markupPercentage: parseFloat(markupPercentage || 0),
      isActive
    };

    try {
      let res;
      if (editingId) {
        res = await api.fx.update(editingId, payload);
      } else {
        res = await api.fx.create(payload);
      }

      if (res.success) {
        alert(editingId ? 'FX configuration updated successfully' : 'FX configuration created successfully');
        setShowModal(false);
        fetchConfigs();
      }
    } catch (err) {
      alert(err.message || 'Action failed');
    }
  };

  // Dynamic simulation playground calculation
  useEffect(() => {
    const amount = parseFloat(playAmount || 0);
    if (isNaN(amount) || amount < 0) {
      setConversionResult(null);
      return;
    }

    const matchedConfig = configs.find(
      c => c.baseCurrency === 'USD' && c.targetCurrency === playTargetCurrency && c.isActive
    );

    if (playTargetCurrency === 'USD') {
      setConversionResult({
        exchangeRate: 1,
        markupPercentage: 0,
        markupFee: 0,
        convertedTotal: amount,
        finalTotal: amount,
        isConverted: false,
        msg: 'Same base currency, no FX conversion required.'
      });
    } else if (matchedConfig) {
      const converted = amount * matchedConfig.exchangeRate;
      const fee = converted * (matchedConfig.markupPercentage / 100);
      setConversionResult({
        exchangeRate: matchedConfig.exchangeRate,
        markupPercentage: matchedConfig.markupPercentage,
        markupFee: parseFloat(fee.toFixed(2)),
        convertedTotal: parseFloat(converted.toFixed(2)),
        finalTotal: parseFloat((converted + fee).toFixed(2)),
        isConverted: true,
        msg: `Found active FX rules for USD ➔ ${playTargetCurrency}.`
      });
    } else {
      setConversionResult({
        error: true,
        msg: `No active FX rule found for USD ➔ ${playTargetCurrency}. Checkout transactions will be rejected.`
      });
    }
  }, [playAmount, playTargetCurrency, configs]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* Interactive FX Converter Playground */}
      <div className="glass-panel" style={{ padding: 20 }}>
        <h4 style={{ margin: '0 0 10px 0', color: 'var(--primary-color)' }}>Profit Markup & FX Converter Playground</h4>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '0 0 15px 0' }}>
          Simulate foreign exchange transactions, view calculated platform markups, and verify checkout totals.
        </p>

        <div style={{ display: 'flex', gap: 20, flexDirection: 'column' }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ margin: 0, width: 150 }}>
              <label className="form-label" style={{ fontSize: 11 }}>USD Base Amount</label>
              <input 
                type="number" 
                className="form-input" 
                value={playAmount} 
                onChange={(e) => setPlayAmount(e.target.value)} 
                style={{ margin: 0 }}
              />
            </div>
            <div className="form-group" style={{ margin: 0, width: 140 }}>
              <label className="form-label" style={{ fontSize: 11 }}>Checkout Target Currency</label>
              <select 
                className="form-input" 
                value={playTargetCurrency} 
                onChange={(e) => setPlayTargetCurrency(e.target.value)}
                style={{ margin: 0 }}
              >
                <option value="USD">USD</option>
                <option value="INR">INR</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>

            {/* Target Display Card */}
            <div style={{ flex: 1, minWidth: 320, padding: '12px 18px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px dashed var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 10, color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>Calculated Total</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: conversionResult?.error ? 'var(--error-color)' : 'var(--success-color)' }}>
                  {conversionResult?.error ? 'Calculation Error' : `${conversionResult?.finalTotal} ${playTargetCurrency}`}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 10, color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>Profit Markup Fee</span>
                <span style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 600 }}>
                  {conversionResult?.error ? '-' : `${conversionResult?.markupFee} ${playTargetCurrency} (${conversionResult?.markupPercentage}%)`}
                </span>
              </div>
            </div>
          </div>

          {/* Trace calculations block */}
          <div>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 6, fontWeight: 600 }}>FX Converter Match Status & Audit Logs</span>
            <div style={{ 
              background: 'rgba(0,0,0,0.5)', padding: 15, borderRadius: 8, 
              border: '1px solid var(--border-color)', fontFamily: 'monospace', 
              fontSize: 12, display: 'flex', flexDirection: 'column', gap: 6, color: '#e2e8f0', 
              borderLeft: `3px solid ${conversionResult?.error ? 'var(--error-color)' : 'var(--primary-color)'}`
            }}>
              {conversionResult ? (
                <>
                  <div style={{ color: conversionResult.error ? 'var(--error-color)' : 'var(--success-color)', fontWeight: 600 }}>
                    {conversionResult.msg}
                  </div>
                  {!conversionResult.error && conversionResult.isConverted && (
                    <>
                      <div>[CALC] Cart total in USD: ${parseFloat(playAmount).toFixed(2)} USD</div>
                      <div>[CALC] Exchange Rate: 1 USD = {conversionResult.exchangeRate} {playTargetCurrency}</div>
                      <div>[CALC] Raw Converted Amount: {conversionResult.convertedTotal} {playTargetCurrency}</div>
                      <div>[CALC] Platform Profit Markup Fee: {conversionResult.markupFee} {playTargetCurrency} ({conversionResult.markupPercentage}%)</div>
                      <div>[CALC] Final Order Amount Charged: {conversionResult.finalTotal} {playTargetCurrency}</div>
                    </>
                  )}
                </>
              ) : (
                <div style={{ color: 'var(--text-muted)' }}>Enter amount to view simulation details...</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Configurations table */}
      <div className="glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0 }}>FX Markup & Conversion Configurations</h3>
          <button onClick={handleOpenAddModal} className="btn">
            + Define FX Config
          </button>
        </div>

        {loading ? (
          <div>Loading FX rules...</div>
        ) : error ? (
          <div style={{ color: 'var(--error-color)' }}>{error}</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: 12 }}>Base Currency</th>
                <th style={{ padding: 12 }}>Target Currency</th>
                <th style={{ padding: 12 }}>Exchange Rate</th>
                <th style={{ padding: 12 }}>Profit Markup (%)</th>
                <th style={{ padding: 12 }}>Status</th>
                <th style={{ padding: 12, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {configs.length > 0 ? (
                configs.map((config) => (
                  <tr key={config._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: 12, fontWeight: 600 }}>{config.baseCurrency}</td>
                    <td style={{ padding: 12 }}>
                      <span className="stream-status-badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)' }}>
                        {config.targetCurrency}
                      </span>
                    </td>
                    <td style={{ padding: 12 }}>1 {config.baseCurrency} = {config.exchangeRate} {config.targetCurrency}</td>
                    <td style={{ padding: 12, color: 'var(--success-color)', fontWeight: 600 }}>+{config.markupPercentage}%</td>
                    <td style={{ padding: 12 }}>
                      <span 
                        onClick={() => handleToggleActive(config)}
                        className={`stream-status-badge badge-${config.isActive ? 'success' : 'failed'}`}
                        style={{ cursor: 'pointer' }}
                      >
                        {config.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: 12, textAlign: 'right' }}>
                      <button 
                        onClick={() => handleEditClick(config)} 
                        className="btn btn-secondary" 
                        style={{ padding: '4px 8px', fontSize: 11, marginRight: 8 }}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(config._id)} 
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
                  <td colSpan="6" style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No FX rules configured. Add a configuration rule to support checkout currencies other than USD.
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
            <h3 style={{ margin: 0 }}>{editingId ? 'Edit FX Config' : 'Define FX Config'}</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              
              <div style={{ display: 'flex', gap: 15 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Base Currency</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={baseCurrency} 
                    onChange={(e) => setBaseCurrency(e.target.value)} 
                    placeholder="USD" 
                    readOnly 
                    required 
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Target Currency</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={targetCurrency} 
                    onChange={(e) => setTargetCurrency(e.target.value)} 
                    placeholder="e.g. INR, EUR, GBP" 
                    required 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 15 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Exchange Rate</label>
                  <input 
                    type="number" 
                    step="any"
                    className="form-input" 
                    value={exchangeRate} 
                    onChange={(e) => setExchangeRate(e.target.value)} 
                    placeholder="e.g. 83.45" 
                    required 
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Platform Profit Markup (%)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="form-input" 
                    value={markupPercentage} 
                    onChange={(e) => setMarkupPercentage(e.target.value)} 
                    placeholder="e.g. 2.50" 
                    required 
                  />
                </div>
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 15 }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn">
                  {editingId ? 'Save Changes' : 'Create Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
