import { BuildScriptComposerMultiAgentTransaction, CallArgument, getModuleInner } from '@aptos-labs/script-composer-sdk';
import { AptosConfig, Network } from "@aptos-labs/ts-sdk"

// Shared configuration
const aptosConfig = new AptosConfig({ network: Network.TESTNET });

// Example 1: Basic Multi-Agent Transaction (sender + secondary signers, no fee payer)
async function exampleBasicMultiAgent() {
  console.log('\n=== Example 1: Basic Multi-Agent Transaction ===\n');
  
  const aptos_account_module = await getModuleInner({
    aptosConfig,
    accountAddress: '0x1',
    moduleName: 'aptos_account',
  });

  try {
    const tx = await BuildScriptComposerMultiAgentTransaction({
      sender: "0x1",
      secondarySignerAddresses: ['0x2'],
      builder: async (composer) => {
        // Store the module in cache first
        composer.storeModule(aptos_account_module, "0x1::aptos_account");
        await composer.addBatchedCalls({
          function: '0x1::aptos_account::transfer',
          functionArguments: [CallArgument.newSigner(0), '0x1', 1],
          typeArguments: [],
          // Do not allow auto fetch
          options: {
            allowFetch: false,
          },
          moduleAbi: aptos_account_module.abi,
          moduleBytecodes: [aptos_account_module.bytecode],
        });

        await composer.addBatchedCalls({
            function: '0x1::aptos_account::transfer',
            functionArguments: [CallArgument.newSigner(1), '0x1', 1],
            typeArguments: [],
            // Do not allow auto fetch
            options: {
              allowFetch: false,
            },
            moduleAbi: aptos_account_module.abi,
            moduleBytecodes: [aptos_account_module.bytecode],
          });

        return composer;
      },
      aptosConfig,
    });

    console.log('✓ Transaction created successfully');
    console.log('  - Secondary signers:', tx.secondarySignerAddresses.length);
    console.log('  - Fee payer:', tx.feePayerAddress ? tx.feePayerAddress.toString() : 'None');
    console.log('  - Transaction type: Multi-Agent (basic)');
    
  } catch (error) {
    console.error('✗ Error (basic multi-agent):', error);
  }
}

// Example 2: Multi-Agent with Secondary Signers
async function exampleMultiAgentWithSecondarySigners() {
  console.log('\n=== Example 2: Multi-Agent with Secondary Signers ===\n');
  
  const aptos_account_module = await getModuleInner({
    aptosConfig,
    accountAddress: '0x1',
    moduleName: 'aptos_account',
  });

  try {
    // Example secondary signer addresses (in real usage, these would be actual account addresses)
    const secondarySignerAddresses = ['0x2', '0x3'];
    
    const tx = await BuildScriptComposerMultiAgentTransaction({
      sender: "0x1",
      secondarySignerAddresses: secondarySignerAddresses,
      builder: async (composer) => {
        // Store the module in cache first
        composer.storeModule(aptos_account_module, "0x1::aptos_account");
        await composer.addBatchedCalls({
          function: '0x1::aptos_account::transfer',
          functionArguments: [CallArgument.newSigner(0), '0x1', 1],
          typeArguments: [],
          // Do not allow auto fetch
          options: {
            allowFetch: false,
          },
          moduleAbi: aptos_account_module.abi,
          moduleBytecodes: [aptos_account_module.bytecode],
        });
        return composer;
      },
      aptosConfig,
    });

    console.log('✓ Transaction created successfully');
    console.log('  - Secondary signers:', tx.secondarySignerAddresses.map(addr => addr.toString()).join(', '));
    console.log('  - Number of secondary signers:', tx.secondarySignerAddresses.length);
    console.log('  - Fee payer:', tx.feePayerAddress ? tx.feePayerAddress.toString() : 'None');
    console.log('  - Transaction type: Multi-Agent (with secondary signers)');
    
  } catch (error) {
    console.error('✗ Error (multi-agent with secondary signers):', error);
  }
}

// Example 3: Multi-Agent with Fee Payer (Sponsored Transaction)
async function exampleMultiAgentWithFeePayer() {
  console.log('\n=== Example 3: Multi-Agent with Fee Payer (Sponsored Transaction) ===\n');
  
  const aptos_account_module = await getModuleInner({
    aptosConfig,
    accountAddress: '0x1',
    moduleName: 'aptos_account',
  });

  try {
    // Example fee payer address (in real usage, this would be an actual account address)
    const feePayerAddress = '0x4';
    
    const tx = await BuildScriptComposerMultiAgentTransaction({
      sender: "0x1",
      secondarySignerAddresses: ['0x2'],
      feePayerAddress: feePayerAddress,
      builder: async (composer) => {
        // Store the module in cache first
        composer.storeModule(aptos_account_module, "0x1::aptos_account");
        await composer.addBatchedCalls({
          function: '0x1::aptos_account::transfer',
          functionArguments: [CallArgument.newSigner(0), '0x1', 1],
          typeArguments: [],
          // Do not allow auto fetch
          options: {
            allowFetch: false,
          },
          moduleAbi: aptos_account_module.abi,
          moduleBytecodes: [aptos_account_module.bytecode],
        });

        await composer.addBatchedCalls({
          function: '0x1::aptos_account::transfer',
          functionArguments: [CallArgument.newSigner(1), '0x1', 1],
          typeArguments: [],
          // Do not allow auto fetch
          options: {
            allowFetch: false,
          },
          moduleAbi: aptos_account_module.abi,
          moduleBytecodes: [aptos_account_module.bytecode],
        });
        return composer;
      },
      aptosConfig,
    });

    console.log('✓ Transaction created successfully');
    console.log('  - Secondary signers:', tx.secondarySignerAddresses.length);
    console.log('  - Fee payer:', tx.feePayerAddress?.toString() || 'None');
    console.log('  - Transaction type: Multi-Agent (sponsored transaction)');
    console.log('  - Note: Fee payer will cover gas costs');
    
  } catch (error) {
    console.error('✗ Error (multi-agent with fee payer):', error);
  }
}

// Example 4: Complete Multi-Agent Transaction (sender + secondary signers + fee payer)
async function exampleCompleteMultiAgent() {
  console.log('\n=== Example 4: Complete Multi-Agent Transaction ===\n');
  
  const aptos_account_module = await getModuleInner({
    aptosConfig,
    accountAddress: '0x1',
    moduleName: 'aptos_account',
  });

  try {
    // Example addresses (in real usage, these would be actual account addresses)
    const secondarySignerAddresses = ['0x2', '0x3'];
    const feePayerAddress = '0x4';
    
    const tx = await BuildScriptComposerMultiAgentTransaction({
      sender: "0x1",
      secondarySignerAddresses: secondarySignerAddresses,
      feePayerAddress: feePayerAddress,
      builder: async (composer) => {
        // Store the module in cache first
        composer.storeModule(aptos_account_module, "0x1::aptos_account");
        await composer.addBatchedCalls({
          function: '0x1::aptos_account::transfer',
          functionArguments: [CallArgument.newSigner(0), '0x1', 1],
          typeArguments: [],
          // Do not allow auto fetch
          options: {
            allowFetch: false,
          },
          moduleAbi: aptos_account_module.abi,
          moduleBytecodes: [aptos_account_module.bytecode],
        });
        await composer.addBatchedCalls({
          function: '0x1::aptos_account::transfer',
          functionArguments: [CallArgument.newSigner(1), '0x1', 1],
          typeArguments: [],
          // Do not allow auto fetch
          options: {
            allowFetch: false,
          },
          moduleAbi: aptos_account_module.abi,
          moduleBytecodes: [aptos_account_module.bytecode],  
        });
        
        return composer;
      },
      aptosConfig,
    });

    console.log('✓ Complete multi-agent transaction created successfully');
    console.log('  - Sender: 0x1');
    console.log('  - Secondary signers:', tx.secondarySignerAddresses.map(addr => addr.toString()).join(', '));
    console.log('  - Number of secondary signers:', tx.secondarySignerAddresses.length);
    console.log('  - Fee payer:', tx.feePayerAddress?.toString() || 'None');
    console.log('  - Total signers (including sender):', tx.secondarySignerAddresses.length + 1);
    console.log('  - Transaction type: Multi-Agent (complete)');
    console.log('  - Note: This transaction requires multiple signatures and has a fee payer');
    
  } catch (error) {
    console.error('✗ Error (complete multi-agent):', error);
  }
}

// Run all examples
async function main() {
  console.log('========================================');
  console.log('Multi-Agent Transaction Examples');
  console.log('========================================');
  
  await exampleBasicMultiAgent();
  await exampleMultiAgentWithSecondarySigners();
  await exampleMultiAgentWithFeePayer();
  await exampleCompleteMultiAgent();
  
  console.log('\n========================================');
  console.log('All examples completed!');
  console.log('========================================');
}

await main();
