/**
 * SmartPay – Application Controller and State Management
 */

(function () {
    // Initial default state
    const defaultState = {
        gateways: {
            stripe: {
                id: 'stripe',
                name: 'Stripe',
                active: true,
                key: 'pk_test_stripe_51N3...',
                secret: 'sk_test_stripe_51N3...',
                feePct: 2.9,
                feeFixed: 0.30,
                sandbox: true,
                processedVolume: 53240.00,
                successCount: 1042,
                totalCount: 1056,
                avgLatency: 180 // ms
            },
            paypal: {
                id: 'paypal',
                name: 'PayPal',
                active: true,
                key: 'paypal_client_id_...',
                secret: 'paypal_client_secret_...',
                feePct: 3.49,
                feeFixed: 0.49,
                sandbox: true,
                processedVolume: 32150.00,
                successCount: 512,
                totalCount: 524,
                avgLatency: 280
            },
            razorpay: {
                id: 'razorpay',
                name: 'Razorpay',
                active: true,
                key: 'rzp_test_key_...',
                secret: 'rzp_test_secret_...',
                feePct: 2.0,
                feeFixed: 0.0,
                sandbox: true,
                processedVolume: 12450.00,
                successCount: 310,
                totalCount: 315,
                avgLatency: 210
            },
            adyen: {
                id: 'adyen',
                name: 'Adyen',
                active: true,
                key: 'adyen_ws_user_...',
                secret: 'adyen_api_key_...',
                feePct: 1.2,
                feeFixed: 0.12,
                sandbox: true,
                processedVolume: 24500.00,
                successCount: 198,
                totalCount: 200,
                avgLatency: 310
            },
            authorize_net: {
                id: 'authorize_net',
                name: 'Authorize.Net',
                active: true,
                key: 'authnet_api_login_...',
                secret: 'authnet_transaction_key_...',
                feePct: 2.9,
                feeFixed: 0.30,
                sandbox: true,
                processedVolume: 8400.00,
                successCount: 88,
                totalCount: 92,
                avgLatency: 250
            }
        },
        routingRules: [
            { id: 'rule-1', name: 'High Value Volume to Stripe', field: 'amount', operator: '>', value: '1000', target: 'stripe', active: true },
            { id: 'rule-2', name: 'European Volume to Adyen', field: 'currency', operator: '=', value: 'EUR', target: 'adyen', active: true },
            { id: 'rule-3', name: 'Indian Transactions to Razorpay', field: 'country', operator: '=', value: 'IN', target: 'razorpay', active: true },
            { id: 'rule-4', name: 'Amex Transactions to PayPal', field: 'network', operator: '=', value: 'Amex', target: 'paypal', active: true }
        ],
        apiKeys: [
            { id: 'key-1', name: 'Default Public Key', value: 'pk_test_smartpay_51N3a4e9z8Fq012x', type: 'Public', created: '2026-06-20' },
            { id: 'key-2', name: 'Default Secret Key', value: 'sk_test_smartpay_51N3a4e9z8Fr987q', type: 'Secret', created: '2026-06-20' }
        ],
        webhookUrl: '',
        transactions: [
            { id: 'tx_1001', customer: 'Liam Neeson', amount: 1250.00, currency: 'USD', country: 'US', network: 'Visa', gateway: 'stripe', status: 'success', timestamp: new Date(Date.now() - 3600000 * 2).toISOString() },
            { id: 'tx_1002', customer: 'Emma Watson', amount: 420.00, currency: 'EUR', country: 'DE', network: 'Mastercard', gateway: 'adyen', status: 'success', timestamp: new Date(Date.now() - 3600000 * 4).toISOString() },
            { id: 'tx_1003', customer: 'Aarav Patel', amount: 85.00, currency: 'INR', country: 'IN', network: 'Visa', gateway: 'razorpay', status: 'success', timestamp: new Date(Date.now() - 3600000 * 6).toISOString() },
            { id: 'tx_1004', customer: 'John Smith', amount: 95.00, currency: 'USD', country: 'US', network: 'Amex', gateway: 'paypal', status: 'success', timestamp: new Date(Date.now() - 3600000 * 8).toISOString() },
            { id: 'tx_1005', customer: 'Sophie Dubois', amount: 15.00, currency: 'EUR', country: 'DE', network: 'Visa', gateway: 'adyen', status: 'failed', failureReason: 'Insufficient Funds', timestamp: new Date(Date.now() - 3600000 * 10).toISOString() },
            { id: 'tx_1006', customer: 'David Miller', amount: 350.00, currency: 'CAD', country: 'CA', network: 'Mastercard', gateway: 'stripe', status: 'success', timestamp: new Date(Date.now() - 3600000 * 12).toISOString() },
            { id: 'tx_1007', customer: 'Chloe Jones', amount: 120.00, currency: 'GBP', country: 'GB', network: 'Visa', gateway: 'stripe', status: 'success', timestamp: new Date(Date.now() - 3600000 * 14).toISOString() },
            { id: 'tx_1008', customer: 'Raj Sharma', amount: 5500.00, currency: 'INR', country: 'IN', network: 'Amex', gateway: 'razorpay', status: 'success', timestamp: new Date(Date.now() - 3600000 * 16).toISOString() }
        ]
    };

    // Load state from local storage or use defaults
    window.SmartPayState = JSON.parse(localStorage.getItem('smartpay_state')) || defaultState;

    // Save state helper
    window.saveSmartPayState = function () {
        localStorage.setItem('smartpay_state', JSON.stringify(window.SmartPayState));
        // Dispatch custom event to notify components that the state changed
        window.dispatchEvent(new CustomEvent('smartpay_state_changed'));
    };

    // View Routing System
    const navItems = document.querySelectorAll('.nav-menu .nav-item');
    const contentPanels = document.querySelectorAll('.content-panel');
    const headerTitle = document.getElementById('header-view-title');

    function switchView(panelId) {
        // Toggle active menu items
        navItems.forEach(item => {
            if (item.getAttribute('data-panel') === panelId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Toggle active content panels
        contentPanels.forEach(panel => {
            if (panel.id === `${panelId}-panel`) {
                panel.classList.add('active-panel');
            } else {
                panel.classList.remove('active-panel');
            }
        });

        // Update header title
        let viewTitle = 'Dashboard';
        switch (panelId) {
            case 'dashboard': viewTitle = 'Dashboard'; break;
            case 'routing': viewTitle = 'Smart Routing Settings'; break;
            case 'playground': viewTitle = 'Payment Playground'; break;
            case 'gateways': viewTitle = 'Gateway Integrations'; break;
            case 'developer': viewTitle = 'Developer API Portal'; break;
        }
        headerTitle.textContent = viewTitle;

        // Trigger updates depending on view
        if (panelId === 'dashboard' && window.SmartPayDashboard) {
            window.SmartPayDashboard.render();
        } else if (panelId === 'routing' && window.SmartPayRouting) {
            window.SmartPayRouting.render();
        } else if (panelId === 'gateways' && window.SmartPayGateways) {
            window.SmartPayGateways.render();
        } else if (panelId === 'developer' && window.SmartPayDeveloper) {
            window.SmartPayDeveloper.render();
        }
    }

    // Attach click listeners to sidebar links
    navItems.forEach(item => {
        item.addEventListener('click', function () {
            const panelId = this.getAttribute('data-panel');
            switchView(panelId);
        });
    });

    // Initialize application on load
    window.addEventListener('DOMContentLoaded', () => {
        // Switch to initial view
        switchView('dashboard');
        
        // Initial setup for webhook url configuration
        const devWebhookInput = document.getElementById('dev-webhook-url');
        if (devWebhookInput) {
            devWebhookInput.value = window.SmartPayState.webhookUrl || '';
        }
    });

})();
