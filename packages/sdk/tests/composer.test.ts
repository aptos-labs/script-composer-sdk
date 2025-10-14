import { expect, test } from 'vitest';
import { AptosScriptComposer, BuildScriptComposerTransaction } from '../src/index';
import {
  AccountAddress,
  AccountAddressInput,
  AptosConfig,
  getAptosFullNode,
  LedgerVersionArg,
  MoveModuleBytecode,
  Network,
} from '@aptos-labs/ts-sdk';
import { CallArgument } from '@aptos-labs/script-composer-pack';

async function getModuleInner(args: {
  aptosConfig: AptosConfig;
  accountAddress: AccountAddressInput;
  moduleName: string;
  options?: LedgerVersionArg;
}): Promise<MoveModuleBytecode> {
  const { aptosConfig, accountAddress, moduleName, options } = args;

  const { data } = await getAptosFullNode<{}, MoveModuleBytecode>({
    aptosConfig,
    originMethod: 'getModule',
    path: `accounts/${AccountAddress.from(accountAddress).toString()}/module/${moduleName}`,
    params: { ledger_version: options?.ledgerVersion },
  });
  return data;
}

const coin_module = await getModuleInner({
  aptosConfig: new AptosConfig({ network: Network.TESTNET }),
  accountAddress: '0x1',
  moduleName: 'coin',
});

const fa_module = await getModuleInner({
  aptosConfig: new AptosConfig({ network: Network.TESTNET }),
  accountAddress: '0x1',
  moduleName: 'fungible_asset',
});

const aptos_coin_module = await getModuleInner({
  aptosConfig: new AptosConfig({ network: Network.TESTNET }),
  accountAddress: '0x1',
  moduleName: 'aptos_coin',
});

const primary_fungible_store_module = await getModuleInner({
  aptosConfig: new AptosConfig({ network: Network.TESTNET }),
  accountAddress: '0x1',
  moduleName: 'primary_fungible_store',
});

test('test composer', () => {
  const builder = new AptosScriptComposer(new AptosConfig({ network: Network.TESTNET }));

  expect(builder).toBeDefined();
});

test('test composer build txn', async () => {
  const builder = new AptosScriptComposer(new AptosConfig({ network: Network.TESTNET }));

  builder.storeModule(coin_module);
  builder.storeModule(fa_module);
  builder.storeModule(aptos_coin_module);
  builder.storeModule(primary_fungible_store_module);

  const coin = await builder.addBatchedCalls({
    function: '0x1::coin::withdraw',
    functionArguments: [CallArgument.newSigner(0), 1],
    typeArguments: ['0x1::aptos_coin::AptosCoin'],
    moduleAbi: coin_module.abi,
    moduleBytecodes: [coin_module.bytecode],
    options: {
      allowFetch: false,
    },
  });

  // Passing the coin value to the 0x1::coin::coin_to_fungible_asset to convert a coin
  // into fungible asset.
  const fungibleAsset = await builder.addBatchedCalls({
    function: '0x1::coin::coin_to_fungible_asset',
    // coin[0] represents the first return value from the first call you added.
    functionArguments: [coin[0]],
    typeArguments: ['0x1::aptos_coin::AptosCoin'],
    moduleAbi: coin_module.abi,
    moduleBytecodes: [coin_module.bytecode],
    options: {
      allowFetch: false,
    },
  });

  // Deposit the fungibleAsset converted from second call.
  await builder.addBatchedCalls({
    function: '0x1::primary_fungible_store::deposit',
    functionArguments: ['0x1', fungibleAsset[0]],
    typeArguments: [],
    moduleAbi: primary_fungible_store_module.abi,
    moduleBytecodes: [primary_fungible_store_module.bytecode],
    options: {
      allowFetch: false,
    },
  });

  const tx = builder.build();

  expect(tx).toBeDefined();
});

test('test composer build Payload', async () => {
  const builder = new AptosScriptComposer(new AptosConfig({ network: Network.TESTNET }));

  builder.storeModule(coin_module);
  builder.storeModule(fa_module);
  builder.storeModule(aptos_coin_module);
  builder.storeModule(primary_fungible_store_module);

  const coin = await builder.addBatchedCalls({
    function: '0x1::coin::withdraw',
    functionArguments: [CallArgument.newSigner(0), 1],
    typeArguments: ['0x1::aptos_coin::AptosCoin'],
    moduleAbi: coin_module.abi,
    moduleBytecodes: [coin_module.bytecode],
    options: {
      allowFetch: false,
    },
  });

  // Passing the coin value to the 0x1::coin::coin_to_fungible_asset to convert a coin
  // into fungible asset.
  const fungibleAsset = await builder.addBatchedCalls({
    function: '0x1::coin::coin_to_fungible_asset',
    // coin[0] represents the first return value from the first call you added.
    functionArguments: [coin[0]],
    typeArguments: ['0x1::aptos_coin::AptosCoin'],
    moduleAbi: coin_module.abi!,
    moduleBytecodes: [coin_module.bytecode],
    options: {
      allowFetch: false,
    },
  });

  // Deposit the fungibleAsset converted from second call.
  await builder.addBatchedCalls({
    function: '0x1::primary_fungible_store::deposit',
    functionArguments: ['0x1', fungibleAsset[0]],
    typeArguments: [],
    moduleAbi: primary_fungible_store_module.abi,
    moduleBytecodes: [primary_fungible_store_module.bytecode],
    options: {
      allowFetch: false,
    },
  });

  const payload = builder.build_payload();

  expect(payload).toBeDefined();
});

test('test composer build Txn', async () => {
  const txn = BuildScriptComposerTransaction({
    sender: AccountAddress.ONE,
    aptosConfig: new AptosConfig({ network: Network.TESTNET }),
    builder: async (builder) => {
      builder.storeModule(coin_module);
      builder.storeModule(fa_module);
      builder.storeModule(aptos_coin_module);
      builder.storeModule(primary_fungible_store_module);

      const coin = await builder.addBatchedCalls({
        function: '0x1::coin::withdraw',
        functionArguments: [CallArgument.newSigner(0), 1],
        typeArguments: ['0x1::aptos_coin::AptosCoin'],
        moduleAbi: coin_module.abi,
        moduleBytecodes: [coin_module.bytecode],
        options: {
          allowFetch: false,
        },
      });

      // Passing the coin value to the 0x1::coin::coin_to_fungible_asset to convert a coin
      // into fungible asset.
      const fungibleAsset = await builder.addBatchedCalls({
        function: '0x1::coin::coin_to_fungible_asset',
        // coin[0] represents the first return value from the first call you added.
        functionArguments: [coin[0]],
        typeArguments: ['0x1::aptos_coin::AptosCoin'],
        moduleAbi: coin_module.abi,
        moduleBytecodes: [coin_module.bytecode],
        options: {
          allowFetch: false,
        },
      });

      // Deposit the fungibleAsset converted from second call.
      await builder.addBatchedCalls({
        function: '0x1::primary_fungible_store::deposit',
        functionArguments: ['0x1', fungibleAsset[0]],
        typeArguments: [],
        moduleAbi: primary_fungible_store_module.abi,
        moduleBytecodes: [primary_fungible_store_module.bytecode],
        options: {
          allowFetch: false,
        },
      });

      return builder;
    },
  });

  expect(txn).toBeDefined();
});

test('test composer with fetch enabled', async () => {
  const builder = new AptosScriptComposer(new AptosConfig({ network: Network.TESTNET }));

  // Test with allowFetch enabled (default behavior)
  // This should automatically fetch the module from the chain without needing to store it first
  const coin = await builder.addBatchedCalls({
    function: '0x1::coin::withdraw',
    functionArguments: [CallArgument.newSigner(0), 1000000], // 0.01 APT
    typeArguments: ['0x1::aptos_coin::AptosCoin'],
    // Note: Not providing moduleAbi or moduleBytecodes - should be fetched automatically
    options: {
      allowFetch: true, // Explicitly enable fetch (this is the default)
    },
  });

  // Test chaining with another function that also uses fetch
  const fungibleAsset = await builder.addBatchedCalls({
    function: '0x1::coin::coin_to_fungible_asset',
    functionArguments: [coin[0]],
    typeArguments: ['0x1::aptos_coin::AptosCoin'],
    // Again, not providing moduleAbi or moduleBytecodes
    options: {
      allowFetch: true,
    },
  });

  // Final deposit call
  await builder.addBatchedCalls({
    function: '0x1::primary_fungible_store::deposit',
    functionArguments: ['0x1', fungibleAsset[0]],
    typeArguments: [],
    // Testing default behavior (allowFetch should be true by default)
    // options: { allowFetch: true } // This is the default, so we can omit it
  });

  const tx = builder.build();
  expect(tx).toBeDefined();
  expect(tx.length).toBeGreaterThan(0);
});

test('test composer fetch vs no-fetch behavior', async () => {
  // Test that fetch is required when allowFetch is false and no ABI/bytecode provided
  const builder = new AptosScriptComposer(new AptosConfig({ network: Network.TESTNET }));

  // This should fail because allowFetch is false but no moduleAbi provided
  await expect(
    builder.addBatchedCalls({
      function: '0x1::coin::withdraw',
      functionArguments: [CallArgument.newSigner(0), 1000000],
      typeArguments: ['0x1::aptos_coin::AptosCoin'],
      options: {
        allowFetch: false,
      },
    })
  ).rejects.toThrow('Module ABI is required when auto-fetch is disabled');

  // This should also fail because allowFetch is false but no moduleBytecodes provided
  await expect(
    builder.addBatchedCalls({
      function: '0x1::coin::withdraw',
      functionArguments: [CallArgument.newSigner(0), 1000000],
      typeArguments: ['0x1::aptos_coin::AptosCoin'],
      moduleAbi: coin_module.abi,
      // Missing moduleBytecodes
      options: {
        allowFetch: false,
      },
    })
  ).rejects.toThrow('Module bytecode is required when auto-fetch is disabled');
});
