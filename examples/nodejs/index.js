import { BuildScriptComposerTransaction } from 'script-composer-sdk';
import { AptosConfig, Network, getAptosFullNode, AccountAddress, Aptos } from "@aptos-labs/ts-sdk"
import { CallArgument } from '@aptos-labs/script-composer-pack';

async function getModuleInner(args) {
  const { aptosConfig, accountAddress, moduleName, options } = args;

  const { data } =  await getAptosFullNode({
    aptosConfig,
    originMethod: 'getModule',
    path: `accounts/${AccountAddress.from(accountAddress).toString()}/module/${moduleName}`,
    params: { ledger_version: options?.ledgerVersion },
  });
  return data;
}

async function main() {
  const aptos_account_module = await getModuleInner({
    aptosConfig: new AptosConfig({ network: Network.TESTNET }),
    accountAddress: '0x1',
    moduleName: 'aptos_account',
  });
  try {
   const tx = await BuildScriptComposerTransaction({
    sender: "0x1",
    builder: async (composer) => {
      composer.storeModule(aptos_account_module)

      await composer.addBatchedCalls({
        function: '0x1::aptos_account::transfer',
        functionArguments: [ CallArgument.newSigner(0) ,'0x1', 1],
        typeArguments: [],
        moduleAbi: aptos_account_module.abi,
      });
      return composer
    },
    aptosConfig: new AptosConfig({
      network: Network.TESTNET,
    }),
   });

   const aptos = new Aptos({
    network: Network.TESTNET,
   })

   const simulate_result = await aptos.transaction.simulate.simple({
    transaction: tx,
   })

   console.log(simulate_result)
    
  } catch (error) {
    console.error('Error:', error);
  }
}

await main(); 