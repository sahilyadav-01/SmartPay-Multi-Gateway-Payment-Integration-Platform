import React, { useState } from 'react';

export default function Gateways() {
  const [stripeActive, setStripeActive] = useState(true);
  const [razorpayActive, setRazorpayActive] = useState(true);
  const [paypalActive, setPaypalActive] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    alert('Gateway Configurations Saved successfully (Local Simulator and Sandbox Updated)');
  };

  return (
    <div className="glass-panel" style={{ maxWidth: 800 }}>
      <h3 style={{ marginBottom: 20 }}>Gateway Integrations Config</h3>
      
      <form onSubmit={handleSave}>
        {/* Stripe */}
        <div style={{ padding: 20, background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: 12, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
            <h4 style={{ margin: 0, color: 'var(--stripe-color)' }}>Stripe Integration</h4>
            <label className="switch">
              <input type="checkbox" checked={stripeActive} onChange={() => setStripeActive(!stripeActive)} />
              <span className="slider"></span>
            </label>
          </div>
          <div className="form-group">
            <label className="form-label">Stripe Publishable Key</label>
            <input type="text" className="form-input" placeholder="pk_test_stripe_..." defaultValue="pk_test_stripe_51N3a4e9z8Fq012x" />
          </div>
          <div className="form-group">
            <label className="form-label">Stripe Secret Key</label>
            <input type="password" className="form-input" placeholder="sk_test_stripe_..." defaultValue="••••••••••••••••••••••••••••••••" />
          </div>
        </div>

        {/* Razorpay */}
        <div style={{ padding: 20, background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: 12, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
            <h4 style={{ margin: 0, color: 'var(--razorpay-color)' }}>Razorpay (Primary Gateway)</h4>
            <label className="switch">
              <input type="checkbox" checked={razorpayActive} onChange={() => setRazorpayActive(!razorpayActive)} />
              <span className="slider"></span>
            </label>
          </div>
          <div className="form-group">
            <label className="form-label">Razorpay Key ID</label>
            <input type="text" className="form-input" placeholder="rzp_test_..." defaultValue="rzp_test_key_51N3a4e9" />
          </div>
          <div className="form-group">
            <label className="form-label">Razorpay Key Secret</label>
            <input type="password" className="form-input" placeholder="rzp_secret_..." defaultValue="••••••••••••••••••••••••" />
          </div>
        </div>

        {/* PayPal */}
        <div style={{ padding: 20, background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: 12, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
            <h4 style={{ margin: 0, color: 'var(--paypal-color)' }}>PayPal Integration</h4>
            <label className="switch">
              <input type="checkbox" checked={paypalActive} onChange={() => setPaypalActive(!paypalActive)} />
              <span className="slider"></span>
            </label>
          </div>
          <div className="form-group">
            <label className="form-label">PayPal Client ID</label>
            <input type="text" className="form-input" placeholder="paypal_client_id_..." defaultValue="paypal_client_id_placeholder" />
          </div>
        </div>

        <button type="submit" className="btn">
          Save Settings
        </button>
      </form>
    </div>
  );
}
