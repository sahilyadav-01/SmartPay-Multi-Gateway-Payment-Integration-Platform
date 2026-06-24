/**
 * SmartPay – Developer API Keys, Webhooks and Integration Snippets
 */

(function () {
    window.SmartPayDeveloper = {
        init: function () {
            this.bindEvents();
            this.renderDocs('code-node');
        },

        render: function () {
            this.renderApiKeysList();
        },

        bindEvents: function () {
            const generateKeyBtn = document.getElementById('btn-generate-api-key');
            const saveWebhookBtn = document.getElementById('btn-save-webhook');
            const testWebhookBtn = document.getElementById('btn-test-webhook-dispatch');
            const docsTabs = document.querySelectorAll('.docs-panel .console-tab');

            if (generateKeyBtn) {
                generateKeyBtn.addEventListener('click', () => {
                    this.handleGenerateApiKey();
                });
            }

            if (saveWebhookBtn) {
                saveWebhookBtn.addEventListener('click', () => {
                    this.handleSaveWebhookUrl();
                });
            }

            if (testWebhookBtn) {
                testWebhookBtn.addEventListener('click', () => {
                    this.handleTestWebhookDispatch();
                });
            }

            // Snippet tab switching
            docsTabs.forEach(tab => {
                tab.addEventListener('click', (e) => {
                    const tabId = e.target.getAttribute('data-tab');
                    
                    docsTabs.forEach(t => t.classList.remove('active'));
                    e.target.classList.add('active');

                    this.renderDocs(tabId);
                });
            });
        },

        renderApiKeysList: function () {
            const container = document.getElementById('api-keys-list-container');
            if (!container) return;

            container.innerHTML = '';
            const state = window.SmartPayState;

            if (state.apiKeys.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 20px; color: var(--text-muted); font-size: 13px;">
                        No developer API keys active.
                    </div>
                `;
                return;
            }

            state.apiKeys.forEach((key, index) => {
                // Obfuscate secret keys slightly in list
                const displayedValue = key.type === 'Secret' 
                    ? key.value.substring(0, 16) + '••••••••••••••••'
                    : key.value;

                container.innerHTML += `
                    <div class="key-row">
                        <div>
                            <div style="font-size: 14px; font-weight: 600;">${key.name}</div>
                            <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
                                Type: <b>${key.type}</b> • Created: ${key.created}
                            </div>
                            <div class="key-value" style="margin-top: 6px;">${displayedValue}</div>
                        </div>
                        <div class="flex-row-gap-12">
                            <button class="btn btn-secondary btn-copy-key" data-key="${key.value}" style="padding: 6px 12px; font-size: 12px;">
                                Copy
                            </button>
                            <button class="btn btn-secondary btn-danger btn-revoke-key" data-id="${key.id}" style="padding: 6px 12px; font-size: 12px; box-shadow: none;">
                                Revoke
                            </button>
                        </div>
                    </div>
                `;
            });

            // Bind Copy Button listeners
            document.querySelectorAll('.btn-copy-key').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const rawKey = e.target.getAttribute('data-key');
                    navigator.clipboard.writeText(rawKey)
                        .then(() => {
                            const originalText = e.target.textContent;
                            e.target.textContent = 'Copied!';
                            setTimeout(() => e.target.textContent = originalText, 1500);
                        })
                        .catch(() => {
                            alert('Failed to copy to clipboard.');
                        });
                });
            });

            // Bind Revoke key listeners
            document.querySelectorAll('.btn-revoke-key').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const keyId = e.target.getAttribute('data-id');
                    state.apiKeys = state.apiKeys.filter(k => k.id !== keyId);
                    window.saveSmartPayState();
                    this.render();
                });
            });
        },

        handleGenerateApiKey: function () {
            const state = window.SmartPayState;
            
            // Random string helper
            const randHex = (len) => Array.from({length: len}, () => Math.floor(Math.random()*16).toString(16)).join('');
            const newValue = 'sk_test_smartpay_' + randHex(24);
            const dateStr = new Date().toISOString().split('T')[0];

            const newKey = {
                id: 'key_' + Math.floor(Math.random() * 900000 + 100000),
                name: `Secret Key (Generated)`,
                value: newValue,
                type: 'Secret',
                created: dateStr
            };

            state.apiKeys.push(newKey);
            window.saveSmartPayState();
            this.render();
        },

        handleSaveWebhookUrl: function () {
            const state = window.SmartPayState;
            const input = document.getElementById('dev-webhook-url');
            if (!input) return;

            const saveBtn = document.getElementById('btn-save-webhook');
            const url = input.value.trim();

            state.webhookUrl = url;
            window.saveSmartPayState();

            if (saveBtn) {
                const orig = saveBtn.textContent;
                saveBtn.textContent = 'Saved!';
                setTimeout(() => saveBtn.textContent = orig, 1500);
            }
        },

        handleTestWebhookDispatch: function () {
            const state = window.SmartPayState;
            const url = state.webhookUrl;

            if (!url) {
                alert('Please save a webhook endpoint URL first to dispatch test webhooks.');
                return;
            }

            // Create webhook event object
            const testPayload = {
                id: 'evt_test_' + Math.floor(Math.random() * 9000000 + 1000000),
                object: 'event',
                type: 'payment.succeeded',
                created: Math.floor(Date.now() / 1000),
                api_version: '2026-06-24',
                data: {
                    object: {
                        id: 'tx_test_' + Math.floor(Math.random() * 900000 + 100000),
                        object: 'charge',
                        amount: 5000,
                        currency: 'USD',
                        status: 'succeeded',
                        gateway: 'stripe_mock',
                        paid: true,
                        captured: true,
                        created: Math.floor(Date.now() / 1000)
                    }
                }
            };

            // Log output to playground consoles (if initialized)
            if (window.SmartPayPlayground && typeof window.SmartPayPlayground.logToConsole === 'function') {
                window.SmartPayPlayground.logToConsole('webhook-logs', `Mock Dispatch triggered externally: payment.succeeded`, 'info');
                window.SmartPayPlayground.logToConsole('webhook-logs', testPayload, 'info');
            }

            // Trigger real request
            fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(testPayload)
            })
            .then(res => {
                alert(`Test Webhook sent successfully!\nResponse Status: ${res.status}`);
            })
            .catch(err => {
                alert(`Webhook dispatch failed.\nError details: ${err.message}`);
            });
        },

        renderDocs: function (tabId) {
            const viewport = document.getElementById('docs-code-viewport');
            if (!viewport) return;

            const state = window.SmartPayState;
            const sKey = state.apiKeys.find(k => k.type === 'Secret')?.value || 'sk_test_smartpay_••••••••••••';

            let snippet = '';

            if (tabId === 'code-node') {
                snippet = `
<span class="json-key">const</span> smartpay = <span class="json-key">require</span>(<span class="json-string">'@smartpay/sdk'</span>)(<span class="json-string">'${sKey}'</span>);

<span class="json-key">async function</span> <span class="json-number">processPayment</span>() {
  <span class="json-key">try</span> {
    <span class="json-key">const</span> charge = <span class="json-key">await</span> smartpay.charges.create({
      <span class="json-key">amount</span>: <span class="json-number">5000</span>, <span class="json-muted">// $50.00</span>
      <span class="json-key">currency</span>: <span class="json-string">'USD'</span>,
      <span class="json-key">source</span>: <span class="json-string">'tok_visa_decline_none'</span>,
      <span class="json-key">metadata</span>: {
        <span class="json-key">customer_country</span>: <span class="json-string">'US'</span>
      }
    });

    console.log(<span class="json-string">'Charge Succeeded via:'</span>, charge.gateway);
  } <span class="json-key">catch</span> (error) {
    console.error(<span class="json-string">'Charge Failed:'</span>, error.message);
  }
}
`;
            } else if (tabId === 'code-python') {
                snippet = `
<span class="json-key">import</span> smartpay

smartpay.api_key = <span class="json-string">"${sKey}"</span>

<span class="json-key">def</span> <span class="json-number">process_payment</span>():
    <span class="json-key">try</span>:
        charge = smartpay.Charge.create(
            amount=<span class="json-number">5000</span>, <span class="json-muted"># $50.00</span>
            currency=<span class="json-string">"USD"</span>,
            source=<span class="json-string">"tok_visa"</span>,
            metadata={
                <span class="json-string">"customer_country"</span>: <span class="json-string">"US"</span>
            }
        )
        print(f<span class="json-string">"Charge Succeeded via: {charge.gateway}"</span>)
    <span class="json-key">except</span> smartpay.error.CardError <span class="json-key">as</span> e:
        print(f<span class="json-string">"Card Declined: {e.message}"</span>)
`;
            } else if (tabId === 'code-curl') {
                snippet = `
curl https://api.smartpay.io/v1/charges \\
  -u <span class="json-string">${sKey}</span>: \\
  -d <span class="json-key">amount</span>=<span class="json-number">5000</span> \\
  -d <span class="json-key">currency</span>=USD \\
  -d <span class="json-key">source</span>=tok_visa \\
  -d <span class="json-key">metadata[customer_country]</span>=US
`;
            } else if (tabId === 'code-go') {
                snippet = `
<span class="json-key">package</span> main

<span class="json-key">import</span> (
	<span class="json-string">"fmt"</span>
	<span class="json-string">"github.com/smartpay/smartpay-go"</span>
)

<span class="json-key">func</span> <span class="json-number">main</span>() {
	smartpay.Key = <span class="json-string">"${sKey}"</span>

	params := &smartpay.ChargeParams{
		Amount:   smartpay.Int64(<span class="json-number">5000</span>),
		Currency: smartpay.String(<span class="json-string">"USD"</span>),
		Source:   smartpay.String(<span class="json-string">"tok_visa"</span>),
	}
	params.AddMetadata(<span class="json-string">"customer_country"</span>, <span class="json-string">"US"</span>)

	charge, err := charge.New(params)
	<span class="json-key">if</span> err != nil {
		fmt.Println(<span class="json-string">"Failed:"</span>, err.Error())
		<span class="json-key">return</span>
	}
	fmt.Printf(<span class="json-string">"Succeeded via: %s\\n"</span>, charge.Gateway)
}
`;
            }

            viewport.innerHTML = `<pre>${snippet.trim()}</pre>`;
        }
    };

    // Initialize developer module on load
    window.addEventListener('DOMContentLoaded', () => {
        window.SmartPayDeveloper.init();
    });

})();
