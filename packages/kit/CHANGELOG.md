# @solana/kit

## 7.0.0

### Major Changes

- [#1663](https://github.com/anza-xyz/kit/pull/1663) [`d09718d`](https://github.com/anza-xyz/kit/commit/d09718de4e2644c8d2a29d4e2d8992bc06177510) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Add `withSignal()` to `ReactiveStreamStore` for per-connection cancellation, replacing the construction-time `abortSignal` option. Mirrors the action store's per-dispatch `withSignal()` pattern — callers attach a per-connection signal at the call site instead of baking one into the store.

    ```ts
    const store = createReactiveStoreFromDataPublisherFactory({
        createDataPublisher: signal => transport({ signal, ...plan }),
        dataChannelName: 'notification',
        errorChannelName: 'error',
    });
    // Per-connection timeout — fresh clock per attempt:
    store.withSignal(AbortSignal.timeout(30_000)).connect();
    ```

    `store.withSignal(signal)` returns a thin wrapper exposing `connect()` that composes the caller-provided signal with the per-connection inner controller via `AbortSignal.any`. Aborting the caller's signal surfaces the abort reason on state as `{ status: 'error' }`; supersession via the internal controller (a newer `connect()` or `reset()`) stays silent so the newer call owns state. The "permanent kill switch" pattern is expressible by binding once: `const killable = store.withSignal(killCtrl.signal); killable.connect();`. After `killCtrl.abort()`, every `killable.connect()` short-circuits to error.

    `createDataPublisher` is widened from `() => Promise<DataPublisher>` to `(signal: AbortSignal) => Promise<DataPublisher>`. The store passes the composed per-connection signal to the factory so the underlying transport can stop on per-connection abort, not just the stream-store's listeners. Existing no-arg factories still satisfy the new shape — TypeScript allows fewer parameters than the declared type.

    The construction-time `abortSignal` option on `createReactiveStoreFromDataPublisherFactory`, `createReactiveStoreWithInitialValueAndSlotTracking`, and `PendingRpcSubscriptionsRequest.reactiveStore()` is removed. Callers wanting a long-lived kill switch use the bind-once `withSignal` pattern. `ReactiveStreamSource<T>.reactiveStore()` is now parameter-less (mirrors `ReactiveActionSource<T>.reactiveStore()`).

- [#1662](https://github.com/anza-xyz/kit/pull/1662) [`fa04323`](https://github.com/anza-xyz/kit/commit/fa043235a58d928a30b7a66a56643dec5327dd6a) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Drop auto-connect from `ReactiveStreamStore`; callers explicitly invoke `connect()` to open the underlying stream. Mirrors the action store's caller-driven `dispatch()` pattern — the store is a state machine that callers orchestrate, not a self-starting subscription.

    The factory variant returned by `createReactiveStoreFromDataPublisherFactory` now starts in `status: 'idle'`. Call `store.connect()` to open the stream; from `idle`, the store transitions through `loading` → `loaded` (or `error`). A subsequent `connect()` from any non-idle status transitions through `retrying` while preserving the last known value. A new `reset()` method aborts the current connection and returns the store to `idle` without permanently killing it — natural for React effect cleanup.

    ```ts
    const store = createReactiveStoreFromDataPublisherFactory({
        abortSignal,
        createDataPublisher,
        dataChannelName: 'notification',
        errorChannelName: 'error',
    });
    store.connect(); // opens the stream — previously this happened on construction
    ```

    `retry()` is now deprecated; it remains as an error-only alias for `connect()`. Migrate to calling `connect()` directly. Code that previously relied on `retry()` being a no-op when the store was not in `error` state should add an explicit `if (status === 'error') store.connect();` guard at the call site.

    `createReactiveStoreFromDataPublisher` (the deprecated non-factory variant accepting a ready-made `DataPublisher`) is removed. Its only documented use was as a backwards-compatibility alias behind `PendingRpcSubscriptionsRequest.reactive()`, which is also removed in this release. Migrate to the factory variant — wrap a ready-made publisher in `() => Promise.resolve(publisher)` if needed — and use `reactiveStore()` for RPC subscriptions.

    `createReactiveStoreWithInitialValueAndSlotTracking` in `@solana/kit` no longer fires the RPC request on construction — call `store.connect()` to start it, or wrap in a `useEffect` that calls `connect()` on mount and `reset()` on cleanup. The store starts in `status: 'idle'` and follows the same lifecycle as the underlying stream store.

- [#1708](https://github.com/anza-xyz/kit/pull/1708) [`03000e5`](https://github.com/anza-xyz/kit/commit/03000e57cf90a1dab630704edf067bc2ac3bc381) Thanks [@mcintyre94](https://github.com/mcintyre94)! - `createReactiveStoreWithInitialValueAndSlotTracking` now consumes its two inputs as reactive sources rather than as request objects it calls `send()` / `subscribe()` on directly. The `rpcRequest` / `rpcSubscriptionRequest` config fields (and their `rpcValueMapper` / `rpcSubscriptionValueMapper`) are replaced by `initialValueSource: ReactiveActionSource<...>` / `streamSource: ReactiveStreamSource<...>` (with `initialValueMapper` / `streamValueMapper`).

    Each source is consumed via its `reactiveStore()` method, so the helper reuses `ReactiveActionStore` / `ReactiveStreamStore` primitives. `PendingRpcRequest` satisfies `ReactiveActionSource` and `PendingRpcSubscriptionsRequest` satisfies `ReactiveStreamSource`, so callers can still pass eg. `rpc.getBalance(addr)` / `rpcSubscriptions.accountNotifications(addr)` results directly.

    ```ts
    const balanceStore = createReactiveStoreWithInitialValueAndSlotTracking({
        initialValueSource: rpc.getBalance(myAddress, { commitment: 'confirmed' }),
        initialValueMapper: lamports => lamports,
        streamSource: rpcSubscriptions.accountNotifications(myAddress),
        streamValueMapper: ({ lamports }) => lamports,
    });
    balanceStore.withSignal(AbortSignal.timeout(60_000)).connect();
    ```

- [#1677](https://github.com/anza-xyz/kit/pull/1677) [`a198b5c`](https://github.com/anza-xyz/kit/commit/a198b5c6c9681b3f9c37d9d458cbc6b87b7667e7) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Collapse `loading` and `retrying` into a single `loading` status on `ReactiveStreamStore`, mirroring the action store's `running` (which is itself the merged "first call vs subsequent call" state). `data` and `error` are preserved through `loading` for stale-while-revalidate — UI can render the prior outcome alongside an in-flight reconnect.

    `ReactiveState<T>` drops the `retrying` variant. `loading` widens from `{ data: undefined, error: undefined }` to `{ data: T | undefined, error: unknown }`. Both `createReactiveStoreFromDataPublisherFactory` and `createReactiveStoreWithInitialValueAndSlotTracking` now transition every `connect()` through `loading` (preserving `currentState.data` and `currentState.error`); a subsequent `loaded` clears `error`, a subsequent `error` replaces it.

    ```ts
    // Previously:
    { status: 'error', data: lastValue, error: caughtError }
    // connect() →
    { status: 'retrying', data: lastValue, error: undefined }  // error cleared, separate status

    // Now:
    { status: 'error', data: lastValue, error: caughtError }
    // connect() →
    { status: 'loading', data: lastValue, error: caughtError }  // error preserved, unified status
    ```

    Migration: replace `status === 'retrying'` checks with `status === 'loading' && data !== undefined` (or just `status === 'loading'` if you don't need to distinguish first-load vs reconnect — the SWR pattern lets you render whatever is in `data` regardless).

- [#1786](https://github.com/anza-xyz/kit/pull/1786) [`6947740`](https://github.com/anza-xyz/kit/commit/6947740680b1bb8c570a5c513ba165e356ceee7d) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Remove deprecated `getMinimumBalanceForRentExemption` and `createEmptyClient`.

    **BREAKING CHANGES**

    **Removed `getMinimumBalanceForRentExemption` from `@solana/kit`.** The minimum balance for an account is being actively reduced (see [SIMD-0437](https://github.com/solana-foundation/solana-improvement-documents/pull/437)) and is expected to become dynamic in future Solana upgrades (see [SIMD-0194](https://github.com/solana-foundation/solana-improvement-documents/pull/194) and [SIMD-0389](https://github.com/solana-foundation/solana-improvement-documents/pull/389)), so a hardcoded local computation can no longer return accurate results. Use the `getMinimumBalanceForRentExemption` RPC method or a `ClientWithGetMinimumBalance` plugin instead.

    ```diff
    - import { getMinimumBalanceForRentExemption } from '@solana/kit';
    - const rentExemptLamports = getMinimumBalanceForRentExemption(82n);
    + const { value: rentExemptLamports } = await rpc.getMinimumBalanceForRentExemption(82n).send();
    ```

    **Removed `createEmptyClient` from `@solana/plugin-core`.** Use `createClient`, which behaves identically and additionally accepts an optional initial value.

    ```diff
    - import { createEmptyClient } from '@solana/plugin-core';
    - const client = createEmptyClient();
    + import { createClient } from '@solana/plugin-core';
    + const client = createClient();
    ```

- [#1780](https://github.com/anza-xyz/kit/pull/1780) [`acec0be`](https://github.com/anza-xyz/kit/commit/acec0be468340a7367f78fe8a8ed61ed8a16e553) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Streamline the `ReactiveStreamStore` contract by removing deprecated members and unifying its state accessor with `ReactiveActionStore`. The `getUnifiedState()` method has been renamed to `getState()`, and the deprecated value-only `getState()`, `getError()`, and `retry()` members along with the `ReactiveStore` type alias have been removed.

    **BREAKING CHANGES**

    **`getUnifiedState()` renamed to `getState()`.** The unified `{ data, error, status }` snapshot accessor is now simply `getState()`, matching `ReactiveActionStore.getState()`.

    ```diff
    - const state = useSyncExternalStore(store.subscribe, store.getUnifiedState);
    + const state = useSyncExternalStore(store.subscribe, store.getState);
    ```

    **Removed the deprecated value-only `getState()` and `getError()`.** Read the value and error off the unified snapshot instead.

    ```diff
    - const data = store.getState();
    - const error = store.getError();
    + const { data, error } = store.getState();
    ```

    **Removed `retry()`.** Use `connect()`, which always (re)connects regardless of status. Wrap it with a status guard if you need the error-only behavior.

    ```diff
    - store.retry();
    + if (store.getState().status === 'error') store.connect();
    ```

    **Removed the `ReactiveStore` type alias.** Use `ReactiveStreamStore` directly.

    ```diff
    - import type { ReactiveStore } from '@solana/subscribable';
    + import type { ReactiveStreamStore } from '@solana/subscribable';
    ```

### Minor Changes

- [#1611](https://github.com/anza-xyz/kit/pull/1611) [`772b82c`](https://github.com/anza-xyz/kit/commit/772b82c4f18c418100560a5010b17e6b40dd7ab3) Thanks [@amilz](https://github.com/amilz)! - Add `@solana/transaction-introspection`, a new package that bridges a `getTransaction` response and the auto-generated `@solana-program/*` `parseXInstruction` clients. Decodes the transaction (`encoding: 'base64'`, `'base58'`, or `'json'`), resolves account indices against static + ALT-loaded addresses, normalizes inner instructions from `meta.innerInstructions`, and exposes `walkInstructions` to enumerate every instruction in display order — each outer instruction followed by its inner instructions — with a `trace` recording its location. Each returned instruction is a `ResolvedInstruction & { trace }` directly usable with `isInstructionForProgram` from `@solana/instructions` and with the auto-generated `identifyXInstruction` / `parseXInstruction` helpers. Supports `legacy`, `v0`, and `v1` compiled transaction messages. Re-exported from `@solana/kit`.

    ```ts
    import { createSolanaRpc, signature } from '@solana/kit';
    import { isInstructionForProgram } from '@solana/instructions';
    import { decodeTransactionFromRpcResponse, walkInstructions } from '@solana/transaction-introspection';
    import { identifyTokenInstruction, TOKEN_PROGRAM_ADDRESS, TokenInstruction } from '@solana-program/token';

    const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
    const rpcTx = await rpc
        .getTransaction(signature(txid), {
            commitment: 'confirmed',
            encoding: 'base64',
            maxSupportedTransactionVersion: 0,
        })
        .send();
    if (!rpcTx) throw new Error(`Transaction ${txid} not found`);

    const { compiledMessage, loadedAddresses } = decodeTransactionFromRpcResponse(rpcTx);

    for (const ix of walkInstructions({ compiledMessage, loadedAddresses, meta: rpcTx.meta })) {
        if (!isInstructionForProgram(ix, TOKEN_PROGRAM_ADDRESS)) continue;
        if (identifyTokenInstruction(ix) === TokenInstruction.SyncNative) {
            console.log('SyncNative found at', ix.trace);
        }
    }
    ```

    `@solana/rpc-api` now exports the non-null `getTransaction` response shapes as named types (`GetTransactionApiResponseBase58`, `GetTransactionApiResponseBase64`, `GetTransactionApiResponseJson`, `GetTransactionApiResponseJsonParsed`), which `decodeTransactionFromRpcResponse` accepts as inputs. `@solana/errors` gains `SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_INSTRUCTION_ACCOUNT_INDEX_OUT_OF_RANGE` plus a new `TRANSACTION_INTROSPECTION` domain (`SOLANA_ERROR__TRANSACTION_INTROSPECTION__CANNOT_DECODE_JSON_PARSED_TRANSACTION`, `SOLANA_ERROR__TRANSACTION_INTROSPECTION__UNRECOGNIZED_GET_TRANSACTION_RESPONSE`).

- [#1706](https://github.com/anza-xyz/kit/pull/1706) [`9063658`](https://github.com/anza-xyz/kit/commit/906365844fdc8555850ea9c8d1fc84614e6883ca) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Migrate `@solana/react` to depend on `@solana/kit` as a peer dependency (replacing its individual workspace sub-package deps) and re-export `@solana/subscribable` from `@solana/kit` so React consumers have a single import root. `@solana/promises` remains as a direct dep — it's a small utility that isn't part of Kit's public surface.

    For `@solana/react` users:
    - `@solana/kit` must now be installed alongside `@solana/react`.
    - Apps that already use both get a single deduplicated `@solana/kit` instance — important for anything relying on shared types or `instanceof SolanaError` checks.
    - Kit can be bumped independently of React within the peer range.

    For `@solana/kit` users:
    - `ReactiveStreamSource`, `ReactiveStreamStore`, `ReactiveActionSource`, `ReactiveActionStore`, `ReactiveState`, `createReactiveActionStore`, `createReactiveStoreFromDataPublisherFactory`, `DataPublisher` and the rest of `@solana/subscribable`'s surface are now reachable directly through `@solana/kit`.

### Patch Changes

- [#1740](https://github.com/anza-xyz/kit/pull/1740) [`a4ef3b5`](https://github.com/anza-xyz/kit/commit/a4ef3b5f6c3735d015d6f08898372bd648f36c67) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Fix `createReactiveStoreWithInitialValueAndSlotTracking` stranding the store in `loading` when a fresh `connect()` window is answered only by a stale-slot value

    `lastUpdateSlot` persists across `connect()` windows so the surfaced value never regresses. Previously, a successful response at a slot older than the high-water mark was dropped entirely — including the status transition — so a reconnect (e.g. a `useTrackedData` `refresh()`) answered by a lagging RPC node while a quiet account's subscription emitted nothing would sit in `loading` forever. A stale-slot response now settles the store back to `loaded`, retaining the newer data it already holds rather than regressing to the older value.

- Updated dependencies [[`3014977`](https://github.com/anza-xyz/kit/commit/30149771475d45b6cfff1c4aacd16c8f7256e256), [`d09718d`](https://github.com/anza-xyz/kit/commit/d09718de4e2644c8d2a29d4e2d8992bc06177510), [`fa04323`](https://github.com/anza-xyz/kit/commit/fa043235a58d928a30b7a66a56643dec5327dd6a), [`3de3dda`](https://github.com/anza-xyz/kit/commit/3de3dda437c18be882cd6378bebda7a82a54e5b0), [`772b82c`](https://github.com/anza-xyz/kit/commit/772b82c4f18c418100560a5010b17e6b40dd7ab3), [`660bd74`](https://github.com/anza-xyz/kit/commit/660bd7447348d6669d48f6f45fc627b002bc16aa), [`e193711`](https://github.com/anza-xyz/kit/commit/e1937110a3eb300e184b10732f82ccfefe9c2a3f), [`069d56d`](https://github.com/anza-xyz/kit/commit/069d56d69226f755412b282c22818cbc90f2db4f), [`a198b5c`](https://github.com/anza-xyz/kit/commit/a198b5c6c9681b3f9c37d9d458cbc6b87b7667e7), [`8d3bbf1`](https://github.com/anza-xyz/kit/commit/8d3bbf1b471aa153e1d51a995981224778fa2937), [`cab6d7e`](https://github.com/anza-xyz/kit/commit/cab6d7ed7bc870ba030c961c131a2cd8c49b6eb4), [`6947740`](https://github.com/anza-xyz/kit/commit/6947740680b1bb8c570a5c513ba165e356ceee7d), [`1c8d215`](https://github.com/anza-xyz/kit/commit/1c8d215afaa795f981999a5d8c6f21e9effb1db6), [`2c47363`](https://github.com/anza-xyz/kit/commit/2c47363f8add9d16aa3a7e6181344e167d27997c), [`acec0be`](https://github.com/anza-xyz/kit/commit/acec0be468340a7367f78fe8a8ed61ed8a16e553)]:
    - @solana/errors@7.0.0
    - @solana/subscribable@7.0.0
    - @solana/transaction-introspection@7.0.0
    - @solana/rpc-api@7.0.0
    - @solana/rpc-spec-types@7.0.0
    - @solana/instruction-plans@7.0.0
    - @solana/rpc-parsed-types@7.0.0
    - @solana/plugin-core@7.0.0
    - @solana/rpc-types@7.0.0
    - @solana/accounts@7.0.0
    - @solana/addresses@7.0.0
    - @solana/instructions@7.0.0
    - @solana/keys@7.0.0
    - @solana/offchain-messages@7.0.0
    - @solana/program-client-core@7.0.0
    - @solana/programs@7.0.0
    - @solana/rpc@7.0.0
    - @solana/rpc-subscriptions@7.0.0
    - @solana/signers@7.0.0
    - @solana/sysvars@7.0.0
    - @solana/transaction-confirmation@7.0.0
    - @solana/transaction-messages@7.0.0
    - @solana/transactions@7.0.0
    - @solana/codecs@7.0.0
    - @solana/plugin-interfaces@7.0.0
    - @solana/functional@7.0.0

## 6.10.0

### Minor Changes

- [#1555](https://github.com/anza-xyz/kit/pull/1555) [`5e1644d`](https://github.com/anza-xyz/kit/commit/5e1644db15cfe6828d382041e10bf7e58bd7f825) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Add a `reactiveStore()` method to `PendingRpcRequest`. It fires the request on construction and synchronously returns a `ReactiveActionStore` that holds the request's `idle`/`running`/`success`/`error` lifecycle state. Compatible with `useSyncExternalStore`, Svelte stores, and other reactive primitives. Call `dispatch()` to re-fire the request (e.g. after an error), or `reset()` to abort the in-flight call and return to idle.

    ```ts
    const store = rpc.getAccountInfo(address).reactiveStore();
    const state = useSyncExternalStore(store.subscribe, store.getState);
    if (state.status === 'error') return <ErrorMessage error={state.error} onRetry={store.dispatch} />;
    if (state.status === 'running' && !state.data) return <Spinner />;
    return <View data={state.data!} />;
    ```

- [#1553](https://github.com/anza-xyz/kit/pull/1553) [`15b610d`](https://github.com/anza-xyz/kit/commit/15b610deb88ba0a49b8fdab7dec7085ad3f4cb6e) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Add a `reactiveStore()` method to `PendingRpcSubscriptionsRequest`. Unlike `reactive()`, this variant returns a `ReactiveStore` synchronously and supports `retry()` to reconnect after an error. `reactive()` is now `@deprecated` in favour of `reactiveStore()`.

    ```ts
    const store = rpc.accountNotifications(address).reactiveStore({ abortSignal });
    const state = useSyncExternalStore(store.subscribe, store.getUnifiedState);
    if (state.status === 'error') return <ErrorMessage error={state.error} onRetry={store.retry} />;
    ```

- [#1552](https://github.com/anza-xyz/kit/pull/1552) [`c318d7f`](https://github.com/anza-xyz/kit/commit/c318d7f2e16fec92859503af41102792be01cece) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Add `retry()` and `getUnifiedState()` to `ReactiveStore`. The new `getUnifiedState()` returns a discriminated `{ data, error, status }` snapshot with stable identity, so stores can be passed directly to `useSyncExternalStore` without an intermediate wrapper. `getState()` and `getError()` remain on the type but are now `@deprecated` in favour of the unified snapshot.

    A new `createReactiveStoreFromDataPublisherFactory` function is also introduced. It accepts a `createDataPublisher: () => Promise<DataPublisher>` factory rather than a ready-made publisher, which lets the store reconnect via `retry()` after an error. The existing `createReactiveStoreFromDataPublisher` is now `@deprecated`; calling `retry()` on a store it produced throws a new `SolanaError` with code `SOLANA_ERROR__SUBSCRIBABLE__RETRY_NOT_SUPPORTED`.

    `createReactiveStoreWithInitialValueAndSlotTracking` (from `@solana/kit`) now supports `retry()`, which re-sends the RPC request and re-subscribes to the subscription with a fresh abort signal while preserving the last known slot and value.

- [#1606](https://github.com/anza-xyz/kit/pull/1606) [`da868aa`](https://github.com/anza-xyz/kit/commit/da868aafa3aec49dc5984d768c65adb471fb71de) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Add framework-agnostic source duck-types for reactive bindings.

    `@solana/subscribable` now exports two new types:
    - `ReactiveStreamSource<T>` — anything with a `reactiveStore({ abortSignal })` method that returns a `ReactiveStreamStore<T>`. `PendingRpcSubscriptionsRequest<T>` satisfies this by design.
    - `ReactiveActionSource<T>` — anything with a zero-argument `reactiveStore()` method that returns a `ReactiveActionStore<[], T>`. `PendingRpcRequest<T>` satisfies this by design.

    These let reactive-framework bindings consume a single duck-type instead of naming concrete producer types — and let plugin authors expose their own pending-request objects to those bindings without modification.

    Both source types live in `@solana/subscribable` and are not re-exported from `@solana/kit`, matching the existing convention for their parent `ReactiveStreamStore` / `ReactiveActionStore` types — anyone consuming a source duck-type is already in the reactive-primitives layer and will already be importing the related store types from the same package.

    `@solana/kit` now publicly exports the previously-private `CreateReactiveStoreWithInitialValueAndSlotTrackingConfig` type so non-React consumers (e.g. plugins) can declare function return shapes based on it without taking a dependency on `@solana/react`.

- [#1654](https://github.com/anza-xyz/kit/pull/1654) [`460557b`](https://github.com/anza-xyz/kit/commit/460557b9f706f22aa384cb175deeb45c30081166) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Added `estimateResourceLimitsFactory`, `estimateAndSetResourceLimitsFactory`, and `fillTransactionMessageProvisoryResourceLimits` to `@solana/kit`. These mirror the existing compute-unit estimators but additionally estimate and set the loaded accounts data size limit, which is required for version 1 transactions. Both limits are derived from a single simulation call.

    Two new error codes were added to `@solana/errors`: `SOLANA_ERROR__TRANSACTION__FAILED_TO_ESTIMATE_LOADED_ACCOUNTS_DATA_SIZE_LIMIT` (thrown when an RPC fails to return a `loadedAccountsDataSize` value while estimating a version 1 transaction) and `SOLANA_ERROR__TRANSACTION__FAILED_WHEN_SIMULATING_TO_ESTIMATE_RESOURCE_LIMITS` (the resource-limits counterpart of `SOLANA_ERROR__TRANSACTION__FAILED_WHEN_SIMULATING_TO_ESTIMATE_COMPUTE_LIMIT`).

    ## Migration

    The compute-unit-only helpers are still exported but are now deprecated. The new helpers handle every transaction version: for legacy and version 0 messages they behave the same as the old ones (only the compute unit limit is set); for version 1 messages they additionally set the loaded accounts data size limit, which is required for v1.

    ### `estimateComputeUnitLimitFactory` → `estimateResourceLimitsFactory`

    The new estimator returns an object instead of a `number`. Destructure `computeUnitLimit` from the result:

    ```ts
    // Before
    const estimateComputeUnitLimit = estimateComputeUnitLimitFactory({ rpc });
    const units = await estimateComputeUnitLimit(transactionMessage);

    // After
    const estimateResourceLimits = estimateResourceLimitsFactory({ rpc });
    const { computeUnitLimit } = await estimateResourceLimits(transactionMessage);
    // If provided by the RPC, `loadedAccountsDataSizeLimit` is also returned
    ```

    ### `estimateAndSetComputeUnitLimitFactory` → `estimateAndSetResourceLimitsFactory`

    The new helper accepts the multi-resource estimator and returns a function with the same shape as before — it takes a transaction message and returns the same message with resource limits set. No call-site change beyond the factory swap:

    ```ts
    // Before
    const estimator = estimateComputeUnitLimitFactory({ rpc });
    const estimateAndSet = estimateAndSetComputeUnitLimitFactory(estimator);

    // After
    const estimator = estimateResourceLimitsFactory({ rpc });
    const estimateAndSet = estimateAndSetResourceLimitsFactory(estimator);
    ```

    Behavior note: the new helper re-estimates the compute unit limit when it is unset, set to the provisory value of `0`, or set to the runtime max of `1_400_000` (same as before). For the loaded accounts data size limit on v1 messages it only re-estimates when unset or set to the provisory `0`; an explicit value — including the runtime max of 64 MiB — is left untouched, since callers who set it explicitly are signaling a deliberate choice.

    ### `fillTransactionMessageProvisoryComputeUnitLimit` → `fillTransactionMessageProvisoryResourceLimits`

    The signature is unchanged. For v1 messages, the new helper additionally reserves a provisory `0` for the loaded accounts data size limit when none is set. For legacy and v0 messages, the behavior is unchanged and the function only reserves space for the CU limit.

    ```ts
    // Before
    const reserved = fillTransactionMessageProvisoryComputeUnitLimit(transactionMessage);

    // After
    const reserved = fillTransactionMessageProvisoryResourceLimits(transactionMessage);
    ```

- [#1554](https://github.com/anza-xyz/kit/pull/1554) [`47a785b`](https://github.com/anza-xyz/kit/commit/47a785bdb47f89443cccb69151650974d0f57f65) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Rename `ReactiveStore<T>` to `ReactiveStreamStore<T>`. The old name remains exported as a deprecated alias and will be removed in a future major release.

### Patch Changes

- Updated dependencies [[`0d5aa7f`](https://github.com/anza-xyz/kit/commit/0d5aa7f23e3dbc42f974484e1212cdca737b8e91), [`953eed6`](https://github.com/anza-xyz/kit/commit/953eed6ef7f54b1fc367b7dfa84a45fd37c9a4bc), [`c318d7f`](https://github.com/anza-xyz/kit/commit/c318d7f2e16fec92859503af41102792be01cece), [`09e7796`](https://github.com/anza-xyz/kit/commit/09e779660a13899862fdf15a379d750be71e77d5), [`d655bef`](https://github.com/anza-xyz/kit/commit/d655bef59c7ed6c8150802951a0d2d1b0c6b472c), [`da868aa`](https://github.com/anza-xyz/kit/commit/da868aafa3aec49dc5984d768c65adb471fb71de), [`460557b`](https://github.com/anza-xyz/kit/commit/460557b9f706f22aa384cb175deeb45c30081166), [`93191af`](https://github.com/anza-xyz/kit/commit/93191af2fd088cd1c56cbed65b2ba1acd2a49ff6), [`6c2c903`](https://github.com/anza-xyz/kit/commit/6c2c903d0eb573aa2c7bf179c7f005c9ee6f4db6), [`40e0848`](https://github.com/anza-xyz/kit/commit/40e084878ca49f37f38065c8b2f64f1b62454f36), [`47a785b`](https://github.com/anza-xyz/kit/commit/47a785bdb47f89443cccb69151650974d0f57f65), [`6b499ee`](https://github.com/anza-xyz/kit/commit/6b499ee38a3f695951a8505f23964839fd308b3d), [`82a1ac5`](https://github.com/anza-xyz/kit/commit/82a1ac56131ebc2ad43f948feb862172418f8b3d), [`74b8d3d`](https://github.com/anza-xyz/kit/commit/74b8d3d5166b4857ab722eae0ec5e2843e480a4b)]:
    - @solana/rpc-api@6.10.0
    - @solana/transaction-confirmation@6.10.0
    - @solana/subscribable@6.10.0
    - @solana/errors@6.10.0
    - @solana/plugin-core@6.10.0
    - @solana/rpc-types@6.10.0
    - @solana/offchain-messages@6.10.0
    - @solana/program-client-core@6.10.0
    - @solana/rpc@6.10.0
    - @solana/sysvars@6.10.0
    - @solana/accounts@6.10.0
    - @solana/plugin-interfaces@6.10.0
    - @solana/rpc-subscriptions@6.10.0
    - @solana/addresses@6.10.0
    - @solana/instruction-plans@6.10.0
    - @solana/instructions@6.10.0
    - @solana/keys@6.10.0
    - @solana/programs@6.10.0
    - @solana/signers@6.10.0
    - @solana/transaction-messages@6.10.0
    - @solana/transactions@6.10.0
    - @solana/rpc-parsed-types@6.10.0
    - @solana/codecs@6.10.0
    - @solana/functional@6.10.0
    - @solana/rpc-spec-types@6.10.0

## 6.9.0

### Minor Changes

- [#1544](https://github.com/anza-xyz/kit/pull/1544) [`e82e03e`](https://github.com/anza-xyz/kit/commit/e82e03eb0e982db74f96d11b9aa8fefb4f0038c3) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Update RPC types for Agave v3.x validator compatibility.

    **`@solana/rpc-parsed-types`**: `JsonParsedVoteAccount` now includes `blockRevenueCollector`, `blockRevenueCommissionBps`, `blsPubkeyCompressed`, `inflationRewardsCollector`, `inflationRewardsCommissionBps`, `pendingDelegatorRewards`, and a `latency` field on each vote entry.

    **`@solana/rpc-api`**: `SimulateTransactionApiResponseBase` now includes `fee`, `loadedAddresses`, `preBalances`, `postBalances`, `preTokenBalances`, and `postTokenBalances`.

    **`@solana/errors`**: `RpcSimulateTransactionResult` updated with the same new fields.

    **Note on `replacementBlockhash`**: Agave v3.x validators now always return `replacementBlockhash` in `simulateTransaction` responses (as `null` when `replaceRecentBlockhash` is not set). Kit's types still model this field as conditionally present based on config. A future breaking change will move it to the base response type as `TransactionBlockhashLifetime | null` to match v3.x behavior. Consumers using v3.x validators may see this field at runtime even when Kit's types don't surface it.

    **Note on Agave v3.x validator behavior**: Validators running Agave v3.x no longer return a dedicated `TRANSACTION_SIGNATURE_VERIFICATION_FAILURE` RPC error for invalid signatures in `simulateTransaction` or `sendTransaction`. Instead, `simulateTransaction` returns a result with `err: "SignatureFailure"`, and `sendTransaction` returns a preflight failure with the signature error as the cause. This is a validator-level change and does not affect Kit's API surface.

- [#1551](https://github.com/anza-xyz/kit/pull/1551) [`d24f908`](https://github.com/anza-xyz/kit/commit/d24f908a4fbbddddd9e8bacc57485de6d8e022b4) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Add `ClientWithSubscribeToPayer` and `ClientWithSubscribeToIdentity` interfaces. These are a framework-agnostic convention for plugins that mutate `client.payer` / `client.identity` reactively — they install a sibling `subscribeToPayer` / `subscribeToIdentity` function so consumers can observe changes without naming the specific plugin that provides them.

- [#1570](https://github.com/anza-xyz/kit/pull/1570) [`c5e0e14`](https://github.com/anza-xyz/kit/commit/c5e0e1444ae420390047d5e37a13650edf042954) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add a new `@solana/fixed-points` package providing precise fixed-point number types for Solana, both decimal (power-of-10 scale) and binary (power-of-2 scale), in signed and unsigned flavors with arbitrary bit widths. The package includes factories, guards, arithmetic, comparisons, signedness conversions, rescaling, string/number formatting, and byte-level codecs. Also re-exported from `@solana/codecs` and `@solana/kit`.

- [#1562](https://github.com/anza-xyz/kit/pull/1562) [`096c48e`](https://github.com/anza-xyz/kit/commit/096c48e6771ad7ea833cb4ca51206b7cc827a3d7) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Bump the TypeScript peer dependency floor from `>=5.0.0` to `>=5.4.0`.

- [#1578](https://github.com/anza-xyz/kit/pull/1578) [`0e8fd3f`](https://github.com/anza-xyz/kit/commit/0e8fd3f62b2cdb8e5082700096ce011883a60578) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add `Sol`, `sol()`, `solToLamports`, and `lamportsToSol` helpers for converting between SOL amounts expressed as `@solana/fixed-points` values and `Lamports` branded bigints. Also add `getSolEncoder`, `getSolDecoder`, and `getSolCodec` for serializing SOL amounts to bytes (the encoder accepts both `Sol` and `Lamports` inputs; the decoder always returns `Sol`). Finally, update `getLamportsEncoder`/`getDefaultLamportsEncoder` and their codec counterparts to also accept `Sol` as input.

### Patch Changes

- Updated dependencies [[`92126f4`](https://github.com/anza-xyz/kit/commit/92126f438afff8b7521f827cf0e92b1d2cd69c55), [`b1ae82b`](https://github.com/anza-xyz/kit/commit/b1ae82bbb2159f17a3e0f337c5f8677613b5b32d), [`a5ef97b`](https://github.com/anza-xyz/kit/commit/a5ef97b17fe747de1e2bee0189ed44e20c0f6c40), [`e82e03e`](https://github.com/anza-xyz/kit/commit/e82e03eb0e982db74f96d11b9aa8fefb4f0038c3), [`d24f908`](https://github.com/anza-xyz/kit/commit/d24f908a4fbbddddd9e8bacc57485de6d8e022b4), [`c5e0e14`](https://github.com/anza-xyz/kit/commit/c5e0e1444ae420390047d5e37a13650edf042954), [`096c48e`](https://github.com/anza-xyz/kit/commit/096c48e6771ad7ea833cb4ca51206b7cc827a3d7), [`0e8fd3f`](https://github.com/anza-xyz/kit/commit/0e8fd3f62b2cdb8e5082700096ce011883a60578)]:
    - @solana/errors@6.9.0
    - @solana/plugin-core@6.9.0
    - @solana/rpc-api@6.9.0
    - @solana/rpc-parsed-types@6.9.0
    - @solana/plugin-interfaces@6.9.0
    - @solana/codecs@6.9.0
    - @solana/accounts@6.9.0
    - @solana/addresses@6.9.0
    - @solana/functional@6.9.0
    - @solana/instruction-plans@6.9.0
    - @solana/instructions@6.9.0
    - @solana/keys@6.9.0
    - @solana/offchain-messages@6.9.0
    - @solana/program-client-core@6.9.0
    - @solana/programs@6.9.0
    - @solana/rpc-spec-types@6.9.0
    - @solana/rpc-subscriptions@6.9.0
    - @solana/rpc-types@6.9.0
    - @solana/rpc@6.9.0
    - @solana/signers@6.9.0
    - @solana/subscribable@6.9.0
    - @solana/sysvars@6.9.0
    - @solana/transaction-confirmation@6.9.0
    - @solana/transaction-messages@6.9.0
    - @solana/transactions@6.9.0

## 6.8.0

### Minor Changes

- [#1528](https://github.com/anza-xyz/kit/pull/1528) [`09a7509`](https://github.com/anza-xyz/kit/commit/09a75092c48f4b827d7d2ac6db0b1bd34c4a41dd) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Add `createReactiveStoreWithInitialValueAndSlotTracking()`, a helper that combines an initial RPC fetch with an ongoing subscription into a single `ReactiveStore`. Uses slot-based comparison to ensure only the most recent value is kept, regardless of arrival order. The store state is a `SolanaRpcResponse<TItem>`. Compatible with `useSyncExternalStore`, Svelte stores, and other reactive primitives.

- [#1536](https://github.com/anza-xyz/kit/pull/1536) [`cec688e`](https://github.com/anza-xyz/kit/commit/cec688e59a34f092d89f9a3f2253edb571c37899) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Add `createAsyncGeneratorWithInitialValueAndSlotTracking`, an async generator alternative to `createReactiveStoreWithInitialValueAndSlotTracking` that yields values from both an RPC fetch and an ongoing subscription, silently dropping any value at a slot older than the last seen.

### Patch Changes

- [#1532](https://github.com/anza-xyz/kit/pull/1532) [`667a0f0`](https://github.com/anza-xyz/kit/commit/667a0f059f5432244ab2cf8a23a22f53c7a36b4b) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Update the TypeScript peer dependency from `^5.0.0` to `>=5.0.0` to allow TypeScript 6 and above.

- Updated dependencies [[`d79f8d1`](https://github.com/anza-xyz/kit/commit/d79f8d115065557194db9604f3a0bfef7d37a2b6), [`667a0f0`](https://github.com/anza-xyz/kit/commit/667a0f059f5432244ab2cf8a23a22f53c7a36b4b), [`fdfcb6c`](https://github.com/anza-xyz/kit/commit/fdfcb6cbf439eb55e07ad7d59372347bd816d6d3), [`f53ce07`](https://github.com/anza-xyz/kit/commit/f53ce0796c782e79490e1cf11a55e28fb62b8c8f), [`43bc570`](https://github.com/anza-xyz/kit/commit/43bc570a5b51a9fda75abc1f0f818728ca3cd439), [`ffb7665`](https://github.com/anza-xyz/kit/commit/ffb76652f6b887eb5020c3584f1d827a1098dccc), [`f8d6131`](https://github.com/anza-xyz/kit/commit/f8d61310a0ca7dfeb86f7e7d3f5975b8a140370a)]:
    - @solana/signers@6.8.0
    - @solana/keys@6.8.0
    - @solana/accounts@6.8.0
    - @solana/addresses@6.8.0
    - @solana/codecs@6.8.0
    - @solana/errors@6.8.0
    - @solana/functional@6.8.0
    - @solana/instruction-plans@6.8.0
    - @solana/instructions@6.8.0
    - @solana/offchain-messages@6.8.0
    - @solana/plugin-core@6.8.0
    - @solana/plugin-interfaces@6.8.0
    - @solana/program-client-core@6.8.0
    - @solana/programs@6.8.0
    - @solana/rpc@6.8.0
    - @solana/rpc-api@6.8.0
    - @solana/rpc-parsed-types@6.8.0
    - @solana/rpc-spec-types@6.8.0
    - @solana/rpc-subscriptions@6.8.0
    - @solana/rpc-types@6.8.0
    - @solana/subscribable@6.8.0
    - @solana/sysvars@6.8.0
    - @solana/transaction-confirmation@6.8.0
    - @solana/transaction-messages@6.8.0
    - @solana/transactions@6.8.0

## 6.7.0

### Patch Changes

- Updated dependencies [[`2763d0c`](https://github.com/anza-xyz/kit/commit/2763d0c92b60089f4b20f6241cb5f91232cc2e75)]:
    - @solana/plugin-core@6.7.0
    - @solana/accounts@6.7.0
    - @solana/addresses@6.7.0
    - @solana/codecs@6.7.0
    - @solana/errors@6.7.0
    - @solana/functional@6.7.0
    - @solana/instruction-plans@6.7.0
    - @solana/instructions@6.7.0
    - @solana/keys@6.7.0
    - @solana/offchain-messages@6.7.0
    - @solana/plugin-interfaces@6.7.0
    - @solana/program-client-core@6.7.0
    - @solana/programs@6.7.0
    - @solana/rpc@6.7.0
    - @solana/rpc-api@6.7.0
    - @solana/rpc-parsed-types@6.7.0
    - @solana/rpc-spec-types@6.7.0
    - @solana/rpc-subscriptions@6.7.0
    - @solana/rpc-types@6.7.0
    - @solana/signers@6.7.0
    - @solana/sysvars@6.7.0
    - @solana/transaction-confirmation@6.7.0
    - @solana/transaction-messages@6.7.0
    - @solana/transactions@6.7.0

## 6.6.0

### Patch Changes

- Updated dependencies [[`742ffca`](https://github.com/anza-xyz/kit/commit/742ffcaf5304f702334e1f0b2a14cf208ae0ee5f), [`7f02d23`](https://github.com/anza-xyz/kit/commit/7f02d23948cc09e3f0bc70931d845569f1cb38ad), [`9c4fd6e`](https://github.com/anza-xyz/kit/commit/9c4fd6e67a6f70b1386f0745cf5afe0f93c75e36), [`0fa54a4`](https://github.com/anza-xyz/kit/commit/0fa54a469937db3989f42afc4248882736f719f5), [`f055201`](https://github.com/anza-xyz/kit/commit/f055201c2dd3a4a69b9894d66b622ae81c13b8cd)]:
    - @solana/instruction-plans@6.6.0
    - @solana/transactions@6.6.0
    - @solana/errors@6.6.0
    - @solana/transaction-messages@6.6.0
    - @solana/plugin-core@6.6.0
    - @solana/signers@6.6.0
    - @solana/plugin-interfaces@6.6.0
    - @solana/program-client-core@6.6.0
    - @solana/rpc-api@6.6.0
    - @solana/transaction-confirmation@6.6.0
    - @solana/accounts@6.6.0
    - @solana/addresses@6.6.0
    - @solana/instructions@6.6.0
    - @solana/keys@6.6.0
    - @solana/offchain-messages@6.6.0
    - @solana/programs@6.6.0
    - @solana/rpc@6.6.0
    - @solana/rpc-subscriptions@6.6.0
    - @solana/rpc-types@6.6.0
    - @solana/sysvars@6.6.0
    - @solana/rpc-parsed-types@6.6.0
    - @solana/codecs@6.6.0
    - @solana/functional@6.6.0
    - @solana/rpc-spec-types@6.6.0

## 6.5.0

### Patch Changes

- [#1485](https://github.com/anza-xyz/kit/pull/1485) [`4a4c217`](https://github.com/anza-xyz/kit/commit/4a4c21741e4982dd52e6d08a0e46ee626c73717c) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Deprecated `getMinimumBalanceForRentExemption`. The minimum balance for an account is being actively reduced (see [SIMD-0437](https://github.com/solana-foundation/solana-improvement-documents/pull/437)) and is expected to become dynamic in future Solana upgrades (see [SIMD-0194](https://github.com/solana-foundation/solana-improvement-documents/pull/194) and [SIMD-0389](https://github.com/solana-foundation/solana-improvement-documents/pull/389)). Use the `getMinimumBalanceForRentExemption` RPC method or a `ClientWithGetMinimumBalance` plugin instead. This function will be removed in v7.

- Updated dependencies [[`10cb920`](https://github.com/anza-xyz/kit/commit/10cb92045bba4710a6c6157a3963d9e3a61f755e), [`9e05736`](https://github.com/anza-xyz/kit/commit/9e057365a1a4e350f8a0ccc233b262e09b0134fa)]:
    - @solana/plugin-interfaces@6.5.0
    - @solana/signers@6.5.0
    - @solana/program-client-core@6.5.0
    - @solana/accounts@6.5.0
    - @solana/addresses@6.5.0
    - @solana/codecs@6.5.0
    - @solana/errors@6.5.0
    - @solana/functional@6.5.0
    - @solana/instruction-plans@6.5.0
    - @solana/instructions@6.5.0
    - @solana/keys@6.5.0
    - @solana/offchain-messages@6.5.0
    - @solana/plugin-core@6.5.0
    - @solana/programs@6.5.0
    - @solana/rpc@6.5.0
    - @solana/rpc-api@6.5.0
    - @solana/rpc-parsed-types@6.5.0
    - @solana/rpc-spec-types@6.5.0
    - @solana/rpc-subscriptions@6.5.0
    - @solana/rpc-types@6.5.0
    - @solana/sysvars@6.5.0
    - @solana/transaction-confirmation@6.5.0
    - @solana/transaction-messages@6.5.0
    - @solana/transactions@6.5.0

## 6.4.0

### Minor Changes

- [#1476](https://github.com/anza-xyz/kit/pull/1476) [`3e9e0a2`](https://github.com/anza-xyz/kit/commit/3e9e0a207155b56e96b5ee556728b5afdb23d4fe) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add compute unit limit estimation utilities: `estimateComputeUnitLimitFactory`, `estimateAndSetComputeUnitLimitFactory`, and `fillTransactionMessageProvisoryComputeUnitLimit`. These replace the external `@solana-program/compute-budget` estimation functions with Kit-native equivalents that work across all transaction versions.

### Patch Changes

- [#1468](https://github.com/anza-xyz/kit/pull/1468) [`304436f`](https://github.com/anza-xyz/kit/commit/304436ffaad6812ee0cc2f67b5a881f7f918b3ae) Thanks [@amilz](https://github.com/amilz)! - Include source files in published packages so IDE "Go to Definition" navigates to TypeScript source instead of .d.ts type declarations

- Updated dependencies [[`896412d`](https://github.com/anza-xyz/kit/commit/896412da20ced2b81f9f529e9b5feef16b7e790f), [`084e92e`](https://github.com/anza-xyz/kit/commit/084e92e668d41041c6424d616441557560873888), [`abeca1b`](https://github.com/anza-xyz/kit/commit/abeca1b28725f675128f68e4e73d2f655e500eaa)]:
    - @solana/instruction-plans@6.4.0
    - @solana/transaction-messages@6.4.0
    - @solana/plugin-core@6.4.0
    - @solana/accounts@6.4.0
    - @solana/addresses@6.4.0
    - @solana/codecs@6.4.0
    - @solana/instructions@6.4.0
    - @solana/keys@6.4.0
    - @solana/offchain-messages@6.4.0
    - @solana/program-client-core@6.4.0
    - @solana/rpc-api@6.4.0
    - @solana/rpc-types@6.4.0
    - @solana/signers@6.4.0
    - @solana/sysvars@6.4.0
    - @solana/transaction-confirmation@6.4.0
    - @solana/transactions@6.4.0
    - @solana/plugin-interfaces@6.4.0
    - @solana/programs@6.4.0
    - @solana/rpc-parsed-types@6.4.0
    - @solana/rpc-subscriptions@6.4.0
    - @solana/rpc@6.4.0
    - @solana/errors@6.4.0
    - @solana/functional@6.4.0
    - @solana/rpc-spec-types@6.4.0

## 6.3.1

### Patch Changes

- Updated dependencies [[`a557a62`](https://github.com/anza-xyz/kit/commit/a557a62e0f42d2d526f0b8fbdd0a9fcc08ac9ef7)]:
    - @solana/instruction-plans@6.3.1
    - @solana/plugin-interfaces@6.3.1
    - @solana/program-client-core@6.3.1
    - @solana/accounts@6.3.1
    - @solana/addresses@6.3.1
    - @solana/codecs@6.3.1
    - @solana/errors@6.3.1
    - @solana/functional@6.3.1
    - @solana/instructions@6.3.1
    - @solana/keys@6.3.1
    - @solana/offchain-messages@6.3.1
    - @solana/plugin-core@6.3.1
    - @solana/programs@6.3.1
    - @solana/rpc@6.3.1
    - @solana/rpc-api@6.3.1
    - @solana/rpc-parsed-types@6.3.1
    - @solana/rpc-spec-types@6.3.1
    - @solana/rpc-subscriptions@6.3.1
    - @solana/rpc-types@6.3.1
    - @solana/signers@6.3.1
    - @solana/sysvars@6.3.1
    - @solana/transaction-confirmation@6.3.1
    - @solana/transaction-messages@6.3.1
    - @solana/transactions@6.3.1

## 6.3.0

### Patch Changes

- Updated dependencies [[`f47d5cf`](https://github.com/anza-xyz/kit/commit/f47d5cf30512bbae3233f0ddccae45462af7f309)]:
    - @solana/errors@6.3.0
    - @solana/instruction-plans@6.3.0
    - @solana/accounts@6.3.0
    - @solana/addresses@6.3.0
    - @solana/instructions@6.3.0
    - @solana/keys@6.3.0
    - @solana/offchain-messages@6.3.0
    - @solana/program-client-core@6.3.0
    - @solana/programs@6.3.0
    - @solana/rpc@6.3.0
    - @solana/rpc-api@6.3.0
    - @solana/rpc-subscriptions@6.3.0
    - @solana/rpc-types@6.3.0
    - @solana/signers@6.3.0
    - @solana/sysvars@6.3.0
    - @solana/transaction-confirmation@6.3.0
    - @solana/transaction-messages@6.3.0
    - @solana/transactions@6.3.0
    - @solana/plugin-interfaces@6.3.0
    - @solana/rpc-parsed-types@6.3.0
    - @solana/codecs@6.3.0
    - @solana/functional@6.3.0
    - @solana/plugin-core@6.3.0
    - @solana/rpc-spec-types@6.3.0

## 6.2.0

### Patch Changes

- Updated dependencies [[`b28b843`](https://github.com/anza-xyz/kit/commit/b28b8439b1f62aefd9c35c4bea733816975033e5), [`0d0be3e`](https://github.com/anza-xyz/kit/commit/0d0be3e18bfbb053b92c4b2d338c5bb0ed414bcc), [`98a8869`](https://github.com/anza-xyz/kit/commit/98a8869d5a728a65b7a525d87ed481616112503c), [`7568a12`](https://github.com/anza-xyz/kit/commit/7568a127e1d1197d2362be464117bc41c82b01ad), [`e33a65f`](https://github.com/anza-xyz/kit/commit/e33a65fd18d52bd2d7a0018ff9a152ff6f43a3b3), [`79db829`](https://github.com/anza-xyz/kit/commit/79db8292b2064145f615576589d8ecbf32196dc1), [`49c1195`](https://github.com/anza-xyz/kit/commit/49c1195637a8d550b864918e96d9f9681f658bfe)]:
    - @solana/sysvars@6.2.0
    - @solana/errors@6.2.0
    - @solana/instruction-plans@6.2.0
    - @solana/accounts@6.2.0
    - @solana/addresses@6.2.0
    - @solana/instructions@6.2.0
    - @solana/keys@6.2.0
    - @solana/offchain-messages@6.2.0
    - @solana/program-client-core@6.2.0
    - @solana/programs@6.2.0
    - @solana/rpc@6.2.0
    - @solana/rpc-api@6.2.0
    - @solana/rpc-subscriptions@6.2.0
    - @solana/rpc-types@6.2.0
    - @solana/signers@6.2.0
    - @solana/transaction-confirmation@6.2.0
    - @solana/transaction-messages@6.2.0
    - @solana/transactions@6.2.0
    - @solana/plugin-interfaces@6.2.0
    - @solana/codecs@6.2.0
    - @solana/rpc-parsed-types@6.2.0
    - @solana/functional@6.2.0
    - @solana/plugin-core@6.2.0
    - @solana/rpc-spec-types@6.2.0

## 6.1.0

### Minor Changes

- [#1356](https://github.com/anza-xyz/kit/pull/1356) [`da61429`](https://github.com/anza-xyz/kit/commit/da614294bb8af73302cdd0ff565e48b8a05ab478) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add `@solana/kit/program-client-core` as a subpath export for `@solana/program-client-core` without changing root `@solana/kit` exports.

### Patch Changes

- Updated dependencies [[`3f711e1`](https://github.com/anza-xyz/kit/commit/3f711e16bc38657d5d1ff71cf98e73897ff19ea5), [`1f6cd4b`](https://github.com/anza-xyz/kit/commit/1f6cd4bc7f41e865ff81ecd819dd9f728c27af77), [`215027c`](https://github.com/anza-xyz/kit/commit/215027c49845bd5cbd86d3da396f0c3895283d75), [`ee558a1`](https://github.com/anza-xyz/kit/commit/ee558a1ea8a95295db0e7b0751b32ac9d6342911), [`50010b5`](https://github.com/anza-xyz/kit/commit/50010b5b791ff0e6d8636ded3af33158f2380e4e), [`d3314a6`](https://github.com/anza-xyz/kit/commit/d3314a6e22d32219a11953e4a7ef8274b82f4b37), [`33234f5`](https://github.com/anza-xyz/kit/commit/33234f50760e34a21072304e6aaf1a31b7a410f1)]:
    - @solana/errors@6.1.0
    - @solana/instruction-plans@6.1.0
    - @solana/plugin-interfaces@6.1.0
    - @solana/program-client-core@6.1.0
    - @solana/codecs@6.1.0
    - @solana/offchain-messages@6.1.0
    - @solana/transaction-messages@6.1.0
    - @solana/transactions@6.1.0
    - @solana/accounts@6.1.0
    - @solana/addresses@6.1.0
    - @solana/instructions@6.1.0
    - @solana/keys@6.1.0
    - @solana/programs@6.1.0
    - @solana/rpc@6.1.0
    - @solana/rpc-api@6.1.0
    - @solana/rpc-subscriptions@6.1.0
    - @solana/rpc-types@6.1.0
    - @solana/signers@6.1.0
    - @solana/sysvars@6.1.0
    - @solana/transaction-confirmation@6.1.0
    - @solana/rpc-parsed-types@6.1.0
    - @solana/functional@6.1.0
    - @solana/plugin-core@6.1.0
    - @solana/rpc-spec-types@6.1.0

## 6.0.1

### Patch Changes

- [#1321](https://github.com/anza-xyz/kit/pull/1321) [`2d3296f`](https://github.com/anza-xyz/kit/commit/2d3296f1ea03184455197d0284be73ada999b492) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Fix a bug in the type of `TransactionMessageWithSigners`

- Updated dependencies [[`2d3296f`](https://github.com/anza-xyz/kit/commit/2d3296f1ea03184455197d0284be73ada999b492), [`a8a57ce`](https://github.com/anza-xyz/kit/commit/a8a57cebc47caa24f6d105c346427baa244fa462)]:
    - @solana/transaction-messages@6.0.1
    - @solana/signers@6.0.1
    - @solana/instruction-plans@6.0.1
    - @solana/programs@6.0.1
    - @solana/rpc-api@6.0.1
    - @solana/transaction-confirmation@6.0.1
    - @solana/transactions@6.0.1
    - @solana/rpc@6.0.1
    - @solana/sysvars@6.0.1
    - @solana/rpc-subscriptions@6.0.1
    - @solana/accounts@6.0.1
    - @solana/addresses@6.0.1
    - @solana/codecs@6.0.1
    - @solana/errors@6.0.1
    - @solana/functional@6.0.1
    - @solana/instructions@6.0.1
    - @solana/keys@6.0.1
    - @solana/offchain-messages@6.0.1
    - @solana/plugin-core@6.0.1
    - @solana/rpc-parsed-types@6.0.1
    - @solana/rpc-spec-types@6.0.1
    - @solana/rpc-types@6.0.1

## 6.0.0

### Patch Changes

- Updated dependencies [[`f80b6de`](https://github.com/anza-xyz/kit/commit/f80b6de0649ed2df3aa64fdd01215322bb8cc926), [`5f12df2`](https://github.com/anza-xyz/kit/commit/5f12df20b6f4b4b3536cc76c69b90fb8dc22455d), [`b82df4c`](https://github.com/anza-xyz/kit/commit/b82df4c98a9f157c030f62735f4427ba095bee6a), [`5c810ac`](https://github.com/anza-xyz/kit/commit/5c810ac20414a893b94045f0e89f01a8ca79ba8a), [`bd3d5f1`](https://github.com/anza-xyz/kit/commit/bd3d5f11eac57d1930a747af9ae02cde07d13aa1), [`986a09c`](https://github.com/anza-xyz/kit/commit/986a09c56c38c2a91752972ec258fe790f8620db), [`f8ef83e`](https://github.com/anza-xyz/kit/commit/f8ef83ee7491db8aa7331a0628045ee9072196a4), [`91cdb71`](https://github.com/anza-xyz/kit/commit/91cdb7129daaf0fa0a6d78d16a571e6f2a3feded), [`2fbad6a`](https://github.com/anza-xyz/kit/commit/2fbad6ab60789e4207f6c4c95c4c2ac514aafab5)]:
    - @solana/transaction-messages@6.0.0
    - @solana/instruction-plans@6.0.0
    - @solana/programs@6.0.0
    - @solana/rpc-api@6.0.0
    - @solana/signers@6.0.0
    - @solana/transaction-confirmation@6.0.0
    - @solana/transactions@6.0.0
    - @solana/rpc@6.0.0
    - @solana/sysvars@6.0.0
    - @solana/rpc-subscriptions@6.0.0
    - @solana/accounts@6.0.0
    - @solana/addresses@6.0.0
    - @solana/codecs@6.0.0
    - @solana/errors@6.0.0
    - @solana/functional@6.0.0
    - @solana/instructions@6.0.0
    - @solana/keys@6.0.0
    - @solana/offchain-messages@6.0.0
    - @solana/plugin-core@6.0.0
    - @solana/rpc-parsed-types@6.0.0
    - @solana/rpc-spec-types@6.0.0
    - @solana/rpc-types@6.0.0

## 5.5.1

### Patch Changes

- Updated dependencies [[`d957526`](https://github.com/anza-xyz/kit/commit/d9575263c3e563c6951cd35bbc6e65e70a0e6a10)]:
    - @solana/instruction-plans@5.5.1
    - @solana/errors@5.5.1
    - @solana/accounts@5.5.1
    - @solana/addresses@5.5.1
    - @solana/instructions@5.5.1
    - @solana/keys@5.5.1
    - @solana/offchain-messages@5.5.1
    - @solana/programs@5.5.1
    - @solana/rpc@5.5.1
    - @solana/rpc-api@5.5.1
    - @solana/rpc-subscriptions@5.5.1
    - @solana/rpc-types@5.5.1
    - @solana/signers@5.5.1
    - @solana/sysvars@5.5.1
    - @solana/transaction-confirmation@5.5.1
    - @solana/transaction-messages@5.5.1
    - @solana/transactions@5.5.1
    - @solana/rpc-parsed-types@5.5.1
    - @solana/codecs@5.5.1
    - @solana/functional@5.5.1
    - @solana/plugin-core@5.5.1
    - @solana/rpc-spec-types@5.5.1

## 5.5.0

### Patch Changes

- [#1234](https://github.com/anza-xyz/kit/pull/1234) [`7e0377b`](https://github.com/anza-xyz/kit/commit/7e0377b41caed78f81b3fe8272efbc9d4af0464a) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Fix a race condition in `sendAndConfirmDurableNonceTransactionFactory`

- Updated dependencies [[`f731129`](https://github.com/anza-xyz/kit/commit/f731129939bac8b2574ecbbcd6afe0a0a6b00e5f), [`b174ed5`](https://github.com/anza-xyz/kit/commit/b174ed531c15d34e354657d3945e4ea5b38932bc), [`ea97d43`](https://github.com/anza-xyz/kit/commit/ea97d43f588c6b5bf3d4bd96464f3c927967ae28), [`b4f5897`](https://github.com/anza-xyz/kit/commit/b4f5897cab50a92f50b6b390ae76d743173c26dd), [`60e8c45`](https://github.com/anza-xyz/kit/commit/60e8c456356d52fb93637a6323cac9d9b2fc6816), [`cccea6f`](https://github.com/anza-xyz/kit/commit/cccea6fc266e71bb2f1b4b843c3a815e3032f208), [`08c9062`](https://github.com/anza-xyz/kit/commit/08c906299409e82a5941e1044fc6d47d633df784), [`a47e441`](https://github.com/anza-xyz/kit/commit/a47e44109e90ddb03193d4e1e207f9e68118679d), [`ba3f186`](https://github.com/anza-xyz/kit/commit/ba3f1861a9cb53b4c0e7c6d1b92791d8983e001b), [`1cc0a31`](https://github.com/anza-xyz/kit/commit/1cc0a3163cf884a715aef5ba336adfd980dabfa6), [`589d761`](https://github.com/anza-xyz/kit/commit/589d761483a8feaf46b4cda7a97ec7abd5e7ab90), [`6af7c15`](https://github.com/anza-xyz/kit/commit/6af7c156a9cd196d0d5ecb374fe696ec659756bf)]:
    - @solana/instruction-plans@5.5.0
    - @solana/errors@5.5.0
    - @solana/accounts@5.5.0
    - @solana/addresses@5.5.0
    - @solana/instructions@5.5.0
    - @solana/keys@5.5.0
    - @solana/offchain-messages@5.5.0
    - @solana/programs@5.5.0
    - @solana/rpc@5.5.0
    - @solana/rpc-api@5.5.0
    - @solana/rpc-subscriptions@5.5.0
    - @solana/rpc-types@5.5.0
    - @solana/signers@5.5.0
    - @solana/sysvars@5.5.0
    - @solana/transaction-confirmation@5.5.0
    - @solana/transaction-messages@5.5.0
    - @solana/transactions@5.5.0
    - @solana/rpc-parsed-types@5.5.0
    - @solana/codecs@5.5.0
    - @solana/functional@5.5.0
    - @solana/plugin-core@5.5.0
    - @solana/rpc-spec-types@5.5.0

## 5.4.0

### Patch Changes

- [#1187](https://github.com/anza-xyz/kit/pull/1187) [`f5f89eb`](https://github.com/anza-xyz/kit/commit/f5f89eb8e769d5b6056b2f686d51a7ef4a0d1d09) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Make Typescript peer dependency optional + reduce required version to ^5

- Updated dependencies [[`fb1c576`](https://github.com/anza-xyz/kit/commit/fb1c5761122bebc9955179a911a79a33a391e032), [`f5f89eb`](https://github.com/anza-xyz/kit/commit/f5f89eb8e769d5b6056b2f686d51a7ef4a0d1d09), [`189de37`](https://github.com/anza-xyz/kit/commit/189de37f76bcb273986d750fd6ed6541f711103b)]:
    - @solana/accounts@5.4.0
    - @solana/transaction-confirmation@5.4.0
    - @solana/transaction-messages@5.4.0
    - @solana/instruction-plans@5.4.0
    - @solana/offchain-messages@5.4.0
    - @solana/rpc-subscriptions@5.4.0
    - @solana/rpc-parsed-types@5.4.0
    - @solana/rpc-spec-types@5.4.0
    - @solana/instructions@5.4.0
    - @solana/transactions@5.4.0
    - @solana/plugin-core@5.4.0
    - @solana/functional@5.4.0
    - @solana/addresses@5.4.0
    - @solana/rpc-types@5.4.0
    - @solana/programs@5.4.0
    - @solana/rpc-api@5.4.0
    - @solana/signers@5.4.0
    - @solana/sysvars@5.4.0
    - @solana/codecs@5.4.0
    - @solana/errors@5.4.0
    - @solana/keys@5.4.0
    - @solana/rpc@5.4.0

## 5.3.0

### Minor Changes

- [#1065](https://github.com/anza-xyz/kit/pull/1065) [`fafa52f`](https://github.com/anza-xyz/kit/commit/fafa52f6d058a12c7f0f7125f61906160aad2a37) Thanks [@rajgoesout](https://github.com/rajgoesout)! - Add local rent exemption calculator

### Patch Changes

- Updated dependencies []:
    - @solana/accounts@5.3.0
    - @solana/addresses@5.3.0
    - @solana/codecs@5.3.0
    - @solana/errors@5.3.0
    - @solana/functional@5.3.0
    - @solana/instruction-plans@5.3.0
    - @solana/instructions@5.3.0
    - @solana/keys@5.3.0
    - @solana/offchain-messages@5.3.0
    - @solana/plugin-core@5.3.0
    - @solana/programs@5.3.0
    - @solana/rpc@5.3.0
    - @solana/rpc-api@5.3.0
    - @solana/rpc-parsed-types@5.3.0
    - @solana/rpc-spec-types@5.3.0
    - @solana/rpc-subscriptions@5.3.0
    - @solana/rpc-types@5.3.0
    - @solana/signers@5.3.0
    - @solana/sysvars@5.3.0
    - @solana/transaction-confirmation@5.3.0
    - @solana/transaction-messages@5.3.0
    - @solana/transactions@5.3.0

## 5.2.0

### Minor Changes

- [#1113](https://github.com/anza-xyz/kit/pull/1113) [`b1937c7`](https://github.com/anza-xyz/kit/commit/b1937c7385050b911f50ac36913a6cfe4575036d) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add new `@solana/plugin-core` package enabling us to create modular Kit clients that can be extended with plugins.

- [#1139](https://github.com/anza-xyz/kit/pull/1139) [`6dbaf66`](https://github.com/anza-xyz/kit/commit/6dbaf66015198bd912ec0800c1db1fd63b68e7a2) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Return more precise types from transaction message functions

    Deprecate `BaseTransactionMessage` in favour of `TransactionMessage`

### Patch Changes

- Updated dependencies [[`b80b092`](https://github.com/anza-xyz/kit/commit/b80b09239762262116cb70b43271ad98a2f716b5), [`b1937c7`](https://github.com/anza-xyz/kit/commit/b1937c7385050b911f50ac36913a6cfe4575036d), [`109c78e`](https://github.com/anza-xyz/kit/commit/109c78e8972857323558ca913706a95cdb70c549), [`6dbaf66`](https://github.com/anza-xyz/kit/commit/6dbaf66015198bd912ec0800c1db1fd63b68e7a2)]:
    - @solana/instruction-plans@5.2.0
    - @solana/errors@5.2.0
    - @solana/plugin-core@5.2.0
    - @solana/keys@5.2.0
    - @solana/transaction-messages@5.2.0
    - @solana/transactions@5.2.0
    - @solana/signers@5.2.0
    - @solana/accounts@5.2.0
    - @solana/addresses@5.2.0
    - @solana/instructions@5.2.0
    - @solana/offchain-messages@5.2.0
    - @solana/programs@5.2.0
    - @solana/rpc@5.2.0
    - @solana/rpc-api@5.2.0
    - @solana/rpc-subscriptions@5.2.0
    - @solana/rpc-types@5.2.0
    - @solana/sysvars@5.2.0
    - @solana/transaction-confirmation@5.2.0
    - @solana/codecs@5.2.0
    - @solana/rpc-parsed-types@5.2.0
    - @solana/functional@5.2.0
    - @solana/rpc-spec-types@5.2.0

## 5.1.0

### Minor Changes

- [#880](https://github.com/anza-xyz/kit/pull/880) [`becf5f6`](https://github.com/anza-xyz/kit/commit/becf5f63f1b97d43109b2488c7cd0806ce6329f4) Thanks [@steveluscher](https://github.com/steveluscher)! - Added codecs for encoding and decoding Solana Offchain Messages (see https://github.com/solana-foundation/SRFCs/discussions/3)

- [#984](https://github.com/anza-xyz/kit/pull/984) [`32214f5`](https://github.com/anza-xyz/kit/commit/32214f57cfb79fb2566e773acec71635bac641df) Thanks [@steveluscher](https://github.com/steveluscher)! - Added the capability to sign Solana Offchain Messages using a `CryptoKey`

### Patch Changes

- [#999](https://github.com/anza-xyz/kit/pull/999) [`d7f5a0c`](https://github.com/anza-xyz/kit/commit/d7f5a0c046f0a2f2836554fa671364de0b512e97) Thanks [@tmm](https://github.com/tmm)! - Some npm packages are needed for specific runtimes only (eg. React Native, Node). To prevent package managers from unconditionally installing these packages when they have `auto-install-peers` enabled, we are marking them as optional in `peerDependenciesMeta`. When running in React Native, be sure to explicitly install `fastestsmallesttextencoderdecoder`. When running in Node, be sure to explicitly install `ws`. When using `@solana/react`, we will presume that you have already installed `react`.

- Updated dependencies [[`becf5f6`](https://github.com/anza-xyz/kit/commit/becf5f63f1b97d43109b2488c7cd0806ce6329f4), [`18e7e2c`](https://github.com/anza-xyz/kit/commit/18e7e2c9d9013be6223932398f40cbc276c4a0e9), [`e64a9b2`](https://github.com/anza-xyz/kit/commit/e64a9b263f7752bd470144d19562eff8819bd799), [`2bd0bc2`](https://github.com/anza-xyz/kit/commit/2bd0bc2b8d45eedca661ddf056341deba159a6b1), [`32214f5`](https://github.com/anza-xyz/kit/commit/32214f57cfb79fb2566e773acec71635bac641df), [`32b13a8`](https://github.com/anza-xyz/kit/commit/32b13a8973fe0645af1f87f0068c289730b4062c), [`a0c394b`](https://github.com/anza-xyz/kit/commit/a0c394b2f5fcaf543382ca30f052830ca91759e3), [`2f7bda8`](https://github.com/anza-xyz/kit/commit/2f7bda81ca8248797957bdf693e812abc90b1951), [`eb49ed7`](https://github.com/anza-xyz/kit/commit/eb49ed7dd45f2a5a0098b3de5ef482a813f8ad47), [`5c1f9e5`](https://github.com/anza-xyz/kit/commit/5c1f9e5d61ae55851aaa44e7a5ab83ff09ffee28), [`81a0eec`](https://github.com/anza-xyz/kit/commit/81a0eec57d196d4ce6b86897640dcab85c5deafd)]:
    - @solana/offchain-messages@5.1.0
    - @solana/errors@5.1.0
    - @solana/transaction-confirmation@5.1.0
    - @solana/instruction-plans@5.1.0
    - @solana/addresses@5.1.0
    - @solana/transactions@5.1.0
    - @solana/rpc@5.1.0
    - @solana/transaction-messages@5.1.0
    - @solana/signers@5.1.0
    - @solana/accounts@5.1.0
    - @solana/instructions@5.1.0
    - @solana/keys@5.1.0
    - @solana/programs@5.1.0
    - @solana/rpc-subscriptions@5.1.0
    - @solana/rpc-types@5.1.0
    - @solana/sysvars@5.1.0
    - @solana/codecs@5.1.0
    - @solana/rpc-parsed-types@5.1.0
    - @solana/functional@5.1.0
    - @solana/rpc-spec-types@5.1.0

## 5.0.0

### Patch Changes

- Updated dependencies [[`0fed638`](https://github.com/anza-xyz/kit/commit/0fed6389886639a48b44a09e129ac1b264c44389)]:
    - @solana/rpc-types@5.0.0
    - @solana/errors@5.0.0
    - @solana/accounts@5.0.0
    - @solana/rpc@5.0.0
    - @solana/rpc-parsed-types@5.0.0
    - @solana/rpc-subscriptions@5.0.0
    - @solana/signers@5.0.0
    - @solana/sysvars@5.0.0
    - @solana/transaction-confirmation@5.0.0
    - @solana/transaction-messages@5.0.0
    - @solana/transactions@5.0.0
    - @solana/addresses@5.0.0
    - @solana/instruction-plans@5.0.0
    - @solana/instructions@5.0.0
    - @solana/keys@5.0.0
    - @solana/programs@5.0.0
    - @solana/codecs@5.0.0
    - @solana/functional@5.0.0
    - @solana/rpc-spec-types@5.0.0

## 4.0.0

### Patch Changes

- [#521](https://github.com/anza-xyz/kit/pull/521) [`98bde94`](https://github.com/anza-xyz/kit/commit/98bde94bc4cd5f5f7e646c774bc50fef21112dd1) Thanks [@tao-stones](https://github.com/tao-stones)! - Add loadedAccountsDataSize to simulateTransaction response

- Updated dependencies [[`5408f52`](https://github.com/anza-xyz/kit/commit/5408f524ae22293cb7b497310440019be5a98c55), [`f591dea`](https://github.com/anza-xyz/kit/commit/f591dead4a3d5871fd02460f6301bb4bdf6b508e), [`cb11699`](https://github.com/anza-xyz/kit/commit/cb11699d77536e5901c62d32e43c671b044e4aa1), [`9fa8465`](https://github.com/anza-xyz/kit/commit/9fa8465bf0f264f5a9181c805a0d85cb1ecc2768), [`ce7f91c`](https://github.com/anza-xyz/kit/commit/ce7f91c522118bd929f69f581d2d48e90d18c99a), [`af01f27`](https://github.com/anza-xyz/kit/commit/af01f2770e4b3a94f3ef3360677b27aa08175c1b), [`c035ab8`](https://github.com/anza-xyz/kit/commit/c035ab8a488486d160ca0361408493115cd09383), [`22f18d0`](https://github.com/anza-xyz/kit/commit/22f18d0ce8950b26eaa897b146bfe8c1a025b3bb), [`cfc1d92`](https://github.com/anza-xyz/kit/commit/cfc1d9249e55c79d27ac840806f198a5c5895e56), [`c87cada`](https://github.com/anza-xyz/kit/commit/c87cada3ddf0a8c5fa27ed7122b901b17392c2df), [`9e8bfe4`](https://github.com/anza-xyz/kit/commit/9e8bfe460886124d1d12e444e7452db631c0ac6f), [`54d8445`](https://github.com/anza-xyz/kit/commit/54d8445bbef207b6d84da0ea91a1c091251ee013)]:
    - @solana/transactions@4.0.0
    - @solana/errors@4.0.0
    - @solana/keys@4.0.0
    - @solana/transaction-messages@4.0.0
    - @solana/rpc-types@4.0.0
    - @solana/signers@4.0.0
    - @solana/transaction-confirmation@4.0.0
    - @solana/rpc-subscriptions@4.0.0
    - @solana/instruction-plans@4.0.0
    - @solana/accounts@4.0.0
    - @solana/addresses@4.0.0
    - @solana/instructions@4.0.0
    - @solana/programs@4.0.0
    - @solana/rpc@4.0.0
    - @solana/sysvars@4.0.0
    - @solana/rpc-parsed-types@4.0.0
    - @solana/codecs@4.0.0
    - @solana/functional@4.0.0
    - @solana/rpc-spec-types@4.0.0

## 3.0.0

### Major Changes

- [#482](https://github.com/anza-xyz/kit/pull/482) [`00d66fb`](https://github.com/anza-xyz/kit/commit/00d66fbec15288bb531f7459b6baa48aead1cdc6) Thanks [@lorisleiva](https://github.com/lorisleiva)! - BREAKING CHANGE: Transactions must now satisfy the `SendableTransaction` type before being provided to helper functions that send transactions to the network. On top of ensuring the transaction is fully signed, this type also ensures the transaction is within size limit.

- [#594](https://github.com/anza-xyz/kit/pull/594) [`733605d`](https://github.com/anza-xyz/kit/commit/733605df84ce5f5ffea1e83eea8df74e08789642) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Extract lifetime token from `CompiledTransactionMessage`. `CompiledTransactionMessage & CompiledTransactionMessageWithLifetime` may now be used to refer to a compiled transaction message with a lifetime token. This enables `CompiledTransactionMessages` to be encoded without the need to specify a mock lifetime token.

- [#462](https://github.com/anza-xyz/kit/pull/462) [`a74ea02`](https://github.com/anza-xyz/kit/commit/a74ea0267bf589fba50bb2ebe72dc4f73da9adcf) Thanks [@lorisleiva](https://github.com/lorisleiva)! - BREAKING CHANGE: The `FullySignedTransaction` no longer extends the `Transaction` type so it can be composed with other flags that also narrow transaction types. This means, whenever `FullySignedTransaction` is used on its own, it will need to be replaced with `FullySignedTransaction & Transaction`.

- [#691](https://github.com/anza-xyz/kit/pull/691) [`771f8ae`](https://github.com/anza-xyz/kit/commit/771f8aef1f8c096450c6e4ac05b8611150201485) Thanks [@lorisleiva](https://github.com/lorisleiva)! - BREAKING CHANGE: Removes the `getComputeUnitEstimateForTransactionMessageFactory` deprecated function.

### Minor Changes

- [#725](https://github.com/anza-xyz/kit/pull/725) [`ce8f9db`](https://github.com/anza-xyz/kit/commit/ce8f9db3a1f7b397aa080548a54c4d3d2aa6ad7d) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Re-export `@solana/instruction-plans` from `@solana/kit`.

### Patch Changes

- [#584](https://github.com/anza-xyz/kit/pull/584) [`760fb83`](https://github.com/anza-xyz/kit/commit/760fb8319f6b53fa1baf05f9aa1246cb6c2caceb) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Deprecate `CompilableTransactionMessage` in favour of `TransactionMessage & TransactionMessageWithFeePayer`

- Updated dependencies [[`771f8ae`](https://github.com/anza-xyz/kit/commit/771f8aef1f8c096450c6e4ac05b8611150201485), [`358df82`](https://github.com/anza-xyz/kit/commit/358df829770c4164fde50e57be04fe0782ddd4b5), [`93ae6f9`](https://github.com/anza-xyz/kit/commit/93ae6f96859019b6c7ea9a596ffb9b1be7a35e64), [`771f8ae`](https://github.com/anza-xyz/kit/commit/771f8aef1f8c096450c6e4ac05b8611150201485), [`6a183bf`](https://github.com/anza-xyz/kit/commit/6a183bf9e9d672e2d42f3aecc589a9e54d01cb1a), [`760fb83`](https://github.com/anza-xyz/kit/commit/760fb8319f6b53fa1baf05f9aa1246cb6c2caceb), [`23d2fa1`](https://github.com/anza-xyz/kit/commit/23d2fa14cbd5197473eca94a1ac6c5abf221b052), [`771f8ae`](https://github.com/anza-xyz/kit/commit/771f8aef1f8c096450c6e4ac05b8611150201485), [`12d06d1`](https://github.com/anza-xyz/kit/commit/12d06d11d6a5fcf6ce06e9f9698175720666de39), [`018479f`](https://github.com/anza-xyz/kit/commit/018479f56dc7f487b9a9ec444184cea7f13d9f3a), [`a894d53`](https://github.com/anza-xyz/kit/commit/a894d53192d50b5d2217ada2cb715d71ef4f8f02), [`9feba85`](https://github.com/anza-xyz/kit/commit/9feba8557b64dd3199cd88af2c17b7ccd5d18fec), [`c6e8568`](https://github.com/anza-xyz/kit/commit/c6e8568214c1647b42e259f464f7e5f220627525), [`00d66fb`](https://github.com/anza-xyz/kit/commit/00d66fbec15288bb531f7459b6baa48aead1cdc6), [`733605d`](https://github.com/anza-xyz/kit/commit/733605df84ce5f5ffea1e83eea8df74e08789642), [`01f159a`](https://github.com/anza-xyz/kit/commit/01f159a436d7a29479aa1a1877c9b4c77da1170f), [`24967d1`](https://github.com/anza-xyz/kit/commit/24967d166e9a7035bab2cdababbaae4b46d0deaa), [`0bd053b`](https://github.com/anza-xyz/kit/commit/0bd053bfa40b095d37bea7b7cd695259ba5a9cdc), [`55d6b04`](https://github.com/anza-xyz/kit/commit/55d6b040764f5e32de9c94d1844529855233d845), [`a74ea02`](https://github.com/anza-xyz/kit/commit/a74ea0267bf589fba50bb2ebe72dc4f73da9adcf), [`81c83b1`](https://github.com/anza-xyz/kit/commit/81c83b12dd0e145bf7d08182e01824f2f14e5ee5), [`771f8ae`](https://github.com/anza-xyz/kit/commit/771f8aef1f8c096450c6e4ac05b8611150201485), [`7d48ccd`](https://github.com/anza-xyz/kit/commit/7d48ccd47f08de8d7e9105567d3766ee6ff1e64f), [`a4310a5`](https://github.com/anza-xyz/kit/commit/a4310a571268c03e8d31b64ab450c922079de9c3), [`f79d05a`](https://github.com/anza-xyz/kit/commit/f79d05a92387522ef05816d1d20b75e050da42f3)]:
    - @solana/transaction-messages@3.0.0
    - @solana/instruction-plans@3.0.0
    - @solana/signers@3.0.0
    - @solana/instructions@3.0.0
    - @solana/errors@3.0.0
    - @solana/transactions@3.0.0
    - @solana/rpc-spec-types@3.0.0
    - @solana/programs@3.0.0
    - @solana/transaction-confirmation@3.0.0
    - @solana/accounts@3.0.0
    - @solana/addresses@3.0.0
    - @solana/keys@3.0.0
    - @solana/rpc@3.0.0
    - @solana/rpc-subscriptions@3.0.0
    - @solana/rpc-types@3.0.0
    - @solana/sysvars@3.0.0
    - @solana/codecs@3.0.0
    - @solana/rpc-parsed-types@3.0.0
    - @solana/functional@3.0.0

## 2.3.0

### Minor Changes

- [#426](https://github.com/anza-xyz/kit/pull/426) [`b7dfe03`](https://github.com/anza-xyz/kit/commit/b7dfe033a8e929d7a598d8bfea546e9ef4207639) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Deprecate the `I` prefix of four transaction message types to stay consistent with the rest of them. Namely, the following types are renamed and their old names are marked as deprecated:
    - `ITransactionMessageWithFeePayer` -> `TransactionMessageWithFeePayer`
    - `ITransactionMessageWithFeePayerSigner` -> `TransactionMessageWithFeePayerSigner`
    - `ITransactionMessageWithSigners` -> `TransactionMessageWithSigners`
    - `ITransactionMessageWithSingleSendingSigner` -> `TransactionMessageWithSingleSendingSigner`

- [#488](https://github.com/anza-xyz/kit/pull/488) [`810d6ab`](https://github.com/anza-xyz/kit/commit/810d6abafe1b7ea46ed63c491db1f5d6c16397ab) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Remove the `I` prefix on the following types: `IInstruction`, `IInstructionWithAccounts`, `IInstructionWithData`, `IInstructionWithSigners`, `IAccountMeta`, `IAccountLookupMeta` and `IAccountSignerMeta`. The old names are kept as aliases but marked as deprecated.

### Patch Changes

- [#520](https://github.com/anza-xyz/kit/pull/520) [`043d8c1`](https://github.com/anza-xyz/kit/commit/043d8c13d45c5058130154ab0507b86a1adefbf5) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Deprecate the `getComputeUnitEstimateForTransactionMessageFactory` function in favor of the `estimateComputeUnitLimitFactory` function from the `@solana-program/compute-budget` client.

- Updated dependencies [[`6ccbf01`](https://github.com/anza-xyz/kit/commit/6ccbf012703fce1cb40388b0f4e1ffaeffea838a), [`53e1336`](https://github.com/anza-xyz/kit/commit/53e1336149878c84048e0fde5c7e7ace6cc1e97f), [`363e3cc`](https://github.com/anza-xyz/kit/commit/363e3cc45db77a731bab1435b925fe0ad0af01df), [`eb61d94`](https://github.com/anza-xyz/kit/commit/eb61d94786e212fc23778d445a94b86d2b1b024f), [`eeac21d`](https://github.com/anza-xyz/kit/commit/eeac21d5fe4d8fb3ed3addee87872679ee37b4c4), [`bbcb913`](https://github.com/anza-xyz/kit/commit/bbcb913839d33abc746f38d6e65e7bfd30cd2ac6), [`93609aa`](https://github.com/anza-xyz/kit/commit/93609aa31dbd83086d0debd41aa2f8e9a0809761), [`b7dfe03`](https://github.com/anza-xyz/kit/commit/b7dfe033a8e929d7a598d8bfea546e9ef4207639), [`e6c0568`](https://github.com/anza-xyz/kit/commit/e6c0568ef34fdc04075af27eb102851123a02be0), [`810d6ab`](https://github.com/anza-xyz/kit/commit/810d6abafe1b7ea46ed63c491db1f5d6c16397ab)]:
    - @solana/transaction-messages@2.3.0
    - @solana/transactions@2.3.0
    - @solana/signers@2.3.0
    - @solana/errors@2.3.0
    - @solana/instructions@2.3.0
    - @solana/programs@2.3.0
    - @solana/transaction-confirmation@2.3.0
    - @solana/accounts@2.3.0
    - @solana/addresses@2.3.0
    - @solana/keys@2.3.0
    - @solana/rpc@2.3.0
    - @solana/rpc-subscriptions@2.3.0
    - @solana/rpc-types@2.3.0
    - @solana/sysvars@2.3.0
    - @solana/rpc-parsed-types@2.3.0
    - @solana/codecs@2.3.0
    - @solana/functional@2.3.0
    - @solana/rpc-spec-types@2.3.0

## 2.2.1

### Patch Changes

- Updated dependencies []:
    - @solana/rpc-subscriptions@2.2.1
    - @solana/transaction-confirmation@2.2.1
    - @solana/accounts@2.2.1
    - @solana/addresses@2.2.1
    - @solana/codecs@2.2.1
    - @solana/errors@2.2.1
    - @solana/functional@2.2.1
    - @solana/instructions@2.2.1
    - @solana/keys@2.2.1
    - @solana/programs@2.2.1
    - @solana/rpc@2.2.1
    - @solana/rpc-parsed-types@2.2.1
    - @solana/rpc-spec-types@2.2.1
    - @solana/rpc-types@2.2.1
    - @solana/signers@2.2.1
    - @solana/sysvars@2.2.1
    - @solana/transaction-messages@2.2.1
    - @solana/transactions@2.2.1

## 2.2.0

### Patch Changes

- Updated dependencies [[`85925d6`](https://github.com/anza-xyz/kit/commit/85925d64308e91b59fb748c75e4b414012eb4893)]:
    - @solana/addresses@2.2.0
    - @solana/keys@2.2.0
    - @solana/rpc-types@2.2.0
    - @solana/signers@2.2.0
    - @solana/transaction-messages@2.2.0
    - @solana/transactions@2.2.0
    - @solana/accounts@2.2.0
    - @solana/instructions@2.2.0
    - @solana/programs@2.2.0
    - @solana/rpc-parsed-types@2.2.0
    - @solana/rpc-subscriptions@2.2.0
    - @solana/sysvars@2.2.0
    - @solana/transaction-confirmation@2.2.0
    - @solana/rpc@2.2.0
    - @solana/codecs@2.2.0
    - @solana/errors@2.2.0
    - @solana/functional@2.2.0
    - @solana/rpc-spec-types@2.2.0

## 2.1.1

### Patch Changes

- [#473](https://github.com/anza-xyz/kit/pull/473) [`36a9dee`](https://github.com/anza-xyz/kit/commit/36a9dee4e6cbd72020dc74777fe394130b9a5f46) Thanks [@steveluscher](https://github.com/steveluscher)! - The identity of all branded types has changed in such a way that the types from v2.1.1 will be compatible with any other version going forward, which is not the case for versions v2.1.0 and before.

    If you end up with a mix of versions in your project prior to v2.1.1 (eg. `@solana/addresses@2.0.0` and `@solana/addresses@2.1.0`) you may discover that branded types like `Address` raise a type error, even though they are runtime compatible. Your options are:
    1. Always make sure that you have exactly one instance of each `@solana/*` dependency in your project at any given time
    2. Upgrade all of your `@solana/*` dependencies to v2.1.1 at minimum, even if their minor or patch versions differ.
    3. Suppress the type errors using a comment like the following:
        ```ts
        const myAddress = address('1234..5678'); // from @solana/addresses@2.0.0
        const myAccount = await fetchEncodedAccount(
            // imports @solana/addresses@2.1.0
            rpc,
            // @ts-expect-error Address types mismatch between installed versions of @solana/addresses
            myAddress,
        );
        ```

- [#409](https://github.com/anza-xyz/kit/pull/409) [`24a329d`](https://github.com/anza-xyz/kit/commit/24a329dda1434aaf450d1d35b022ee77556ac415) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Loosen lifetime constraint on sendAndConfirmTransaction to only require lastValidBlockHeight

- [#236](https://github.com/anza-xyz/kit/pull/236) [`ca1d4ec`](https://github.com/anza-xyz/kit/commit/ca1d4ec7ddd641ca813f79f8ca06d225f29419e2) Thanks [@steveluscher](https://github.com/steveluscher)! - The minimum TypeScript version is now 5.3.3

- Updated dependencies [[`2fb1fbc`](https://github.com/anza-xyz/kit/commit/2fb1fbcf06b12f3f892776e89d2ee32797d032a3), [`36a9dee`](https://github.com/anza-xyz/kit/commit/36a9dee4e6cbd72020dc74777fe394130b9a5f46), [`41b679c`](https://github.com/anza-xyz/kit/commit/41b679c2646029c9c7f005de55fba687e3c89e8a), [`24a329d`](https://github.com/anza-xyz/kit/commit/24a329dda1434aaf450d1d35b022ee77556ac415), [`41b679c`](https://github.com/anza-xyz/kit/commit/41b679c2646029c9c7f005de55fba687e3c89e8a), [`e143797`](https://github.com/anza-xyz/kit/commit/e1437975c60b9fe1beaabb45d513a840000b25a3), [`776e18d`](https://github.com/anza-xyz/kit/commit/776e18d75c759a839608069c61da3f70b775540b), [`ca1d4ec`](https://github.com/anza-xyz/kit/commit/ca1d4ec7ddd641ca813f79f8ca06d225f29419e2)]:
    - @solana/sysvars@2.1.1
    - @solana/transaction-confirmation@2.1.1
    - @solana/transaction-messages@2.1.1
    - @solana/rpc-subscriptions@2.1.1
    - @solana/rpc-parsed-types@2.1.1
    - @solana/rpc-spec-types@2.1.1
    - @solana/instructions@2.1.1
    - @solana/transactions@2.1.1
    - @solana/functional@2.1.1
    - @solana/addresses@2.1.1
    - @solana/rpc-types@2.1.1
    - @solana/accounts@2.1.1
    - @solana/programs@2.1.1
    - @solana/signers@2.1.1
    - @solana/codecs@2.1.1
    - @solana/errors@2.1.1
    - @solana/keys@2.1.1
    - @solana/rpc@2.1.1

## 2.1.0

### Patch Changes

- [#101](https://github.com/anza-xyz/kit/pull/101) [`4662f52`](https://github.com/anza-xyz/kit/commit/4662f52f8cdd6fd0b267adb896bc9606f1e86b5e) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Add a new function `fetchAddressesForLookupTables` to fetch the addresses contained in a list of lookup tables'

- Updated dependencies [[`a1e45a1`](https://github.com/anza-xyz/kit/commit/a1e45a1d91ba1ac530eea0986b2ffeafb9713aec), [`1adf435`](https://github.com/anza-xyz/kit/commit/1adf435cfc724303f64e509a6fda144ec8f5019d), [`d1c787c`](https://github.com/anza-xyz/kit/commit/d1c787c447bd134e6a6da8be059c8353f92b2f9a), [`0c577eb`](https://github.com/anza-xyz/kit/commit/0c577eb03fa5db8b817f209d52a19a36976c7c12), [`c7b7dd9`](https://github.com/anza-xyz/kit/commit/c7b7dd99aca878d2450760c214dbea593ddbadc0), [`9b179dc`](https://github.com/anza-xyz/kit/commit/9b179dc6b7c7e6e4d51481a396567f17665abbc3), [`29d1e28`](https://github.com/anza-xyz/kit/commit/29d1e282f7ae53db008515980f13d54c40760065), [`400f4d5`](https://github.com/anza-xyz/kit/commit/400f4d5673286a197561033bba63bac9a433cc6a), [`5af7f20`](https://github.com/anza-xyz/kit/commit/5af7f2013135a79893a0f190a905c6dd077ac38c), [`70eb596`](https://github.com/anza-xyz/kit/commit/70eb596bdff9d95d607a937615190a0d8111ad3c), [`704d8a2`](https://github.com/anza-xyz/kit/commit/704d8a220592a5a472bd7726013814b50c991f5b), [`c880687`](https://github.com/anza-xyz/kit/commit/c880687184239a2b2908e85b460bc0b97c07f371)]:
    - @solana/signers@2.1.0
    - @solana/addresses@2.1.0
    - @solana/errors@2.1.0
    - @solana/keys@2.1.0
    - @solana/sysvars@2.1.0
    - @solana/transaction-confirmation@2.1.0
    - @solana/rpc-types@2.1.0
    - @solana/accounts@2.1.0
    - @solana/rpc-subscriptions@2.1.0
    - @solana/rpc@2.1.0
    - @solana/transaction-messages@2.1.0
    - @solana/instructions@2.1.0
    - @solana/programs@2.1.0
    - @solana/rpc-parsed-types@2.1.0
    - @solana/transactions@2.1.0
    - @solana/codecs@2.1.0
    - @solana/functional@2.1.0
    - @solana/rpc-spec-types@2.1.0

## 2.0.0

### Major Changes

- [`4e7ec14`](https://github.com/solana-labs/solana-web3.js/commit/4e7ec14d9c1a74122d8b9b6cd177928bd1087c4b) Thanks [@steveluscher](https://github.com/steveluscher)! - This version of the `@solana/web3.js` Technology Preview fixes a bug with the default RPC transport, adds a utility that you can use to get an estimate of a transaction message's compute unit cost, and introduces `@solana/react` hooks for interacting with Wallet Standard wallets.

    To install the fourth Technology Preview:

    ```shell
    npm install --save @solana/web3.js@tp4
    ```

    For an example of how to use the new `@solana/react` package to interact with wallets in a React application, see the example application in [`examples/react-app`](https://github.com/solana-labs/solana-web3.js/tree/master/examples/react-app#readme). We hope to see similar wallet-connection packages patterned off `@solana/react` for other application frameworks soon.

    Try a demo of Technology Preview 4 in your browser at [CodeSandbox](https://codesandbox.io/p/sandbox/solana-javascript-sdk-technology-preview-4-h8cz4v?file=%2Fsrc%2Findex.ts%3A21%2C8).
    - [#2858](https://github.com/solana-labs/solana-web3.js/pull/2858) [`22a34aa`](https://github.com/solana-labs/solana-web3.js/commit/22a34aa08d1be7e9b43ccfea94a99eaa2694e491) Thanks [@steveluscher](https://github.com/steveluscher)! - Transaction signers' methods now take `minContextSlot` as an option. This is important for signers that simulate transactions, like wallets. They might be interested in knowing the slot at which the transaction was prepared, lest they run simulation at too early a slot.
    - [#2852](https://github.com/solana-labs/solana-web3.js/pull/2852) [`cec9048`](https://github.com/solana-labs/solana-web3.js/commit/cec9048b2f83535df7e499db5488c336981dfb5a) Thanks [@lorisleiva](https://github.com/lorisleiva)! - The `signAndSendTransactionMessageWithSigners` function now automatically asserts that the provided transaction message contains a single sending signer and fails otherwise.
    - [#2707](https://github.com/solana-labs/solana-web3.js/pull/2707) [`cb49bfa`](https://github.com/solana-labs/solana-web3.js/commit/cb49bfa28f412376a41e758eeda59e7e90983147) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Allow creating keypairs and keys from ReadonlyUint8Array
    - [#2715](https://github.com/solana-labs/solana-web3.js/pull/2715) [`26dae19`](https://github.com/solana-labs/solana-web3.js/commit/26dae190c2ec835fbdaa7b7d66ca33d6ba0727b8) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Consolidated `getNullableCodec` and `getOptionCodec` with their `Zeroable` counterparts and added more configurations

        Namely, the `prefix` option can now be set to `null` and the `fixed` option was replaced with the `noneValue` option which can be set to `"zeroes"` for `Zeroable` codecs or a custom byte array for custom representations of none values. This means the `getZeroableNullableCodec` and `getZeroableOptionCodec` functions were removed in favor of the new options.

        ```ts
        // Before.
        getZeroableNullableCodec(getU16Codec());

        // After.
        getNullableCodec(getU16Codec(), { noneValue: 'zeroes', prefix: null });
        ```

        Additionally, it is now possible to create nullable codecs that have no `prefix` nor `noneValue`. In this case, the existence of the nullable item is indicated by the presence of any remaining bytes left to decode.

        ```ts
        const codec = getNullableCodec(getU16Codec(), { prefix: null });
        codec.encode(42); // 0x2a00
        codec.encode(null); // Encodes nothing.
        codec.decode(new Uint8Array([42, 0])); // 42
        codec.decode(new Uint8Array([])); // null
        ```

        Also note that it is now possible for custom `noneValue` byte arrays to be of any length — previously, it had to match the fixed-size of the nullable item.

        Here is a recap of all supported scenarios, using a `u16` codec as an example:

        | `encode(42)` / `encode(null)` | No `noneValue` (default) | `noneValue: "zeroes"`       | Custom `noneValue` (`0xff`) |
        | ----------------------------- | ------------------------ | --------------------------- | --------------------------- |
        | `u8` prefix (default)         | `0x012a00` / `0x00`      | `0x012a00` / `0x000000`     | `0x012a00` / `0x00ff`       |
        | Custom `prefix` (`u16`)       | `0x01002a00` / `0x0000`  | `0x01002a00` / `0x00000000` | `0x01002a00` / `0x0000ff`   |
        | No `prefix`                   | `0x2a00` / `0x`          | `0x2a00` / `0x0000`         | `0x2a00` / `0xff`           |

        Reciprocal changes were made with `getOptionCodec`.

    - [#2785](https://github.com/solana-labs/solana-web3.js/pull/2785) [`4f19842`](https://github.com/solana-labs/solana-web3.js/commit/4f198423997d28d927f982333d268e19940656df) Thanks [@steveluscher](https://github.com/steveluscher)! - The development mode error message printer no longer fatals on Safari &lt; 16.4.
    - [#2867](https://github.com/solana-labs/solana-web3.js/pull/2867) [`be36bab`](https://github.com/solana-labs/solana-web3.js/commit/be36babd752b1c987a2f53b4ff83ac8c045a3418) Thanks [@steveluscher](https://github.com/steveluscher)! - The `innerInstructions` property of JSON-RPC errors used snake case rather than camelCase for `stackHeight` and `programId`. This has been corrected.
    - [#2728](https://github.com/solana-labs/solana-web3.js/pull/2728) [`f1e9ac2`](https://github.com/solana-labs/solana-web3.js/commit/f1e9ac2af579e4fbfb5550cbdbd971a87a4e4432) Thanks [@joncinque](https://github.com/joncinque)! - Simulate with the maximum quantity of compute units (1.4M) instead of `u32::MAX`
    - [#2703](https://github.com/solana-labs/solana-web3.js/pull/2703) [`0908628`](https://github.com/solana-labs/solana-web3.js/commit/09086289a230aa1b780c1035408b48243ab960f2) Thanks [@steveluscher](https://github.com/steveluscher)! - Created a utility function to estimate the compute unit consumption of a transaction message
    - [#2795](https://github.com/solana-labs/solana-web3.js/pull/2795) [`ce876d9`](https://github.com/solana-labs/solana-web3.js/commit/ce876d99f04d539292abd810acd77a319c52f50d) Thanks [@steveluscher](https://github.com/steveluscher)! - Added React hooks to which you can pass a Wallet Standard `UiWalletAccount` and obtain a `MessageModifyingSigner`, `TransactionModifyingSigner`, or `TransactionSendingSigner` for use in constructing, signing, and sending Solana transactions and messages
    - [#2772](https://github.com/solana-labs/solana-web3.js/pull/2772) [`8fe4551`](https://github.com/solana-labs/solana-web3.js/commit/8fe4551217a3ad8bfdcd1609ac7b23e8fd044c72) Thanks [@steveluscher](https://github.com/steveluscher)! - Added a series of React hooks to which you can pass a Wallet Standard `UiWalletAccount` to extract its `signMessage`, `signTransaction`, and `signAndSendTransaction` features
    - [#2819](https://github.com/solana-labs/solana-web3.js/pull/2819) [`7ee47ae`](https://github.com/solana-labs/solana-web3.js/commit/7ee47ae24ad73b429ee863342f300a6f6c49e3d2) Thanks [@steveluscher](https://github.com/steveluscher)! - Fixed a bug where coalesced RPC calls could end up aborted even though there were still interested consumers. This would happen if the consumer count fell to zero, then rose above zero again, in the same runloop.
    - [#2868](https://github.com/solana-labs/solana-web3.js/pull/2868) [`91fb1f3`](https://github.com/solana-labs/solana-web3.js/commit/91fb1f39bb174cf1e899a21365153a7b3bbf3571) Thanks [@steveluscher](https://github.com/steveluscher)! - The `simulateTransaction` RPC method now accepts an `innerInstructions` param. When `true`, the simulation result will include an array of inner instructions, if any.
    - [#2866](https://github.com/solana-labs/solana-web3.js/pull/2866) [`73bd5a9`](https://github.com/solana-labs/solana-web3.js/commit/73bd5a9e0b32846cd5d76f2d2d1b21661eab0677) Thanks [@steveluscher](https://github.com/steveluscher)! - The `TransactionInstruction` RPC type now has `stackHeight`
    - [#2751](https://github.com/solana-labs/solana-web3.js/pull/2751) [`6340744`](https://github.com/solana-labs/solana-web3.js/commit/6340744e5cf0ea91ae677f381d5a187638a19597) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Allow Rpc Request params to be any type, instead of requiring an array

### Patch Changes

- [#2728](https://github.com/solana-labs/solana-web3.js/pull/2728) [`f1e9ac2`](https://github.com/solana-labs/solana-web3.js/commit/f1e9ac2af579e4fbfb5550cbdbd971a87a4e4432) Thanks [@joncinque](https://github.com/joncinque)! - Simulate with the maximum quantity of compute units (1.4M) instead of `u32::MAX`

- [#3407](https://github.com/solana-labs/solana-web3.js/pull/3407) [`10b08ac`](https://github.com/solana-labs/solana-web3.js/commit/10b08ac8cdb61aa1412475426cfcaf0eefe32722) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Use `RpcRequest`, `RpcResponse` and their transformers in RPC Subscriptions packages

    This change makes the RPC and RPC Subscriptions architecture more consistent by using the same `RpcRequest` and `RpcResponse` types and transformers as the basis for handling user requests (RPC calls or subscriptions) and returning responses to them.

    See the following PRs for more details:
    - [PR #3393](https://github.com/solana-labs/solana-web3.js/pull/3393)
    - [PR #3394](https://github.com/solana-labs/solana-web3.js/pull/3394)
    - [PR #3403](https://github.com/solana-labs/solana-web3.js/pull/3403)
    - [PR #3404](https://github.com/solana-labs/solana-web3.js/pull/3404)
    - [PR #3405](https://github.com/solana-labs/solana-web3.js/pull/3405)

- [#3541](https://github.com/solana-labs/solana-web3.js/pull/3541) [`135dc5a`](https://github.com/solana-labs/solana-web3.js/commit/135dc5ad43f286380a4c3a689668016f0d7945f4) Thanks [@steveluscher](https://github.com/steveluscher)! - Drop the Release Candidate label and publish `@solana/web3.js` at version 2.0.0

- [#2905](https://github.com/solana-labs/solana-web3.js/pull/2905) [`56fde06`](https://github.com/solana-labs/solana-web3.js/commit/56fde06003841228d4e7de162059dda648f1043d) Thanks [@steveluscher](https://github.com/steveluscher)! - Fixed the type of `config` on `getComputeUnitEstimateForTransactionMessage`. It is now optional and does not include `transactionMessage`.

- [#3453](https://github.com/solana-labs/solana-web3.js/pull/3453) [`bafefed`](https://github.com/solana-labs/solana-web3.js/commit/bafefed88574009ba5a983023e439d91b65fada2) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Rename decodeTransactionMessage to decompileTransactionMessageFetchingLookupTables

- [#2504](https://github.com/solana-labs/solana-web3.js/pull/2504) [`18d6b56`](https://github.com/solana-labs/solana-web3.js/commit/18d6b56a69509e4c98de8f3de51abe2623b46763) Thanks [@steveluscher](https://github.com/steveluscher)! - Replaced `fast-stable-stringify` with our fork

- [#3290](https://github.com/solana-labs/solana-web3.js/pull/3290) [`2368163`](https://github.com/solana-labs/solana-web3.js/commit/23681637fa3ee0e2242b3b6bf087a066393bcbd8) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Throw an error if a transaction fails when being simulated to estimate CUs

- [#2606](https://github.com/solana-labs/solana-web3.js/pull/2606) [`367b8ad`](https://github.com/solana-labs/solana-web3.js/commit/367b8ad0cce55a916abfb0125f36b6e844333b2b) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Use commonjs package type

- [#2703](https://github.com/solana-labs/solana-web3.js/pull/2703) [`0908628`](https://github.com/solana-labs/solana-web3.js/commit/09086289a230aa1b780c1035408b48243ab960f2) Thanks [@steveluscher](https://github.com/steveluscher)! - Created a utility function to estimate the compute unit consumption of a transaction message

- [#3137](https://github.com/solana-labs/solana-web3.js/pull/3137) [`fd72c2e`](https://github.com/solana-labs/solana-web3.js/commit/fd72c2ed1edad488318fa5d3e285f04852f4210a) Thanks [@mcintyre94](https://github.com/mcintyre94)! - The build is now compatible with the Vercel Edge runtime and Cloudflare Workers through the addition of `edge-light` and `workerd` to the package exports.

- Updated dependencies [[`9370133`](https://github.com/solana-labs/solana-web3.js/commit/9370133e414bfa863517248d97905449e9a867eb), [`31916ae`](https://github.com/solana-labs/solana-web3.js/commit/31916ae5d4fb29f239c63252a59745e33a6979ea), [`42a70f4`](https://github.com/solana-labs/solana-web3.js/commit/42a70f4c3004e55fe6ce5a8e500f5610765ec66f), [`292487d`](https://github.com/solana-labs/solana-web3.js/commit/292487da00ee57350e8faf49ccf961203aed6403), [`10b08ac`](https://github.com/solana-labs/solana-web3.js/commit/10b08ac8cdb61aa1412475426cfcaf0eefe32722), [`7d310f6`](https://github.com/solana-labs/solana-web3.js/commit/7d310f6f9cd7d02fca4d6f8e311b857c9dd84e61), [`1ad523d`](https://github.com/solana-labs/solana-web3.js/commit/1ad523dc5792d9152a66e9dc2b83294e3eba4db0), [`7ee47ae`](https://github.com/solana-labs/solana-web3.js/commit/7ee47ae24ad73b429ee863342f300a6f6c49e3d2), [`3834d82`](https://github.com/solana-labs/solana-web3.js/commit/3834d82eb1dd150f261612d742c3105194689c13), [`696c72c`](https://github.com/solana-labs/solana-web3.js/commit/696c72ce25c96f06442785bddffbc890ceb802f3), [`419c12e`](https://github.com/solana-labs/solana-web3.js/commit/419c12e617435570d0cded6ca6d35370d0060da7), [`45df702`](https://github.com/solana-labs/solana-web3.js/commit/45df7028d872e65759dad86b97cd9d4a9a3a545e), [`9dfca45`](https://github.com/solana-labs/solana-web3.js/commit/9dfca454355819444bad29e48602886428ba4cac), [`3c02c35`](https://github.com/solana-labs/solana-web3.js/commit/3c02c3582f5b87151b7ac1d9cd24b9d20f6945ea), [`1c25dd4`](https://github.com/solana-labs/solana-web3.js/commit/1c25dd4069a3a8f5599285c9b0eaeb71a2f897d1), [`89f399d`](https://github.com/solana-labs/solana-web3.js/commit/89f399d474abac463b1daaa864c88305d7b8c21f), [`3fc388f`](https://github.com/solana-labs/solana-web3.js/commit/3fc388f0b40243436a3ecbcd2af27ea8efa683e4), [`ebb03cd`](https://github.com/solana-labs/solana-web3.js/commit/ebb03cd8270027db957d4cecc7d2374d468d4ccb), [`002cc38`](https://github.com/solana-labs/solana-web3.js/commit/002cc38a99cd4c91c7ce9023e1b4fb28f7e10832), [`26dae19`](https://github.com/solana-labs/solana-web3.js/commit/26dae190c2ec835fbdaa7b7d66ca33d6ba0727b8), [`2040f96`](https://github.com/solana-labs/solana-web3.js/commit/2040f96cc22e4195749577d265cd6a76d8a08b87), [`0245265`](https://github.com/solana-labs/solana-web3.js/commit/024526554fa0145e31e62a0d47f1eea556a30e71), [`ce1be3f`](https://github.com/solana-labs/solana-web3.js/commit/ce1be3fe37ea9b744fd836f3d6c2c8e5e31efd77), [`1672346`](https://github.com/solana-labs/solana-web3.js/commit/1672346246fe9444b018d726ab7bfcd4bb092ec2), [`82cf07f`](https://github.com/solana-labs/solana-web3.js/commit/82cf07f4e905f6b056e70a0463a94222c3e7cadd), [`2d54650`](https://github.com/solana-labs/solana-web3.js/commit/2d5465018d8060eceb00efbf4f718df26d145199), [`135dc5a`](https://github.com/solana-labs/solana-web3.js/commit/135dc5ad43f286380a4c3a689668016f0d7945f4), [`bef9604`](https://github.com/solana-labs/solana-web3.js/commit/bef960435eb2303395bfa76e44f84d3348c5722d), [`af9fa3b`](https://github.com/solana-labs/solana-web3.js/commit/af9fa3b7e83220d69eab67b37d3a36beac0e848c), [`7e86583`](https://github.com/solana-labs/solana-web3.js/commit/7e86583da68695076ec62033f3fe078b3890f026), [`500a991`](https://github.com/solana-labs/solana-web3.js/commit/500a991d292638eaee1fa48a7b94acfe2ff83cb7), [`c122c75`](https://github.com/solana-labs/solana-web3.js/commit/c122c75936e8fa5364edf114a5182cf119b26922), [`0b02de1`](https://github.com/solana-labs/solana-web3.js/commit/0b02de140887654f19f8eda374f40c6f5a8f5e92), [`4f19842`](https://github.com/solana-labs/solana-web3.js/commit/4f198423997d28d927f982333d268e19940656df), [`231a030`](https://github.com/solana-labs/solana-web3.js/commit/231a0303ae5960e783719a8ff1d17a50ff26ad78), [`677a9c4`](https://github.com/solana-labs/solana-web3.js/commit/677a9c4eb88a8ac6a9ede8d82f367c5ac8d69ff4), [`8f94a9e`](https://github.com/solana-labs/solana-web3.js/commit/8f94a9ede71b32662bff991e6def68bc9e8bc921), [`38faba0`](https://github.com/solana-labs/solana-web3.js/commit/38faba05fab479ddbd95d0e211744d203f8aa823), [`73bd5a9`](https://github.com/solana-labs/solana-web3.js/commit/73bd5a9e0b32846cd5d76f2d2d1b21661eab0677), [`2e5af9f`](https://github.com/solana-labs/solana-web3.js/commit/2e5af9f1a9410f15108863342b48225fdf9a0c83), [`cec9048`](https://github.com/solana-labs/solana-web3.js/commit/cec9048b2f83535df7e499db5488c336981dfb5a), [`e3e82d9`](https://github.com/solana-labs/solana-web3.js/commit/e3e82d909825e958ae234ed18500335a621773bd), [`4c7224d`](https://github.com/solana-labs/solana-web3.js/commit/4c7224d0a884b0dc91ea536ce5fbdcd0a0d7e011), [`2798061`](https://github.com/solana-labs/solana-web3.js/commit/27980617e4f8d34dbc7b6da4507e4bca68a68090), [`44c8772`](https://github.com/solana-labs/solana-web3.js/commit/44c8772c8711b99e68dce3348e17bfc5b1d2a833), [`54d68c4`](https://github.com/solana-labs/solana-web3.js/commit/54d68c482feebf4e62a9896b3badd77dab615941), [`be36bab`](https://github.com/solana-labs/solana-web3.js/commit/be36babd752b1c987a2f53b4ff83ac8c045a3418), [`cb49bfa`](https://github.com/solana-labs/solana-web3.js/commit/cb49bfa28f412376a41e758eeda59e7e90983147), [`18d6b56`](https://github.com/solana-labs/solana-web3.js/commit/18d6b56a69509e4c98de8f3de51abe2623b46763), [`e1cb697`](https://github.com/solana-labs/solana-web3.js/commit/e1cb697d66dc906aa2433965452417e03cf86e13), [`288029a`](https://github.com/solana-labs/solana-web3.js/commit/288029a55a5eeb863b6df960027a59214ffc37f1), [`4ae78f5`](https://github.com/solana-labs/solana-web3.js/commit/4ae78f5cdddd6772b25351beb813483d4e52cea6), [`3d90241`](https://github.com/solana-labs/solana-web3.js/commit/3d902419c1b232fa7145757b9c95976de69790c7), [`478443f`](https://github.com/solana-labs/solana-web3.js/commit/478443fedac06678f12e8ac285aa7c7fcf503ee8), [`367b8ad`](https://github.com/solana-labs/solana-web3.js/commit/367b8ad0cce55a916abfb0125f36b6e844333b2b), [`fd72c2e`](https://github.com/solana-labs/solana-web3.js/commit/fd72c2ed1edad488318fa5d3e285f04852f4210a), [`4decebb`](https://github.com/solana-labs/solana-web3.js/commit/4decebb9b619972f49c740323b59cf470696e105), [`d4965ec`](https://github.com/solana-labs/solana-web3.js/commit/d4965ece9abaf81e3006442db15f3f77d89a622c), [`9239e6e`](https://github.com/solana-labs/solana-web3.js/commit/9239e6ec972b4de9f0d15b197fbef1d2871759d9), [`0158b31`](https://github.com/solana-labs/solana-web3.js/commit/0158b3181ed96996f269f3bff689f76411e460b3), [`db144da`](https://github.com/solana-labs/solana-web3.js/commit/db144da362e3389837b56f97abfb766cc8c847c2), [`22a34aa`](https://github.com/solana-labs/solana-web3.js/commit/22a34aa08d1be7e9b43ccfea94a99eaa2694e491), [`f9a8446`](https://github.com/solana-labs/solana-web3.js/commit/f9a84460670a97d4ab6514b28fe0d29c6fac3302), [`c8e6e71`](https://github.com/solana-labs/solana-web3.js/commit/c8e6e71529f219caf83ed444e53f5a1e757129dc), [`125fc15`](https://github.com/solana-labs/solana-web3.js/commit/125fc1540cfbc0a4afdba5aabac0884c750e58c1)]:
    - @solana/errors@2.0.0
    - @solana/transactions@2.0.0
    - @solana/addresses@2.0.0
    - @solana/rpc-types@2.0.0
    - @solana/rpc@2.0.0
    - @solana/rpc-subscriptions@2.0.0
    - @solana/rpc-spec-types@2.0.0
    - @solana/keys@2.0.0
    - @solana/signers@2.0.0
    - @solana/transaction-confirmation@2.0.0
    - @solana/transaction-messages@2.0.0
    - @solana/accounts@2.0.0
    - @solana/codecs@2.0.0
    - @solana/programs@2.0.0
    - @solana/rpc-parsed-types@2.0.0
    - @solana/instructions@2.0.0
    - @solana/functional@2.0.0
    - @solana/sysvars@2.0.0

## 2.0.0-rc.4

### Patch Changes

- Updated dependencies [[`2798061`](https://github.com/solana-labs/solana-web3.js/commit/27980617e4f8d34dbc7b6da4507e4bca68a68090)]:
    - @solana/errors@2.0.0-rc.4
    - @solana/accounts@2.0.0-rc.4
    - @solana/addresses@2.0.0-rc.4
    - @solana/instructions@2.0.0-rc.4
    - @solana/keys@2.0.0-rc.4
    - @solana/programs@2.0.0-rc.4
    - @solana/rpc@2.0.0-rc.4
    - @solana/rpc-subscriptions@2.0.0-rc.4
    - @solana/rpc-types@2.0.0-rc.4
    - @solana/signers@2.0.0-rc.4
    - @solana/sysvars@2.0.0-rc.4
    - @solana/transaction-confirmation@2.0.0-rc.4
    - @solana/transaction-messages@2.0.0-rc.4
    - @solana/transactions@2.0.0-rc.4
    - @solana/rpc-parsed-types@2.0.0-rc.4
    - @solana/codecs@2.0.0-rc.4
    - @solana/functional@2.0.0-rc.4
    - @solana/rpc-spec-types@2.0.0-rc.4

## 2.0.0-rc.3

### Patch Changes

- Updated dependencies [[`45df702`](https://github.com/solana-labs/solana-web3.js/commit/45df7028d872e65759dad86b97cd9d4a9a3a545e)]:
    - @solana/rpc-subscriptions@2.0.0-rc.3
    - @solana/rpc-spec-types@2.0.0-rc.3
    - @solana/transaction-confirmation@2.0.0-rc.3
    - @solana/rpc@2.0.0-rc.3
    - @solana/accounts@2.0.0-rc.3
    - @solana/sysvars@2.0.0-rc.3
    - @solana/addresses@2.0.0-rc.3
    - @solana/codecs@2.0.0-rc.3
    - @solana/errors@2.0.0-rc.3
    - @solana/functional@2.0.0-rc.3
    - @solana/instructions@2.0.0-rc.3
    - @solana/keys@2.0.0-rc.3
    - @solana/programs@2.0.0-rc.3
    - @solana/rpc-parsed-types@2.0.0-rc.3
    - @solana/rpc-types@2.0.0-rc.3
    - @solana/signers@2.0.0-rc.3
    - @solana/transaction-messages@2.0.0-rc.3
    - @solana/transactions@2.0.0-rc.3

## 2.0.0-rc.2

### Patch Changes

- [#3407](https://github.com/solana-labs/solana-web3.js/pull/3407) [`10b08ac`](https://github.com/solana-labs/solana-web3.js/commit/10b08ac8cdb61aa1412475426cfcaf0eefe32722) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Use `RpcRequest`, `RpcResponse` and their transformers in RPC Subscriptions packages

    This change makes the RPC and RPC Subscriptions architecture more consistent by using the same `RpcRequest` and `RpcResponse` types and transformers as the basis for handling user requests (RPC calls or subscriptions) and returning responses to them.

    See the following PRs for more details:
    - [PR #3393](https://github.com/solana-labs/solana-web3.js/pull/3393)
    - [PR #3394](https://github.com/solana-labs/solana-web3.js/pull/3394)
    - [PR #3403](https://github.com/solana-labs/solana-web3.js/pull/3403)
    - [PR #3404](https://github.com/solana-labs/solana-web3.js/pull/3404)
    - [PR #3405](https://github.com/solana-labs/solana-web3.js/pull/3405)

- [#3453](https://github.com/solana-labs/solana-web3.js/pull/3453) [`bafefed`](https://github.com/solana-labs/solana-web3.js/commit/bafefed88574009ba5a983023e439d91b65fada2) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Rename decodeTransactionMessage to decompileTransactionMessageFetchingLookupTables

- [#3290](https://github.com/solana-labs/solana-web3.js/pull/3290) [`2368163`](https://github.com/solana-labs/solana-web3.js/commit/23681637fa3ee0e2242b3b6bf087a066393bcbd8) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Throw an error if a transaction fails when being simulated to estimate CUs

- [#3137](https://github.com/solana-labs/solana-web3.js/pull/3137) [`fd72c2e`](https://github.com/solana-labs/solana-web3.js/commit/fd72c2ed1edad488318fa5d3e285f04852f4210a) Thanks [@mcintyre94](https://github.com/mcintyre94)! - The build is now compatible with the Vercel Edge runtime and Cloudflare Workers through the addition of `edge-light` and `workerd` to the package exports.

- Updated dependencies [[`292487d`](https://github.com/solana-labs/solana-web3.js/commit/292487da00ee57350e8faf49ccf961203aed6403), [`10b08ac`](https://github.com/solana-labs/solana-web3.js/commit/10b08ac8cdb61aa1412475426cfcaf0eefe32722), [`3834d82`](https://github.com/solana-labs/solana-web3.js/commit/3834d82eb1dd150f261612d742c3105194689c13), [`696c72c`](https://github.com/solana-labs/solana-web3.js/commit/696c72ce25c96f06442785bddffbc890ceb802f3), [`9dfca45`](https://github.com/solana-labs/solana-web3.js/commit/9dfca454355819444bad29e48602886428ba4cac), [`3c02c35`](https://github.com/solana-labs/solana-web3.js/commit/3c02c3582f5b87151b7ac1d9cd24b9d20f6945ea), [`1c25dd4`](https://github.com/solana-labs/solana-web3.js/commit/1c25dd4069a3a8f5599285c9b0eaeb71a2f897d1), [`3fc388f`](https://github.com/solana-labs/solana-web3.js/commit/3fc388f0b40243436a3ecbcd2af27ea8efa683e4), [`0245265`](https://github.com/solana-labs/solana-web3.js/commit/024526554fa0145e31e62a0d47f1eea556a30e71), [`500a991`](https://github.com/solana-labs/solana-web3.js/commit/500a991d292638eaee1fa48a7b94acfe2ff83cb7), [`231a030`](https://github.com/solana-labs/solana-web3.js/commit/231a0303ae5960e783719a8ff1d17a50ff26ad78), [`8f94a9e`](https://github.com/solana-labs/solana-web3.js/commit/8f94a9ede71b32662bff991e6def68bc9e8bc921), [`38faba0`](https://github.com/solana-labs/solana-web3.js/commit/38faba05fab479ddbd95d0e211744d203f8aa823), [`4c7224d`](https://github.com/solana-labs/solana-web3.js/commit/4c7224d0a884b0dc91ea536ce5fbdcd0a0d7e011), [`44c8772`](https://github.com/solana-labs/solana-web3.js/commit/44c8772c8711b99e68dce3348e17bfc5b1d2a833), [`e1cb697`](https://github.com/solana-labs/solana-web3.js/commit/e1cb697d66dc906aa2433965452417e03cf86e13), [`fd72c2e`](https://github.com/solana-labs/solana-web3.js/commit/fd72c2ed1edad488318fa5d3e285f04852f4210a), [`4decebb`](https://github.com/solana-labs/solana-web3.js/commit/4decebb9b619972f49c740323b59cf470696e105), [`d4965ec`](https://github.com/solana-labs/solana-web3.js/commit/d4965ece9abaf81e3006442db15f3f77d89a622c), [`0158b31`](https://github.com/solana-labs/solana-web3.js/commit/0158b3181ed96996f269f3bff689f76411e460b3), [`db144da`](https://github.com/solana-labs/solana-web3.js/commit/db144da362e3389837b56f97abfb766cc8c847c2), [`c8e6e71`](https://github.com/solana-labs/solana-web3.js/commit/c8e6e71529f219caf83ed444e53f5a1e757129dc)]:
    - @solana/addresses@2.0.0-rc.2
    - @solana/rpc-subscriptions@2.0.0-rc.2
    - @solana/rpc-spec-types@2.0.0-rc.2
    - @solana/rpc@2.0.0-rc.2
    - @solana/rpc-types@2.0.0-rc.2
    - @solana/transaction-confirmation@2.0.0-rc.2
    - @solana/accounts@2.0.0-rc.2
    - @solana/transaction-messages@2.0.0-rc.2
    - @solana/rpc-parsed-types@2.0.0-rc.2
    - @solana/sysvars@2.0.0-rc.2
    - @solana/errors@2.0.0-rc.2
    - @solana/instructions@2.0.0-rc.2
    - @solana/transactions@2.0.0-rc.2
    - @solana/functional@2.0.0-rc.2
    - @solana/programs@2.0.0-rc.2
    - @solana/signers@2.0.0-rc.2
    - @solana/codecs@2.0.0-rc.2
    - @solana/keys@2.0.0-rc.2

## 2.0.0-rc.1

### Patch Changes

- Updated dependencies [[`7d310f6`](https://github.com/solana-labs/solana-web3.js/commit/7d310f6f9cd7d02fca4d6f8e311b857c9dd84e61), [`1ad523d`](https://github.com/solana-labs/solana-web3.js/commit/1ad523dc5792d9152a66e9dc2b83294e3eba4db0), [`c122c75`](https://github.com/solana-labs/solana-web3.js/commit/c122c75936e8fa5364edf114a5182cf119b26922), [`f9a8446`](https://github.com/solana-labs/solana-web3.js/commit/f9a84460670a97d4ab6514b28fe0d29c6fac3302)]:
    - @solana/keys@2.0.0-rc.1
    - @solana/signers@2.0.0-rc.1
    - @solana/transaction-confirmation@2.0.0-rc.1
    - @solana/rpc-subscriptions@2.0.0-rc.1
    - @solana/transactions@2.0.0-rc.1
    - @solana/rpc@2.0.0-rc.1
    - @solana/sysvars@2.0.0-rc.1
    - @solana/accounts@2.0.0-rc.1
    - @solana/addresses@2.0.0-rc.1
    - @solana/codecs@2.0.0-rc.1
    - @solana/errors@2.0.0-rc.1
    - @solana/functional@2.0.0-rc.1
    - @solana/instructions@2.0.0-rc.1
    - @solana/programs@2.0.0-rc.1
    - @solana/rpc-parsed-types@2.0.0-rc.1
    - @solana/rpc-types@2.0.0-rc.1
    - @solana/transaction-messages@2.0.0-rc.1

## 2.0.0-rc.0

### Patch Changes

- [#2905](https://github.com/solana-labs/solana-web3.js/pull/2905) [`56fde06`](https://github.com/solana-labs/solana-web3.js/commit/56fde06003841228d4e7de162059dda648f1043d) Thanks [@steveluscher](https://github.com/steveluscher)! - Fixed the type of `config` on `getComputeUnitEstimateForTransactionMessage`. It is now optional and does not include `transactionMessage`.

- Updated dependencies [[`42a70f4`](https://github.com/solana-labs/solana-web3.js/commit/42a70f4c3004e55fe6ce5a8e500f5610765ec66f), [`419c12e`](https://github.com/solana-labs/solana-web3.js/commit/419c12e617435570d0cded6ca6d35370d0060da7), [`677a9c4`](https://github.com/solana-labs/solana-web3.js/commit/677a9c4eb88a8ac6a9ede8d82f367c5ac8d69ff4), [`9239e6e`](https://github.com/solana-labs/solana-web3.js/commit/9239e6ec972b4de9f0d15b197fbef1d2871759d9)]:
    - @solana/rpc@2.0.0-rc.0
    - @solana/transaction-messages@2.0.0-rc.0
    - @solana/errors@2.0.0-rc.0
    - @solana/rpc-subscriptions@2.0.0-rc.0
    - @solana/programs@2.0.0-rc.0
    - @solana/transaction-confirmation@2.0.0-rc.0
    - @solana/signers@2.0.0-rc.0
    - @solana/transactions@2.0.0-rc.0
    - @solana/accounts@2.0.0-rc.0
    - @solana/sysvars@2.0.0-rc.0
    - @solana/addresses@2.0.0-rc.0
    - @solana/instructions@2.0.0-rc.0
    - @solana/keys@2.0.0-rc.0
    - @solana/rpc-types@2.0.0-rc.0
    - @solana/rpc-parsed-types@2.0.0-rc.0
    - @solana/codecs@2.0.0-rc.0
    - @solana/functional@2.0.0-rc.0

## 2.0.0-preview.4

### Major Changes

- This version of the `@solana/web3.js` Technology Preview fixes a bug with the default RPC transport, adds a utility that you can use to get an estimate of a transaction message's compute unit cost, and introduces `@solana/react` hooks for interacting with Wallet Standard wallets.

    To install the fourth Technology Preview:

    ```shell
    npm install --save @solana/web3.js@tp4
    ```

    For an example of how to use the new `@solana/react` package to interact with wallets in a React application, see the example application in [`examples/react-app`](https://github.com/solana-labs/solana-web3.js/tree/master/examples/react-app#readme). We hope to see similar wallet-connection packages patterned off `@solana/react` for other application frameworks soon.

    Try a demo of Technology Preview 4 in your browser at [CodeSandbox](https://codesandbox.io/p/sandbox/solana-javascript-sdk-technology-preview-4-h8cz4v?file=%2Fsrc%2Findex.ts%3A21%2C8).
    - [#2858](https://github.com/solana-labs/solana-web3.js/pull/2858) [`22a34aa`](https://github.com/solana-labs/solana-web3.js/commit/22a34aa08d1be7e9b43ccfea94a99eaa2694e491) Thanks [@steveluscher](https://github.com/steveluscher)! - Transaction signers' methods now take `minContextSlot` as an option. This is important for signers that simulate transactions, like wallets. They might be interested in knowing the slot at which the transaction was prepared, lest they run simulation at too early a slot.
    - [#2852](https://github.com/solana-labs/solana-web3.js/pull/2852) [`cec9048`](https://github.com/solana-labs/solana-web3.js/commit/cec9048b2f83535df7e499db5488c336981dfb5a) Thanks [@lorisleiva](https://github.com/lorisleiva)! - The `signAndSendTransactionMessageWithSigners` function now automatically asserts that the provided transaction message contains a single sending signer and fails otherwise.
    - [#2707](https://github.com/solana-labs/solana-web3.js/pull/2707) [`cb49bfa`](https://github.com/solana-labs/solana-web3.js/commit/cb49bfa28f412376a41e758eeda59e7e90983147) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Allow creating keypairs and keys from ReadonlyUint8Array
    - [#2715](https://github.com/solana-labs/solana-web3.js/pull/2715) [`26dae19`](https://github.com/solana-labs/solana-web3.js/commit/26dae190c2ec835fbdaa7b7d66ca33d6ba0727b8) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Consolidated `getNullableCodec` and `getOptionCodec` with their `Zeroable` counterparts and added more configurations

        Namely, the `prefix` option can now be set to `null` and the `fixed` option was replaced with the `noneValue` option which can be set to `"zeroes"` for `Zeroable` codecs or a custom byte array for custom representations of none values. This means the `getZeroableNullableCodec` and `getZeroableOptionCodec` functions were removed in favor of the new options.

        ```ts
        // Before.
        getZeroableNullableCodec(getU16Codec());

        // After.
        getNullableCodec(getU16Codec(), { noneValue: 'zeroes', prefix: null });
        ```

        Additionally, it is now possible to create nullable codecs that have no `prefix` nor `noneValue`. In this case, the existence of the nullable item is indicated by the presence of any remaining bytes left to decode.

        ```ts
        const codec = getNullableCodec(getU16Codec(), { prefix: null });
        codec.encode(42); // 0x2a00
        codec.encode(null); // Encodes nothing.
        codec.decode(new Uint8Array([42, 0])); // 42
        codec.decode(new Uint8Array([])); // null
        ```

        Also note that it is now possible for custom `noneValue` byte arrays to be of any length — previously, it had to match the fixed-size of the nullable item.

        Here is a recap of all supported scenarios, using a `u16` codec as an example:

        | `encode(42)` / `encode(null)` | No `noneValue` (default) | `noneValue: "zeroes"`       | Custom `noneValue` (`0xff`) |
        | ----------------------------- | ------------------------ | --------------------------- | --------------------------- |
        | `u8` prefix (default)         | `0x012a00` / `0x00`      | `0x012a00` / `0x000000`     | `0x012a00` / `0x00ff`       |
        | Custom `prefix` (`u16`)       | `0x01002a00` / `0x0000`  | `0x01002a00` / `0x00000000` | `0x01002a00` / `0x0000ff`   |
        | No `prefix`                   | `0x2a00` / `0x`          | `0x2a00` / `0x0000`         | `0x2a00` / `0xff`           |

        Reciprocal changes were made with `getOptionCodec`.

    - [#2785](https://github.com/solana-labs/solana-web3.js/pull/2785) [`4f19842`](https://github.com/solana-labs/solana-web3.js/commit/4f198423997d28d927f982333d268e19940656df) Thanks [@steveluscher](https://github.com/steveluscher)! - The development mode error message printer no longer fatals on Safari &lt; 16.4.
    - [#2867](https://github.com/solana-labs/solana-web3.js/pull/2867) [`be36bab`](https://github.com/solana-labs/solana-web3.js/commit/be36babd752b1c987a2f53b4ff83ac8c045a3418) Thanks [@steveluscher](https://github.com/steveluscher)! - The `innerInstructions` property of JSON-RPC errors used snake case rather than camelCase for `stackHeight` and `programId`. This has been corrected.
    - [#2728](https://github.com/solana-labs/solana-web3.js/pull/2728) [`f1e9ac2`](https://github.com/solana-labs/solana-web3.js/commit/f1e9ac2af579e4fbfb5550cbdbd971a87a4e4432) Thanks [@joncinque](https://github.com/joncinque)! - Simulate with the maximum quantity of compute units (1.4M) instead of `u32::MAX`
    - [#2703](https://github.com/solana-labs/solana-web3.js/pull/2703) [`0908628`](https://github.com/solana-labs/solana-web3.js/commit/09086289a230aa1b780c1035408b48243ab960f2) Thanks [@steveluscher](https://github.com/steveluscher)! - Created a utility function to estimate the compute unit consumption of a transaction message
    - [#2795](https://github.com/solana-labs/solana-web3.js/pull/2795) [`ce876d9`](https://github.com/solana-labs/solana-web3.js/commit/ce876d99f04d539292abd810acd77a319c52f50d) Thanks [@steveluscher](https://github.com/steveluscher)! - Added React hooks to which you can pass a Wallet Standard `UiWalletAccount` and obtain a `MessageModifyingSigner`, `TransactionModifyingSigner`, or `TransactionSendingSigner` for use in constructing, signing, and sending Solana transactions and messages
    - [#2772](https://github.com/solana-labs/solana-web3.js/pull/2772) [`8fe4551`](https://github.com/solana-labs/solana-web3.js/commit/8fe4551217a3ad8bfdcd1609ac7b23e8fd044c72) Thanks [@steveluscher](https://github.com/steveluscher)! - Added a series of React hooks to which you can pass a Wallet Standard `UiWalletAccount` to extract its `signMessage`, `signTransaction`, and `signAndSendTransaction` features
    - [#2819](https://github.com/solana-labs/solana-web3.js/pull/2819) [`7ee47ae`](https://github.com/solana-labs/solana-web3.js/commit/7ee47ae24ad73b429ee863342f300a6f6c49e3d2) Thanks [@steveluscher](https://github.com/steveluscher)! - Fixed a bug where coalesced RPC calls could end up aborted even though there were still interested consumers. This would happen if the consumer count fell to zero, then rose above zero again, in the same runloop.
    - [#2868](https://github.com/solana-labs/solana-web3.js/pull/2868) [`91fb1f3`](https://github.com/solana-labs/solana-web3.js/commit/91fb1f39bb174cf1e899a21365153a7b3bbf3571) Thanks [@steveluscher](https://github.com/steveluscher)! - The `simulateTransaction` RPC method now accepts an `innerInstructions` param. When `true`, the simulation result will include an array of inner instructions, if any.
    - [#2866](https://github.com/solana-labs/solana-web3.js/pull/2866) [`73bd5a9`](https://github.com/solana-labs/solana-web3.js/commit/73bd5a9e0b32846cd5d76f2d2d1b21661eab0677) Thanks [@steveluscher](https://github.com/steveluscher)! - The `TransactionInstruction` RPC type now has `stackHeight`
    - [#2751](https://github.com/solana-labs/solana-web3.js/pull/2751) [`6340744`](https://github.com/solana-labs/solana-web3.js/commit/6340744e5cf0ea91ae677f381d5a187638a19597) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Allow Rpc Request params to be any type, instead of requiring an array

### Patch Changes

- [#2728](https://github.com/solana-labs/solana-web3.js/pull/2728) [`f1e9ac2`](https://github.com/solana-labs/solana-web3.js/commit/f1e9ac2af579e4fbfb5550cbdbd971a87a4e4432) Thanks [@joncinque](https://github.com/joncinque)! - Simulate with the maximum quantity of compute units (1.4M) instead of `u32::MAX`

- [#2606](https://github.com/solana-labs/solana-web3.js/pull/2606) [`367b8ad`](https://github.com/solana-labs/solana-web3.js/commit/367b8ad0cce55a916abfb0125f36b6e844333b2b) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Use commonjs package type

- [#2703](https://github.com/solana-labs/solana-web3.js/pull/2703) [`0908628`](https://github.com/solana-labs/solana-web3.js/commit/09086289a230aa1b780c1035408b48243ab960f2) Thanks [@steveluscher](https://github.com/steveluscher)! - Created a utility function to estimate the compute unit consumption of a transaction message

- Updated dependencies [[`7ee47ae`](https://github.com/solana-labs/solana-web3.js/commit/7ee47ae24ad73b429ee863342f300a6f6c49e3d2), [`26dae19`](https://github.com/solana-labs/solana-web3.js/commit/26dae190c2ec835fbdaa7b7d66ca33d6ba0727b8), [`4f19842`](https://github.com/solana-labs/solana-web3.js/commit/4f198423997d28d927f982333d268e19940656df), [`73bd5a9`](https://github.com/solana-labs/solana-web3.js/commit/73bd5a9e0b32846cd5d76f2d2d1b21661eab0677), [`cec9048`](https://github.com/solana-labs/solana-web3.js/commit/cec9048b2f83535df7e499db5488c336981dfb5a), [`be36bab`](https://github.com/solana-labs/solana-web3.js/commit/be36babd752b1c987a2f53b4ff83ac8c045a3418), [`cb49bfa`](https://github.com/solana-labs/solana-web3.js/commit/cb49bfa28f412376a41e758eeda59e7e90983147), [`3d90241`](https://github.com/solana-labs/solana-web3.js/commit/3d902419c1b232fa7145757b9c95976de69790c7), [`367b8ad`](https://github.com/solana-labs/solana-web3.js/commit/367b8ad0cce55a916abfb0125f36b6e844333b2b), [`22a34aa`](https://github.com/solana-labs/solana-web3.js/commit/22a34aa08d1be7e9b43ccfea94a99eaa2694e491)]:
    - @solana/rpc@2.0.0-preview.4
    - @solana/codecs@2.0.0-preview.4
    - @solana/errors@2.0.0-preview.4
    - @solana/rpc-types@2.0.0-preview.4
    - @solana/signers@2.0.0-preview.4
    - @solana/keys@2.0.0-preview.4
    - @solana/transaction-messages@2.0.0-preview.4
    - @solana/transaction-confirmation@2.0.0-preview.4
    - @solana/rpc-subscriptions@2.0.0-preview.4
    - @solana/rpc-parsed-types@2.0.0-preview.4
    - @solana/instructions@2.0.0-preview.4
    - @solana/transactions@2.0.0-preview.4
    - @solana/functional@2.0.0-preview.4
    - @solana/addresses@2.0.0-preview.4
    - @solana/accounts@2.0.0-preview.4
    - @solana/programs@2.0.0-preview.4
    - @solana/sysvars@2.0.0-preview.4

## 2.0.0-preview.3

### Patch Changes

- [#2504](https://github.com/solana-labs/solana-web3.js/pull/2504) [`18d6b56`](https://github.com/solana-labs/solana-web3.js/commit/18d6b56a69509e4c98de8f3de51abe2623b46763) Thanks [@steveluscher](https://github.com/steveluscher)! - Replaced `fast-stable-stringify` with our fork

- Updated dependencies [[`9370133`](https://github.com/solana-labs/solana-web3.js/commit/9370133e414bfa863517248d97905449e9a867eb), [`31916ae`](https://github.com/solana-labs/solana-web3.js/commit/31916ae5d4fb29f239c63252a59745e33a6979ea), [`89f399d`](https://github.com/solana-labs/solana-web3.js/commit/89f399d474abac463b1daaa864c88305d7b8c21f), [`ebb03cd`](https://github.com/solana-labs/solana-web3.js/commit/ebb03cd8270027db957d4cecc7d2374d468d4ccb), [`002cc38`](https://github.com/solana-labs/solana-web3.js/commit/002cc38a99cd4c91c7ce9023e1b4fb28f7e10832), [`2040f96`](https://github.com/solana-labs/solana-web3.js/commit/2040f96cc22e4195749577d265cd6a76d8a08b87), [`ce1be3f`](https://github.com/solana-labs/solana-web3.js/commit/ce1be3fe37ea9b744fd836f3d6c2c8e5e31efd77), [`1672346`](https://github.com/solana-labs/solana-web3.js/commit/1672346246fe9444b018d726ab7bfcd4bb092ec2), [`82cf07f`](https://github.com/solana-labs/solana-web3.js/commit/82cf07f4e905f6b056e70a0463a94222c3e7cadd), [`2d54650`](https://github.com/solana-labs/solana-web3.js/commit/2d5465018d8060eceb00efbf4f718df26d145199), [`bef9604`](https://github.com/solana-labs/solana-web3.js/commit/bef960435eb2303395bfa76e44f84d3348c5722d), [`af9fa3b`](https://github.com/solana-labs/solana-web3.js/commit/af9fa3b7e83220d69eab67b37d3a36beac0e848c), [`7e86583`](https://github.com/solana-labs/solana-web3.js/commit/7e86583da68695076ec62033f3fe078b3890f026), [`0b02de1`](https://github.com/solana-labs/solana-web3.js/commit/0b02de140887654f19f8eda374f40c6f5a8f5e92), [`2e5af9f`](https://github.com/solana-labs/solana-web3.js/commit/2e5af9f1a9410f15108863342b48225fdf9a0c83), [`e3e82d9`](https://github.com/solana-labs/solana-web3.js/commit/e3e82d909825e958ae234ed18500335a621773bd), [`54d68c4`](https://github.com/solana-labs/solana-web3.js/commit/54d68c482feebf4e62a9896b3badd77dab615941), [`18d6b56`](https://github.com/solana-labs/solana-web3.js/commit/18d6b56a69509e4c98de8f3de51abe2623b46763), [`288029a`](https://github.com/solana-labs/solana-web3.js/commit/288029a55a5eeb863b6df960027a59214ffc37f1), [`4ae78f5`](https://github.com/solana-labs/solana-web3.js/commit/4ae78f5cdddd6772b25351beb813483d4e52cea6), [`478443f`](https://github.com/solana-labs/solana-web3.js/commit/478443fedac06678f12e8ac285aa7c7fcf503ee8), [`125fc15`](https://github.com/solana-labs/solana-web3.js/commit/125fc1540cfbc0a4afdba5aabac0884c750e58c1)]:
    - @solana/errors@2.0.0-preview.3
    - @solana/transactions@2.0.0-preview.3
    - @solana/addresses@2.0.0-preview.3
    - @solana/rpc-types@2.0.0-preview.3
    - @solana/programs@2.0.0-preview.3
    - @solana/codecs@2.0.0-preview.3
    - @solana/transaction-confirmation@2.0.0-preview.3
    - @solana/transaction-messages@2.0.0-preview.3
    - @solana/rpc-subscriptions@2.0.0-preview.3
    - @solana/rpc@2.0.0-preview.3
    - @solana/keys@2.0.0-preview.3
    - @solana/accounts@2.0.0-preview.3
    - @solana/instructions@2.0.0-preview.3
    - @solana/signers@2.0.0-preview.3
    - @solana/rpc-parsed-types@2.0.0-preview.3
    - @solana/functional@2.0.0-preview.3

## 2.0.0-preview.2

### Patch Changes

- The first Technology Preview of `@solana/web3.js` 2.0 was [released at the Breakpoint conference](https://www.youtube.com/watch?v=JUJtAPhES5g) in November 2023. Based on your feedback, we want to get a second version of it into your hands now with some changes, bug fixes, and new features.

    To install the second Technology Preview:

    ```shell
    npm install --save @solana/web3.js@tp2
    ```

    Most notably, this release integrates with the new JavaScript client generator for on-chain programs. Instruction creators and account decoders can now be autogenerated for any program, including your own! Read more [here](https://github.com/solana-program/create-solana-program), and check out the growing list of autogenerated core programs [here](https://www.npmjs.com/search?q=%40solana-program).

    Try a demo of Technology Preview 2 in your browser at https://sola.na/web3tp2demo.
    - Renamed `Base58EncodedAddress` to `Address` (#1814) [63683a4bc](https://github.com/solana-labs/solana-web3.js/commit/63683a4bc)
    - Renamed `Ed25519Signature` and `TransactionSignature` to `SignatureBytes` and `Signature` (#1815) [205c09268](https://github.com/solana-labs/solana-web3.js/commit/205c09268)
    - Fixed return type of `getSignaturesForAddress` (#1821) [36c7263bd](https://github.com/solana-labs/solana-web3.js/commit/36c7263bd)
    - `signTransaction` now asserts that the transaction is fully signed; added `partiallySignTransaction` that does not (#1820) [7d54c2dad](https://github.com/solana-labs/solana-web3.js/commit/7d54c2dad)
    - The `@solana/webcrypto-ed25519-polyfill` now sets the `crypto` global in Node [17a54d24a](https://github.com/solana-labs/solana-web3.js/commit/17a54d24a)
    - Added `assertIsBlockhashLifetimeTransaction` that asserts transaction has a blockhash lifetime (#1908) [ae94ca38d](https://github.com/solana-labs/solana-web3.js/commit/ae94ca38d)
    - Added a `createPrivateKeyFromBytes` helper (#1913) [85b7dfe13](https://github.com/solana-labs/solana-web3.js/commit/85b7dfe13)
    - Added `@solana/accounts`; types and helper methods for representing, fetching and decoding Solana accounts (#1855) [e1ca3966e](https://github.com/solana-labs/solana-web3.js/commit/e1ca3966e)
    - Export the TransactionError type (#1964) [4c009bf5b](https://github.com/solana-labs/solana-web3.js/commit/4c009bf5b)
    - Export all RPC method XApi types from `@solana/rpc-core` (#1965) [ed98b3d9c](https://github.com/solana-labs/solana-web3.js/commit/ed98b3d9c)
    - Added a generic `createJsonRpcApi` function for custom APIs [1e2106f21](https://github.com/solana-labs/solana-web3.js/commit/1e2106f21)
    - Added a generic `createJsonRpcSubscriptionsApi` function for custom APIs [ae3f1f087](https://github.com/solana-labs/solana-web3.js/commit/ae3f1f087)
    - RPC commitment now defaults to `confirmed` when not explicitly specified [cb7702ca5](https://github.com/solana-labs/solana-web3.js/commit/cb7702ca5)
    - Added `ClusterUrl` types and handlers (#2084) [61f7ba0](https://github.com/solana-labs/solana-web3.js/commit/61f7ba0)
    - RPC transports can now be cluster-specific, ie. `RpcDevnet<TRpcMethods>` & `RpcSubscriptionsDevnet<TRpcMethods>` (#2053) [e58bb22](https://github.com/solana-labs/solana-web3.js/commit/e58bb22), (#2056) [cbf8f38](https://github.com/solana-labs/solana-web3.js/commit/cbf8f38)
    - RPC APIs can now be cluster-specific, ie. `SolanaRpcMethodsDevnet` (#2054) [5175d8a](https://github.com/solana-labs/solana-web3.js/commit/5175d8a)
    - Added cluster-level RPC support for `@solana/web3.js` (#2055) [5a6335d](https://github.com/solana-labs/solana-web3.js/commit/5a6335d), (#2058) [0e03ca9](https://github.com/solana-labs/solana-web3.js/commit/0e03ca9)
    - Added `@solana/signers`; an abstraction layer over signing messages and transactions in Solana (#1710) [7c29a1e](https://github.com/solana-labs/solana-web3.js/commit/7c29a1e)
    - Updated codec such that only one instance of `Uint8Array` is created when encoding data. This allows `Encoders` to set data at different offsets and therefore enables non-linear serialization (#1865) [7800e3b](https://github.com/solana-labs/solana-web3.js/commit/7800e3b)
    - Added `FixedSize*` and `VariableSize*` type variants for `Codecs`, `Encoders` and `Decoders` (#1883) [5e58d5c](https://github.com/solana-labs/solana-web3.js/commit/5e58d5c)
    - Repaired some inaccurate RPC method signatures (#2137) [bb65ba9](https://github.com/solana-labs/solana-web3.js/commit/bb65ba9)
    - Renamed transaction/airdrop sender factories with the ‘Factory’ suffix (#2130) [2d1d49c](https://github.com/solana-labs/solana-web3.js/commit/2d1d49c5467e5cb13871067c3dc0f9c87f007b9f)
    - All code now throws coded exceptions defined in `@solana/errors` which can be refined using `isSolanaError()` and decoded in production using `npx @solana/errors decode` (#2160) [3524f2c](https://github.com/solana-labs/solana-web3.js/commit/3524f2c583dbc663cf6dcb73a01b0beed6cfd136), (#2161) [94944b](https://github.com/solana-labs/solana-web3.js/commit/94944b65b9d957ca95653d66dc1f4805f1a36740), (#2213) [8541c2e](https://github.com/solana-labs/solana-web3.js/commit/8541c2ef860535514fa39c4b9a6a75276417ffaa), (#2220) [c9b2705](https://github.com/solana-labs/solana-web3.js/commit/c9b2705318724bbccb05efdb1ddc088dd82921b2), (#2207) [75a18e3](https://github.com/solana-labs/solana-web3.js/commit/75a18e30524078ea1e8c07133fd6c75fad357db3), (#2224) [613053d](https://github.com/solana-labs/solana-web3.js/commit/613053deab85e5a8703e241ab138ec51cc54885a), (#2226) [94fee67](https://github.com/solana-labs/solana-web3.js/commit/94fee67560faae1f41aeddb2e7c3d0d9078ab851), (#2228) [483c674](https://github.com/solana-labs/solana-web3.js/commit/483c674a8b19f146c7dba5f1eb64182f01fdcdc4), (#2235) [803b2d8](https://github.com/solana-labs/solana-web3.js/commit/803b2d88e9e39cecf18f03b2130507dea7230423), (#2236) [cf9c20c](https://github.com/solana-labs/solana-web3.js/commit/cf9c20ceed7186f5af704ee646344c42d4ec0084), (#2242) [9084fdd](https://github.com/solana-labs/solana-web3.js/commit/9084fddec79eebb9c00c70738e43b4bfb01bf352), (#2245) [e374ac6](https://github.com/solana-labs/solana-web3.js/commit/e374ac67ad48a121470d125a1d08485b8b529b2b), (#2186) [546263e](https://github.com/solana-labs/solana-web3.js/commit/546263e251c8a7b08949b01d0d51fa2398dc7fff), (#2187) [bea19d2](https://github.com/solana-labs/solana-web3.js/commit/bea19d209ea6b02351c21a878200f87da1e9b4be), (#2188) [2e0ae95](https://github.com/solana-labs/solana-web3.js/commit/2e0ae95ffc2738ae047249c7f64c46a95e9573d1), (#2189) [7712fc3](https://github.com/solana-labs/solana-web3.js/commit/7712fc32ef33bfe7f235d85d3ba2308ba6884143), (#2190) [7d67615](https://github.com/solana-labs/solana-web3.js/commit/7d67615ac1ae771810dfc544ecc17d664a0fc11d), (#2191) [0ba8f21](https://github.com/solana-labs/solana-web3.js/commit/0ba8f216d962d61e0f653404c4a9289e59712cc2), (#2192) [91a360d](https://github.com/solana-labs/solana-web3.js/commit/91a360daf5c66ac0f1bae7347298f25ae89329b2), (#2202) [a71a2db](https://github.com/solana-labs/solana-web3.js/commit/a71a2db4c35136c8650b56985bbd33c5413e1bbd), (#2286) [52a5d3d](https://github.com/solana-labs/solana-web3.js/commit/52a5d3db60e702ccf77b4d17b8a3fd388e6e8584), and more
    - You can now supply a custom Undici dispatcher for use with the `fetch` API when creating an RPC transport in Node (#2178) [a2fc5a3](https://github.com/solana-labs/solana-web3.js/commit/a2fc5a3fda252cccc6ee62f2f7163d1578a20113)
    - Added functions to assert a value is an `IInstructionWithAccounts` and IInstructionWithData` (#2212) [07c30c1](https://github.com/solana-labs/solana-web3.js/commit/07c30c14c7d5efd6121290db62fa40371f108778)
    - Added a function to assert an instruction is for a given program (#2234) [fb655dd](https://github.com/solana-labs/solana-web3.js/commit/fb655ddd217e4c4f55c5c8a81a08177e20ef5431)
    - You can now create an RPC using only a URL (#2238) [cd0b6c6](https://github.com/solana-labs/solana-web3.js/commit/cd0b6c616ded7d1fdee33e33d3e44ce9bce48cef), (#2239) [fc11993](https://github.com/solana-labs/solana-web3.js/commit/fc119937ade7e46f487c99f254ff5a874e524c2c)
    - You can now resize codec with the `resizeCodec` helper (#2293) [606de63](https://github.com/solana-labs/solana-web3.js/commit/606de638e21eebd0535806dee445e6d046cfb074)
    - You can now skip bytes while writing byte buffers using the `offsetCodec` helper (#2294) [09d8cc8](https://github.com/solana-labs/solana-web3.js/commit/09d8cc815d133d70da0db93c9a0c0092e0d9a929)
    - You can now now pad the beginning or end of byte buffers using the `padLeftCodec` and `padRightCodec` helpers (#2314) [f9509c7](https://github.com/solana-labs/solana-web3.js/commit/f9509c77dd6ec92357edbbe18acbb76c5a33e4b2)
    - Added a new `@solana/sysvars` package for fetching, decoding, and building transactions with sysvar accounts (#2041)

- Updated dependencies [[`0546a8c`](https://github.com/solana-labs/solana-web3.js/commit/0546a8ce95b6852324d58bb32ac31480506193a7)]:
    - @solana/accounts@2.0.0-preview.2
    - @solana/addresses@2.0.0-preview.2
    - @solana/codecs@2.0.0-preview.2
    - @solana/errors@2.0.0-preview.2
    - @solana/functional@2.0.0-preview.2
    - @solana/instructions@2.0.0-preview.2
    - @solana/keys@2.0.0-preview.2
    - @solana/programs@2.0.0-preview.2
    - @solana/rpc@2.0.0-preview.2
    - @solana/rpc-parsed-types@2.0.0-preview.2
    - @solana/rpc-subscriptions@2.0.0-preview.2
    - @solana/rpc-types@2.0.0-preview.2
    - @solana/signers@2.0.0-preview.2
    - @solana/transaction-confirmation@2.0.0-preview.2
    - @solana/transactions@2.0.0-preview.2
