# @aptos-labs/script-composer-sdk

Compose multiple Aptos Move entry-function calls into a single script transaction.

For full documentation, examples, and contribution information, see the [Script Composer SDK repository](https://github.com/aptos-labs/script-composer-sdk).

## Install

```bash
pnpm add @aptos-labs/script-composer-sdk @aptos-labs/ts-sdk
```

The package supports `@aptos-labs/ts-sdk` major versions 3 through 7.

## Build a transaction

```ts
import { AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { BuildScriptComposerTransaction, CallArgument } from '@aptos-labs/script-composer-sdk';

const aptosConfig = new AptosConfig({ network: Network.TESTNET });

const transaction = await BuildScriptComposerTransaction({
  sender: '0x...',
  aptosConfig,
  builder: async (composer) => {
    await composer.addBatchedCalls({
      function: '0x1::aptos_account::transfer',
      functionArguments: [CallArgument.newSigner(0), '0x...', 1_000],
    });
    return composer;
  },
});
```

`addBatchedCalls` automatically fetches missing Move module metadata by default. To work offline, set `options.allowFetch` to `false` and provide `moduleAbi` and `moduleBytecodes`.

The returned transaction is unsigned. Sign and submit it with `@aptos-labs/ts-sdk`. Use `BuildScriptComposerMultiAgentTransaction` when secondary signers or a fee payer are required.
