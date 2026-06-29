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
- **Type tests**: `src/__typetests__/` directories contain compile-time type tests using `satisfies` and `@ts-expect-error`. Structure each file as one or more `// [DESCRIBE] <name>` blocks, with each individual test wrapped in its own nested `{ ... }` block (preceded by a one-line `// comment` describing the test) so that variable scopes don't leak between tests.
- **Lint/prettier**: Also run through Jest runners (`jest-runner-eslint`, `jest-runner-prettier`).
- **Commands**: `pnpm test` runs all unit tests. `pnpm lint` runs lint checks. `pnpm style:fix` auto-fixes formatting.
- **`expect.assertions`**: Only use `expect.assertions(n)` in **async** tests (where you need to guarantee the expected number of assertions ran). Synchronous tests do not need it.
- **Flushing async state**: When a test needs to wait for queued microtasks or promise chains to settle, prefer `jest.useFakeTimers()` + `await jest.runAllTimersAsync()` over hand-rolled `flushMicrotasks` helpers that `await Promise.resolve()` in a loop. The loop count is fragile and breaks as soon as an extra `.then` is introduced. When enabling fake timers in a scoped `beforeEach` (i.e. not at the top of the file), pair it with an `afterEach(() => { jest.useRealTimers(); })` so subsequent describes don't inherit fake timers.
- **Placeholder mocks**: When a test mock must satisfy an interface but a particular method shouldn't be called in that test, make the stub throw/reject rather than using a bare `jest.fn()` that silently returns `undefined`. For sync methods use `jest.fn().mockImplementation(() => { throw new Error('not implemented'); })`; for async methods use `jest.fn().mockRejectedValue(new Error('not implemented'))`. An accidental call then fails the test loudly instead of producing `undefined` and a confusing downstream assertion error.
- **React hook tests**: Use `renderHook` (and `render`) from `packages/react/src/__test-utils__/render.tsx` — these wrap every tree in `<StrictMode>`. Do NOT import `renderHook` / `render` directly from `@testing-library/react` for new tests in the `@solana/react` package. StrictMode's dev double-render surfaces render-phase impurity (side effects in `useMemo` / state initializers, missing effect cleanups, refs read during render) that would otherwise only manifest in real apps. When effect setups legitimately double under StrictMode, assert on end-state (signal aborted, store reset to idle) rather than raw call counts.

## Error System

All errors use the `SolanaError` class from `@solana/errors`. Key rules:

- Error codes are numeric constants in `packages/errors/src/codes.ts`, named `SOLANA_ERROR__<DOMAIN>__<DESCRIPTION>` (double-underscore separated).
- Each domain reserves a dedicated numeric range. Never reuse, remove, or reorder error codes.
- Human-readable messages live in `packages/errors/src/messages.ts` with `$key` context interpolation.
- In production builds, messages are stripped. Use `npx @solana/errors decode -- <code>` to decode them.
- To add a new error: add the constant to `codes.ts`, add it to the `SolanaErrorCode` union, optionally define context in `context.ts`, and add the message to `messages.ts`.

## RPC Types

RPC method response types live in `packages/rpc-api/src/<methodName>.ts`; types for `jsonParsed` account data live in `packages/rpc-parsed-types/`.

- **Agave is the source of truth.** RPC types must mirror the shape the server actually returns — field names, nesting, optionality, and numeric width. Confirm a field against the Agave source for the relevant release tag (e.g. `RpcVoteAccountInfo` in [`anza-xyz/agave`](https://github.com/anza-xyz/agave) at `rpc-client-types/src/response.rs`), and sanity-check the live shape against a local test validator (`./scripts/start-shared-test-validator.sh`, then `curl` the method). Don't infer the type from a single validator's output alone — read the Rust definition.
- **`number` vs `bigint` is decided by the Rust type.** Kit's response transformer (`packages/rpc-transformers/src/response-transformer-bigint-upcast.ts`) upcasts **every** JSON integer to `bigint` by default, to avoid silent precision loss on values that can exceed `Number.MAX_SAFE_INTEGER`. To keep a field as a JS `number` instead, you must add its keypath to an allow-list. Decide based on the server-side type:
    - `u64` / `usize` / `i64`, or anything that could exceed 2^53 → type as **`bigint`**; do **not** allow-list it (let the default upcast apply).
    - A small bounded integer guaranteed to fit a JS number (`u8`, `u16`, `u32`) → type as **`number`** and allow-list its keypath.
    - A float (`f32`/`f64`, which cannot be a `bigint`) → type as **`number`** and allow-list its keypath.
- **Where to allow-list a keypath:** for top-level method responses, add it to the per-method entry in `getAllowedNumericKeypaths()` in `packages/rpc-api/src/index.ts` (keyed by method name, with `KEYPATH_WILDCARD` for array elements). For numbers nested inside `jsonParsed` account data, add it to the shared configs in `packages/rpc-transformers/src/response-transformer-allowed-numeric-values.ts`.
- **Optionality & versioning.** If the Agave field is `Option<T>` or `#[serde(skip_serializing_if = ...)]`, or was introduced/removed in a specific Agave version, type it optional (`field?: T`) — older or newer nodes won't always include it. Prefer backward-compatible widenings (optional fields, or a union of the old and new shapes that callers can narrow) over hard replacements, so the types stay correct across validator versions rather than asserting one version's shape.
- **Mirror changes in `@solana/rpc-graphql`.** The GraphQL schema in `packages/rpc-graphql/src/schema/type-defs/` re-exposes the same RPC and `jsonParsed` account shapes, so when you change a `jsonParsed` type (especially a parsed-account shape in `rpc-parsed-types`), check whether the corresponding GraphQL type needs the same field added/removed. GraphQL output fields are nullable unless suffixed with `!`, so prefer leaving version-dependent fields nullable (don't add `!`) and keep legacy fields alongside new ones — the same backward-compatible widening rule as above. Most fields resolve via GraphQL's default resolver straight off the parsed object, so adding a field to the type def is usually enough; only `data`/`ownerProgram`-style fields have custom resolvers in `packages/rpc-graphql/src/schema/type-resolvers/`.

## Coding Conventions

- **TypeScript strict mode**, ESM-first.
- **Branded/nominal types**: `@solana/nominal-types` provides `Brand<T, Name>` for types like `Address`, `Signature`, `Lamports` — these are branded primitives, not classes.
- **Functional composition**: Use `pipe()` from `@solana/functional` to compose operations on transaction messages and other data structures.
- **Platform-specific code**: Use `__BROWSER__`, `__NODEJS__`, `__REACTNATIVE__` guards. The build system will tree-shake unused branches.
- **Dev-only code**: Guard with `__DEV__` (e.g. verbose error messages, debug assertions).
- **Formatting**: ESLint via `@solana-config/eslint`, Prettier via `@solana-config/prettier`. Run `pnpm style:fix` to auto-fix.
- **All publishable packages share a fixed version** (currently in lockstep).
- **Deferred promises**: Use `Promise.withResolvers<T>()` instead of hand-rolling a `new Promise((resolve, reject) => ...)` with captured externals. Do not reintroduce a `deferred()` helper — `Promise.withResolvers` already returns `{ promise, resolve, reject }`.

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
