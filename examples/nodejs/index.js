import { BuildScriptComposerTransaction, CallArgument, getModuleInner } from '@aptos-labs/script-composer-sdk';
import { AptosConfig, Network, Aptos } from "@aptos-labs/ts-sdk"

// Example using local cache
async function mainWithCache() {
  const aptos_account_module = await getModuleInner({
    aptosConfig: new AptosConfig({ network: Network.TESTNET }),
    accountAddress: '0x1',
    moduleName: 'aptos_account',
  });
  try {
   const tx = await BuildScriptComposerTransaction({
    sender: "0x1",
    builder: async (composer) => {
      // Store the module in cache first
      composer.storeModule(aptos_account_module, "0x1::aptos_account");
      await composer.addBatchedCalls({
        function: '0x1::aptos_account::transfer',
        functionArguments: [ CallArgument.newSigner(0) ,'0x1', 1],
        typeArguments: [],
        // Do not allow auto fetch
        options: {
          allowFetch: false,
        }
        // moduleAbi: aptos_account_module.abi,
      });
      return composer
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
   })

   console.log('simulate_result (cache):', simulate_result)
    
  } catch (error) {
    console.error('Error (cache):', error);
  }
}

// Example using auto fetch
async function mainWithFetch() {
  try {
   const tx = await BuildScriptComposerTransaction({
    sender: "0x1",
    builder: async (composer) => {
      await composer.addBatchedCalls({
        function: '0x1::aptos_account::transfer',
        functionArguments: [ CallArgument.newSigner(0) ,'0x1', 1],
        typeArguments: [],
        // Allow auto fetch
        options: {
          allowFetch: true,
        }
      });
      return composer
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
   })

   console.log('simulate_result (fetch):', simulate_result)
    
  } catch (error) {
    console.error('Error (fetch):', error);
  }
}

await mainWithCache();
await mainWithFetch();