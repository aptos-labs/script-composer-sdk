import { expect, test } from 'vitest'
import {AptosScriptComposer, BuildScriptComposerTransaction} from "../src/index"
import { AccountAddress, AccountAddressInput, AptosConfig, fetchModuleAbi, getAptosFullNode, LedgerVersionArg, MoveModuleBytecode, Network } from '@aptos-labs/ts-sdk'
import { CallArgument } from '@aptos-labs/script-composer-pack'

async function getModuleInner(args: {
    aptosConfig: AptosConfig;
    accountAddress: AccountAddressInput;
    moduleName: string;
    options?: LedgerVersionArg;
  }): Promise<MoveModuleBytecode> {
    const { aptosConfig, accountAddress, moduleName, options } = args;
  
    const { data } = await getAptosFullNode<{}, MoveModuleBytecode>({
      aptosConfig,
      originMethod: "getModule",
      path: `accounts/${AccountAddress.from(accountAddress).toString()}/module/${moduleName}`,
      params: { ledger_version: options?.ledgerVersion },
    });
    return data;
}

const coin_module = await getModuleInner(
    {
      aptosConfig:   new AptosConfig({network: Network.TESTNET}),
      accountAddress: "0x1", 
      moduleName: "coin"
    }
);

const fa_module = await getModuleInner(
    {
      aptosConfig:   new AptosConfig({network: Network.TESTNET}),
      accountAddress: "0x1", 
      moduleName: "fungible_asset"
    }
);

const aptos_coin_module = await getModuleInner(
    {
      aptosConfig:   new AptosConfig({network: Network.TESTNET}),
      accountAddress: "0x1", 
      moduleName: "aptos_coin"
    }
);

const primary_fungible_store_module = await getModuleInner(
    {
      aptosConfig:   new AptosConfig({network: Network.TESTNET}),
      accountAddress: "0x1", 
      moduleName: "primary_fungible_store"
    }
);

test('test composer', () => {
    const builder = new AptosScriptComposer(new AptosConfig({network: Network.TESTNET}))

    expect(builder).toBeDefined()
})

test('test composer build txn', async () => {
    const builder = new AptosScriptComposer(new AptosConfig({network: Network.TESTNET}))
 
    builder.storeModule(coin_module);
    builder.storeModule(fa_module);
    builder.storeModule(aptos_coin_module);
    builder.storeModule(primary_fungible_store_module);

    const coin = await builder.addBatchedCalls({
        function: "0x1::coin::withdraw",
        functionArguments: [CallArgument.newSigner(0), 1],
        typeArguments: ["0x1::aptos_coin::AptosCoin"],
        moduleAbi: coin_module.abi!,
    });

    // Passing the coin value to the 0x1::coin::coin_to_fungible_asset to convert a coin
    // into fungible asset.
    const fungibleAsset = await builder.addBatchedCalls({
        function: "0x1::coin::coin_to_fungible_asset",
        // coin[0] represents the first return value from the first call you added.
        functionArguments: [coin[0]],
        typeArguments: ["0x1::aptos_coin::AptosCoin"],
        moduleAbi: coin_module.abi!,
    });
 
    // Deposit the fungibleAsset converted from second call.
    await builder.addBatchedCalls({
        function: "0x1::primary_fungible_store::deposit",
        functionArguments: ["0x1", fungibleAsset[0]],
        typeArguments: [],
        moduleAbi: primary_fungible_store_module.abi!,
    });

    const tx = builder.build();

    expect(tx).toBeDefined();

})


test('test composer build Payload', async () => {
    const builder = new AptosScriptComposer(new AptosConfig({network: Network.TESTNET}))

    builder.storeModule(coin_module);
    builder.storeModule(fa_module);
    builder.storeModule(aptos_coin_module);
    builder.storeModule(primary_fungible_store_module);

    const coin = await builder.addBatchedCalls({
        function: "0x1::coin::withdraw",
        functionArguments: [CallArgument.newSigner(0), 1],
        typeArguments: ["0x1::aptos_coin::AptosCoin"],
        moduleAbi: coin_module.abi!,
    });

    // Passing the coin value to the 0x1::coin::coin_to_fungible_asset to convert a coin
    // into fungible asset.
    const fungibleAsset = await builder.addBatchedCalls({
        function: "0x1::coin::coin_to_fungible_asset",
        // coin[0] represents the first return value from the first call you added.
        functionArguments: [coin[0]],
        typeArguments: ["0x1::aptos_coin::AptosCoin"],
        moduleAbi: coin_module.abi!,
    });
 
    // Deposit the fungibleAsset converted from second call.
    await builder.addBatchedCalls({
        function: "0x1::primary_fungible_store::deposit",
        functionArguments: ["0x1", fungibleAsset[0]],
        typeArguments: [],
        moduleAbi: primary_fungible_store_module.abi!,
    });

    const payload = builder.build_payload();

    expect(payload).toBeDefined();

})

test('test composer build Txn', async () => {
 
    const txn = BuildScriptComposerTransaction(
        {
            sender: AccountAddress.ONE,
            aptosConfig: new AptosConfig({network: Network.TESTNET}),
            builder: async (builder)=>{

                builder.storeModule(coin_module);
                builder.storeModule(fa_module);
                builder.storeModule(aptos_coin_module);
                builder.storeModule(primary_fungible_store_module);
            
                const coin = await builder.addBatchedCalls({
                    function: "0x1::coin::withdraw",
                    functionArguments: [CallArgument.newSigner(0), 1],
                    typeArguments: ["0x1::aptos_coin::AptosCoin"],
                    moduleAbi: coin_module.abi!,
                });
            
                // Passing the coin value to the 0x1::coin::coin_to_fungible_asset to convert a coin
                // into fungible asset.
                const fungibleAsset = await builder.addBatchedCalls({
                    function: "0x1::coin::coin_to_fungible_asset",
                    // coin[0] represents the first return value from the first call you added.
                    functionArguments: [coin[0]],
                    typeArguments: ["0x1::aptos_coin::AptosCoin"],
                    moduleAbi: coin_module.abi!,
                });
             
                // Deposit the fungibleAsset converted from second call.
                await builder.addBatchedCalls({
                    function: "0x1::primary_fungible_store::deposit",
                    functionArguments: ["0x1", fungibleAsset[0]],
                    typeArguments: [],
                    moduleAbi: primary_fungible_store_module.abi!,
                });

                return builder
            }
        }
    );

    expect(txn).toBeDefined();

})