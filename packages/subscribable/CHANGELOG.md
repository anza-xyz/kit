# @solana/subscribable

## 8.0.0

### Minor Changes

- [#1811](https://github.com/anza-xyz/kit/pull/1811) [`7022c26`](https://github.com/anza-xyz/kit/commit/7022c262ba75bdd243c148c4f0759c2546159b6f) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Add `bridgeStoreToAsyncIterable` to `@solana/subscribable`

    `bridgeStoreToAsyncIterable` adapts a `ReactiveStreamStore` into the pull-based `AsyncIterable` contract that consumers like TanStack Query's `experimental_streamedQuery` expect. It is now a public export of `@solana/subscribable` (and re-exported from `@solana/kit`). It was previously an internal helper of `@solana/react`, but it is not React- or TanStack-specific and is useful to any consumer that needs to drive a stream store by `for await`-ing it.

    The bridge only observes the store — consistent with the rest of the ecosystem, the caller owns the store's lifecycle (`connect()` it yourself, bound to the same signal, and `reset()` it when done). The bridge subscribes, seeds from the store's current snapshot, yields values, and unsubscribes when iteration ends.

    It throws the new `SOLANA_ERROR__SUBSCRIBABLE__STREAM_CLOSED_WITHOUT_ERROR` when a store closes in an error state with a nullish payload. This is the error `useSubscriptionQuery` and `useTrackedDataQuery` now surface in that case; the SWR bridge is unaffected.

### Patch Changes

- Updated dependencies [[`7022c26`](https://github.com/anza-xyz/kit/commit/7022c262ba75bdd243c148c4f0759c2546159b6f)]:
    - @solana/errors@8.0.0
    - @solana/promises@8.0.0

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

- [#1614](https://github.com/anza-xyz/kit/pull/1614) [`3de3dda`](https://github.com/anza-xyz/kit/commit/3de3dda437c18be882cd6378bebda7a82a54e5b0) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Add `store.withSignal(signal)` on `ReactiveActionStore` for attaching a caller-provided `AbortSignal` to a dispatch. The method returns a thin wrapper exposing only `dispatch` / `dispatchAsync`; the supplied signal is composed with the store's internal per-dispatch controller via `AbortSignal.any`, so aborting either cancels the in-flight call and surfaces the abort reason on state. The bare `dispatch` / `dispatchAsync` signatures are unchanged — this is additive.

    Two common patterns the wrapper enables:
    - **Per-attempt timeout.** `store.withSignal(AbortSignal.timeout(5_000)).dispatch(args)` — a fresh clock per call. Different call sites can pass different timeouts.
    - **Shared kill switch.** Hold one `AbortController`, bind the wrapper once (`const killable = store.withSignal(killCtrl.signal)`), and use `killable.dispatch(...)` everywhere. Aborting the controller cancels the current call and makes future calls on the wrapper start aborted.

- [#1624](https://github.com/anza-xyz/kit/pull/1624) [`1c8d215`](https://github.com/anza-xyz/kit/commit/1c8d215afaa795f981999a5d8c6f21e9effb1db6) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Preserve the last `error` on a `ReactiveActionStore` through subsequent `running` states, matching the existing stale-while-revalidate behavior for `data`. A re-dispatch after a failure now keeps the previous error visible until the new attempt resolves, mirroring how SWR and TanStack Query handle revalidation. `success` clears the error; `reset()` clears both. This also affects `useAction`, whose `error` field now persists through a new `dispatch()` until the new call resolves.

### Patch Changes

- Updated dependencies [[`3014977`](https://github.com/anza-xyz/kit/commit/30149771475d45b6cfff1c4aacd16c8f7256e256), [`772b82c`](https://github.com/anza-xyz/kit/commit/772b82c4f18c418100560a5010b17e6b40dd7ab3), [`e193711`](https://github.com/anza-xyz/kit/commit/e1937110a3eb300e184b10732f82ccfefe9c2a3f), [`069d56d`](https://github.com/anza-xyz/kit/commit/069d56d69226f755412b282c22818cbc90f2db4f)]:
    - @solana/errors@7.0.0
    - @solana/promises@7.0.0

## 6.10.0

### Minor Changes

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

- [#1554](https://github.com/anza-xyz/kit/pull/1554) [`47a785b`](https://github.com/anza-xyz/kit/commit/47a785bdb47f89443cccb69151650974d0f57f65) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Rename `ReactiveStore<T>` to `ReactiveStreamStore<T>`. The old name remains exported as a deprecated alias and will be removed in a future major release.

- [#1550](https://github.com/anza-xyz/kit/pull/1550) [`82a1ac5`](https://github.com/anza-xyz/kit/commit/82a1ac56131ebc2ad43f948feb862172418f8b3d) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Added `createReactiveActionStore` — a framework-agnostic state machine that wraps an async function and exposes a `{ dispatch, dispatchAsync, getState, subscribe, reset }` contract compatible with `useSyncExternalStore`, Svelte stores, Vue's `shallowRef`, and similar reactive primitives. `dispatch` is synchronous and fire-and-forget (safe from UI event handlers); `dispatchAsync` returns a promise that resolves to the wrapped function's result and rejects on failure or supersede — use `isAbortError` from `@solana/promises` to filter aborts. Each call creates a fresh `AbortController` and aborts the previous one, so rapid successive dispatches only produce one final state transition — the outcome of the most recent call.

### Patch Changes

- Updated dependencies [[`c318d7f`](https://github.com/anza-xyz/kit/commit/c318d7f2e16fec92859503af41102792be01cece), [`460557b`](https://github.com/anza-xyz/kit/commit/460557b9f706f22aa384cb175deeb45c30081166), [`40e0848`](https://github.com/anza-xyz/kit/commit/40e084878ca49f37f38065c8b2f64f1b62454f36), [`47a785b`](https://github.com/anza-xyz/kit/commit/47a785bdb47f89443cccb69151650974d0f57f65), [`6b499ee`](https://github.com/anza-xyz/kit/commit/6b499ee38a3f695951a8505f23964839fd308b3d), [`74b8d3d`](https://github.com/anza-xyz/kit/commit/74b8d3d5166b4857ab722eae0ec5e2843e480a4b)]:
    - @solana/errors@6.10.0
    - @solana/promises@6.10.0

## 6.9.0

### Minor Changes

- [#1562](https://github.com/anza-xyz/kit/pull/1562) [`096c48e`](https://github.com/anza-xyz/kit/commit/096c48e6771ad7ea833cb4ca51206b7cc827a3d7) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Bump the TypeScript peer dependency floor from `>=5.0.0` to `>=5.4.0`.

### Patch Changes

- Updated dependencies [[`92126f4`](https://github.com/anza-xyz/kit/commit/92126f438afff8b7521f827cf0e92b1d2cd69c55), [`a5ef97b`](https://github.com/anza-xyz/kit/commit/a5ef97b17fe747de1e2bee0189ed44e20c0f6c40), [`e82e03e`](https://github.com/anza-xyz/kit/commit/e82e03eb0e982db74f96d11b9aa8fefb4f0038c3), [`096c48e`](https://github.com/anza-xyz/kit/commit/096c48e6771ad7ea833cb4ca51206b7cc827a3d7)]:
    - @solana/errors@6.9.0

## 6.8.0

### Minor Changes

- [#1524](https://github.com/anza-xyz/kit/pull/1524) [`f53ce07`](https://github.com/anza-xyz/kit/commit/f53ce0796c782e79490e1cf11a55e28fb62b8c8f) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Add `ReactiveStore` type and `createReactiveStoreFromDataPublisher()` to `@solana/subscribable`, and a `reactive()` method to pending subscriptions in `@solana/rpc-subscriptions-spec` that returns a reactive store compatible with `useSyncExternalStore`, Svelte stores, and other reactive primitives.

### Patch Changes

- [#1532](https://github.com/anza-xyz/kit/pull/1532) [`667a0f0`](https://github.com/anza-xyz/kit/commit/667a0f059f5432244ab2cf8a23a22f53c7a36b4b) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Update the TypeScript peer dependency from `^5.0.0` to `>=5.0.0` to allow TypeScript 6 and above.

- Updated dependencies [[`667a0f0`](https://github.com/anza-xyz/kit/commit/667a0f059f5432244ab2cf8a23a22f53c7a36b4b), [`43bc570`](https://github.com/anza-xyz/kit/commit/43bc570a5b51a9fda75abc1f0f818728ca3cd439), [`ffb7665`](https://github.com/anza-xyz/kit/commit/ffb76652f6b887eb5020c3584f1d827a1098dccc)]:
    - @solana/errors@6.8.0

## 6.7.0

### Patch Changes

- Updated dependencies []:
    - @solana/errors@6.7.0

## 6.6.0

### Patch Changes

- Updated dependencies [[`7f02d23`](https://github.com/anza-xyz/kit/commit/7f02d23948cc09e3f0bc70931d845569f1cb38ad)]:
    - @solana/errors@6.6.0

## 6.5.0

### Patch Changes

- Updated dependencies []:
    - @solana/errors@6.5.0

## 6.4.0

### Patch Changes

- Updated dependencies []:
    - @solana/errors@6.4.0

## 6.3.1

### Patch Changes

- Updated dependencies []:
    - @solana/errors@6.3.1

## 6.3.0

### Patch Changes

- Updated dependencies [[`f47d5cf`](https://github.com/anza-xyz/kit/commit/f47d5cf30512bbae3233f0ddccae45462af7f309)]:
    - @solana/errors@6.3.0

## 6.2.0

### Patch Changes

- Updated dependencies [[`0d0be3e`](https://github.com/anza-xyz/kit/commit/0d0be3e18bfbb053b92c4b2d338c5bb0ed414bcc), [`7568a12`](https://github.com/anza-xyz/kit/commit/7568a127e1d1197d2362be464117bc41c82b01ad), [`e33a65f`](https://github.com/anza-xyz/kit/commit/e33a65fd18d52bd2d7a0018ff9a152ff6f43a3b3), [`49c1195`](https://github.com/anza-xyz/kit/commit/49c1195637a8d550b864918e96d9f9681f658bfe)]:
    - @solana/errors@6.2.0

## 6.1.0

### Patch Changes

- Updated dependencies [[`3f711e1`](https://github.com/anza-xyz/kit/commit/3f711e16bc38657d5d1ff71cf98e73897ff19ea5), [`215027c`](https://github.com/anza-xyz/kit/commit/215027c49845bd5cbd86d3da396f0c3895283d75)]:
    - @solana/errors@6.1.0

## 6.0.1

### Patch Changes

- Updated dependencies []:
    - @solana/errors@6.0.1

## 6.0.0

### Patch Changes

- Updated dependencies []:
    - @solana/errors@6.0.0

## 5.5.1

### Patch Changes

- Updated dependencies [[`d957526`](https://github.com/anza-xyz/kit/commit/d9575263c3e563c6951cd35bbc6e65e70a0e6a10)]:
    - @solana/errors@5.5.1

## 5.5.0

### Patch Changes

- Updated dependencies [[`b4f5897`](https://github.com/anza-xyz/kit/commit/b4f5897cab50a92f50b6b390ae76d743173c26dd), [`08c9062`](https://github.com/anza-xyz/kit/commit/08c906299409e82a5941e1044fc6d47d633df784), [`ba3f186`](https://github.com/anza-xyz/kit/commit/ba3f1861a9cb53b4c0e7c6d1b92791d8983e001b), [`1cc0a31`](https://github.com/anza-xyz/kit/commit/1cc0a3163cf884a715aef5ba336adfd980dabfa6), [`6af7c15`](https://github.com/anza-xyz/kit/commit/6af7c156a9cd196d0d5ecb374fe696ec659756bf)]:
    - @solana/errors@5.5.0

## 5.4.0

### Patch Changes

- [#1187](https://github.com/anza-xyz/kit/pull/1187) [`f5f89eb`](https://github.com/anza-xyz/kit/commit/f5f89eb8e769d5b6056b2f686d51a7ef4a0d1d09) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Make Typescript peer dependency optional + reduce required version to ^5

- Updated dependencies [[`f5f89eb`](https://github.com/anza-xyz/kit/commit/f5f89eb8e769d5b6056b2f686d51a7ef4a0d1d09), [`189de37`](https://github.com/anza-xyz/kit/commit/189de37f76bcb273986d750fd6ed6541f711103b)]:
    - @solana/errors@5.4.0

## 5.3.0

### Patch Changes

- Updated dependencies []:
    - @solana/errors@5.3.0

## 5.2.0

### Patch Changes

- Updated dependencies [[`b80b092`](https://github.com/anza-xyz/kit/commit/b80b09239762262116cb70b43271ad98a2f716b5)]:
    - @solana/errors@5.2.0

## 5.1.0

### Patch Changes

- Updated dependencies [[`becf5f6`](https://github.com/anza-xyz/kit/commit/becf5f63f1b97d43109b2488c7cd0806ce6329f4), [`32214f5`](https://github.com/anza-xyz/kit/commit/32214f57cfb79fb2566e773acec71635bac641df)]:
    - @solana/errors@5.1.0

## 5.0.0

### Patch Changes

- Updated dependencies [[`0fed638`](https://github.com/anza-xyz/kit/commit/0fed6389886639a48b44a09e129ac1b264c44389)]:
    - @solana/errors@5.0.0

## 4.0.0

### Patch Changes

- Updated dependencies [[`5408f52`](https://github.com/anza-xyz/kit/commit/5408f524ae22293cb7b497310440019be5a98c55), [`cb11699`](https://github.com/anza-xyz/kit/commit/cb11699d77536e5901c62d32e43c671b044e4aa1), [`9fa8465`](https://github.com/anza-xyz/kit/commit/9fa8465bf0f264f5a9181c805a0d85cb1ecc2768), [`22f18d0`](https://github.com/anza-xyz/kit/commit/22f18d0ce8950b26eaa897b146bfe8c1a025b3bb), [`c87cada`](https://github.com/anza-xyz/kit/commit/c87cada3ddf0a8c5fa27ed7122b901b17392c2df)]:
    - @solana/errors@4.0.0

## 3.0.0

### Patch Changes

- Updated dependencies [[`6a183bf`](https://github.com/anza-xyz/kit/commit/6a183bf9e9d672e2d42f3aecc589a9e54d01cb1a), [`23d2fa1`](https://github.com/anza-xyz/kit/commit/23d2fa14cbd5197473eca94a1ac6c5abf221b052), [`9feba85`](https://github.com/anza-xyz/kit/commit/9feba8557b64dd3199cd88af2c17b7ccd5d18fec), [`01f159a`](https://github.com/anza-xyz/kit/commit/01f159a436d7a29479aa1a1877c9b4c77da1170f)]:
    - @solana/errors@3.0.0

## 2.3.0

### Patch Changes

- Updated dependencies [[`363e3cc`](https://github.com/anza-xyz/kit/commit/363e3cc45db77a731bab1435b925fe0ad0af01df), [`eeac21d`](https://github.com/anza-xyz/kit/commit/eeac21d5fe4d8fb3ed3addee87872679ee37b4c4), [`93609aa`](https://github.com/anza-xyz/kit/commit/93609aa31dbd83086d0debd41aa2f8e9a0809761), [`b7dfe03`](https://github.com/anza-xyz/kit/commit/b7dfe033a8e929d7a598d8bfea546e9ef4207639)]:
    - @solana/errors@2.3.0

## 2.2.1

### Patch Changes

- Updated dependencies []:
    - @solana/errors@2.2.1

## 2.2.0

### Patch Changes

- Updated dependencies []:
    - @solana/errors@2.2.0

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

- [#236](https://github.com/anza-xyz/kit/pull/236) [`ca1d4ec`](https://github.com/anza-xyz/kit/commit/ca1d4ec7ddd641ca813f79f8ca06d225f29419e2) Thanks [@steveluscher](https://github.com/steveluscher)! - The minimum TypeScript version is now 5.3.3

- Updated dependencies [[`36a9dee`](https://github.com/anza-xyz/kit/commit/36a9dee4e6cbd72020dc74777fe394130b9a5f46), [`ca1d4ec`](https://github.com/anza-xyz/kit/commit/ca1d4ec7ddd641ca813f79f8ca06d225f29419e2)]:
    - @solana/errors@2.1.1

## 2.1.0

### Patch Changes

- [`1adf435`](https://github.com/anza-xyz/kit/commit/1adf435cfc724303f64e509a6fda144ec8f5019d) Thanks [@leantOnSol](https://github.com/leantOnSol)! - A two-versions-old version of Node LTS is now specified everywhere via the `engines` field, including the one in the root of the `pnpm` workspace, and engine-strictness is delegated to the `.npmrc` files.

- [`29d1e28`](https://github.com/anza-xyz/kit/commit/29d1e282f7ae53db008515980f13d54c40760065) Thanks [@steveluscher](https://github.com/steveluscher)! - Disabled the `MaxListenersExceededWarning` in Node when creating event targets for internal use

- Updated dependencies [[`1adf435`](https://github.com/anza-xyz/kit/commit/1adf435cfc724303f64e509a6fda144ec8f5019d), [`c7b7dd9`](https://github.com/anza-xyz/kit/commit/c7b7dd99aca878d2450760c214dbea593ddbadc0), [`5af7f20`](https://github.com/anza-xyz/kit/commit/5af7f2013135a79893a0f190a905c6dd077ac38c), [`704d8a2`](https://github.com/anza-xyz/kit/commit/704d8a220592a5a472bd7726013814b50c991f5b)]:
    - @solana/errors@2.1.0

## 2.0.0

### Patch Changes

- [#3541](https://github.com/solana-labs/solana-web3.js/pull/3541) [`135dc5a`](https://github.com/solana-labs/solana-web3.js/commit/135dc5ad43f286380a4c3a689668016f0d7945f4) Thanks [@steveluscher](https://github.com/steveluscher)! - Drop the Release Candidate label and publish `@solana/web3.js` at version 2.0.0

- [#3301](https://github.com/solana-labs/solana-web3.js/pull/3301) [`8c2cb9f`](https://github.com/solana-labs/solana-web3.js/commit/8c2cb9f44a52b3c27bc15c2c972bea1aae1622e7) Thanks [@steveluscher](https://github.com/steveluscher)! - Creates a package for working with subscribable data sources like event targets. From an `EventTarget` or object which conforms to the `EventEmitter` interface you can now create a more ergonomic `DataPublisher` (object with an `on` method that vends an unsubscribe function) or an abortable `AsyncIterable`.

- Updated dependencies [[`9370133`](https://github.com/solana-labs/solana-web3.js/commit/9370133e414bfa863517248d97905449e9a867eb), [`89f399d`](https://github.com/solana-labs/solana-web3.js/commit/89f399d474abac463b1daaa864c88305d7b8c21f), [`ebb03cd`](https://github.com/solana-labs/solana-web3.js/commit/ebb03cd8270027db957d4cecc7d2374d468d4ccb), [`ce1be3f`](https://github.com/solana-labs/solana-web3.js/commit/ce1be3fe37ea9b744fd836f3d6c2c8e5e31efd77), [`82cf07f`](https://github.com/solana-labs/solana-web3.js/commit/82cf07f4e905f6b056e70a0463a94222c3e7cadd), [`2d54650`](https://github.com/solana-labs/solana-web3.js/commit/2d5465018d8060eceb00efbf4f718df26d145199), [`135dc5a`](https://github.com/solana-labs/solana-web3.js/commit/135dc5ad43f286380a4c3a689668016f0d7945f4), [`bef9604`](https://github.com/solana-labs/solana-web3.js/commit/bef960435eb2303395bfa76e44f84d3348c5722d), [`7e86583`](https://github.com/solana-labs/solana-web3.js/commit/7e86583da68695076ec62033f3fe078b3890f026), [`4f19842`](https://github.com/solana-labs/solana-web3.js/commit/4f198423997d28d927f982333d268e19940656df), [`677a9c4`](https://github.com/solana-labs/solana-web3.js/commit/677a9c4eb88a8ac6a9ede8d82f367c5ac8d69ff4), [`38faba0`](https://github.com/solana-labs/solana-web3.js/commit/38faba05fab479ddbd95d0e211744d203f8aa823), [`2798061`](https://github.com/solana-labs/solana-web3.js/commit/27980617e4f8d34dbc7b6da4507e4bca68a68090), [`be36bab`](https://github.com/solana-labs/solana-web3.js/commit/be36babd752b1c987a2f53b4ff83ac8c045a3418), [`288029a`](https://github.com/solana-labs/solana-web3.js/commit/288029a55a5eeb863b6df960027a59214ffc37f1), [`4ae78f5`](https://github.com/solana-labs/solana-web3.js/commit/4ae78f5cdddd6772b25351beb813483d4e52cea6), [`478443f`](https://github.com/solana-labs/solana-web3.js/commit/478443fedac06678f12e8ac285aa7c7fcf503ee8), [`367b8ad`](https://github.com/solana-labs/solana-web3.js/commit/367b8ad0cce55a916abfb0125f36b6e844333b2b), [`fd72c2e`](https://github.com/solana-labs/solana-web3.js/commit/fd72c2ed1edad488318fa5d3e285f04852f4210a)]:
    - @solana/errors@2.0.0

## 2.0.0-rc.4

### Patch Changes

- Updated dependencies [[`2798061`](https://github.com/solana-labs/solana-web3.js/commit/27980617e4f8d34dbc7b6da4507e4bca68a68090)]:
    - @solana/errors@2.0.0-rc.4

## 2.0.0-rc.3

### Patch Changes

- Updated dependencies []:
    - @solana/errors@2.0.0-rc.3

## 2.0.0-rc.2

### Patch Changes

- [#3301](https://github.com/solana-labs/solana-web3.js/pull/3301) [`8c2cb9f`](https://github.com/solana-labs/solana-web3.js/commit/8c2cb9f44a52b3c27bc15c2c972bea1aae1622e7) Thanks [@steveluscher](https://github.com/steveluscher)! - Creates a package for working with subscribable data sources like event targets. From an `EventTarget` or object which conforms to the `EventEmitter` interface you can now create a more ergonomic `DataPublisher` (object with an `on` method that vends an unsubscribe function) or an abortable `AsyncIterable`.

- Updated dependencies [[`38faba0`](https://github.com/solana-labs/solana-web3.js/commit/38faba05fab479ddbd95d0e211744d203f8aa823), [`fd72c2e`](https://github.com/solana-labs/solana-web3.js/commit/fd72c2ed1edad488318fa5d3e285f04852f4210a)]:
    - @solana/errors@2.0.0-rc.2
