/**
 * SmartPay – Routing Rules Engine and Simulator
 */

(function () {
    window.SmartPayRouting = {
        init: function () {
            this.bindEvents();
        },

        render: function () {
            this.renderRulesList();
            this.setupDragAndDrop();
        },

        bindEvents: function () {
            const addRuleBtn = document.getElementById('btn-add-rule');
            const closeRuleBtn = document.getElementById('modal-close-rule');
            const ruleOverlay = document.getElementById('modal-add-rule-overlay');
            const addRuleForm = document.getElementById('form-add-rule');
            const runSimBtn = document.getElementById('btn-run-simulation');

            if (addRuleBtn) {
                addRuleBtn.addEventListener('click', () => {
                    ruleOverlay.classList.add('active');
                });
            }

            if (closeRuleBtn) {
                closeRuleBtn.addEventListener('click', () => {
                    ruleOverlay.classList.remove('active');
                });
            }

            if (ruleOverlay) {
                ruleOverlay.addEventListener('click', (e) => {
                    if (e.target === ruleOverlay) {
                        ruleOverlay.classList.remove('active');
                    }
                });
            }

            if (addRuleForm) {
                addRuleForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleAddRule();
                });
            }

            if (runSimBtn) {
                runSimBtn.addEventListener('click', () => {
                    this.runSimulation();
                });
            }

            // Sync operators options based on field selected
            const fieldSelect = document.getElementById('rule-field-select');
            const operatorSelect = document.getElementById('rule-operator-select');
            if (fieldSelect && operatorSelect) {
                fieldSelect.addEventListener('change', function () {
                    const field = this.value;
                    if (field === 'amount') {
                        operatorSelect.innerHTML = `
                            <option value=">">Greater than (&gt;)</option>
                            <option value="<">Less than (&lt;)</option>
                            <option value="=">Equals (=)</option>
                        `;
                    } else {
                        operatorSelect.innerHTML = `
                            <option value="=">Equals (=)</option>
                            <option value="!=">Not Equals (!=)</option>
                        `;
                    }
                });
            }
        },

        renderRulesList: function () {
            const rulesList = document.getElementById('rules-sortable-list');
            if (!rulesList) return;

            rulesList.innerHTML = '';
            const state = window.SmartPayState;

            if (state.routingRules.length === 0) {
                rulesList.innerHTML = `
                    <div style="text-align: center; padding: 30px; color: var(--text-muted); font-size: 14px;">
                        No routing rules defined. All payments will fall back to default gateway.
                    </div>
                `;
                return;
            }

            state.routingRules.forEach((rule, index) => {
                const checkedAttr = rule.active ? 'checked' : '';
                const operatorName = rule.operator === '>' ? 'greater than' 
                                   : rule.operator === '<' ? 'less than' 
                                   : rule.operator === '!=' ? 'not equal to' 
                                   : 'equal to';
                
                const gatewayName = state.gateways[rule.target]?.name || rule.target;

                rulesList.innerHTML += `
                    <div class="rule-card" draggable="true" data-id="${rule.id}" data-index="${index}">
                        <div class="rule-drag-handle">⋮⋮</div>
                        <div class="rule-info">
                            <div class="rule-title">
                                ${rule.name}
                                <span class="stream-status-badge" style="background: rgba(139, 92, 246, 0.1); color: var(--primary-color); font-size: 9px; padding: 1px 4px;">
                                    Priority ${index + 1}
                                </span>
                            </div>
                            <div class="rule-desc">
                                Route to <b>${gatewayName}</b> if <b>${rule.field}</b> is <i>${operatorName}</i> <b>"${rule.value}"</b>
                            </div>
                        </div>
                        <div class="rule-actions">
                            <label class="switch">
                                <input type="checkbox" class="rule-toggle" data-id="${rule.id}" ${checkedAttr}>
                                <span class="slider"></span>
                            </label>
                            <button class="btn btn-secondary btn-danger" data-delete-id="${rule.id}" style="padding: 6px 10px; box-shadow: none;">
                                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="pointer-events: none;">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                `;
            });

            // Bind rule toggle listeners
            document.querySelectorAll('.rule-toggle').forEach(checkbox => {
                checkbox.addEventListener('change', (e) => {
                    const ruleId = e.target.getAttribute('data-id');
                    const rule = state.routingRules.find(r => r.id === ruleId);
                    if (rule) {
                        rule.active = e.target.checked;
                        window.saveSmartPayState();
                    }
                });
            });

            // Bind rule delete listeners
            document.querySelectorAll('[data-delete-id]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const ruleId = e.target.getAttribute('data-delete-id');
                    state.routingRules = state.routingRules.filter(r => r.id !== ruleId);
                    window.saveSmartPayState();
                    this.render();
                });
            });
        },

        handleAddRule: function () {
            const state = window.SmartPayState;
            const name = document.getElementById('rule-name-input').value.trim();
            const field = document.getElementById('rule-field-select').value;
            const operator = document.getElementById('rule-operator-select').value;
            const value = document.getElementById('rule-value-input').value.trim();
            const target = document.getElementById('rule-target-select').value;

            if (!name || !value) return;

            const newRule = {
                id: 'rule_' + Math.floor(Math.random() * 900000 + 100000),
                name,
                field,
                operator,
                value,
                target,
                active: true
            };

            state.routingRules.push(newRule);
            window.saveSmartPayState();

            // Reset Form and Modal
            document.getElementById('form-add-rule').reset();
            document.getElementById('modal-add-rule-overlay').classList.remove('active');
            
            // Re-render
            this.render();
        },

        setupDragAndDrop: function () {
            const list = document.getElementById('rules-sortable-list');
            if (!list) return;

            let dragEl = null;

            list.addEventListener('dragstart', (e) => {
                if (e.target.classList.contains('rule-card')) {
                    dragEl = e.target;
                    e.target.classList.add('dragging');
                    e.dataTransfer.effectAllowed = 'move';
                }
            });

            list.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                const overEl = e.target.closest('.rule-card');
                if (overEl && overEl !== dragEl) {
                    const rect = overEl.getBoundingClientRect();
                    const next = (e.clientY - rect.top) / (rect.bottom - rect.top) > 0.5;
                    list.insertBefore(dragEl, next ? overEl.nextSibling : overEl);
                }
            });

            list.addEventListener('dragend', (e) => {
                if (dragEl) {
                    dragEl.classList.remove('dragging');
                    
                    // Recalculate rules ordering based on current DOM sequence
                    const state = window.SmartPayState;
                    const newRules = [];
                    const ruleCards = list.querySelectorAll('.rule-card');
                    
                    ruleCards.forEach(card => {
                        const ruleId = card.getAttribute('data-id');
                        const foundRule = state.routingRules.find(r => r.id === ruleId);
                        if (foundRule) {
                            newRules.push(foundRule);
                        }
                    });

                    state.routingRules = newRules;
                    window.saveSmartPayState();
                    
                    // Rerender just to update priorities count labels
                    this.renderRulesList();
                    this.setupDragAndDrop();
                }
            });
        },

        // CORE ROUTING EVALUATOR ENGINE
        determineGateway: function (amount, currency, network, country, getSteps = false) {
            const state = window.SmartPayState;
            const steps = [];
            let targetGatewayId = null;

            steps.push({
                title: 'Transaction Initialized',
                desc: `Input: $${amount} ${currency} • Network: ${network} • Country: ${country}`,
                status: 'active'
            });

            // 1. Evaluate rules hierarchy
            let ruleMatched = false;
            for (let i = 0; i < state.routingRules.length; i++) {
                const rule = state.routingRules[i];
                
                if (!rule.active) {
                    steps.push({
                        title: `Rule skipped: ${rule.name}`,
                        desc: 'This routing rule is currently disabled in settings.',
                        status: 'normal'
                    });
                    continue;
                }

                // Evaluate condition
                let matched = false;
                const txVal = rule.field === 'amount' ? parseFloat(amount) : (
                    rule.field === 'currency' ? currency : (
                        rule.field === 'network' ? network : country
                    )
                );

                const ruleVal = rule.field === 'amount' ? parseFloat(rule.value) : rule.value;

                if (rule.operator === '>') {
                    matched = txVal > ruleVal;
                } else if (rule.operator === '<') {
                    matched = txVal < ruleVal;
                } else if (rule.operator === '=') {
                    matched = String(txVal).toLowerCase() === String(ruleVal).toLowerCase();
                } else if (rule.operator === '!=') {
                    matched = String(txVal).toLowerCase() !== String(ruleVal).toLowerCase();
                }

                if (matched) {
                    ruleMatched = true;
                    targetGatewayId = rule.target;
                    steps.push({
                        title: `Rule Match: ${rule.name}`,
                        desc: `Matched condition: "${rule.field} ${rule.operator} ${rule.value}" matches "${txVal}"`,
                        status: 'success'
                    });
                    break;
                } else {
                    steps.push({
                        title: `Rule Miss: ${rule.name}`,
                        desc: `Evaluated: "${rule.field} ${rule.operator} ${rule.value}". No match for "${txVal}"`,
                        status: 'normal'
                    });
                }
            }

            // 2. Default gateway routing
            if (!ruleMatched) {
                targetGatewayId = 'stripe'; // Default gateway
                steps.push({
                    title: 'Default Routing Activated',
                    desc: 'No routing rules matched. Fallback gateway Stripe selected.',
                    status: 'success'
                });
            }

            // 3. Health check validation (failsafe routing)
            let chosenGateway = state.gateways[targetGatewayId];
            if (!chosenGateway || !chosenGateway.active) {
                const oldGatewayName = chosenGateway?.name || targetGatewayId;
                
                // Route to first active gateway
                const firstActive = Object.values(state.gateways).find(g => g.active);
                
                if (firstActive) {
                    targetGatewayId = firstActive.id;
                    chosenGateway = firstActive;
                    steps.push({
                        title: 'Failsafe Routing Activated',
                        desc: `Target gateway "${oldGatewayName}" is Offline. Re-routed to backup gateway "${chosenGateway.name}"`,
                        status: 'success'
                    });
                } else {
                    steps.push({
                        title: 'Critical Outage Alert',
                        desc: 'Target gateway is offline and no backup gateways are available.',
                        status: 'error'
                    });
                }
            } else {
                steps.push({
                    title: `Gateway Selected: ${chosenGateway.name}`,
                    desc: `Routing transaction to secure gateway endpoint: ${chosenGateway.name}`,
                    status: 'success'
                });
            }

            if (getSteps) {
                return { gatewayId: targetGatewayId, steps };
            }
            return targetGatewayId;
        },

        runSimulation: function () {
            const amount = parseFloat(document.getElementById('sim-amount').value) || 0;
            const currency = document.getElementById('sim-currency').value;
            const network = document.getElementById('sim-network').value;
            const country = document.getElementById('sim-country').value;
            const traceContainer = document.getElementById('simulation-trace-path');
            
            if (!traceContainer) return;

            traceContainer.innerHTML = '';
            
            const result = this.determineGateway(amount, currency, network, country, true);

            result.steps.forEach((step, idx) => {
                const activeClass = step.status === 'success' ? 'success' : (step.status === 'active' ? 'active' : '');
                
                traceContainer.innerHTML += `
                    <div class="trace-step ${activeClass}">
                        <div class="trace-dot">${idx + 1}</div>
                        <div class="trace-details">
                            <div class="trace-title">${step.title}</div>
                            <div class="trace-desc">${step.desc}</div>
                        </div>
                    </div>
                `;
            });
        }
    };

    // Initialize routing on DOM load
    window.addEventListener('DOMContentLoaded', () => {
        window.SmartPayRouting.init();
    });

})();
