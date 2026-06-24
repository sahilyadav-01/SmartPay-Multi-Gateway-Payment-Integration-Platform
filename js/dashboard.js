/**
 * SmartPay – Dashboard Panel and Charting Engine
 */

(function () {
    window.SmartPayDashboard = {
        render: function () {
            this.updateStats();
            this.renderChart();
            this.renderTicker();
        },

        updateStats: function () {
            const state = window.SmartPayState;
            const txs = state.transactions;
            const successTxs = txs.filter(t => t.status === 'success');
            
            // Total Volume
            const totalVolume = successTxs.reduce((sum, t) => sum + t.amount, 0);
            document.getElementById('dashboard-total-volume').textContent = 
                new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalVolume);

            // Success Rate
            const successRate = txs.length > 0 
                ? ((successTxs.length / txs.length) * 100).toFixed(1) 
                : '100.0';
            document.getElementById('dashboard-success-rate').textContent = `${successRate}%`;

            // Active Gateways
            const totalGateways = Object.keys(state.gateways).length;
            const activeGateways = Object.values(state.gateways).filter(g => g.active).length;
            document.getElementById('dashboard-active-gateways').textContent = `${activeGateways}/${totalGateways}`;

            // Avg API Latency
            const activeGws = Object.values(state.gateways).filter(g => g.active);
            const avgLatency = activeGws.length > 0
                ? Math.round(activeGws.reduce((sum, g) => sum + g.avgLatency, 0) / activeGws.length)
                : 0;
            document.getElementById('dashboard-avg-latency').textContent = `${avgLatency}ms`;
        },

        renderChart: function () {
            const state = window.SmartPayState;
            const chartSvg = document.getElementById('dashboard-svg-chart');
            const legendContainer = document.getElementById('chart-legends-container');
            
            if (!chartSvg || !legendContainer) return;
            
            // Define active gateways to show in chart (limit to top 3 for UI clarity)
            const gatewaysToPlot = Object.values(state.gateways)
                .filter(g => g.active)
                .slice(0, 3);
            
            // Render Legends
            legendContainer.innerHTML = '';
            gatewaysToPlot.forEach(gw => {
                const colorVar = `var(--${gw.id}-color)`;
                legendContainer.innerHTML += `
                    <div class="legend-item">
                        <span class="legend-dot" style="background-color: ${colorVar}; box-shadow: 0 0 6px ${colorVar};"></span>
                        <span>${gw.name}</span>
                    </div>
                `;
            });

            // Generate X-axis labels (last 7 days formatted as "MMM DD")
            const days = [];
            const dayLabels = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                days.push(d.toISOString().split('T')[0]);
                dayLabels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            }

            // Sum up volumes for each day per gateway
            // To make chart look attractive, we pre-populate some baseline aggregate data, 
            // then layer on user's custom transactions.
            const baselines = {
                stripe: [1200, 1500, 1800, 1400, 2100, 1900, 0],
                paypal: [800, 1100, 950, 1300, 1200, 900, 0],
                razorpay: [400, 600, 550, 700, 800, 650, 0],
                adyen: [300, 450, 500, 400, 600, 550, 0],
                authorize_net: [200, 250, 300, 210, 400, 350, 0]
            };

            // Overlay actual database transactions on top of baselines
            const dataset = {};
            gatewaysToPlot.forEach(gw => {
                const base = baselines[gw.id] || [100, 200, 150, 300, 250, 400, 0];
                dataset[gw.id] = [...base];
                
                // Aggregate state transactions
                state.transactions.forEach(tx => {
                    if (tx.status === 'success' && tx.gateway === gw.id) {
                        const txDay = tx.timestamp.split('T')[0];
                        const idx = days.indexOf(txDay);
                        if (idx !== -1) {
                            dataset[gw.id][idx] += tx.amount;
                        }
                    }
                });
            });

            // Find max value to scale chart
            let maxVal = 1000;
            Object.values(dataset).forEach(points => {
                const localMax = Math.max(...points);
                if (localMax > maxVal) maxVal = localMax;
            });
            maxVal = Math.ceil(maxVal / 500) * 500; // Round to nearest 500

            // Chart dimensions
            const width = 800;
            const height = 250;
            const paddingLeft = 55;
            const paddingRight = 20;
            const paddingTop = 20;
            const paddingBottom = 30;

            const chartWidth = width - paddingLeft - paddingRight;
            const chartHeight = height - paddingTop - paddingBottom;

            // Start drawing SVG
            let svgContent = '';

            // 1. Draw Grid Lines and Y-Axis Labels
            const gridLinesCount = 5;
            for (let i = 0; i <= gridLinesCount; i++) {
                const y = paddingTop + (chartHeight / gridLinesCount) * i;
                const value = Math.round(maxVal - (maxVal / gridLinesCount) * i);
                
                svgContent += `
                    <line class="chart-grid-line" x1="${paddingLeft}" y1="${y}" x2="${width - paddingRight}" y2="${y}" />
                    <text class="chart-axis-text" x="${paddingLeft - 10}" y="${y + 4}" text-anchor="end">$${value}</text>
                `;
            }

            // 2. Draw X-Axis Labels
            const stepX = chartWidth / 6;
            dayLabels.forEach((label, idx) => {
                const x = paddingLeft + stepX * idx;
                svgContent += `
                    <text class="chart-axis-text" x="${x}" y="${height - 8}" text-anchor="middle">${label}</text>
                `;
            });

            // Define custom SVG Gradients dynamically
            svgContent += `
                <defs>
                    ${gatewaysToPlot.map(gw => `
                        <linearGradient id="grad-${gw.id}" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stop-color="var(--${gw.id}-color)" stop-opacity="0.3"/>
                            <stop offset="100%" stop-color="var(--${gw.id}-color)" stop-opacity="0.0"/>
                        </linearGradient>
                    `).join('')}
                </defs>
            `;

            // 3. Draw Lines and Gradient Fills for each Gateway
            gatewaysToPlot.forEach(gw => {
                const points = dataset[gw.id];
                const colorVar = `var(--${gw.id}-color)`;
                
                let pathD = '';
                let areaD = `M ${paddingLeft} ${height - paddingBottom}`;

                points.forEach((val, idx) => {
                    const x = paddingLeft + stepX * idx;
                    // y scale formula
                    const y = paddingTop + chartHeight - (val / maxVal) * chartHeight;
                    
                    if (idx === 0) {
                        pathD += `M ${x} ${y}`;
                    } else {
                        // Smooth curves
                        const prevX = paddingLeft + stepX * (idx - 1);
                        const prevVal = points[idx - 1];
                        const prevY = paddingTop + chartHeight - (prevVal / maxVal) * chartHeight;
                        const cpX1 = prevX + stepX / 2;
                        const cpY1 = prevY;
                        const cpX2 = prevX + stepX / 2;
                        const cpY2 = y;
                        pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${x} ${y}`;
                    }
                    
                    areaD += ` L ${x} ${y}`;
                });
                
                areaD += ` L ${paddingLeft + stepX * (points.length - 1)} ${height - paddingBottom} Z`;

                // Draw Gradient Area
                svgContent += `<path class="chart-area" d="${areaD}" fill="url(#grad-${gw.id})" />`;
                
                // Draw Main Line
                svgContent += `<path class="chart-line" d="${pathD}" stroke="${colorVar}" />`;

                // Draw circles for data points
                points.forEach((val, idx) => {
                    const x = paddingLeft + stepX * idx;
                    const y = paddingTop + chartHeight - (val / maxVal) * chartHeight;
                    svgContent += `
                        <circle class="chart-point" cx="${x}" cy="${y}" r="4" fill="${colorVar}" stroke="#070913" stroke-width="2" />
                    `;
                });
            });

            chartSvg.innerHTML = svgContent;
        },

        renderTicker: function () {
            const state = window.SmartPayState;
            const tickerUl = document.getElementById('live-transaction-ticker');
            if (!tickerUl) return;

            tickerUl.innerHTML = '';
            
            // Sort by timestamp descending and take the top 8
            const recentTxs = [...state.transactions]
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, 8);

            recentTxs.forEach(tx => {
                const gateway = state.gateways[tx.gateway] || { name: tx.gateway, id: tx.gateway };
                const formattedTime = new Date(tx.timestamp).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true
                });

                const badgeClass = `badge-${tx.status}`;
                const amountText = new Intl.NumberFormat('en-US', { style: 'currency', currency: tx.currency }).format(tx.amount);
                
                // Select matching logo symbol
                let gatewayBg = `var(--${gateway.id}-color)`;
                
                // Country emoji helper
                const getCountryEmoji = (code) => {
                    if (code === 'US') return '🇺🇸';
                    if (code === 'DE') return '🇩🇪';
                    if (code === 'IN') return '🇮🇳';
                    if (code === 'GB') return '🇬🇧';
                    if (code === 'CA') return '🇨🇦';
                    return '🏳️';
                };

                const cardIcons = {
                    Visa: '💳 Visa',
                    Mastercard: '💳 MC',
                    Amex: '💳 Amex',
                    Discover: '💳 Disc'
                };
                const cardText = cardIcons[tx.network] || '💳 Card';

                tickerUl.innerHTML += `
                    <li class="stream-item">
                        <div class="stream-customer-details">
                            <div class="stream-gateway-badge" style="background-color: ${gatewayBg}; box-shadow: 0 0 6px ${gatewayBg}; color: white; font-weight: 700; font-size: 10px;">
                                ${gateway.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <div class="stream-name">${tx.customer} ${getCountryEmoji(tx.country)}</div>
                                <div class="stream-meta">${cardText} • ${formattedTime} • Via ${gateway.name}</div>
                            </div>
                        </div>
                        <div class="stream-amount-info">
                            <div class="stream-amount">${amountText}</div>
                            <span class="stream-status-badge ${badgeClass}">${tx.status}</span>
                        </div>
                    </li>
                `;
            });
        }
    };

    // Simulated Real-Time Transaction Generator
    // Generates a mock transaction in the background every 12 seconds to make the dashboard look alive
    const names = ['Michael Jordan', 'Serena Williams', 'Tony Stark', 'Bruce Wayne', 'Peter Parker', 'Selina Kyle', 'Clark Kent', 'Lois Lane', 'Steve Rogers', 'Natasha Romanoff', 'Wanda Maximoff', 'T\'Challa', 'Arthur Dent', 'Ford Prefect', 'Trillian Astra'];
    const currencies = ['USD', 'EUR', 'INR', 'GBP', 'CAD'];
    const countries = { USD: 'US', EUR: 'DE', INR: 'IN', GBP: 'GB', CAD: 'CA' };
    const networks = ['Visa', 'Mastercard', 'Amex', 'Discover'];

    function generateLiveTransaction() {
        // Only run if gateways are loaded and active
        const state = window.SmartPayState;
        if (!state) return;

        const activeGws = Object.values(state.gateways).filter(g => g.active);
        if (activeGws.length === 0) return;

        // Generate properties
        const customer = names[Math.floor(Math.random() * names.length)];
        const currency = currencies[Math.floor(Math.random() * currencies.length)];
        const country = countries[currency];
        const network = networks[Math.floor(Math.random() * networks.length)];
        
        // Random amount skewed towards smaller transactions
        let amount = Math.random() > 0.85 
            ? Math.round(Math.random() * 1500 + 500) // 15% high value
            : Math.round(Math.random() * 120 + 10);  // 85% low value

        // Use smart routing logic to determine target gateway
        let targetGatewayId = 'stripe';
        if (window.SmartPayRouting && typeof window.SmartPayRouting.determineGateway === 'function') {
            targetGatewayId = window.SmartPayRouting.determineGateway(amount, currency, network, country);
        } else {
            // Fallback: pick random active gateway
            targetGatewayId = activeGws[Math.floor(Math.random() * activeGws.length)].id;
        }

        const gateway = state.gateways[targetGatewayId];
        
        // Check if gateway is active. If not, default to first active gateway
        if (!gateway || !gateway.active) {
            targetGatewayId = activeGws[0].id;
        }

        // Simulate success outcome based on gateway configuration
        // (Stripe: 98% success, PayPal: 95%, etc. Simulating random failures)
        const successRate = targetGatewayId === 'stripe' ? 0.98
                          : targetGatewayId === 'paypal' ? 0.96
                          : targetGatewayId === 'razorpay' ? 0.97
                          : targetGatewayId === 'adyen' ? 0.98
                          : 0.95;

        const isSuccess = Math.random() < successRate;
        const status = isSuccess ? 'success' : 'failed';
        const failureReason = isSuccess ? '' : ['Insufficient Funds', 'Card Expired', 'Gateway Connection Timeout', 'Security Refusal'][Math.floor(Math.random() * 4)];

        const tx = {
            id: 'tx_' + Math.floor(Math.random() * 900000 + 100000),
            customer,
            amount: parseFloat(amount),
            currency,
            country,
            network,
            gateway: targetGatewayId,
            status,
            failureReason,
            timestamp: new Date().toISOString()
        };

        // Add to state
        state.transactions.unshift(tx);
        
        // Keep logs size reasonable
        if (state.transactions.length > 100) {
            state.transactions.pop();
        }

        // Update processing metrics for that gateway
        if (isSuccess) {
            state.gateways[targetGatewayId].processedVolume += amount;
            state.gateways[targetGatewayId].successCount += 1;
        }
        state.gateways[targetGatewayId].totalCount += 1;

        // Save State
        window.saveSmartPayState();

        // Dispatch Custom Event so other components know a transaction occurred (e.g. playground logs)
        window.dispatchEvent(new CustomEvent('new_transaction_processed', { detail: tx }));
    }

    // Process a background transaction every 15 seconds
    setInterval(generateLiveTransaction, 15000);

    // Re-render dashboard components if state changes
    window.addEventListener('smartpay_state_changed', () => {
        const activeNav = document.querySelector('.nav-menu .nav-item.active');
        if (activeNav && activeNav.getAttribute('data-panel') === 'dashboard') {
            window.SmartPayDashboard.render();
        }
    });

})();
