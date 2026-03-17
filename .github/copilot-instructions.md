# Script Composer SDK — Copilot Project Instructions

The full agent guide for this repo is at [AGENTS.md](/AGENTS.md) in the repo root. Below are the essentials for Copilot.

## Project and terminology

- **Script Composer SDK**: A library for composing Aptos scripts and transactions in TypeScript, built on `@aptos-labs/ts-sdk` and `@aptos-labs/script-composer-pack` (WASM).
- In this repo, **"multi-agent"** means **Aptos multi-signer or fee-payer (sponsored) transactions**, not AI/LLM agents. Use "multi-signer" or "fee payer" when disambiguation is needed.

## Repository layout

- **pnpm workspace**: `packages/*` (SDK), `examples/*` (example apps). No application source at repo root.
- **SDK source**: `packages/sdk/src/`; main entry and exports in `packages/sdk/src/index.ts`.
- **Examples**: `examples/nodejs`, `examples/react-project`, `examples/nextjs-project`, `examples/multi-agent-nodejs`.

## Build and test (run from repo root)

- Install: `pnpm install`
- Build: `pnpm build` (required after changing SDK before running examples or tests)
- Test: `pnpm test`
- Do not assume running build/test from a subpackage; prefer root for workspace consistency.

## Code and editing conventions

- TypeScript/React examples: Prefer functional components and hooks; avoid empty `catch` blocks—log or rethrow with context.
- Exports: Main API from `packages/sdk/src/index.ts`; examples must not re-export SDK internals.
- Before committing, run lint/format from root: `pnpm -r exec eslint`, `pnpm -r exec prettier` (or scripts defined in each package).

## Relation to other AI instructions

- **AGENTS.md** (root): Tool-agnostic agent guide; all AI coding tools can use it.
- **.cursor/rules/**: Cursor-specific rules (globs, alwaysApply, etc.).
- This file: GitHub Copilot repo-wide instructions; kept in sync with AGENTS.md. Prefer AGENTS.md for details.
