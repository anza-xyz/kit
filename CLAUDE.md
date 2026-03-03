# Agent Instructions

## Project Overview

Kit (`@solana/kit`) is the official JavaScript SDK for building Solana applications, maintained by Anza. The official documentation lives at https://solanakit.com (docs at `/docs`, API reference at `/api`). The GitHub repo is `anza-xyz/kit`.

This is a pnpm monorepo with ~57 packages under `packages/`, orchestrated by Turborepo. The main `@solana/kit` package is a facade that re-exports ~20 workspace packages (accounts, addresses, codecs, errors, keys, rpc, signers, transactions, etc.) and adds its own convenience helpers like `sendAndConfirmTransaction`, `airdrop`, and `fetchLookupTables`.

The documentation website supports an `.mdx` suffix on any page (e.g. `https://solanakit.com/docs/concepts/transactions.mdx`) which returns a cleaner markdown representation suitable for LLM consumption. Use this when you need to look up Kit APIs or concepts.

There is also a companion [`anza-xyz/kit-plugins`](https://github.com/anza-xyz/kit-plugins) monorepo that builds an abstraction layer on top of Kit by offering composable plugins and ready-to-use clients (which are essentially curated sets of plugins). The plugin system relies on the `@solana/plugin-core` and `@solana/plugin-interfaces` packages defined in this repo. Additionally, `@solana/program-client-core` (re-exported from `@solana/kit/program-client-core`) provides the helpers used by the [Codama JS renderer](https://github.com/codama-idl/renderers-js) to generate Kit-compatible program clients.

## Getting Started

```shell
pnpm install                                   # Install dependencies
pnpm test:setup                                # Install the Agave test validator (first time only)
./scripts/start-shared-test-validator.sh       # Start shared test validator (needed for some tests)
pnpm build                                     # Build + test all packages
```

For single-package development:

```shell
cd packages/<name>
pnpm turbo compile:js compile:typedefs         # Compile the package and its dependencies
pnpm dev                                       # Run tests in watch mode
```

## Architecture

The packages form a layered dependency graph. `@solana/errors` is the foundational leaf package with no internal dependencies — nearly every other package depends on it. Core encoding lives in `@solana/codecs-core`, `@solana/codecs-numbers`, `@solana/codecs-strings`, and `@solana/codecs-data-structures`, unified by the `@solana/codecs` facade. `@solana/keys` and `@solana/addresses` build on these codecs and `@solana/nominal-types`. Higher-level packages like `@solana/transactions`, `@solana/rpc`, and `@solana/signers` compose these primitives. `@solana/kit` sits at the top as the consumer-facing umbrella.

Four private "impl" packages (`@solana/crypto-impl`, `@solana/text-encoding-impl`, `@solana/ws-impl`, `@solana/event-target-impl`) provide platform-specific implementations and are **inlined at build time** by tsup — they are never published to npm.

## Build System

- **JS compilation**: tsup (esbuild) via configs in `packages/build-scripts/`.
- **Type declarations**: tsc with per-package `tsconfig.declarations.json`.
- **Build artifacts per package**: Node CJS + ESM, Browser CJS + ESM, React Native ESM. `@solana/kit` additionally produces IIFE bundles (minified production + development with sourcemaps).
- **Platform constants** (set at build time): `__BROWSER__`, `__NODEJS__`, `__REACTNATIVE__`, `__VERSION__`. These are mutually exclusive booleans enabling platform-specific code paths to be tree-shaken.
- **`__DEV__`**: In IIFE builds, statically `true`/`false`. In library builds, replaced with `process.env.NODE_ENV !== 'production'` by the DevFlagPlugin, deferring the decision to the consumer's bundler.

## Testing

- **Framework**: Jest v30 with `@swc/jest` for TypeScript transformation.
- **Shared config**: `packages/test-config/` (`@solana/test-config`).
- **File naming**: `*-test.ts` (runs in both environments), `*-test.node.ts` (Node only), `*-test.browser.ts` (browser/jsdom only). Tests live in `src/__tests__/`.
- **Type tests**: `src/__typetests__/` directories contain compile-time type tests using `satisfies` and `@ts-expect-error`.
- **Lint/prettier**: Also run through Jest runners (`jest-runner-eslint`, `jest-runner-prettier`).
- **Commands**: `pnpm test` runs all unit tests. `pnpm lint` runs lint checks. `pnpm style:fix` auto-fixes formatting.

## Error System

All errors use the `SolanaError` class from `@solana/errors`. Key rules:

- Error codes are numeric constants in `packages/errors/src/codes.ts`, named `SOLANA_ERROR__<DOMAIN>__<DESCRIPTION>` (double-underscore separated).
- Each domain reserves a dedicated numeric range. Never reuse, remove, or reorder error codes.
- Human-readable messages live in `packages/errors/src/messages.ts` with `$key` context interpolation.
- In production builds, messages are stripped. Use `npx @solana/errors decode -- <code>` to decode them.
- To add a new error: add the constant to `codes.ts`, add it to the `SolanaErrorCode` union, optionally define context in `context.ts`, and add the message to `messages.ts`.

## Coding Conventions

- **TypeScript strict mode**, ESM-first.
- **Branded/nominal types**: `@solana/nominal-types` provides `Brand<T, Name>` for types like `Address`, `Signature`, `Lamports` — these are branded primitives, not classes.
- **Functional composition**: Use `pipe()` from `@solana/functional` to compose operations on transaction messages and other data structures.
- **Platform-specific code**: Use `__BROWSER__`, `__NODEJS__`, `__REACTNATIVE__` guards. The build system will tree-shake unused branches.
- **Dev-only code**: Guard with `__DEV__` (e.g. verbose error messages, debug assertions).
- **Formatting**: ESLint via `@solana/eslint-config-solana`, Prettier via `@solana/prettier-config-solana`. Run `pnpm style:fix` to auto-fix.
- **All publishable packages share a fixed version** (currently in lockstep).

## Changesets & Releases

- Use `npx changeset add --empty` to generate changeset files — never create them manually.
- `patch` for fixes, `minor` for features, `major` for breaking changes (while pre-1.0, `minor` may be treated as breaking).
- No changeset needed for docs-only changes, CI config, dev dependency updates, or test-only changes.
- All publishable packages are version-locked via the `fixed` config in `.changeset/config.json`.

## CI

- **PRs**: Build + test on Node `current` and `lts/*`.
- **Bundle size**: Monitored via BundleMon on every PR.
- **Publishing**: On merge to `main`, changesets action creates a "Version Packages" PR or publishes to npm. Canary snapshots are published on every push to `main`.

<!-- skills-inject:start -->

## Skill Instructions

The following instructions come from installed skills (autogenerated, do not edit manually) and should always be followed.

### Changesets

- Any PR that should trigger a package release MUST include a changeset.
- Identify affected packages by mapping changed files to their nearest `package.json`.
- Choose the right bump: `patch` for fixes, `minor` for features, `major` for breaking changes.
- While a project is pre-1.0, `minor` bumps may be treated as breaking.
- ALWAYS use `npx changeset add --empty` to generate a new changeset file with a random name. NEVER create changeset files manually.
- No changeset needed for: docs-only changes, CI config, dev dependency updates, test-only changes.

### Shipping (Git)

- NEVER commit, push, create branches, or create PRs without explicit user approval.
- Before any git operation that creates or modifies a commit, present a review block containing: changeset entry (if applicable), commit title, and commit/PR description. ALWAYS wait for approval.
- Use standard `git add` and `git commit` workflows. Concise title on the first line, blank line, then description body.
- Use `gh pr create` for pull requests.
- Write commit and PR descriptions as natural flowing prose. Do NOT insert hard line breaks mid-paragraph.

### Shipping (Graphite)

- Check if [Graphite](https://graphite.dev/) is installed (`which gt`). Prefer Graphite when available; fall back to the Git shipping workflow otherwise.
- NEVER commit, push, create branches, or create PRs without explicit user approval.
- Before any git operation that creates or modifies a commit, present a review block containing: changeset entry (if applicable), commit title, and commit/PR description. ALWAYS wait for approval.
- Use `gt create -am "Title" -m "Description body"` for new PRs. The first `-m` sets the commit title; the second sets the PR description.
- Use `gt modify -a` to amend the current branch with follow-up changes (NEVER create additional commits on the same branch).
- ALWAYS escape backticks in commit messages with backslashes for shell compatibility (e.g. `"Update \`my-package\` config"`).
- Do NOT run `gt submit` after committing. Only run it when the user explicitly asks to submit or push.
- Write commit and PR descriptions as natural flowing prose. Do NOT insert hard line breaks mid-paragraph.

### TypeScript Docblocks

- All exported functions, types, interfaces, and constants MUST have JSDoc docblocks.
- Start with `/**`, use `*` prefix for each line, end with `*/` — each on its own line.
- Begin with a clear one-to-two line summary. Add a blank line before tags.
- Include `@param`, `@typeParam`, `@return`, `@throws`, and at least one `@example` when helpful.
- Use `{@link ...}` to reference related items. Add `@see` tags at the end for related APIs.

### TypeScript READMEs

- When adding a new public API, add or update the package's README.
- Structure: brief intro, installation, usage (with code snippet), deep-dive sections.
- Code snippets must be realistic, concise, and use TypeScript syntax.
- Focus on the quickest path to success. Developers should feel excited, not overwhelmed.

<!-- skills-inject:end -->
