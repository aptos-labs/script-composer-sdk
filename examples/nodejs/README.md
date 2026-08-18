# Node.js quick start

This runnable quick start composes `0x1::aptos_account::transfer` and simulates it on Aptos Testnet. It runs the same transaction twice:

1. **Preloaded module:** fetches `0x1::aptos_account`, stores it in the composer, and sets `allowFetch: false`.
2. **Automatic module loading:** lets `addBatchedCalls` fetch required Move metadata; `allowFetch` defaults to `true`.

The script never signs or submits a transaction.

## Prerequisites

- Node.js 22 or later
- pnpm 10.11.0 or later
- Network access to Aptos Testnet or Mainnet

## Run

From the repository root:

```bash
pnpm install
pnpm build
pnpm --filter example-nodejs start
```

The default configuration uses `0x1` as both sender and recipient on Testnet and transfers one octa. It is intentionally safe because the transaction is simulated only.

## Configuration

Set environment variables before running to use different public account addresses or network settings:

| Variable | Default | Description |
| --- | --- | --- |
| `APTOS_NETWORK` | `testnet` | `testnet` or `mainnet` |
| `APTOS_SENDER` | `0x1` | Sender address used to build and simulate the transaction |
| `APTOS_RECIPIENT` | sender address | Recipient address |
| `APTOS_AMOUNT_OCTAS` | `1` | Positive integer transfer amount in octas |

For example:

```bash
APTOS_SENDER=0x... APTOS_RECIPIENT=0x... APTOS_AMOUNT_OCTAS=1000 \
  pnpm --filter example-nodejs start
```

## Expected output

A successful run prints one simulation summary for the preloaded module path and one for automatic module loading. Both should report `success: true` when using the default Testnet configuration.

## Use this in an application

Replace the transfer call with your Move entry functions, then build a transaction with `BuildScriptComposerTransaction`. The returned transaction is unsigned. Use `@aptos-labs/ts-sdk` to collect signatures and submit only after reviewing the payload and signer permissions.
