import React, { useState, useEffect } from 'react';
import { api } from './api/api';
import Dashboard from './views/Dashboard';
import Products from './views/Products';
import Coupons from './views/Coupons';
import Transactions from './views/Transactions';
import Gateways from './views/Gateways';
import RoutingRules from './views/RoutingRules';

export default function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('admin@smartpay.io');
  const [password, setPassword] = useState('admin123');
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [activePanel, setActivePanel] = useState('dashboard');

  useEffect(() => {
    const savedUser = api.auth.getCurrentUser();
    if (savedUser && savedUser.role === 'admin') {
      setUser(savedUser);
    }
  }, []);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await api.auth.login(email, password);
      if (res.success) {
        if (res.user.role !== 'admin') {
          setLoginError('Access denied: Role must be Admin');
          api.auth.logout();
        } else {
          setUser(res.user);
        }
      }
    } catch (err) {
      setLoginError(err.message || 'Login credentials invalid');
    }
  };

  const handleLogout = () => {
    api.auth.logout();
    setUser(null);
  };

  // Sleek login layout
  if (!user) {
    return (
      <div style={{
        display: 'flex', height: '100vh', width: '100vw', alignItems: 'center',
        justifyContent: 'center', background: '#070913', overflow: 'hidden', position: 'relative'
      }}>
        {/* Decorative Gradients */}
        <div style={{
          position: 'absolute', width: 500, height: 500, top: '-10%', right: '-10%',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, rgba(0, 0, 0, 0) 70%)',
          filter: 'blur(80px)', borderRadius: '50%'
        }}></div>
        <div style={{
          position: 'absolute', width: 400, height: 400, bottom: '-10%', left: '-10%',
          background: 'radial-gradient(circle, rgba(99, 91, 255, 0.12) 0%, rgba(0, 0, 0, 0) 70%)',
          filter: 'blur(80px)', borderRadius: '50%'
        }}></div>

        <div className="glass-panel" style={{ width: 400, padding: 32, zIndex: 10 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, background: 'linear-gradient(135deg, #fff 30%, #a78bfa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              SmartPay Admin
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>Control Panel Authentication</p>
          </div>

          {loginError && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)', color: 'var(--error-color)',
              padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16
            }}>
              {loginError}
            </div>
          )}

          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input 
                type="email" 
                className="form-input" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            <div className="form-group" style={{ marginBottom: 10 }}>
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  className="form-input" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  style={{ paddingRight: 60 }}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  style={{ 
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', 
                    background: 'none', border: 'none', color: 'var(--text-secondary)', 
                    cursor: 'pointer', fontSize: 12, fontWeight: 600 
                  }}
                >
                  {showPassword ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, fontSize: 13 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={rememberMe} 
                  onChange={() => setRememberMe(!rememberMe)} 
                /> 
                Remember Me
              </label>
              <a 
                href="#" 
                onClick={(e) => { 
                  e.preventDefault(); 
                  alert('Reset password code has been dispatched. Please check your system email logs.'); 
                }} 
                style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 500 }}
              >
                Forgot Password?
              </a>
            </div>

            <button type="submit" className="btn" style={{ width: '100%', justifyContent: 'center', marginBottom: 16 }}>
              Authenticate Admin
            </button>

            {/* Social logins */}
            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Or Authenticate via Social ID
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
                <button 
                  type="button" 
                  onClick={() => alert('Social authentication via Google initialized.')} 
                  className="btn btn-secondary" 
                  style={{ padding: '8px 12px', fontSize: 11, flex: 1, justifyContent: 'center' }}
                >
                  Google
                </button>
                <button 
                  type="button" 
                  onClick={() => alert('Social authentication via Apple initialized.')} 
                  className="btn btn-secondary" 
                  style={{ padding: '8px 12px', fontSize: 11, flex: 1, justifyContent: 'center' }}
                >
                  Apple
                </button>
                <button 
                  type="button" 
                  onClick={() => alert('Social authentication via GitHub initialized.')} 
                  className="btn btn-secondary" 
                  style={{ padding: '8px 12px', fontSize: 11, flex: 1, justifyContent: 'center' }}
                >
                  GitHub
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="brand" style={{ paddingBottom: 15, marginBottom: 15 }}>
          <div className="brand-icon">
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>S</span>
          </div>
          <h1 className="brand-name">SmartPay</h1>
        </div>
        
        <nav className="nav-menu">
          <li className={`nav-item ${activePanel === 'dashboard' ? 'active' : ''}`} onClick={() => setActivePanel('dashboard')}>
            <a className="nav-link">
              <span className="nav-text">Dashboard</span>
            </a>
          </li>
          <li className={`nav-item ${activePanel === 'products' ? 'active' : ''}`} onClick={() => setActivePanel('products')}>
            <a className="nav-link">
              <span className="nav-text">Manage Products</span>
            </a>
          </li>
          <li className={`nav-item ${activePanel === 'coupons' ? 'active' : ''}`} onClick={() => setActivePanel('coupons')}>
            <a className="nav-link">
              <span className="nav-text">Coupons System</span>
            </a>
          </li>
          <li className={`nav-item ${activePanel === 'transactions' ? 'active' : ''}`} onClick={() => setActivePanel('transactions')}>
            <a className="nav-link">
              <span className="nav-text">Transactions & Refunds</span>
            </a>
          </li>
          <li className={`nav-item ${activePanel === 'gateways' ? 'active' : ''}`} onClick={() => setActivePanel('gateways')}>
            <a className="nav-link">
              <span className="nav-text">Gateway Configuration</span>
            </a>
          </li>
          <li className={`nav-item ${activePanel === 'routing' ? 'active' : ''}`} onClick={() => setActivePanel('routing')}>
            <a className="nav-link">
              <span className="nav-text">Smart Routing</span>
            </a>
          </li>
        </nav>
        
        <div className="sidebar-footer" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{user.name}</span>
            <button onClick={handleLogout} style={{ border: 'none', background: 'transparent', color: 'var(--error-color)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
              Logout
            </button>
          </div>
          <div className="system-status">
            <span className="status-dot"></span>
            <span>All Channels Secure</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="header">
          <h2 className="page-title" style={{ textTransform: 'capitalize' }}>
            {activePanel === 'gateways' ? 'Gateway Configurations' : activePanel}
          </h2>
          <div className="header-actions">
            <div className="system-status">
              <span className="status-dot"></span>
              <span>Production Sandbox Mode</span>
            </div>
          </div>
        </header>

        <section className="content-panel active-panel">
          {activePanel === 'dashboard' && <Dashboard />}
          {activePanel === 'products' && <Products />}
          {activePanel === 'coupons' && <Coupons />}
          {activePanel === 'transactions' && <Transactions />}
          {activePanel === 'gateways' && <Gateways />}
          {activePanel === 'routing' && <RoutingRules />}
        </section>
      </main>
    </div>
  );
}
