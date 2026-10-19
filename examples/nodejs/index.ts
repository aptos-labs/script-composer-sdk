import {
  AccountAddress,
  Aptos,
  AptosConfig,
  Network,
  type MoveModuleBytecode,
} from '@aptos-labs/ts-sdk';
import {
  BuildScriptComposerTransaction,
  CallArgument,
  getModuleInner,
} from '@aptos-labs/script-composer-sdk';

const networkName = process.env.APTOS_NETWORK?.toLowerCase() ?? 'testnet';
const network = networkName === 'mainnet' ? Network.MAINNET : Network.TESTNET;
const sender = process.env.APTOS_SENDER ?? '0x1';
const recipient = process.env.APTOS_RECIPIENT ?? sender;
const amount = Number(process.env.APTOS_AMOUNT_OCTAS ?? '1');
const aptosConfig = new AptosConfig({ network });
const aptos = new Aptos(aptosConfig);

if (!Number.isSafeInteger(amount) || amount <= 0) {
  throw new Error('APTOS_AMOUNT_OCTAS must be a positive safe integer.');
}

AccountAddress.from(sender);
AccountAddress.from(recipient);

async function buildTransfer({ module }: { module?: MoveModuleBytecode }) {
  return BuildScriptComposerTransaction({
    sender,
    aptosConfig,
    builder: async (composer) => {
      if (module) composer.storeModule(module, '0x1::aptos_account');

      await composer.addBatchedCalls({
        function: '0x1::aptos_account::transfer',
        functionArguments: [CallArgument.newSigner(0), recipient, amount],
        ...(module
          ? {
              options: { allowFetch: false },
              moduleAbi: module.abi,
              moduleBytecodes: [module.bytecode],
            }
          : {}),
      });
      return composer;
    },
  });
}

async function simulate(label: string, module?: MoveModuleBytecode) {
  const transaction = await buildTransfer({ module });
  const [result] = await aptos.transaction.simulate.simple({ transaction });
  console.log(`\n${label}`);
  console.log(`  success: ${result.success}`);
  console.log(`  status: ${result.vm_status}`);
  console.log(`  gas used: ${result.gas_used}`);
  console.log(`  sender: ${result.sender}`);
}

async function main() {
  console.log(`Composing a ${amount}-octa transfer on ${networkName}.`);
  console.log(`Sender: ${sender}`);
  console.log(`Recipient: ${recipient}`);
  console.log('This example only simulates; it never signs or submits a transaction.');

  const module = await getModuleInner({
    aptosConfig,
    accountAddress: '0x1',
    moduleName: 'aptos_account',
  });

  await simulate('Preloaded module (allowFetch: false)', module);
  await simulate('Automatic module loading (allowFetch defaults to true)');
}

main().catch((error: unknown) => {
  console.error('\nExample failed:', error);
  process.exitCode = 1;
});
