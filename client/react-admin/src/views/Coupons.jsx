import React, { useEffect, useState } from 'react';
import { api } from '../api/api';

export default function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Coupon creation form state
  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [usageLimit, setUsageLimit] = useState('100');

  const fetchCoupons = async () => {
    try {
      const res = await api.coupons.list();
      if (res.success) {
        setCoupons(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      code,
      discountType,
      discountValue: parseFloat(discountValue),
      expiryDate,
      usageLimit: parseInt(usageLimit)
    };

    try {
      const res = await api.coupons.create(payload);
      if (res.success) {
        alert('Coupon created successfully');
        setShowModal(false);
        fetchCoupons();
      }
    } catch (err) {
      alert(err.message || 'Coupon creation failed');
    }
  };

  return (
    <div className="glass-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ margin: 0 }}>Coupon Engine Rules</h3>
        <button onClick={() => { setCode(''); setDiscountValue(''); setExpiryDate(''); setUsageLimit('100'); setShowModal(true); }} className="btn">
          + Add Coupon Code
        </button>
      </div>

      {loading ? (
        <div>Loading coupons...</div>
      ) : error ? (
        <div style={{ color: 'var(--error-color)' }}>{error}</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
              <th style={{ padding: 12 }}>Coupon Code</th>
              <th style={{ padding: 12 }}>Discount Type</th>
              <th style={{ padding: 12 }}>Value</th>
              <th style={{ padding: 12 }}>Usage Count</th>
              <th style={{ padding: 12 }}>Limit</th>
              <th style={{ padding: 12 }}>Expiry Date</th>
              <th style={{ padding: 12, textAlign: 'right' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {coupons.length > 0 ? (
              coupons.map((coupon) => (
                <tr key={coupon._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: 12, fontWeight: 700 }}>{coupon.code}</td>
                  <td style={{ padding: 12, textTransform: 'capitalize' }}>{coupon.discountType}</td>
                  <td style={{ padding: 12 }}>
                    {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `$${coupon.discountValue}`}
                  </td>
                  <td style={{ padding: 12 }}>{coupon.usageCount}</td>
                  <td style={{ padding: 12 }}>{coupon.usageLimit}</td>
                  <td style={{ padding: 12 }}>{new Date(coupon.expiryDate).toLocaleDateString()}</td>
                  <td style={{ padding: 12, textAlign: 'right' }}>
                    <span 
                      className={`stream-status-badge badge-${
                        coupon.isActive && new Date(coupon.expiryDate) > new Date() ? 'success' : 'failed'
                      }`}
                    >
                      {coupon.isActive && new Date(coupon.expiryDate) > new Date() ? 'Active' : 'Expired/Inactive'}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No coupon codes configured.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 100
        }}>
          <div className="glass-panel" style={{ width: 450, backgroundColor: 'var(--bg-surface-solid)' }}>
            <h3 style={{ marginBottom: 20 }}>Create Coupon Rule</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Coupon Code (e.g. WELCOME20)</label>
                <input 
                  type="text" 
                  value={code} 
                  onChange={(e) => setCode(e.target.value)} 
                  className="form-input" 
                  required 
                  placeholder="WELCOME20"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Discount Type</label>
                <select 
                  value={discountType} 
                  onChange={(e) => setDiscountType(e.target.value)} 
                  className="form-select"
                >
                  <option value="percentage">Percentage Discount (%)</option>
                  <option value="fixed">Fixed Discount ($)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Discount Value</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={discountValue} 
                  onChange={(e) => setDiscountValue(e.target.value)} 
                  className="form-input" 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Expiry Date</label>
                <input 
                  type="date" 
                  value={expiryDate} 
                  onChange={(e) => setExpiryDate(e.target.value)} 
                  className="form-input" 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Usage Limit</label>
                <input 
                  type="number" 
                  value={usageLimit} 
                  onChange={(e) => setUsageLimit(e.target.value)} 
                  className="form-input" 
                  required 
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn">
                  Create Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
