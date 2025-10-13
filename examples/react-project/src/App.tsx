import './App.css'
import { AptosConfig, Network, Aptos } from '@aptos-labs/ts-sdk'
import {BuildScriptComposerTransaction, CallArgument, getModuleInner} from "@aptos-labs/script-composer-sdk"
import { useState } from 'react'

function App() {
  const [showModal, setShowModal] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);
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
        builder: async (composer) => {
          composer.storeModule(aptos_account_module)

          await composer.addBatchedCalls({
            function: '0x1::aptos_account::transfer',
            functionArguments: [ CallArgument.newSigner(0) ,'0x1', 1],
            typeArguments: [],
            moduleAbi: aptos_account_module.abi,
            moduleBytecodes: [aptos_account_module.bytecode],
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
    <>
      <button 
        onClick={transfer}
        disabled={isLoading}
        style={{
          padding: '8px 16px',
          fontSize: '14px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          opacity: isLoading ? 0.7 : 1,
          position: 'relative'
        }}
      >
        {isLoading ? 'Simulating...' : 'Simulate Transaction'}
      </button>
      
      {showModal && (
        <div 
          onClick={handleModalClick}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}
        >
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            width: '80%',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflow: 'auto',
            position: 'relative'
          }}>
            <button 
              onClick={() => setShowModal(false)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '5px',
                color: '#666'
              }}
            >
              ×
            </button>
            <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Transaction Simulation Result</h3>
            <pre style={{
              backgroundColor: '#f5f5f5',
              padding: '15px',
              borderRadius: '4px',
              overflow: 'auto',
              margin: 0,
              fontSize: '14px',
              lineHeight: '1.5',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              textAlign: 'left',
              display: 'block'
            }}>
              {JSON.stringify(simulationResult, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </>
  )
}

export default App
