# React example

A browser UI built with Vite and React that composes Aptos transactions with the Script Composer SDK and simulates them on Testnet. The app demonstrates:

- automatic module fetching with `addBatchedCalls`
- composing multiple calls in one transaction
- a multi-agent transaction builder in `src/components/MultiAgentDemo.tsx`

The UI simulates transactions only. It does not sign or submit them.

## Prerequisites

- Node.js 22 or later
- pnpm 10.11.0 or later
- Network access to Aptos Testnet

## Run

From the repository root:

```bash
pnpm install
pnpm build
pnpm --filter react-project dev
```

Or, from this directory after installing workspace dependencies from the repository root:

```bash
pnpm dev
```

The development server starts at `http://localhost:5173` by default.

## Browser setup

The SDK depends on a `buffer` polyfill in the browser. This example sets it in `src/main.tsx` before rendering the app:

```ts
import { Buffer } from 'buffer';

(window as typeof window & { Buffer: typeof Buffer }).Buffer = Buffer;
```

Install peer dependencies in your own app with:

```bash
pnpm add @aptos-labs/script-composer-sdk @aptos-labs/ts-sdk @aptos-labs/script-composer-pack buffer
```

## Learn more

- [Repository README](../../README.md)
- [Official Aptos Script Composer guide](https://aptos.dev/build/sdks/ts-sdk/building-transactions/script-composer)
