# Aptos Script Composer SDK

[![CI](https://github.com/aptos-labs/script-composer-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/aptos-labs/script-composer-sdk/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@aptos-labs/script-composer-sdk)](https://www.npmjs.com/package/@aptos-labs/script-composer-sdk)

Compose multiple Aptos Move entry-function calls into one script transaction. The SDK builds on [`@aptos-labs/ts-sdk`](https://www.npmjs.com/package/@aptos-labs/ts-sdk) and the Script Composer pack, and supports single-signer, multi-agent, and fee-payer transactions.

## Why use it?

A transaction normally invokes one entry function. Script Composer lets an application describe several compatible calls, including calls that consume values returned by earlier calls, and execute them atomically in one Aptos transaction.

## Install

```bash
pnpm add @aptos-labs/script-composer-sdk @aptos-labs/ts-sdk
```

The SDK supports `@aptos-labs/ts-sdk` major versions 3 through 7. Use Node.js 22 or a current LTS release for this repository and its examples.

## Quick start

This example builds a transaction that transfers APT on Testnet. By default, the composer fetches the Move ABI and bytecode it needs from the configured network. Building a transaction does **not** sign or submit it.

```ts
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { BuildScriptComposerTransaction, CallArgument } from '@aptos-labs/script-composer-sdk';

const config = new AptosConfig({ network: Network.TESTNET });
const sender = '0x...';
const recipient = '0x...';

const transaction = await BuildScriptComposerTransaction({
  sender,
  aptosConfig: config,
  builder: async (composer) => {
    await composer.addBatchedCalls({
      function: '0x1::aptos_account::transfer',
      functionArguments: [CallArgument.newSigner(0), recipient, 1_000],
    });
    return composer;
  },
});

// Safe for a quick integration check; no transaction is submitted.
const result = await new Aptos(config).transaction.simulate.simple({ transaction });
console.log(result);
```

To submit a transaction, sign the returned transaction with the appropriate accounts using `@aptos-labs/ts-sdk`, then submit the resulting authenticator. See the [Aptos TypeScript SDK documentation](https://aptos.dev/en/build/sdks/ts-sdk) for account management and signing APIs.

## Core concepts

### Automatic and manual module loading

`addBatchedCalls` uses `allowFetch: true` by default. The composer fetches missing Move module ABI and bytecode from the configured full node, which is convenient for connected applications.

For offline or controlled environments, set `options.allowFetch` to `false` and provide both `moduleAbi` and `moduleBytecodes`. You can also preload modules with `getModuleInner` and `composer.storeModule` as shown in the Node example.

### Connecting calls with returned values

`addBatchedCalls` returns `CallArgument[]`. Pass a returned item into a later call's `functionArguments` to compose dependent operations without leaving the transaction:

```ts
const [createdObject] = await composer.addBatchedCalls({ /* first call */ });
await composer.addBatchedCalls({
  function: '0x...::module::consume',
  functionArguments: [createdObject],
});
```

### Signers, multi-agent transactions, and fee payers

- `CallArgument.newSigner(0)` refers to the primary sender. Secondary signers are indexed starting at `1`.
- Use `BuildScriptComposerTransaction` for a normal, single-signer transaction.
- Use `BuildScriptComposerMultiAgentTransaction` when calls require secondary signers and/or a fee payer. It returns a transaction that each required account must sign before submission.
- A fee payer pays gas; it is not an additional Move-function signer unless the Move call itself requires one.

## Examples

| Example | Demonstrates | Run from repository root |
| --- | --- | --- |
| [Node.js](examples/nodejs) | Auto-fetch and preloaded-module composition, then simulation on Testnet | `pnpm --filter example-nodejs start` |
| [Multi-agent Node.js](examples/multi-agent-nodejs) | Secondary signers and fee-payer transaction construction | `pnpm --filter example-multi-agent-nodejs start` |
| [React](examples/react-project) | Browser UI for composing transactions | `pnpm --filter react-project dev` |
| [Next.js](examples/nextjs-project) | Browser UI including multi-agent flows | `pnpm --filter nextjs-project dev` |

Examples construct or simulate transactions only unless their documentation explicitly says otherwise. Review function arguments, account addresses, and network configuration before adapting an example to submit real transactions.

## Development

```bash
git clone https://github.com/aptos-labs/script-composer-sdk.git
cd script-composer-sdk
pnpm install
pnpm build
pnpm test
```

The repository is a pnpm workspace. SDK source is in `packages/sdk`; runnable applications live under `examples`.

## Releases

This project uses [Changesets](https://github.com/changesets/changesets). Changes that affect the published SDK should include a changeset:

```bash
pnpm changeset
```

Merging changesets to `main` creates or updates a version PR; merging that PR publishes the package through the repository release workflow.

## Support and security

For defects and feature requests, open a [GitHub issue](https://github.com/aptos-labs/script-composer-sdk/issues). Do not report security vulnerabilities in a public issue; follow Aptos Labs' security reporting process instead.
