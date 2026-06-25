import React, { useEffect, useState } from 'react';
import { api } from '../api/api';

export default function CustomerPortal({ onLogout, currentUser }) {
  const [activeTab, setActiveTab] = useState('catalog');
  
  // Core Data state
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({ items: [], amount: 0, discount: 0, couponCode: '' });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Cart / Checkout state
  const [couponInput, setCouponInput] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [checkoutData, setCheckoutData] = useState(null); // stores router response
  const [paying, setPaying] = useState(false);

  // Simulated Payment Form state
  const [stripeCard, setStripeCard] = useState('4242 4242 4242 4242');
  const [stripeExpiry, setStripeExpiry] = useState('12/28');
  const [stripeCvc, setStripeCvc] = useState('123');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const prodRes = await api.products.list();
      if (prodRes.success) setProducts(prodRes.data);

      const cartRes = await api.cart.get();
      if (cartRes.success) setCart(cartRes.data);

      const txRes = await api.payments.listTransactions();
      if (txRes.success) setTransactions(txRes.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch catalog data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddToCart = async (productId) => {
    try {
      const res = await api.cart.add(productId, 1);
      if (res.success) {
        setCart(res.data);
        alert('Item added to cart!');
      }
    } catch (err) {
      alert(err.message || 'Failed to add item');
    }
  };

  const handleUpdateQty = async (productId, delta) => {
    try {
      const res = await api.cart.add(productId, delta);
      if (res.success) {
        setCart(res.data);
      }
    } catch (err) {
      alert(err.message || 'Failed to update quantity');
    }
  };

  const handleRemoveItem = async (productId) => {
    try {
      const res = await api.cart.remove(productId);
      if (res.success) {
        setCart(res.data);
      }
    } catch (err) {
      alert(err.message || 'Failed to remove item');
    }
  };

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponInput) return;
    try {
      const res = await api.coupons.apply(couponInput);
      if (res.success) {
        alert(`Coupon "${couponInput}" applied successfully!`);
        setCart(res.data);
        setCouponInput('');
      }
    } catch (err) {
      alert(err.message || 'Invalid or expired coupon code');
    }
  };

  const handleStartCheckout = async () => {
    if (cart.items.length === 0) {
      alert('Your cart is empty');
      return;
    }
    setLoading(true);
    try {
      const res = await api.payments.checkout(selectedCurrency);
      if (res.success) {
        setCheckoutData(res.data);
        setActiveTab('checkout-sim');
      }
    } catch (err) {
      alert(err.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePaySimulated = async () => {
    setPaying(true);
    try {
      if (checkoutData.gateway === 'stripe') {
        const res = await api.payments.confirmStripe(checkoutData.intentId);
        if (res.success) {
          alert('Simulated Stripe Payment Successful! Invoice has been generated.');
          setCheckoutData(null);
          fetchData();
          setActiveTab('history');
        }
      } else if (checkoutData.gateway === 'razorpay') {
        // Mock verification payload since backend bypasses signature check on simulated order ids
        const payload = {
          razorpay_order_id: checkoutData.orderId,
          razorpay_payment_id: `pay_sim_${Math.random().toString(36).substring(7)}`,
          razorpay_signature: 'dummy_simulated_razorpay_signature'
        };
        const res = await api.payments.verifyRazorpay(payload);
        if (res.success) {
          alert('Simulated Razorpay Payment Successful! Invoice has been generated.');
          setCheckoutData(null);
          fetchData();
          setActiveTab('history');
        }
      }
    } catch (err) {
      alert(err.message || 'Simulated capture failed');
    } finally {
      setPaying(false);
    }
  };

  const handleDownloadInvoice = async (orderId) => {
    try {
      const token = localStorage.getItem('smartpay_admin_token');
      const response = await fetch(`/api/payments/invoice/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Invoice file not found or unauthorized');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice_${orderId.substring(0, 8).toUpperCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert(err.message || 'Invoice download failed');
    }
  };

  return (
    <div className="app-container">
      {/* Customer Sidebar Navigation */}
      <aside className="sidebar">
        <div className="brand" style={{ paddingBottom: 15, marginBottom: 15 }}>
          <div className="brand-icon" style={{ background: 'var(--primary-color)' }}>
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>C</span>
          </div>
          <h1 className="brand-name">SmartPay Portal</h1>
        </div>
        
        <nav className="nav-menu">
          <li className={`nav-item ${activeTab === 'catalog' ? 'active' : ''}`} onClick={() => setActiveTab('catalog')}>
            <a className="nav-link">
              <span className="nav-text">Product Store</span>
            </a>
          </li>
          <li className={`nav-item ${activeTab === 'cart' ? 'active' : ''}`} onClick={() => setActiveTab('cart')}>
            <a className="nav-link">
              <span className="nav-text">Shopping Cart ({cart.items.length})</span>
            </a>
          </li>
          <li className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
            <a className="nav-link">
              <span className="nav-text">Purchase History</span>
            </a>
          </li>
        </nav>
        
        <div className="sidebar-footer" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{currentUser?.name || 'Customer'}</span>
            <button onClick={onLogout} style={{ border: 'none', background: 'transparent', color: 'var(--error-color)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
              Logout
            </button>
          </div>
          <div className="system-status">
            <span className="status-dot"></span>
            <span>Gateway Channels Secure</span>
          </div>
        </div>
      </aside>

      {/* Customer Main Content */}
      <main className="main-content">
        <header className="header">
          <h2 className="page-title" style={{ textTransform: 'capitalize' }}>
            {activeTab === 'checkout-sim' ? 'Secure Checkout Sandbox' : activeTab === 'history' ? 'Your Invoices & History' : activeTab === 'cart' ? 'Your Shopping Cart' : 'Browse Store Catalog'}
          </h2>
          <div className="header-actions">
            <div className="system-status">
              <span className="status-dot"></span>
              <span>Checkout Sandbox Mode</span>
            </div>
          </div>
        </header>

        <section className="content-panel active-panel">
          {error && <div style={{ color: 'var(--error-color)', padding: 10, background: 'rgba(239,68,68,0.1)', borderRadius: 8, marginBottom: 20 }}>{error}</div>}

          {/* Catalog Tab */}
          {activeTab === 'catalog' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
              {products.length > 0 ? (
                products.map((product) => (
                  <div key={product._id} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 180 }}>
                    <div>
                      <span style={{ fontSize: 11, color: 'var(--primary-color)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{product.category}</span>
                      <h4 style={{ margin: '4px 0 10px 0', fontSize: 16 }}>{product.name}</h4>
                      <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.4, margin: '0 0 15px 0' }}>{product.description}</p>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                      <span style={{ fontSize: 20, fontWeight: 700 }}>${product.price}</span>
                      <button onClick={() => handleAddToCart(product._id)} className="btn" style={{ padding: '8px 16px', fontSize: 12 }}>
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  No catalog items found. Set up products in the Admin Control Panel.
                </div>
              )}
            </div>
          )}

          {/* Cart Tab */}
          {activeTab === 'cart' && (
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {/* Items List */}
              <div className="glass-panel" style={{ flex: 2, minWidth: 400 }}>
                <h4 style={{ margin: '0 0 20px 0' }}>Cart Items</h4>
                {cart.items.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                    {cart.items.map((item) => (
                      <div key={item.productId?._id || item.productId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 15, borderBottom: '1px solid var(--border-color)' }}>
                        <div>
                          <h5 style={{ margin: 0, fontSize: 15 }}>{item.name}</h5>
                          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>${item.price} each</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <button onClick={() => handleUpdateQty(item.productId?._id || item.productId, -1)} className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: 12 }}>-</button>
                          <span style={{ fontWeight: 600 }}>{item.quantity}</span>
                          <button onClick={() => handleUpdateQty(item.productId?._id || item.productId, 1)} className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: 12 }}>+</button>
                          <button onClick={() => handleRemoveItem(item.productId?._id || item.productId)} className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: 12, color: 'var(--error-color)' }}>Remove</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>Your cart is empty.</div>
                )}
              </div>

              {/* Summary */}
              <div className="glass-panel" style={{ flex: 1, minWidth: 280, height: 'fit-content' }}>
                <h4 style={{ margin: '0 0 20px 0' }}>Order Summary</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Items Subtotal:</span>
                    <span>${(cart.items.reduce((sum, i) => sum + (i.price * i.quantity), 0)).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>GST (18%):</span>
                    <span>${(cart.items.reduce((sum, i) => sum + (i.price * i.quantity), 0) * 0.18).toFixed(2)}</span>
                  </div>
                  {cart.discount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--error-color)' }}>
                      <span>Discount ({cart.couponCode}):</span>
                      <span>-${cart.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ height: 1, background: 'var(--border-color)', margin: '5px 0' }}></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700 }}>
                    <span>Grand Total:</span>
                    <span>${cart.amount.toFixed(2)}</span>
                  </div>

                  {/* Coupon Form */}
                  <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: 8, marginTop: 15 }}>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Coupon Code" 
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      style={{ margin: 0 }}
                    />
                    <button type="submit" className="btn btn-secondary" style={{ padding: '8px 12px', fontSize: 12 }}>Apply</button>
                  </form>

                  {/* Currency Picker */}
                  <div className="form-group" style={{ marginTop: 15 }}>
                    <label className="form-label">Preferred Currency for Checkout</label>
                    <select 
                      className="form-input" 
                      value={selectedCurrency}
                      onChange={(e) => setSelectedCurrency(e.target.value)}
                    >
                      <option value="USD">USD (Stripe Route)</option>
                      <option value="INR">INR (Razorpay Route)</option>
                      <option value="EUR">EUR (Global Stripe Route)</option>
                    </select>
                  </div>

                  <button 
                    onClick={handleStartCheckout} 
                    className="btn" 
                    style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}
                    disabled={cart.items.length === 0}
                  >
                    Proceed to Payment
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Simulated Checkout Sandbox Tab */}
          {activeTab === 'checkout-sim' && checkoutData && (
            <div className="glass-panel" style={{ maxWidth: 550, margin: '0 auto', padding: 30 }}>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <h4 style={{ margin: 0, textTransform: 'uppercase', color: 'var(--primary-color)' }}>Secure Sandbox Gateways</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 5 }}>
                  The Smart Payment Routing engine automatically routed this transaction to: 
                  <strong style={{ display: 'block', textTransform: 'uppercase', fontSize: 18, color: checkoutData.gateway === 'stripe' ? 'var(--stripe-color)' : 'var(--razorpay-color)' }}>
                    {checkoutData.gateway}
                  </strong>
                </p>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: 15, borderRadius: 8, border: '1px solid var(--border-color)', marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Routed Gateway ID:</span>
                  <span style={{ fontWeight: 600 }}>{checkoutData.intentId || checkoutData.orderId}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Amount Due:</span>
                  <span style={{ fontWeight: 700 }}>${checkoutData.amount} {checkoutData.currency}</span>
                </div>
              </div>

              {/* Stripe simulated form */}
              {checkoutData.gateway === 'stripe' && (
                <div>
                  <div className="form-group">
                    <label className="form-label">Card Number</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={stripeCard} 
                      onChange={(e) => setStripeCard(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 15 }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Expiry Date</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={stripeExpiry} 
                        onChange={(e) => setStripeExpiry(e.target.value)}
                      />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">CVC</label>
                      <input 
                        type="password" 
                        className="form-input" 
                        value={stripeCvc} 
                        onChange={(e) => setStripeCvc(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Razorpay simulated form */}
              {checkoutData.gateway === 'razorpay' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 15, background: 'rgba(17, 177, 255, 0.05)', border: '1px solid var(--razorpay-color)', borderRadius: 8, marginBottom: 20, fontSize: 13 }}>
                  <span style={{ fontWeight: 700, color: 'var(--razorpay-color)' }}>Razorpay Checkout Sandbox Modal Active</span>
                  <span>* Simulated transaction token will be verified automatically by the backend webhook simulator.</span>
                  <span>* Simply click "Authorize & Complete Payment" below to simulate checkout validation.</span>
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                <button 
                  onClick={() => setActiveTab('cart')} 
                  className="btn btn-secondary" 
                  style={{ flex: 1, justifyContent: 'center' }}
                  disabled={paying}
                >
                  Cancel
                </button>
                <button 
                  onClick={handlePaySimulated} 
                  className="btn" 
                  style={{ flex: 2, justifyContent: 'center' }}
                  disabled={paying}
                >
                  {paying ? 'Authorizing Payment...' : 'Authorize & Complete Payment'}
                </button>
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="glass-panel">
              <h4 style={{ margin: '0 0 20px 0' }}>Transaction History</h4>
              {transactions.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                      <th style={{ padding: 12 }}>Transaction ID</th>
                      <th style={{ padding: 12 }}>Gateway Utilized</th>
                      <th style={{ padding: 12 }}>Amount</th>
                      <th style={{ padding: 12 }}>Date</th>
                      <th style={{ padding: 12 }}>Status</th>
                      <th style={{ padding: 12, textAlign: 'right' }}>Invoice</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: 12, fontWeight: 600 }}>{tx.transactionId}</td>
                        <td style={{ padding: 12, textTransform: 'capitalize' }}>{tx.gateway}</td>
                        <td style={{ padding: 12 }}>{tx.amount} {tx.currency}</td>
                        <td style={{ padding: 12 }}>{new Date(tx.timestamp).toLocaleDateString()}</td>
                        <td style={{ padding: 12 }}>
                          <span className={`stream-status-badge badge-${tx.status === 'success' ? 'success' : 'failed'}`}>
                            {tx.status}
                          </span>
                        </td>
                        <td style={{ padding: 12, textAlign: 'right' }}>
                          <button 
                            onClick={() => handleDownloadInvoice(tx.orderId._id || tx.orderId)} 
                            className="btn btn-secondary" 
                            style={{ padding: '4px 8px', fontSize: 11 }}
                          >
                            Download Invoice PDF
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>
                  No transaction history found. Proceed to cart and make your first payment.
                </div>
              )}
            </div>
          )}

        </section>
      </main>
    </div>
  );
}
