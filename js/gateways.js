/**
 * SmartPay – Gateway Configurations Manager
 */

(function () {
    window.SmartPayGateways = {
        init: function () {
            this.bindEvents();
        },

        render: function () {
            this.renderGatewayGrid();
        },

        bindEvents: function () {
            const gatewayOverlay = document.getElementById('modal-gateway-overlay');
            const closeGatewayBtn = document.getElementById('modal-close-gateway');
            const gatewayForm = document.getElementById('form-gateway-config');

            if (closeGatewayBtn) {
                closeGatewayBtn.addEventListener('click', () => {
                    gatewayOverlay.classList.remove('active');
                });
            }

            if (gatewayOverlay) {
                gatewayOverlay.addEventListener('click', (e) => {
                    if (e.target === gatewayOverlay) {
                        gatewayOverlay.classList.remove('active');
                    }
                });
            }

            if (gatewayForm) {
                gatewayForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleSaveGateway();
                });
            }
        },

        renderGatewayGrid: function () {
            const container = document.getElementById('gateways-grid-container');
            if (!container) return;

            container.innerHTML = '';
            const state = window.SmartPayState;

            Object.values(state.gateways).forEach(gw => {
                const checkedAttr = gw.active ? 'checked' : '';
                const formatVolume = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(gw.processedVolume);
                
                const rate = gw.totalCount > 0 
                    ? ((gw.successCount / gw.totalCount) * 100).toFixed(1)
                    : '100.0';

                // Setup logo display characters
                const logoColor = `var(--${gw.id}-color)`;
                const statusText = gw.active ? 'Online' : 'Offline';
                const statusClass = gw.active ? 'text-success' : 'text-error';

                container.innerHTML += `
                    <div class="glass-panel gateway-card ${gw.id}-card">
                        <div>
                            <div class="gateway-header">
                                <div class="gateway-logo-container">
                                    <div class="stream-gateway-badge" style="background-color: ${logoColor}; box-shadow: 0 0 8px ${logoColor}; color: white; font-weight: 700;">
                                        ${gw.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <span class="gateway-name">${gw.name}</span>
                                </div>
                                <label class="switch">
                                    <input type="checkbox" class="gateway-active-toggle" data-id="${gw.id}" ${checkedAttr}>
                                    <span class="slider"></span>
                                </label>
                            </div>
                            
                            <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 12px;">
                                Status: <span class="${statusClass}" style="font-weight: 600;">${statusText}</span><br>
                                Environment: <span style="color: var(--text-primary);">${gw.sandbox ? 'Sandbox (Test)' : 'Live'}</span><br>
                                Pricing: <span style="color: var(--text-primary);">${gw.feePct}% + $${gw.feeFixed.toFixed(2)}</span>
                            </div>
                        </div>

                        <div>
                            <div class="gateway-metrics">
                                <div class="gateway-metric-item">
                                    <div class="gateway-metric-label">Processed Vol</div>
                                    <div class="gateway-metric-value">${formatVolume}</div>
                                </div>
                                <div class="gateway-metric-item">
                                    <div class="gateway-metric-label">Success Rate</div>
                                    <div class="gateway-metric-value">${rate}%</div>
                                </div>
                            </div>
                            <div class="gateway-metrics" style="border-top: none; margin-top: 4px; padding-top: 0;">
                                <div class="gateway-metric-item" style="grid-column: span 2;">
                                    <div class="gateway-metric-label">Average Latency</div>
                                    <div class="gateway-metric-value">${gw.avgLatency}ms</div>
                                </div>
                            </div>
                            
                            <button class="btn btn-secondary btn-configure-gw" data-id="${gw.id}" style="width: 100%; margin-top: 14px; padding: 8px;">
                                Configure
                            </button>
                        </div>
                    </div>
                `;
            });

            // Bind status toggles
            document.querySelectorAll('.gateway-active-toggle').forEach(checkbox => {
                checkbox.addEventListener('change', (e) => {
                    const gwId = e.target.getAttribute('data-id');
                    const activeCount = Object.values(state.gateways).filter(g => g.active).length;
                    
                    // Prevent disabling last gateway
                    if (!e.target.checked && activeCount <= 1) {
                        alert('Safety Halt: At least one gateway integration must remain online.');
                        e.target.checked = true;
                        return;
                    }

                    state.gateways[gwId].active = e.target.checked;
                    window.saveSmartPayState();
                    this.render();
                });
            });

            // Bind configure actions
            document.querySelectorAll('.btn-configure-gw').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const gwId = e.target.getAttribute('data-id');
                    this.openConfigureModal(gwId);
                });
            });
        },

        openConfigureModal: function (gwId) {
            const state = window.SmartPayState;
            const gw = state.gateways[gwId];
            if (!gw) return;

            document.getElementById('modal-gateway-id').value = gwId;
            document.getElementById('modal-gateway-title').textContent = `Configure ${gw.name}`;
            document.getElementById('gateway-key-input').value = gw.key || '';
            document.getElementById('gateway-secret-input').value = gw.secret || '';
            document.getElementById('gateway-fee-pct').value = gw.feePct;
            document.getElementById('gateway-fee-fixed').value = gw.feeFixed;
            document.getElementById('gateway-sandbox-toggle').checked = gw.sandbox;

            document.getElementById('modal-gateway-overlay').classList.add('active');
        },

        handleSaveGateway: function () {
            const state = window.SmartPayState;
            const gwId = document.getElementById('modal-gateway-id').value;
            const key = document.getElementById('gateway-key-input').value.trim();
            const secret = document.getElementById('gateway-secret-input').value.trim();
            const feePct = parseFloat(document.getElementById('gateway-fee-pct').value) || 0;
            const feeFixed = parseFloat(document.getElementById('gateway-fee-fixed').value) || 0;
            const sandbox = document.getElementById('gateway-sandbox-toggle').checked;

            if (state.gateways[gwId]) {
                state.gateways[gwId].key = key;
                state.gateways[gwId].secret = secret;
                state.gateways[gwId].feePct = feePct;
                state.gateways[gwId].feeFixed = feeFixed;
                state.gateways[gwId].sandbox = sandbox;
                
                window.saveSmartPayState();
            }

            document.getElementById('modal-gateway-overlay').classList.remove('active');
            this.render();
        }
    };

    // Initialize module on load
    window.addEventListener('DOMContentLoaded', () => {
        window.SmartPayGateways.init();
    });

})();
