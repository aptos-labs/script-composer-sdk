# Node.js example

A minimal Node.js walkthrough for composing an Aptos transaction and simulating it on Testnet. It runs two equivalent flows:

1. **Preloaded modules**: fetches `0x1::aptos_account` once, stores it in the composer, then disables automatic module fetching.
2. **Automatic modules**: lets the composer fetch the required ABI and bytecode itself.

Neither flow signs nor submits a transaction. The simulated transfer deliberately uses `0x1` as both sender and recipient, so treat it as a construction and simulation example rather than a payment workflow.

## Prerequisites

- Node.js 22 or later
- pnpm 10.11.0 or later
- Network access to Aptos Testnet

## Run

From the repository root:

```bash
pnpm install
pnpm build
pnpm --filter example-nodejs start
```

Or, from this directory after installing workspace dependencies from the repository root:

```bash
pnpm start
```

Expected output includes `simulate_result (cache)` and `simulate_result (fetch)`. A simulation result can contain a VM failure because the placeholder sender is not a funded account; that still verifies the composed transaction can be constructed and sent to the simulation endpoint.

## Adapting it for your application

1. Replace the placeholder sender and recipient with real account addresses.
2. Replace the transfer with your Move entry functions and arguments.
3. Build the transaction using `BuildScriptComposerTransaction`.
4. Sign and submit the returned transaction with `@aptos-labs/ts-sdk` only after reviewing the payload and required signer permissions.

For an offline or controlled module-loading workflow, keep `allowFetch: false` and supply `moduleAbi` plus `moduleBytecodes`. For connected applications, omit the option or use `allowFetch: true`.
