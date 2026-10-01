# @aptos-labs/script-composer-sdk

Compose multiple Aptos Move entry-function calls into a single script transaction.

For full documentation, examples, and contribution information, see the [Script Composer SDK repository](https://github.com/aptos-labs/script-composer-sdk). The official Aptos guide is at [aptos.dev](https://aptos.dev/build/sdks/ts-sdk/building-transactions/script-composer).

## Install

```bash
pnpm add @aptos-labs/script-composer-sdk @aptos-labs/ts-sdk @aptos-labs/script-composer-pack
```

The package supports `@aptos-labs/ts-sdk` major versions 3 through 7.

Browser applications also require the `buffer` peer dependency and a global `Buffer` polyfill before initializing the SDK. See the repository README for details.

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

For generic Move functions, pass concrete types through `typeArguments`. Returned `CallArgument` values from one call can be forwarded into later calls when Move ability rules allow it.

The returned transaction is unsigned. Sign and submit it with `@aptos-labs/ts-sdk`.

- Use `BuildScriptComposerMultiAgentTransaction` when secondary signers or a fee payer are required.
- Use `BuildScriptComposerTransaction` with `withFeePayer: true` for a sponsored single-signer transaction.
