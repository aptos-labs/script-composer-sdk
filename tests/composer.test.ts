import { expect, test } from 'vitest'
import {AptosScriptComposer} from "../src/index"
import { AptosConfig, Network } from '@aptos-labs/ts-sdk'
import { CallArgument } from '@aptos-labs/script-composer-pack'

test('test composer', () => {
    const builder = new AptosScriptComposer(new AptosConfig({network: Network.TESTNET}))

    expect(builder).toBeDefined()
})

test('test composer with custom config', async () => {
    const builder = new AptosScriptComposer(new AptosConfig({network: Network.TESTNET}))

    const coin = await builder.addBatchedCalls({
        function: "0x1::coin::withdraw",
        functionArguments: [CallArgument.newSigner(0), 1],
        typeArguments: ["0x1::aptos_coin::AptosCoin"],
    });

    // Passing the coin value to the 0x1::coin::coin_to_fungible_asset to convert a coin
    // into fungible asset.
    const fungibleAsset = await builder.addBatchedCalls({
        function: "0x1::coin::coin_to_fungible_asset",
        // coin[0] represents the first return value from the first call you added.
        functionArguments: [coin[0]],
        typeArguments: ["0x1::aptos_coin::AptosCoin"],
    });
 
    // Deposit the fungibleAsset converted from second call.
    await builder.addBatchedCalls({
        function: "0x1::primary_fungible_store::deposit",
        functionArguments: ["0x1", fungibleAsset[0]],
        typeArguments: [],
    });

    const tx = builder.build();

    expect(tx).toBeDefined();

})