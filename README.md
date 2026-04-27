# Script Composer SDK

A monorepo containing the Script Composer SDK and example implementations.

## Project Structure

This is a monorepo managed with pnpm workspaces, containing:
- `packages/*`: Core SDK packages
- `examples/*`: Example implementations and usage

## Prerequisites

- Node.js (Latest LTS version recommended)
- pnpm (v10.11.0 or later)

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd script-composer-sdk
```

2. Install dependencies:
```bash
pnpm install
```

## Development

### Building the Project

To build all packages:
```bash
pnpm build
```

### Running Tests

To run tests across all packages:
```bash
pnpm test
```

## Project Setup

1. After cloning the repository, run `pnpm install` to install all dependencies
2. Run `pnpm build` to build all packages
3. You can now run tests using `pnpm test`

## Release Automation

This repository uses a Changesets-based release flow (`.github/workflows/release.yml`).

### How it works

1. Add a changeset in your feature PR:
   - run `pnpm changeset`
   - select `@aptos-labs/script-composer-sdk`
   - choose version bump type and summary
2. Merge PRs with changesets into `main`.
3. On push to `main`, release workflow runs `changesets/action`:
   - if unpublished changesets exist, it creates/updates a Version Packages release PR
   - after that release PR is merged, workflow publishes to npm
4. You can manually re-run via `workflow_dispatch` for retries.

### Important notes

- This workflow no longer uses tag-driven release channels.
- Test tag/test dist-tag channel is intentionally disabled.
- npm package versions are immutable; even if unpublished, `name@version` cannot be reused.

### Required repository setup

1. Configure GitHub App credentials for release automation:
   - repository variable: `APTOS_LABS_BOT_APP_ID`
   - repository secret: `APTOS_LABS_BOT_APP_PRIVATE_KEY`
2. Configure npm Trusted Publisher for this repository and workflow file `release.yml`.
3. Keep `main` protected (PR required, required checks, no direct pushes).
