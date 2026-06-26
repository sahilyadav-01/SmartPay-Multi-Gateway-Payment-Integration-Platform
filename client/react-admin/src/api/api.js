const BASE_URL = ''; // Proxied via Vite config to http://localhost:5000

// Helper to fetch requests with auth headers
const request = async (url, options = {}) => {
  const token = localStorage.getItem('smartpay_admin_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers
  };

  const config = {
    ...options,
    headers
  };

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.errors?.join(', ') || 'API request failed');
  }

  return data;
};

export const api = {
  auth: {
    login: async (email, password) => {
      const res = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      if (res.success && res.accessToken) {
        localStorage.setItem('smartpay_admin_token', res.accessToken);
        localStorage.setItem('smartpay_admin_user', JSON.stringify(res.user));
      }
      return res;
    },
    register: async (name, email, password) => {
      const res = await request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role: 'customer' })
      });
      if (res.success && res.accessToken) {
        localStorage.setItem('smartpay_admin_token', res.accessToken);
        localStorage.setItem('smartpay_admin_user', JSON.stringify(res.user));
      }
      return res;
    },
    logout: () => {
      localStorage.removeItem('smartpay_admin_token');
      localStorage.removeItem('smartpay_admin_user');
    },
    getCurrentUser: () => {
      const user = localStorage.getItem('smartpay_admin_user');
      return user ? JSON.parse(user) : null;
    }
  },
  
  analytics: {
    getStats: async () => {
      return await request('/api/analytics');
    }
  },

  products: {
    list: async () => {
      return await request('/api/products');
    },
    create: async (productData) => {
      return await request('/api/products', {
        method: 'POST',
        body: JSON.stringify(productData)
      });
    },
    update: async (id, productData) => {
      return await request(`/api/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(productData)
      });
    },
    delete: async (id) => {
      return await request(`/api/products/${id}`, {
        method: 'DELETE'
      });
    }
  },

  coupons: {
    list: async () => {
      return await request('/api/coupons');
    },
    create: async (couponData) => {
      return await request('/api/coupons', {
        method: 'POST',
        body: JSON.stringify(couponData)
      });
    },
    apply: async (code) => {
      return await request('/api/coupons/apply', {
        method: 'POST',
        body: JSON.stringify({ code })
      });
    }
  },

  refunds: {
    create: async (refundData) => {
      return await request('/api/refunds', {
        method: 'POST',
        body: JSON.stringify(refundData)
      });
    },
    list: async () => {
      return await request('/api/refunds/history');
    }
  },

  routing: {
    list: async () => {
      return await request('/api/routing-rules');
    },
    create: async (ruleData) => {
      return await request('/api/routing-rules', {
        method: 'POST',
        body: JSON.stringify(ruleData)
      });
    },
    update: async (id, ruleData) => {
      return await request(`/api/routing-rules/${id}`, {
        method: 'PUT',
        body: JSON.stringify(ruleData)
      });
    },
    delete: async (id) => {
      return await request(`/api/routing-rules/${id}`, {
        method: 'DELETE'
      });
    }
  },

  cart: {
    get: async () => {
      return await request('/api/cart');
    },
    add: async (productId, quantity = 1) => {
      return await request('/api/cart/add', {
        method: 'POST',
        body: JSON.stringify({ productId, quantity })
      });
    },
    remove: async (productId) => {
      return await request('/api/cart/remove', {
        method: 'DELETE',
        body: JSON.stringify({ productId })
      });
    }
  },

  payments: {
    checkout: async (currency) => {
      return await request('/api/payments/checkout', {
        method: 'POST',
        body: JSON.stringify({ currency })
      });
    },
    verifyRazorpay: async (verificationData) => {
      return await request('/api/payments/razorpay/verify', {
        method: 'POST',
        body: JSON.stringify(verificationData)
      });
    },
    confirmStripe: async (paymentIntentId) => {
      return await request('/api/payments/stripe/confirm', {
        method: 'POST',
        body: JSON.stringify({ paymentIntentId })
      });
    },
    listTransactions: async () => {
      return await request('/api/payments/transactions');
    },
    getInvoiceUrl: (orderId) => {
      return `/api/payments/invoice/${orderId}`;
    }
  },

  gateways: {
    getHealthStatus: async () => {
      return await request('/api/gateways/status');
    },
    toggleHealthStatus: async (name, status) => {
      return await request('/api/gateways/status/toggle', {
        method: 'POST',
        body: JSON.stringify({ name, status })
      });
    }
  },

  webhooks: {
    getLogs: async () => {
      return await request('/api/webhooks/logs');
    },
    retryWebhook: async (id) => {
      return await request(`/api/webhooks/logs/${id}/retry`, {
        method: 'POST'
      });
    }
  }
};
