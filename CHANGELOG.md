# Unreleased

- Add unit test for `BuildScriptComposerTransaction` with `withFeePayer: true`
- Add comprehensive unit tests for `BuildScriptComposerMultiAgentTransaction` covering various scenarios (with secondary signers, fee payer, and combinations)
- Update ESLint configuration to add console global and fix no-undef errors
- Refactor test module loading: move module fetching from top-level await to `beforeAll` hook for better test reliability
- Update tests to use `aptos_account::transfer` instead of `coin::withdraw` for multi-agent transaction tests
- Improve error handling with proper type checking (use `unknown` instead of `any`)
- Fix APT to Octas conversion in all example projects
- Fix `LanguageSwitcher` event listener issue
- Refactor theme initialization for better consistency across example projects
- Fix multi-agent transaction example comments in Node.js example
- Add missing i18n key (`form.description`) in react-project
- Format test files with Prettier
- Update example documentation and comments for clarity

# 0.3.3-beta.1

- Update Node.js versions in CI workflow (changed from ["18.x", "20.x", "lts/*"] to ["20.x", "22.x", "lts/*"])

# 0.3.3-beta

- Support multi-agent transactions with fee payer
- Add `numSigners` and `hasFeePayer` parameters to `AptosScriptComposer` constructor
- Support automatic detection of multi-agent mode based on signers and fee payer
- Fix `BuildScriptComposerTransaction` to correctly pass `withFeePayer` flag
- Add comprehensive multi-agent transaction examples
- Implement theme toggle and multi-agent transaction demo
- Add ThemeContext and ThemeToggle component for managing light/dark mode
- Update layout and components to support theme switching
- Enhance UI with dark mode styles and improved accessibility
- Fix TypeScript any type warning by using proper type inference
- Remove duplicate client.ts file causing build error
- Run lint and format on SDK code

# 0.3.2

- Update dependencies and bug fixes

# 0.3.1

- Update dependencies and improvements

# 0.3.0

- Enhanced AptosScriptComposer with auto-fetch capability
- Update script-composer-pack dependency

# 0.1.1

- Fix identifier in module id for script composer
- Upgrade dependencies to latest to support Aptos SDK v4 and v5

# 0.1.0 

- Initial release, supports script composer
