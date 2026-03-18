# Script Composer SDK — Agent Guide

This file gives AI assistants (e.g. Cursor, GitHub Copilot, Codex) a quick overview of the repo so they can work on the codebase correctly.

## Multi-tool compatibility

| File / directory | Used by | Purpose |
|------------------|---------|--------|
| **AGENTS.md** (this file) | All tools | Single source of truth: project layout, commands, terminology. Keep here the canonical agent guide. |
| **.cursor/rules/\*.mdc** | Cursor | Cursor-specific rules (globs, alwaysApply). Align content with this file and project conventions. |
| **.github/copilot-instructions.md** | GitHub Copilot | Repo-wide Copilot instructions; summarizes and points to this file. |
| **.cursorrules** | Tools that look for it | Short pointer to this file for tools that only read root-level instructions. |

When updating project conventions or build/test steps, prefer updating **AGENTS.md** first, then sync `.github/copilot-instructions.md` and `.cursor/rules` as needed.

## What This Project Is

- **Script Composer SDK**: A library for composing Aptos blockchain scripts and transactions in TypeScript. It builds on `@aptos-labs/ts-sdk` and uses `@aptos-labs/script-composer-pack` (WASM) under the hood.
- **Use case**: Batching multiple Move calls into one transaction, and supporting single-signer, multi-signer, and fee-payer (sponsored) transactions.

## Repo Layout

- **`packages/sdk`** — Core SDK. Main exports: `AptosScriptComposer`, `BuildScriptComposerTransaction`, `BuildScriptComposerMultiAgentTransaction`, `getModuleInner`, and types from `@aptos-labs/script-composer-pack`. Source lives in `packages/sdk/src/`.
- **`examples/`** — Example apps that depend on the workspace package `@aptos-labs/script-composer-sdk`:
  - `nodejs` — Node.js usage
  - `react-project` — React app
  - `nextjs-project` — Next.js app
  - `multi-agent-nodejs` — Multi-signer / fee-payer (multi-agent) transaction example

Root only has workspace config and scripts; no app source at root.

## Commands (Run From Repo Root)

- `pnpm install` — Install dependencies for all workspaces.
- `pnpm build` — Build all packages (including SDK). Run this after changing SDK code before running examples or tests.
- `pnpm test` — Run tests across all packages.

Build and test are workspace-recursive; always run them from the repository root.

## Important Concepts (Avoid Confusion)

- **"Multi-agent" in this repo** means **Aptos multi-signer or fee-payer (sponsored) transactions**, not Cursor/LLM agents.
- **Single-signer**: Use `BuildScriptComposerTransaction` with a `builder(composer) => ...` that returns the composer.
- **Multi-signer or fee payer**: Use `BuildScriptComposerMultiAgentTransaction` and pass `secondarySignerAddresses` and/or `feePayerAddress` as needed.

## When Editing Code

- SDK source: `packages/sdk/src/`. Types and API are exported from `packages/sdk/src/index.ts`.
- Examples: `examples/<name>/`. After changing the SDK, run `pnpm build` from the root, then run or test the example from its directory or via root scripts.

For more detail, see [README.md](README.md) and the JSDoc in `packages/sdk/src/index.ts`.
