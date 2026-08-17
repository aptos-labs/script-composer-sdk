# Multi-agent Node.js example

This example constructs several Aptos multi-agent transaction variants using the Script Composer SDK:

1. **Primary and secondary signer**: calls reference `CallArgument.newSigner(0)` for the sender and `CallArgument.newSigner(1)` for the first secondary signer.
2. **Multiple secondary signers**: demonstrates supplying more than one secondary signer address.
3. **Fee payer**: demonstrates a sponsored transaction where another account pays the gas fee.
4. **Secondary signers and fee payer**: combines both transaction features.

The script builds transactions and prints their signer metadata. It does **not** sign, simulate, or submit them, so it is safe to run without private keys.

## Prerequisites

- Node.js 22 or later
- pnpm 10.11.0 or later
- Network access to Aptos Testnet; the example fetches the `0x1::aptos_account` module

## Run

From the repository root:

```bash
pnpm install
pnpm build
pnpm --filter example-multi-agent-nodejs start
```

Or, from this directory after installing workspace dependencies from the repository root:

```bash
pnpm start
```

The output identifies each constructed transaction's secondary signer addresses and fee payer, if present.

## Signing and submitting a multi-agent transaction

`BuildScriptComposerMultiAgentTransaction` returns an unsigned transaction. Before submission, use `@aptos-labs/ts-sdk` to collect authenticators from:

- the primary sender;
- every address in `secondarySignerAddresses`; and
- `feePayerAddress`, if provided.

A fee payer is responsible for gas but does not occupy a `CallArgument.newSigner(...)` index. Signer index `0` is always the primary sender; secondary signers begin at index `1`.

The example uses placeholder addresses and a transfer to `0x1`. Replace them with accounts and Move functions that match your application's authorization model before signing or submitting a transaction.
