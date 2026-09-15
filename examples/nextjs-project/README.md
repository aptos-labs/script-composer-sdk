# Next.js example

A browser UI built with Next.js that composes Aptos transactions with the Script Composer SDK and simulates them on Testnet. The main demo lives in `src/app/components/ScriptComposer.tsx`.

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
pnpm --filter nextjs-project dev
```

Or, from this directory after installing workspace dependencies from the repository root:

```bash
pnpm dev
```

The development server starts at `http://localhost:3000`.

## Browser setup

Browser applications need the `buffer` peer dependency. Install the SDK and its peers in your own app with:

```bash
pnpm add @aptos-labs/script-composer-sdk @aptos-labs/ts-sdk @aptos-labs/script-composer-pack buffer
```

If your bundler does not provide Node globals automatically, polyfill `Buffer` before initializing the SDK, as shown in the [React example](../react-project/README.md).

## Learn more

- [Repository README](../../README.md)
- [Official Aptos Script Composer guide](https://aptos.dev/build/sdks/ts-sdk/building-transactions/script-composer)
