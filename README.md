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

This repository includes a guarded release workflow with:
- one reusable workflow (`.github/workflows/release-reusable.yml`)
- one local entry workflow (`.github/workflows/release.yml`)
- one reusable composite action (`.github/actions/npm-release-guarded/action.yml`)

### Supported version formats

- Stable: `x.y.z` (published with npm dist-tag `latest`)
- Beta: `x.y.z-beta.n` (published with npm dist-tag `beta`)
- Test: `x.y.z-test.n` (published with npm dist-tag `test`)

Any other version format fails the workflow.

### Trigger modes

1. Tag push (real publish):
   - push tag `1.2.3` or `v1.2.3`
   - push tag `1.2.3-beta.1` or `v1.2.3-beta.1`
   - push tag `test-v1.2.3-test.1` for isolated test releases
   - workflow validates tag/version match, then waits for environment approval before publish
2. Manual run (`workflow_dispatch`):
   - default is `dry_run=true`
   - for real publish (`dry_run=false`), you must set:
     - `confirm_publish=publish`
     - `confirm_version=<exact package version>`

### Test channel usage

- Test releases use npm dist-tag `test`, isolated from `latest` and `beta`.
- Install test channel explicitly:
  - `npm i @aptos-labs/script-composer-sdk@test`

### Safety guardrails

- `packages/sdk/package.json` version is the source of truth
- tag (if provided) must match package version
- real publish must come from a commit reachable from `main`
- real publish fails if same version already exists on npm
- real publish requires protected environment approval (`npm-release`)
- npm package versions are immutable; even if unpublished, `name@version` cannot be reused

### npm Trusted Publishing (OIDC)

This workflow is designed for npm Trusted Publishing (no long-lived `NPM_TOKEN`):

1. In npm package settings, configure this GitHub repository/workflow as a Trusted Publisher.
2. Keep `id-token: write` permission on the publish job.
3. Publish job will run `npm publish --provenance`.

If Trusted Publishing is not configured, publish will fail at npm authentication step.

For `workflow_call` scenarios, the caller workflow must also grant `id-token: write`.
This repository's `release.yml` already includes it.

Also make sure the published package `package.json` has a correct `repository.url`
matching your GitHub repository; otherwise trusted publishing may fail.

### Reuse from another repository

Another repository can call this reusable workflow:

```yaml
name: Reuse Script Composer Release

on:
  workflow_dispatch:
    inputs:
      dry_run:
        required: false
        default: true
        type: boolean

jobs:
  release:
    permissions:
      contents: read
      id-token: write
    uses: aptos-labs/script-composer-sdk/.github/workflows/release-reusable.yml@<commit-sha>
    with:
      package_dir: packages/sdk
      dry_run: ${{ inputs.dry_run }}
      main_branch: main
      env_name: npm-release
```

For production, pin immutable commit SHAs instead of mutable refs like `@main`.
Use mutable refs only for quick trials.

### Security setup checklist (recommended)

1. Configure `npm-release` Environment:
   - required reviewers
   - prevent self-review
2. Configure npm Trusted Publisher:
   - org/user, repository, workflow filename (`release.yml`)
   - optional environment name (`npm-release`) should match
3. Restrict tag creation with repository rulesets:
   - allow only release maintainers to create release tags
4. Keep `main` protected:
   - PR required, required checks required, no direct pushes
5. Do first release as `workflow_dispatch` with `dry_run=true`.
