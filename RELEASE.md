# Release Guide

This project uses [Changesets](https://github.com/changesets/changesets) to manage versioning and generate changelogs.

## Important Note

**You only need to use changesets commands from the root directory** - no need to operate in sub-packages.

## Release Process

### 1. Add Change Records

When you're ready to release a new version, first add change records:

```bash
pnpm changeset
```

This command will:
- Let you select which package to release (in this project: `@aptos-labs/script-composer-sdk`)
- Let you choose the version type (patch/minor/major)
- Let you input a change description

### 2. Preview Version Changes

Before officially releasing, you can preview version changes:

```bash
pnpm version-packages
```

This will:
- Update the version number in `packages/sdk/package.json`
- Automatically generate `packages/sdk/CHANGELOG.md` (package version history)
- But will NOT actually publish to npm

### 3. Publish to npm

After confirming the version changes are correct, execute the release:

```bash
pnpm release
```

This will:
- Build all packages
- Publish to npm registry
- Create git tags

### 4. Dry Run (Testing)

If you want to test the release process without actually publishing:

```bash
pnpm release:dry-run
```

## Common Commands

- `pnpm changeset` - Add new change records
- `pnpm version-packages` - Update version numbers and changelogs
- `pnpm release` - Build and publish to npm
- `pnpm release:dry-run` - Test release process

## Important Notes

1. Make sure to run `pnpm build` and `pnpm test` before releasing to ensure code quality
2. Change records should clearly describe user-visible changes
3. Version numbers follow [Semantic Versioning](https://semver.org/) specification
4. Ensure all changes are committed to git before releasing

## Version Type Explanation

- **patch** (0.0.X): Bug fixes, backward compatible
- **minor** (0.X.0): New features, backward compatible
- **major** (X.0.0): Breaking changes, not backward compatible
