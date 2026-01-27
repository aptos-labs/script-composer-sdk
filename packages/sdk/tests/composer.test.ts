import { expect, test, beforeAll } from 'vitest';
import {
  AptosScriptComposer,
  BuildScriptComposerTransaction,
  BuildScriptComposerMultiAgentTransaction,
} from '../src/index';
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

// Module variables - will be initialized in beforeAll
let coin_module: MoveModuleBytecode;
let fa_module: MoveModuleBytecode;
let aptos_coin_module: MoveModuleBytecode;
let primary_fungible_store_module: MoveModuleBytecode;
let aptos_account_module: MoveModuleBytecode;

beforeAll(async () => {
  try {
    const aptosConfig = new AptosConfig({ network: Network.TESTNET });

    coin_module = await getModuleInner({
      aptosConfig,
      accountAddress: '0x1',
      moduleName: 'coin',
    });

    fa_module = await getModuleInner({
      aptosConfig,
      accountAddress: '0x1',
      moduleName: 'fungible_asset',
    });

    aptos_coin_module = await getModuleInner({
      aptosConfig,
      accountAddress: '0x1',
      moduleName: 'aptos_coin',
    });

    primary_fungible_store_module = await getModuleInner({
      aptosConfig,
      accountAddress: '0x1',
      moduleName: 'primary_fungible_store',
    });

    aptos_account_module = await getModuleInner({
      aptosConfig,
      accountAddress: '0x1',
      moduleName: 'aptos_account',
    });
  } catch (error: unknown) {
    console.error('Failed to load modules from Aptos Testnet:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('getaddrinfo')) {
      throw new Error(
        'Network error: Could not connect to Aptos Testnet. ' +
          'Please check your internet connection and ensure api.testnet.aptoslabs.com is accessible.'
      );
    }
    throw new Error(`Failed to load test modules: ${errorMessage}`);
  }
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

test('test BuildScriptComposerMultiAgentTransaction with secondary signers', async () => {
  const secondarySignerAddresses = ['0x2', '0x3'];

  const txn = await BuildScriptComposerMultiAgentTransaction({
    sender: AccountAddress.ONE,
    secondarySignerAddresses: secondarySignerAddresses,
    aptosConfig: new AptosConfig({ network: Network.TESTNET }),
    builder: async (builder) => {
      builder.storeModule(aptos_account_module);

      await builder.addBatchedCalls({
        function: '0x1::aptos_account::transfer',
        functionArguments: [CallArgument.newSigner(0), '0x2', 1],
        typeArguments: [],
        moduleAbi: aptos_account_module.abi,
        moduleBytecodes: [aptos_account_module.bytecode],
        options: {
          allowFetch: false,
        },
      });

      return builder;
    },
  });

  expect(txn).toBeDefined();
  expect(txn.secondarySignerAddresses).toBeDefined();
  expect(txn.secondarySignerAddresses.length).toBe(2);
  expect(txn.secondarySignerAddresses[0].toString()).toBe('0x2');
  expect(txn.secondarySignerAddresses[1].toString()).toBe('0x3');
  expect(txn.feePayerAddress).toBeUndefined();
});

test('test BuildScriptComposerMultiAgentTransaction with fee payer', async () => {
  const feePayerAddress = '0x4';

  const txn = await BuildScriptComposerMultiAgentTransaction({
    sender: AccountAddress.ONE,
    feePayerAddress: feePayerAddress,
    aptosConfig: new AptosConfig({ network: Network.TESTNET }),
    builder: async (builder) => {
      builder.storeModule(aptos_account_module);

      await builder.addBatchedCalls({
        function: '0x1::aptos_account::transfer',
        functionArguments: [CallArgument.newSigner(0), '0x2', 1],
        typeArguments: [],
        moduleAbi: aptos_account_module.abi,
        moduleBytecodes: [aptos_account_module.bytecode],
        options: {
          allowFetch: false,
        },
      });

      return builder;
    },
  });

  expect(txn).toBeDefined();
  expect(txn.feePayerAddress).toBeDefined();
  expect(txn.feePayerAddress?.toString()).toBe('0x4');
  expect(txn.secondarySignerAddresses).toBeDefined();
  expect(txn.secondarySignerAddresses.length).toBe(0);
});

test('test BuildScriptComposerMultiAgentTransaction with secondary signers and fee payer', async () => {
  const secondarySignerAddresses = ['0x2', '0x3'];
  const feePayerAddress = '0x4';

  const txn = await BuildScriptComposerMultiAgentTransaction({
    sender: AccountAddress.ONE,
    secondarySignerAddresses: secondarySignerAddresses,
    feePayerAddress: feePayerAddress,
    aptosConfig: new AptosConfig({ network: Network.TESTNET }),
    builder: async (builder) => {
      builder.storeModule(aptos_account_module);

      await builder.addBatchedCalls({
        function: '0x1::aptos_account::transfer',
        functionArguments: [CallArgument.newSigner(0), '0x2', 1],
        typeArguments: [],
        moduleAbi: aptos_account_module.abi,
        moduleBytecodes: [aptos_account_module.bytecode],
        options: {
          allowFetch: false,
        },
      });

      return builder;
    },
  });

  expect(txn).toBeDefined();
  expect(txn.secondarySignerAddresses).toBeDefined();
  expect(txn.secondarySignerAddresses.length).toBe(2);
  expect(txn.secondarySignerAddresses[0].toString()).toBe('0x2');
  expect(txn.secondarySignerAddresses[1].toString()).toBe('0x3');
  expect(txn.feePayerAddress).toBeDefined();
  expect(txn.feePayerAddress?.toString()).toBe('0x4');
});

test('test BuildScriptComposerMultiAgentTransaction without optional parameters', async () => {
  const txn = await BuildScriptComposerMultiAgentTransaction({
    sender: AccountAddress.ONE,
    aptosConfig: new AptosConfig({ network: Network.TESTNET }),
    builder: async (builder) => {
      builder.storeModule(aptos_account_module);

      await builder.addBatchedCalls({
        function: '0x1::aptos_account::transfer',
        functionArguments: [CallArgument.newSigner(0), '0x2', 1],
        typeArguments: [],
        moduleAbi: aptos_account_module.abi,
        moduleBytecodes: [aptos_account_module.bytecode],
        options: {
          allowFetch: false,
        },
      });

      return builder;
    },
  });

  expect(txn).toBeDefined();
  expect(txn.secondarySignerAddresses).toBeDefined();
  expect(txn.secondarySignerAddresses.length).toBe(0);
  expect(txn.feePayerAddress).toBeUndefined();
});
