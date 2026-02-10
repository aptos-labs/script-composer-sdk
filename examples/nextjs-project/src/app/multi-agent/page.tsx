'use client';

import { useState, useMemo } from 'react';
import { AptosConfig, Network, MultiAgentTransaction } from '@aptos-labs/ts-sdk';
import { BuildScriptComposerMultiAgentTransaction, CallArgument, getModuleInner, AptosScriptComposer } from "@aptos-labs/script-composer-sdk";
import Link from 'next/link';
import { Highlight } from 'prism-react-renderer';
import { themes } from 'prism-react-renderer';
import { useI18n } from '../../i18n/client';
import LanguageSwitcher from '../components/LanguageSwitcher';
import ThemeToggle from '../components/ThemeToggle';

type ScenarioType = 'basic' | 'secondary' | 'feePayer' | 'complete';

/**
 * Converts APT (decimal) to Octas (integer)
 * 1 APT = 10^8 Octas = 100,000,000 Octas
 */
function aptToOctas(apt: number): number {
  return Math.floor(apt * 100_000_000);
}

export default function MultiAgentPage() {
  const { t, mounted } = useI18n();
  const [scenario, setScenario] = useState<ScenarioType>('basic');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transaction, setTransaction] = useState<MultiAgentTransaction | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Form state
  const [senderAddress, setSenderAddress] = useState('0x1');
  const [secondarySigners, setSecondarySigners] = useState<string[]>(['']);
  const [feePayerAddress, setFeePayerAddress] = useState('');
  const [receiverAddress, setReceiverAddress] = useState('0x1');
  const [amount, setAmount] = useState('1');

  const addSecondarySigner = () => {
    setSecondarySigners([...secondarySigners, '']);
  };

  const removeSecondarySigner = (index: number) => {
    setSecondarySigners(secondarySigners.filter((_, i) => i !== index));
  };

  const updateSecondarySigner = (index: number, value: string) => {
    const updated = [...secondarySigners];
    updated[index] = value;
    setSecondarySigners(updated);
  };

  const getValidSecondarySigners = () => {
    return secondarySigners.filter(addr => addr.trim() !== '');
  };

  // Generate code snippet based on current form state and scenario
  const codeSnippet = useMemo(() => {
    const amountNum = parseFloat(amount) || 1;
    const amountInOctas = aptToOctas(amountNum);
    const validSigners = secondarySigners.filter(addr => addr.trim() !== '');
    const hasSecondarySigners = (scenario === 'secondary' || scenario === 'complete') && validSigners.length > 0;
    const hasFeePayer = (scenario === 'feePayer' || scenario === 'complete') && feePayerAddress.trim();

    let secondarySignersCode = '';
    if (hasSecondarySigners) {
      const signersArray = validSigners.map(addr => `"${addr.trim()}"`).join(', ');
      secondarySignersCode = `    secondarySignerAddresses: [${signersArray}],\n`;
    }

    let feePayerCode = '';
    if (hasFeePayer) {
      feePayerCode = `    feePayerAddress: "${feePayerAddress.trim()}",\n`;
    }

    return `import { BuildScriptComposerMultiAgentTransaction, CallArgument, getModuleInner } from '@aptos-labs/script-composer-sdk';
import { AptosConfig, Network } from '@aptos-labs/ts-sdk';

async function buildMultiAgentTransaction() {
  // Fetch and cache the module
  const aptos_account_module = await getModuleInner({
    aptosConfig: new AptosConfig({ network: Network.TESTNET }),
    accountAddress: '0x1',
    moduleName: 'aptos_account',
  });

  // Build the multi-agent transaction
  const tx = await BuildScriptComposerMultiAgentTransaction({
    sender: "${senderAddress.trim()}",
${secondarySignersCode}${feePayerCode}    builder: async (composer) => {
      composer.storeModule(aptos_account_module, "0x1::aptos_account");
      
      await composer.addBatchedCalls({
        function: '0x1::aptos_account::transfer',
        functionArguments: [
          CallArgument.newSigner(0),
          "${receiverAddress.trim()}",
          ${amountInOctas} // ${amountNum} APT = ${amountInOctas} Octas
        ],
        typeArguments: [],
        options: {
          allowFetch: false,
        },
        moduleAbi: aptos_account_module.abi,
        moduleBytecodes: [aptos_account_module.bytecode],
      });
      return composer;
    },
    aptosConfig: new AptosConfig({
      network: Network.TESTNET,
    }),
  });

  console.log('Multi-agent transaction created:', tx);
  console.log('Secondary signers:', tx.secondarySignerAddresses);
  console.log('Fee payer:', tx.feePayerAddress || 'None');
}`;
  }, [scenario, senderAddress, receiverAddress, amount, secondarySigners, feePayerAddress]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(codeSnippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  async function handleBuildTransaction() {
    setIsLoading(true);
    setError(null);
    setTransaction(null);
    
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

      // Validate based on scenario
      if ((scenario === 'secondary' || scenario === 'complete') && getValidSecondarySigners().length === 0) {
        setError(t('errors.addSecondarySigner'));
        setIsLoading(false);
        return;
      }

      if ((scenario === 'feePayer' || scenario === 'complete') && !feePayerAddress.trim()) {
        setError(t('errors.addFeePayer'));
        setIsLoading(false);
        return;
      }

      // 获取模块
      const aptos_account_module = await getModuleInner({
        aptosConfig: new AptosConfig({ network: Network.TESTNET }),
        accountAddress: '0x1',
        moduleName: 'aptos_account',
      });

      // Build transaction arguments
      interface TxArgs {
        sender: string;
        builder: (composer: AptosScriptComposer) => Promise<AptosScriptComposer>;
        aptosConfig: AptosConfig;
        secondarySignerAddresses?: string[];
        feePayerAddress?: string;
      }
      
      const txArgs: TxArgs = {
        sender: senderAddress.trim(),
        builder: async (composer: AptosScriptComposer) => {
          composer.storeModule(aptos_account_module, "0x1::aptos_account");
          await composer.addBatchedCalls({
            function: '0x1::aptos_account::transfer',
            functionArguments: [
              CallArgument.newSigner(0),
              receiverAddress.trim(),
              amountInOctas
            ],
            typeArguments: [],
            options: {
              allowFetch: false,
            },
            moduleAbi: aptos_account_module.abi,
            moduleBytecodes: [aptos_account_module.bytecode],
          });
          return composer;
        },
        aptosConfig: new AptosConfig({
          network: Network.TESTNET,
        }),
      };

      // 根据场景添加参数
      if (scenario === 'secondary' || scenario === 'complete') {
        txArgs.secondarySignerAddresses = getValidSecondarySigners();
      }

      if (scenario === 'feePayer' || scenario === 'complete') {
        txArgs.feePayerAddress = feePayerAddress.trim();
      }

      const tx = await BuildScriptComposerMultiAgentTransaction(txArgs);
      setTransaction(tx);
      setError(null);
    } catch (err) {
      console.error('Error:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage || t('errors.simulationFailed'));
    } finally {
      setIsLoading(false);
    }
  }

  const scenarios = [
    { id: 'basic' as ScenarioType, color: 'blue' },
    { id: 'secondary' as ScenarioType, color: 'green' },
    { id: 'feePayer' as ScenarioType, color: 'purple' },
    { id: 'complete' as ScenarioType, color: 'indigo' },
  ];

  if (!mounted) {
    return null; // Prevent hydration mismatch
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="absolute top-4 right-4 z-10 flex gap-2 items-center">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
        <div className="mb-6">
          <Link href="/" className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 font-medium">
            {t('common.backToHome')}
          </Link>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            {t('multiAgent.title')}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {t('multiAgent.subtitle')}
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左侧：表单区域 */}
          <div className="space-y-6">
            {/* Scenario Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">{t('multiAgent.selectScenario')}</h2>
              <div className="space-y-3">
                {scenarios.map((s) => (
                  <label
                    key={s.id}
                    className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      scenario === s.id
                        ? s.color === 'blue' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400' :
                          s.color === 'green' ? 'border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-400' :
                          s.color === 'purple' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-400' :
                          'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-400'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="scenario"
                      value={s.id}
                      checked={scenario === s.id}
                      onChange={(e) => setScenario(e.target.value as ScenarioType)}
                      className="mt-1 mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800 dark:text-white">{t(`multiAgent.scenarios.${s.id}.name`)}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t(`multiAgent.scenarios.${s.id}.desc`)}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Transaction Parameters Form */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">{t('multiAgent.transactionParams')}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('multiAgent.form.senderAddress')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={senderAddress}
                    onChange={(e) => setSenderAddress(e.target.value)}
                    placeholder="0x1"
                    disabled={isLoading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 text-gray-900 dark:text-gray-100 dark:bg-gray-800 dark:border-gray-600"
                  />
                </div>

                {(scenario === 'secondary' || scenario === 'complete') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('multiAgent.form.secondarySigners')}
                    </label>
                    {secondarySigners.map((signer, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={signer}
                          onChange={(e) => updateSecondarySigner(index, e.target.value)}
                          placeholder={t('multiAgent.form.signerPlaceholder', { index: index + 1 })}
                          disabled={isLoading}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 text-gray-900 dark:text-gray-100 dark:bg-gray-800 dark:border-gray-600"
                        />
                        {secondarySigners.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSecondarySigner(index)}
                            disabled={isLoading}
                            className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50"
                          >
                            {t('buttons.remove')}
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addSecondarySigner}
                      disabled={isLoading}
                      className="mt-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 text-sm"
                    >
                      {t('buttons.addSigner')}
                    </button>
                  </div>
                )}

                {(scenario === 'feePayer' || scenario === 'complete') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('multiAgent.form.feePayerAddress')}
                    </label>
                    <input
                      type="text"
                      value={feePayerAddress}
                      onChange={(e) => setFeePayerAddress(e.target.value)}
                      placeholder="0x4"
                      disabled={isLoading}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 text-gray-900 dark:text-gray-100 dark:bg-gray-800 dark:border-gray-600"
                    />
                    <p className="text-xs text-gray-500 mt-1">{t('multiAgent.form.feePayerHint')}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('multiAgent.form.receiverAddress')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={receiverAddress}
                    onChange={(e) => setReceiverAddress(e.target.value)}
                    placeholder="0x1"
                    disabled={isLoading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 text-gray-900 dark:text-gray-100 dark:bg-gray-800 dark:border-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('multiAgent.form.amount')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="1"
                    min="0"
                    step="0.00000001"
                    disabled={isLoading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 text-gray-900 dark:text-gray-100 dark:bg-gray-800 dark:border-gray-600"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
                    ⚠️ {error}
                  </div>
                )}

                <button
                  onClick={handleBuildTransaction}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>{t('buttons.building')}</span>
                    </>
                  ) : (
                    <span>{t('buttons.build')}</span>
                  )}
                </button>
              </div>
            </div>

            {/* Code Display Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">{t('multiAgent.codeExample')}</h3>
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
          </div>

          {/* Right: Results Display */}
          <div className="space-y-6">
            {transaction ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">{t('multiAgent.results.transactionDetails')}</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">{t('multiAgent.results.transactionType')}</h3>
                    <div className="bg-indigo-100 text-indigo-800 px-3 py-2 rounded-lg inline-block font-semibold">
                      {t('multiAgent.results.multiAgent')}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">{t('multiAgent.results.sender')}</h3>
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg font-mono text-sm text-gray-900 dark:text-gray-100">
                      {transaction.rawTransaction.sender.toString()}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">{t('multiAgent.results.secondarySigners')}</h3>
                    {transaction.secondarySignerAddresses.length > 0 ? (
                      <div className="space-y-2">
                        {transaction.secondarySignerAddresses.map((addr, index: number) => (
                          <div key={index} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg font-mono text-sm text-gray-900 dark:text-gray-100">
                            {addr.toString()}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-400 italic">{t('multiAgent.results.none')}</div>
                    )}
                  </div>

                  {transaction.feePayerAddress && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">{t('multiAgent.results.feePayer')}</h3>
                      <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg font-mono text-sm text-purple-800 dark:text-purple-300">
                        {transaction.feePayerAddress.toString()}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">{t('multiAgent.results.sequenceNumber')}</h3>
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg font-mono text-sm text-gray-900 dark:text-gray-100">
                      {transaction.rawTransaction.sequence_number.toString()}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">{t('multiAgent.results.gasUnitPrice')}</h3>
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg font-mono text-sm text-gray-900 dark:text-gray-100">
                      {transaction.rawTransaction.gas_unit_price.toString()}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">{t('multiAgent.results.maxGasAmount')}</h3>
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg font-mono text-sm text-gray-900 dark:text-gray-100">
                      {transaction.rawTransaction.max_gas_amount.toString()}
                    </div>
                  </div>

                  <details className="border border-gray-200 rounded-lg overflow-hidden">
                    <summary className="bg-gray-50 dark:bg-gray-700 px-4 py-3 cursor-pointer font-medium text-purple-600 dark:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-600">
                      {t('multiAgent.results.viewFullObject')}
                    </summary>
                    <pre className="bg-gray-900 text-gray-100 p-4 overflow-x-auto text-xs font-mono max-h-96 overflow-y-auto">
                      {JSON.stringify({
                        sender: transaction.rawTransaction.sender.toString(),
                        secondarySigners: transaction.secondarySignerAddresses.map((a) => a.toString()),
                        feePayer: transaction.feePayerAddress?.toString() || null,
                        sequenceNumber: transaction.rawTransaction.sequence_number.toString(),
                        gasUnitPrice: transaction.rawTransaction.gas_unit_price.toString(),
                        maxGasAmount: transaction.rawTransaction.max_gas_amount.toString(),
                      }, null, 2)}
                    </pre>
                  </details>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="text-center text-gray-400 py-12">
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-lg">{t('multiAgent.results.noTransaction')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
