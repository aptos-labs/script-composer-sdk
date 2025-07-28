'use client';

import { useState } from 'react';
import { AptosConfig, Network, Aptos } from '@aptos-labs/ts-sdk';
import { AptosScriptComposer, BuildScriptComposerTransaction, CallArgument, getModuleInner } from "@aptos-labs/script-composer-sdk";

export default function ScriptComposer() {
  const [showModal, setShowModal] = useState(false);
  const [simulationResult, setSimulationResult] = useState<object | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function transfer() {
    setIsLoading(true);
    try {
      const aptos_account_module = await getModuleInner({
        aptosConfig: new AptosConfig({ network: Network.TESTNET }),
        accountAddress: '0x1',
        moduleName: 'aptos_account',
      });
      
      const tx = await BuildScriptComposerTransaction({
        sender: "0x1",
        builder: async (composer: AptosScriptComposer) => {
          composer.storeModule(aptos_account_module)

          await composer.addBatchedCalls({
            function: '0x1::aptos_account::transfer',
            functionArguments: [CallArgument.newSigner(0), '0x1', 1],
            typeArguments: [],
            moduleAbi: aptos_account_module.abi!,
          });
          return composer
        },
        aptosConfig: new AptosConfig({
          network: Network.TESTNET,
        }),
      });

      const aptos = new Aptos(new AptosConfig({
        network: Network.TESTNET,
      }))

      const simulate_result = await aptos.transaction.simulate.simple({
        transaction: tx,
      })

      setSimulationResult(simulate_result);
      setShowModal(true);
    } catch (error) {
      console.error('Error:', error);
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
    <div className="script-composer">
      <button 
        onClick={transfer}
        disabled={isLoading}
        className="simulate-button"
      >
        {isLoading ? 'Simulating...' : 'Simulate Transaction'}
      </button>
      
      {showModal && (
        <div 
          onClick={handleModalClick}
          className="modal-overlay"
        >
          <div className="modal-content">
            <button 
              onClick={() => setShowModal(false)}
              className="close-button"
            >
              ×
            </button>
            <h3>Transaction Simulation Result</h3>
            <pre className="result-display">
              {JSON.stringify(simulationResult, null, 2)}
            </pre>
          </div>
        </div>
      )}

      <style jsx>{`
        .script-composer {
          padding: 20px;
        }
        
        .simulate-button {
          padding: 8px 16px;
          font-size: 14px;
          cursor: pointer;
          background-color: #0070f3;
          color: white;
          border: none;
          border-radius: 4px;
          transition: opacity 0.2s;
        }

        .simulate-button:disabled {
          cursor: not-allowed;
          opacity: 0.7;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0,0,0,0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .modal-content {
          background-color: white;
          padding: 20px;
          border-radius: 8px;
          width: 80%;
          max-width: 600px;
          max-height: 80vh;
          overflow: auto;
          position: relative;
        }

        .close-button {
          position: absolute;
          top: 10px;
          right: 10px;
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          padding: 5px;
          color: #666;
        }

        .result-display {
          background-color: #f5f5f5;
          padding: 15px;
          border-radius: 4px;
          overflow: auto;
          margin: 0;
          font-size: 14px;
          line-height: 1.5;
          white-space: pre-wrap;
          word-break: break-word;
          text-align: left;
          display: block;
        }
      `}</style>
    </div>
  );
} 