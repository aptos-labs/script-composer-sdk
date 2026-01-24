import './App.css'
import { AptosConfig, Network, Aptos } from '@aptos-labs/ts-sdk'
import { BuildScriptComposerTransaction, CallArgument, getModuleInner } from "@aptos-labs/script-composer-sdk"
import { useState, useMemo } from 'react'
import { Highlight } from 'prism-react-renderer'
import { themes } from 'prism-react-renderer'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from './components/LanguageSwitcher'

function App() {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Form state
  const [senderAddress, setSenderAddress] = useState('0x1');
  const [receiverAddress, setReceiverAddress] = useState('0x1');
  const [amount, setAmount] = useState('1');
  const [useCache, setUseCache] = useState(true);

  // Generate code snippet based on current form state
  const codeSnippet = useMemo(() => {
    const amountNum = parseFloat(amount) || 1;
    return `import { BuildScriptComposerTransaction, CallArgument, getModuleInner } from '@aptos-labs/script-composer-sdk';
import { AptosConfig, Network, Aptos } from '@aptos-labs/ts-sdk';

async function buildAndSimulateTransaction() {
  ${useCache ? `// Fetch and cache the module
  const aptos_account_module = await getModuleInner({
    aptosConfig: new AptosConfig({ network: Network.TESTNET }),
    accountAddress: '0x1',
    moduleName: 'aptos_account',
  });` : '// Module will be auto-fetched during transaction building'}

  // Build the transaction
  const tx = await BuildScriptComposerTransaction({
    sender: "${senderAddress.trim()}",
    builder: async (composer) => {
      ${useCache ? 'composer.storeModule(aptos_account_module);' : ''}
      
      await composer.addBatchedCalls({
        function: '0x1::aptos_account::transfer',
        functionArguments: [
          CallArgument.newSigner(0),
          "${receiverAddress.trim()}",
          ${amountNum}
        ],
        typeArguments: [],
        ${useCache ? `moduleAbi: aptos_account_module.abi,
        moduleBytecodes: [aptos_account_module.bytecode],` : ''}
        options: {
          allowFetch: ${!useCache},
        },
      });
      return composer;
    },
    aptosConfig: new AptosConfig({
      network: Network.TESTNET,
    }),
  });

  // Simulate the transaction
  const aptos = new Aptos(new AptosConfig({
    network: Network.TESTNET,
  }));

  const simulate_result = await aptos.transaction.simulate.simple({
    transaction: tx,
  });

  console.log('Simulation result:', simulate_result);
}`;
  }, [senderAddress, receiverAddress, amount, useCache]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(codeSnippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  async function handleSimulate() {
    setIsLoading(true);
    setError(null);
    setShowModal(false);
    
    try {
      // Validate input
      if (!senderAddress.trim() || !receiverAddress.trim() || !amount.trim()) {
        setError(t('errors.fillAllFields'));
        setIsLoading(false);
        return;
      }

      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        setError(t('errors.invalidAmount'));
        setIsLoading(false);
        return;
      }

      let aptos_account_module: any;
      
      if (useCache) {
        // Use cache mode - fetch and store module
        aptos_account_module = await getModuleInner({
          aptosConfig: new AptosConfig({ network: Network.TESTNET }),
          accountAddress: '0x1',
          moduleName: 'aptos_account',
        });
      }

      const tx = await BuildScriptComposerTransaction({
        sender: senderAddress.trim(),
        builder: async (composer) => {
          if (useCache && aptos_account_module) {
            composer.storeModule(aptos_account_module);
          }

          await composer.addBatchedCalls({
            function: '0x1::aptos_account::transfer',
            functionArguments: [
              CallArgument.newSigner(0),
              receiverAddress.trim(),
              amountNum
            ],
            typeArguments: [],
            moduleAbi: aptos_account_module?.abi,
            moduleBytecodes: aptos_account_module ? [aptos_account_module.bytecode] : undefined,
            options: {
              allowFetch: !useCache,
            },
          });
          return composer;
        },
        aptosConfig: new AptosConfig({
          network: Network.TESTNET,
        }),
      });

      const aptos = new Aptos(new AptosConfig({
        network: Network.TESTNET,
      }));

      const simulate_result = await aptos.transaction.simulate.simple({
        transaction: tx,
      });

      setSimulationResult(simulate_result);
      setShowModal(true);
      setError(null);
    } catch (err: any) {
      console.error('Error:', err);
      setError(err?.message || t('errors.simulationFailed'));
    } finally {
      setIsLoading(false);
    }
  }

  const handleModalClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setShowModal(false);
    }
  };

  return (
    <div className="app-container">
      <div className="main-content">
        <header className="header">
          <div className="language-switcher-container">
            <LanguageSwitcher />
          </div>
          <h1>{t('common.title')}</h1>
          <p className="subtitle">{t('common.subtitle')}</p>
        </header>

        <div className="form-card">
          <h2 className="form-title">{t('form.title')}</h2>
          
          <div className="form-group">
            <label htmlFor="sender">{t('form.senderAddress')} <span style={{ color: '#c33' }}>*</span></label>
            <input
              id="sender"
              type="text"
              value={senderAddress}
              onChange={(e) => setSenderAddress(e.target.value)}
              placeholder="0x1"
              disabled={isLoading}
              className="input-field"
            />
          </div>

          <div className="form-group">
            <label htmlFor="receiver">{t('form.receiverAddress')} <span style={{ color: '#c33' }}>*</span></label>
            <input
              id="receiver"
              type="text"
              value={receiverAddress}
              onChange={(e) => setReceiverAddress(e.target.value)}
              placeholder="0x1"
              disabled={isLoading}
              className="input-field"
            />
          </div>

          <div className="form-group">
            <label htmlFor="amount">{t('form.amount')} <span style={{ color: '#c33' }}>*</span></label>
            <input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1"
              min="0"
              step="0.00000001"
              disabled={isLoading}
              className="input-field"
            />
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={useCache}
                onChange={(e) => setUseCache(e.target.checked)}
                disabled={isLoading}
              />
              <span>{t('form.useCache')}</span>
            </label>
            <small className="hint">{t('form.cacheHint')}</small>
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <button
            onClick={handleSimulate}
            disabled={isLoading}
            className="submit-button"
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                {t('buttons.simulating')}
              </>
            ) : (
              t('buttons.simulate')
            )}
          </button>
        </div>

        {/* Code Display Section */}
        <div className="code-section">
          <div className="code-header">
            <h3 className="code-title">{t('code.title')}</h3>
            <div className="code-actions">
              <button
                onClick={() => setShowCode(!showCode)}
                className="code-toggle-button"
              >
                {showCode ? t('buttons.hideCode') : t('buttons.showCode')}
              </button>
              {showCode && (
                <button
                  onClick={handleCopyCode}
                  className="code-copy-button"
                >
                  {copied ? t('buttons.copied') : t('buttons.copyCode')}
                </button>
              )}
            </div>
          </div>
          {showCode && (
            <div className="code-block-wrapper">
              <Highlight
                code={codeSnippet}
                language="typescript"
                theme={themes.nightOwl}
              >
                {({ className, style, tokens, getLineProps, getTokenProps }) => (
                  <pre className={className} style={{ ...style, margin: 0, borderRadius: '8px', padding: '1.5rem', fontSize: '0.85rem', lineHeight: '1.6' }}>
                    {tokens.map((line, i) => (
                      <div key={i} {...getLineProps({ line })}>
                        {line.map((token, key) => (
                          <span key={key} {...getTokenProps({ token })} />
                        ))}
                      </div>
                    ))}
                  </pre>
                )}
              </Highlight>
            </div>
          )}
        </div>

        {showModal && simulationResult && (
          <div
            className="modal-overlay"
            onClick={handleModalClick}
          >
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setShowModal(false)}
                className="close-button"
                aria-label={t('buttons.close')}
              >
                ×
              </button>
              
              <h2 className="modal-title">{t('results.title')}</h2>
              
              <div className="result-section">
                <h3>{t('results.status')}</h3>
                <div className="status-badge success">
                  {simulationResult[0]?.success ? t('results.success') : t('results.failure')}
                </div>
              </div>

              {simulationResult[0] && (
                <>
                  <div className="result-section">
                    <h3>{t('results.gasFees')}</h3>
                    <div className="info-box">
                      <div className="info-item">
                        <span className="info-label">{t('results.gasUsed')}:</span>
                        <span className="info-value">{simulationResult[0].gas_used || 'N/A'}</span>
                      </div>
                      {simulationResult[0].gas_unit_price && (
                        <div className="info-item">
                          <span className="info-label">{t('results.gasUnitPrice')}:</span>
                          <span className="info-value">{simulationResult[0].gas_unit_price}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {simulationResult[0].vm_status && (
                    <div className="result-section">
                      <h3>{t('results.vmStatus')}</h3>
                      <div className="info-box">
                        <code className="vm-status">{simulationResult[0].vm_status}</code>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="result-section">
                <h3>{t('results.fullResponse')}</h3>
                <details className="json-details">
                  <summary className="json-summary">{t('results.viewJson')}</summary>
                  <pre className="json-display">
                    {JSON.stringify(simulationResult, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App
