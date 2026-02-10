import { AptosConfig, Network, Aptos } from '@aptos-labs/ts-sdk'
import { BuildScriptComposerTransaction, CallArgument, getModuleInner } from "@aptos-labs/script-composer-sdk"
import { useState, useMemo } from 'react'
import { Highlight } from 'prism-react-renderer'
import { themes } from 'prism-react-renderer'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from './components/LanguageSwitcher'
import MultiAgentDemo from './components/MultiAgentDemo'
import ThemeToggle from './components/ThemeToggle'

type ViewType = 'simple' | 'multiAgent';

/**
 * Converts APT (decimal) to Octas (integer)
 * 1 APT = 10^8 Octas = 100,000,000 Octas
 */
function aptToOctas(apt: number): number {
  return Math.floor(apt * 100_000_000);
}

function App() {
  const { t } = useTranslation();
  const [currentView, setCurrentView] = useState<ViewType>('simple');
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
    const amountInOctas = aptToOctas(amountNum);
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
          ${amountInOctas} // ${amountNum} APT = ${amountInOctas} Octas
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

      // Convert APT to Octas (1 APT = 10^8 Octas)
      const amountInOctas = aptToOctas(amountNum);

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
              amountInOctas
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

  if (currentView === 'multiAgent') {
    return (
      <div>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <div className="container mx-auto px-4 py-8">
            <header className="text-center mb-6 relative">
              <div className="absolute top-4 right-4 z-10 flex gap-2 items-center">
                <ThemeToggle />
                <LanguageSwitcher />
              </div>
              <button
                onClick={() => setCurrentView('simple')}
                className="absolute top-4 left-4 px-4 py-2 bg-white/20 dark:bg-gray-800/20 text-white dark:text-gray-300 border border-white/30 dark:border-gray-700 rounded-lg text-sm font-medium transition-all hover:bg-white/30 dark:hover:bg-gray-800/30"
              >
                ← {t('common.title')}
              </button>
            </header>
          </div>
        </div>
        <MultiAgentDemo />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-12">
        <div className="absolute top-4 right-4 z-10 flex gap-2 items-center">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            {t('common.title')}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-6">
            {t('common.subtitle')}
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setCurrentView('multiAgent')}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {t('multiAgent.title')} →
            </button>
          </div>
        </div>

        <div className="w-full max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{t('form.title')}</h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm">{t('form.description')}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="sender" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('form.senderAddress')} <span className="text-red-500">*</span>
                </label>
                <input
                  id="sender"
                  type="text"
                  value={senderAddress}
                  onChange={(e) => setSenderAddress(e.target.value)}
                  placeholder="0x1"
                  disabled={isLoading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all text-gray-900 dark:text-gray-100 dark:bg-gray-800 dark:border-gray-600"
                />
              </div>

              <div>
                <label htmlFor="receiver" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('form.receiverAddress')} <span className="text-red-500">*</span>
                </label>
                <input
                  id="receiver"
                  type="text"
                  value={receiverAddress}
                  onChange={(e) => setReceiverAddress(e.target.value)}
                  placeholder="0x1"
                  disabled={isLoading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all text-gray-900 dark:text-gray-100 dark:bg-gray-800 dark:border-gray-600"
                />
              </div>

              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('form.amount')} <span className="text-red-500">*</span>
                </label>
                <input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="1"
                  min="0"
                  step="0.00000001"
                  disabled={isLoading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all text-gray-900 dark:text-gray-100 dark:bg-gray-800 dark:border-gray-600"
                />
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useCache}
                    onChange={(e) => setUseCache(e.target.checked)}
                    disabled={isLoading}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('form.useCache')}</span>
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">{t('form.cacheHint')}</p>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg flex items-center space-x-2">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={handleSimulate}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{t('buttons.simulating')}</span>
                  </>
                ) : (
                  <span>{t('buttons.simulate')}</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Code Display Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mt-6 w-full max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">{t('code.title')}</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCode(!showCode)}
                className="px-4 py-2 border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-600 hover:text-white transition-all font-medium"
              >
                {showCode ? t('buttons.hideCode') : t('buttons.showCode')}
              </button>
              {showCode && (
                <button
                  onClick={handleCopyCode}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all font-medium"
                >
                  {copied ? t('buttons.copied') : t('buttons.copyCode')}
                </button>
              )}
            </div>
          </div>
          {showCode && (
            <div className="overflow-hidden rounded-lg">
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
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={handleModalClick}
          >
            <div
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-xl">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t('results.title')}</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-3xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label={t('buttons.close')}
                >
                  ×
                </button>
              </div>

              <div className="p-6 space-y-6">
                {simulationResult[0] && (
                  <>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">{t('results.status')}</h3>
                      <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                        simulationResult[0].success
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                      }`}>
                        {simulationResult[0].success ? t('results.success') : t('results.failure')}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">{t('results.gasFees')}</h3>
                      <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400 font-medium">{t('results.gasUsed')}:</span>
                          <span className="text-gray-900 dark:text-gray-100 font-mono font-semibold">
                            {simulationResult[0].gas_used || 'N/A'}
                          </span>
                        </div>
                        {simulationResult[0].gas_unit_price && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400 font-medium">{t('results.gasUnitPrice')}:</span>
                            <span className="text-gray-900 dark:text-gray-100 font-mono font-semibold">
                              {simulationResult[0].gas_unit_price}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {simulationResult[0].vm_status && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">{t('results.vmStatus')}</h3>
                        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                          {simulationResult[0].vm_status}
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div>
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">{t('results.fullResponse')}</h3>
                  <details className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                    <summary className="bg-gray-50 dark:bg-gray-700 px-4 py-3 cursor-pointer font-medium text-purple-600 dark:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                      {t('results.viewJson')}
                    </summary>
                    <pre className="bg-gray-900 text-gray-100 p-4 overflow-x-auto text-sm font-mono">
                      {JSON.stringify(simulationResult, null, 2)}
                    </pre>
                  </details>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App
