/**
 * SmartPay – Payment Playground (Checkout Simulator)
 */

(function () {
    window.SmartPayPlayground = {
        init: function () {
            this.bindCardEvents();
            this.bindFormEvents();
            this.bindConsoleEvents();
            this.updateActiveGatewayGlow();
        },

        // Mirror card inputs to 3D Card Graphic
        bindCardEvents: function () {
            const cardInner = document.getElementById('checkout-card-preview');
            const nameInput = document.getElementById('checkout-name');
            const numInput = document.getElementById('checkout-card-num');
            const expInput = document.getElementById('checkout-expiry');
            const cvvInput = document.getElementById('checkout-cvv');

            const previewName = document.getElementById('preview-card-name');
            const previewNum = document.getElementById('preview-card-number');
            const previewExp = document.getElementById('preview-card-expiry');
            const previewCvv = document.getElementById('preview-card-cvv');

            if (!cardInner) return;

            // Name Mirroring
            nameInput.addEventListener('input', function () {
                previewName.textContent = this.value.toUpperCase() || 'YOUR NAME';
            });

            // Card Number Masking & Mirroring
            numInput.addEventListener('input', (e) => {
                let val = e.target.value.replace(/\D/g, '');
                // Format with spaces
                let formatted = '';
                for (let i = 0; i < val.length; i++) {
                    if (i > 0 && i % 4 === 0) formatted += ' ';
                    formatted += val[i];
                }
                e.target.value = formatted;
                previewNum.textContent = formatted || '•••• •••• •••• ••••';
                
                // Detect Brand Logo
                this.updateCardBrand(val);
                this.updateActiveGatewayGlow();
            });

            // Expiry Date Masking
            expInput.addEventListener('input', (e) => {
                let val = e.target.value.replace(/\D/g, '');
                if (val.length > 2) {
                    val = val.substring(0, 2) + '/' + val.substring(2, 4);
                }
                e.target.value = val;
                previewExp.textContent = val || 'MM/YY';
            });

            // CVV focus triggers 3D Card Rotation
            cvvInput.addEventListener('input', function () {
                previewCvv.textContent = this.value.replace(/./g, '•') || '•••';
            });

            cvvInput.addEventListener('focus', () => {
                cardInner.classList.add('flipped');
            });

            cvvInput.addEventListener('blur', () => {
                cardInner.classList.remove('flipped');
            });
        },

        // Update Card Brand Logo based on number prefix
        updateCardBrand: function (number) {
            const logoContainer = document.getElementById('preview-card-brand');
            if (!logoContainer) return;

            let brandSvg = '';
            
            // Card Network identification
            if (number.startsWith('4')) {
                // Visa
                brandSvg = `
                    <svg viewBox="0 0 48 48" style="height:24px;">
                        <path fill="#1565C0" d="M43,41H5c-2.209,0-4-1.791-4-4V11c0-2.209,1.791-4,4-4h38c2.209,0,4,1.791,4,4v26C47,39.209,45.209,41,43,41z"/>
                        <path fill="#FFF" d="M19.789,17.489h-3.4l-5.309,12.75h3.4L19.789,17.489z M32.61,17.989c-0.6-0.3-1.6-0.6-2.8-0.6c-3,0-5.1,1.6-5.1,3.9c0,1.7,1.5,2.6,2.7,3.2c1.2,0.6,1.6,1,1.6,1.5c0,0.8-1,1.2-1.9,1.2c-1.3,0-2-0.2-3.1-0.7l-0.4-0.2l-0.5,3.1c0.8,0.4,2.3,0.7,3.8,0.7c3.2,0,5.3-1.6,5.3-4c0-1.3-0.8-2.3-2.6-3.2c-1.1-0.6-1.8-1-1.8-1.6c0-0.6,0.6-1.1,1.8-1.1c1,0,1.8,0.2,2.4,0.5l0.3,0.1L32.61,17.989z M38.61,17.489h-2.6c-0.8,0-1.5,0.5-1.8,1.2l-5.1,12.2h3.6l0.7-2h4.4l0.4,2h3.2L38.61,17.489z M36.31,26.489l1.8-5l1,5H36.31z M14.39,17.489l-3.3,9l-0.4-1.8c-0.5-1.7-2.1-3.5-3.9-4.5l3.2,10.6h3.6l5.3-12.7L14.39,17.489z"/>
                    </svg>
                `;
            } else if (/^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[0-1]|2720)/.test(number)) {
                // Mastercard
                brandSvg = `
                    <svg viewBox="0 0 48 48" style="height:24px;">
                        <path fill="#37474F" d="M43,41H5c-2.209,0-4-1.791-4-4V11c0-2.209,1.791-4,4-4h38c2.209,0,4,1.791,4,4v26C47,39.209,45.209,41,43,41z"/>
                        <path fill="#FF9800" d="M30,24c0,4.763-2.5,8.946-6.216,11.272C27.5,37.593,31.956,39,37,39c7.18,0,10-4.82,10-15s-2.82-10-10-10C31.956,14,27.5,15.407,23.784,17.728C27.5,20.054,30,24.237,30,24z"/>
                        <path fill="#F44336" d="M18,24c0-4.763,2.5-8.946,6.216-11.272C20.5,10.407,16.044,9,11,9C3.82,9,1,13.82,1,24s2.82,15,10,15c5.044,0,9.5-1.407,12.784-3.728C20.5,32.946,18,28.763,18,24z"/>
                        <path fill="#FFEB3B" opacity="0.6" d="M23.784,17.728C22.072,19.44,21,21.621,21,24s1.072,4.56,2.784,6.272C25.496,28.56,26.568,26.379,26.568,24S25.496,19.44,23.784,17.728z"/>
                    </svg>
                `;
            } else if (/^(34|37)/.test(number)) {
                // Amex
                brandSvg = `
                    <svg viewBox="0 0 48 48" style="height:24px;">
                        <path fill="#0288D1" d="M43,41H5c-2.209,0-4-1.791-4-4V11c0-2.209,1.791-4,4-4h38c2.209,0,4,1.791,4,4v26C47,39.209,45.209,41,43,41z"/>
                        <path fill="#FFF" d="M19.5,15.5l-2.4,5.4l-2.4-5.4H12v13.5h3v-8.4l2.4,5.4h1.2l2.4-5.4v8.4h3V15.5H19.5z M32,15.5H25v13.5h7c2,0,3.5-1,3.5-3.5v-6.5C35.5,16.5,34,15.5,32,15.5z M32.5,23c0,1.4-0.6,2-1.5,2h-2.5v-6h2.5c0.9,0,1.5,0.6,1.5,2V23z M10.4,18.7l-1.5-3.2H6v13.5h3v-6.3h1.3l1.8,6.3h3.2l-2.3-7.7C12.3,20.5,11.5,19.7,10.4,18.7z M9,18.8v-3.3h0.3C9.6,15.5,10,16,10,16.8S9.6,18.8,9,18.8z"/>
                    </svg>
                `;
            } else if (number.startsWith('6')) {
                // Discover
                brandSvg = `
                    <svg viewBox="0 0 48 48" style="height:24px;">
                        <path fill="#FF6D00" d="M43,41H5c-2.209,0-4-1.791-4-4V11c0-2.209,1.791-4,4-4h38c2.209,0,4,1.791,4,4v26C47,39.209,45.209,41,43,41z"/>
                        <path fill="#FFF" d="M12.5,16.5c-3,0-4.5,2-4.5,5.5s1.5,5.5,4.5,5.5s4.5-2,4.5-5.5S15.5,16.5,12.5,16.5z M12.5,25c-1.5,0-2-1.5-2-3s0.5-3,2-3s2,1.5,2,3S14,25,12.5,25z M25.5,20.5v-4h-3v11h6.5v-3H25.5z M34.5,16.5H31v11h3v-4.5h2.5v-3H34v-1h3v-2.5H34.5z M20,16.5h-3v11h3V16.5z M5,16.5h3v11H5V16.5z"/>
                    </svg>
                `;
            } else {
                // Default Generic Icon
                brandSvg = `
                    <svg viewBox="0 0 24 24" fill="rgba(255,255,255,0.7)" style="height:22px;">
                        <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4V6h16v12zm-5-1H9v-2h6v2zm-2-3H9v-2h4v2z"/>
                    </svg>
                `;
            }

            logoContainer.innerHTML = brandSvg;
        },

        // Evaluate Routing based on inputs and glow card border accordingly
        updateActiveGatewayGlow: function () {
            const state = window.SmartPayState;
            const amount = parseFloat(document.getElementById('checkout-amount').value) || 0;
            const currency = document.getElementById('checkout-country').value === 'IN' ? 'INR' 
                           : document.getElementById('checkout-country').value === 'DE' ? 'EUR' 
                           : 'USD';
                           
            // Card Brand identification
            const cardNumInput = document.getElementById('checkout-card-num').value.replace(/\D/g, '');
            let network = 'Visa';
            if (/^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[0-1]|2720)/.test(cardNumInput)) network = 'Mastercard';
            else if (/^(34|37)/.test(cardNumInput)) network = 'Amex';
            else if (cardNumInput.startsWith('6')) network = 'Discover';

            const country = document.getElementById('checkout-country').value;
            const overrideGw = document.getElementById('checkout-override-gateway').value;

            let targetGwId = 'stripe';
            if (overrideGw !== 'auto') {
                targetGwId = overrideGw;
            } else if (window.SmartPayRouting && typeof window.SmartPayRouting.determineGateway === 'function') {
                targetGwId = window.SmartPayRouting.determineGateway(amount, currency, network, country);
            }

            // Apply card glow classes
            const cardPreview = document.getElementById('checkout-card-preview');
            if (cardPreview) {
                // Strip existing glow classes
                cardPreview.className = 'credit-card-inner';
                // Add specific active glow
                cardPreview.classList.add(`glow-${targetGwId}`);
            }
        },

        bindFormEvents: function () {
            const checkoutForm = document.getElementById('checkout-payment-form');
            const gatewayOverride = document.getElementById('checkout-override-gateway');
            const countrySelect = document.getElementById('checkout-country');
            const amountInput = document.getElementById('checkout-amount');

            // Force dynamic glow update on form adjustments
            [gatewayOverride, countrySelect, amountInput].forEach(el => {
                if (el) el.addEventListener('change', () => this.updateActiveGatewayGlow());
            });

            if (checkoutForm) {
                checkoutForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.processPayment();
                });
            }
        },

        // Tabs switching logic for debugger consoles
        bindConsoleEvents: function () {
            const tabs = document.querySelectorAll('.dev-console .console-tab');
            const screens = document.querySelectorAll('.dev-console .console-screen');

            tabs.forEach(tab => {
                tab.addEventListener('click', function () {
                    const tabId = this.getAttribute('data-tab');
                    
                    tabs.forEach(t => t.classList.remove('active'));
                    this.classList.add('active');

                    screens.forEach(s => {
                        if (s.id === `console-${tabId}`) {
                            s.classList.add('active-screen');
                        } else {
                            s.classList.remove('active-screen');
                        }
                    });
                });
            });
        },

        // Helper to output to developer console logs screen
        logToConsole: function (screenId, message, type = 'info') {
            const screen = document.getElementById(`console-${screenId}`);
            if (!screen) return;

            const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false });
            let formattedMsg = '';

            if (typeof message === 'object') {
                // Pretty-print JSON object with coloring
                const jsonStr = JSON.stringify(message, null, 2);
                formattedMsg = jsonStr
                    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, function (match) {
                        let cls = 'json-number';
                        if (/^"/.test(match)) {
                            if (/:$/.test(match)) {
                                cls = 'json-key';
                            } else {
                                cls = 'json-string';
                            }
                        } else if (/true|false/.test(match)) {
                            cls = 'json-boolean';
                        }
                        return `<span class="${cls}">${match}</span>`;
                    });
            } else {
                formattedMsg = message;
            }

            const lineEl = document.createElement('div');
            lineEl.className = `console-line ${type}`;
            lineEl.innerHTML = `[${timeStr}] ${formattedMsg}`;
            screen.appendChild(lineEl);

            // Auto-scroll to bottom
            screen.scrollTop = screen.scrollHeight;
        },

        // MAIN PAYMENT PROCESSING SIMULATION FLOW
        processPayment: function () {
            const state = window.SmartPayState;
            const submitBtn = document.getElementById('btn-submit-payment');
            
            // Read Form Values
            const name = document.getElementById('checkout-name').value.trim();
            const cardNum = document.getElementById('checkout-card-num').value.replace(/\D/g, '');
            const expiry = document.getElementById('checkout-expiry').value;
            const cvv = document.getElementById('checkout-cvv').value;
            const amount = parseFloat(document.getElementById('checkout-amount').value);
            const country = document.getElementById('checkout-country').value;
            const outcome = document.getElementById('checkout-outcome').value;
            const overrideGw = document.getElementById('checkout-override-gateway').value;

            // Determine processing Currency based on country
            const currency = country === 'IN' ? 'INR' 
                           : country === 'DE' ? 'EUR' 
                           : 'USD';

            // Determine Card Network
            let network = 'Visa';
            if (/^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[0-1]|2720)/.test(cardNum)) network = 'Mastercard';
            else if (/^(34|37)/.test(cardNum)) network = 'Amex';
            else if (cardNum.startsWith('6')) network = 'Discover';

            // 1. Run Smart Routing rules
            let targetGatewayId = 'stripe';
            let traceSteps = null;
            if (overrideGw !== 'auto') {
                targetGatewayId = overrideGw;
                this.logToConsole('api-logs', `Manual Override Gateway active: routing directly to ${overrideGw.toUpperCase()}`, 'info');
            } else if (window.SmartPayRouting) {
                const routeResult = window.SmartPayRouting.determineGateway(amount, currency, network, country, true);
                targetGatewayId = routeResult.gatewayId;
                traceSteps = routeResult.steps;
                
                this.logToConsole('api-logs', `Engine run tracer: Routed to target gateway: ${targetGatewayId.toUpperCase()}`, 'info');
            }

            const gateway = state.gateways[targetGatewayId];
            if (!gateway || !gateway.active) {
                alert('No active payment gateway could process this request. Check your Gateway settings.');
                return;
            }

            // Disable Submit Button and show loading
            submitBtn.disabled = true;
            submitBtn.textContent = 'Charging Card...';

            // Generate Mock Transaction ID
            const txId = 'tx_' + Math.floor(Math.random() * 900000 + 100000);

            // API Request payload to output
            const requestPayload = {
                endpoint: '/v1/charges',
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${state.apiKeys.find(k => k.type === 'Secret')?.value || 'sk_test_smartpay_...'}`
                },
                body: {
                    amount: Math.round(amount * 100), // In Cents/Paise
                    currency: currency,
                    payment_method: {
                        type: 'card',
                        card: {
                            number: '•••• •••• •••• ' + cardNum.slice(-4),
                            exp_month: expiry.split('/')[0] || '12',
                            exp_year: expiry.split('/')[1] || '27',
                            cvc: '•••',
                            holder: name
                        }
                    },
                    metadata: {
                        customer_country: country,
                        card_network: network,
                        routing_gateway: targetGatewayId
                    }
                }
            };

            this.logToConsole('api-logs', `POST /v1/charges Request:`, 'input');
            this.logToConsole('api-logs', requestPayload, 'input');

            // 3D Secure modal execution context if enabled
            if (outcome === '3ds') {
                // Show 3DS modal
                const modal3ds = document.getElementById('modal-3ds-overlay');
                modal3ds.classList.add('active');

                // Cancel Button Click
                const handleCancel = () => {
                    modal3ds.classList.remove('active');
                    this.completePaymentFlow({
                        txId, name, amount, currency, country, network, gatewayId: targetGatewayId,
                        status: 'failed', failureReason: '3D Secure authentication cancelled',
                        latency: gateway.avgLatency + 50
                    });
                    cleanup();
                };

                // OTP Submit Click
                const handleSubmit = (e) => {
                    e.preventDefault();
                    const otpVal = document.getElementById('otp-input').value.trim();
                    modal3ds.classList.remove('active');

                    if (otpVal === '123456') {
                        this.logToConsole('api-logs', `3D Secure OTP verification successful. Resuming payment flow...`, 'success');
                        this.completePaymentFlow({
                            txId, name, amount, currency, country, network, gatewayId: targetGatewayId,
                            status: 'success', latency: gateway.avgLatency + 150
                        });
                    } else {
                        this.logToConsole('api-logs', `3D Secure OTP verification failed. Denying charge.`, 'error');
                        this.completePaymentFlow({
                            txId, name, amount, currency, country, network, gatewayId: targetGatewayId,
                            status: 'failed', failureReason: '3D Secure OTP verification failed',
                            latency: gateway.avgLatency + 100
                        });
                    }
                    cleanup();
                };

                const cleanup = () => {
                    document.getElementById('btn-cancel-3ds').removeEventListener('click', handleCancel);
                    document.getElementById('form-3ds-challenge').removeEventListener('submit', handleSubmit);
                    document.getElementById('otp-input').value = '';
                };

                document.getElementById('btn-cancel-3ds').addEventListener('click', handleCancel);
                document.getElementById('form-3ds-challenge').addEventListener('submit', handleSubmit);

            } else {
                // Simulate ordinary latency delay
                const latency = gateway.avgLatency + Math.round(Math.random() * 40 - 20);
                
                setTimeout(() => {
                    if (outcome === 'success') {
                        this.completePaymentFlow({
                            txId, name, amount, currency, country, network, gatewayId: targetGatewayId,
                            status: 'success', latency
                        });
                    } else {
                        // Handle Failures
                        let reason = 'Payment processor error';
                        if (outcome === 'insufficient_funds') reason = 'Insufficient Funds';
                        else if (outcome === 'incorrect_cvv') reason = 'Incorrect CVV';
                        else if (outcome === 'expired_card') reason = 'Expired Card';
                        else if (outcome === 'timeout') reason = 'Gateway Connection Timeout';

                        this.completePaymentFlow({
                            txId, name, amount, currency, country, network, gatewayId: targetGatewayId,
                            status: 'failed', failureReason: reason, latency
                        });
                    }
                }, latency);
            }
        },

        // Finish the simulated payment processing, updates state metrics, outputs logs, dispatches webhooks
        completePaymentFlow: function ({ txId, name, amount, currency, country, network, gatewayId, status, failureReason = '', latency }) {
            const state = window.SmartPayState;
            const submitBtn = document.getElementById('btn-submit-payment');
            
            // Format time
            const timestamp = new Date().toISOString();

            const tx = {
                id: txId,
                customer: name,
                amount,
                currency,
                country,
                network,
                gateway: gatewayId,
                status,
                failureReason,
                timestamp
            };

            // Add transaction to memory state
            state.transactions.unshift(tx);
            if (state.transactions.length > 100) state.transactions.pop();

            // Update stats
            if (status === 'success') {
                state.gateways[gatewayId].processedVolume += amount;
                state.gateways[gatewayId].successCount += 1;
            }
            state.gateways[gatewayId].totalCount += 1;
            
            // Dynamic Latency adjustment based on outcome
            state.gateways[gatewayId].avgLatency = Math.round((state.gateways[gatewayId].avgLatency * 9 + latency) / 10);

            // Save state
            window.saveSmartPayState();

            // 1. Log Response object inside developer panel
            let responsePayload = {};
            if (status === 'success') {
                responsePayload = {
                    status: 200,
                    statusText: 'OK',
                    body: {
                        id: txId,
                        object: 'charge',
                        amount: Math.round(amount * 100),
                        currency: currency,
                        status: 'succeeded',
                        gateway: gatewayId,
                        paid: true,
                        captured: true,
                        receipt_url: `https://receipts.smartpay.io/${txId}`,
                        created: Math.floor(Date.now() / 1000)
                    }
                };
                this.logToConsole('api-logs', `200 OK Response:`, 'success');
                this.logToConsole('api-logs', responsePayload, 'success');
            } else {
                responsePayload = {
                    status: 402,
                    statusText: 'Payment Required',
                    body: {
                        error: {
                            type: 'card_error',
                            code: failureReason.toLowerCase().replace(/ /g, '_'),
                            message: `The transaction failed via ${gatewayId.toUpperCase()} with reason: ${failureReason}`,
                            decline_code: failureReason.toLowerCase().replace(/ /g, '_'),
                            charge: txId
                        }
                    }
                };
                this.logToConsole('api-logs', `402 Payment Required Response:`, 'error');
                this.logToConsole('api-logs', responsePayload, 'error');
            }

            // 2. Webhook simulation payload logger
            const webhookPayload = {
                id: 'evt_' + Math.floor(Math.random() * 9000000 + 1000000),
                object: 'event',
                type: status === 'success' ? 'payment.succeeded' : 'payment.failed',
                created: Math.floor(Date.now() / 1000),
                api_version: '2026-06-24',
                data: {
                    object: responsePayload.body
                }
            };

            this.logToConsole('webhook-logs', `Sending webhook event: ${webhookPayload.type}`, 'info');
            this.logToConsole('webhook-logs', webhookPayload, 'info');

            // Dispatch webhook if live URL endpoint is configured
            if (state.webhookUrl) {
                this.logToConsole('webhook-logs', `Dispatching POST request to endpoint: ${state.webhookUrl}`, 'input');
                
                // Fire webhook asynchronously so it doesn't block local simulator execution
                fetch(state.webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(webhookPayload)
                })
                .then(res => {
                    this.logToConsole('webhook-logs', `Webhook dispatched. Response Status: ${res.status}`, 'success');
                })
                .catch(err => {
                    this.logToConsole('webhook-logs', `Webhook dispatch failed: Connection error. Details: ${err.message}`, 'error');
                });
            }

            // Reset Checkout form submit button state
            submitBtn.disabled = false;
            submitBtn.textContent = 'Charge Card';

            // Clear inputs
            document.getElementById('checkout-payment-form').reset();
            document.getElementById('preview-card-number').textContent = '•••• •••• •••• ••••';
            document.getElementById('preview-card-name').textContent = 'YOUR NAME';
            document.getElementById('preview-card-expiry').textContent = 'MM/YY';
            document.getElementById('preview-card-cvv').textContent = '•••';
            this.updateCardBrand('');
            this.updateActiveGatewayGlow();
        }
    };

    // Initialize Playground on load
    window.addEventListener('DOMContentLoaded', () => {
        window.SmartPayPlayground.init();
    });

})();
