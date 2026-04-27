# Guarded NPM Release (Composite Action)

Path: `.github/actions/npm-release-guarded/action.yml`

## Purpose

Reusable guarded npm release steps with three modes:
- `preflight`: validate + build/test + pack
- `dry-run`: preflight + `npm publish --dry-run`
- `publish`: preflight + real `npm publish`

## Required input

- `package_dir`: package directory containing `package.json`

## Key behavior

- Accepts only:
  - stable versions `x.y.z` -> npm dist-tag `latest`
  - beta versions `x.y.z-beta.n` -> npm dist-tag `beta`
- Optional tag/version match enforcement
- Optional main-branch ancestry enforcement
- Optional npm version existence check
- Optional manual confirmation enforcement

## Minimal example

```yaml
jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22.x
          registry-url: https://registry.npmjs.org
      - uses: pnpm/action-setup@v4
        with:
          version: 10.11.0
          run_install: false
      - uses: aptos-labs/script-composer-sdk/.github/actions/npm-release-guarded@<commit-sha>
        with:
          package_dir: packages/sdk
          publish_mode: dry-run
```

## Security recommendations

- Pin this action to an immutable commit SHA in production release workflows.
- Use mutable refs like `@main` only for quick trials, not for production publishing.
