[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]
<br />
[![code-style-prettier][code-style-prettier-image]][code-style-prettier-url]

[code-style-prettier-image]: https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square
[code-style-prettier-url]: https://github.com/prettier/prettier
[npm-downloads-image]: https://img.shields.io/npm/dm/@solana/subscribable?style=flat
[npm-image]: https://img.shields.io/npm/v/@solana/subscribable?style=flat
[npm-url]: https://www.npmjs.com/package/@solana/subscribable

# @solana/subscribable

This package contains utilities for creating subscription-based event targets. These differ from the `EventTarget` interface in that the method you use to add a listener returns an unsubscribe function. It is primarily intended for internal use &ndash; particularly for those building `RpcSubscriptionChannels` and associated infrastructure.

## Types

### `DataPublisher<TDataByChannelName>`

This type represents an object with an `on` function that you can call to subscribe to certain data over a named channel.

```ts
let dataPublisher: DataPublisher<{ error: SolanaError }>;
dataPublisher.on('data', handleData); // ERROR. `data` is not a known channel name.
dataPublisher.on('error', e => {
    console.error(e);
}); // OK.
```

### `ReactiveStreamStore<T>`

This type represents a reactive store that holds the latest value published to a data channel. It exposes a `{ getUnifiedState, retry, subscribe }` contract compatible with `useSyncExternalStore`, Svelte stores, and other reactive primitives.

`getUnifiedState()` returns a discriminated snapshot of the store's lifecycle:

```ts
type ReactiveState<T> =
    | { data: undefined; error: undefined; status: 'loading' }
    | { data: T; error: undefined; status: 'loaded' }
    | { data: T | undefined; error: unknown; status: 'error' }
    | { data: T | undefined; error: undefined; status: 'retrying' };
```

> Also exported as `ReactiveStore<T>` for backwards compatibility. That alias is deprecated and will be removed in a future major release.

```ts
const store: ReactiveStreamStore<AccountInfo> = /* ... */;

// React — snapshot identity is stable between updates, so it can be passed directly.
const state = useSyncExternalStore(store.subscribe, store.getUnifiedState);
if (state.status === 'error') return <ErrorMessage error={state.error} onRetry={store.retry} />;
if (state.status === 'loading') return <Spinner />;
return <View data={state.data} />;

// Vue
const snapshot = shallowRef(store.getUnifiedState());
store.subscribe(() => {
    snapshot.value = store.getUnifiedState();
});
```

`retry()` re-opens the stream after an error. When the underlying store supports restart (see [`createReactiveStoreFromDataPublisherFactory`](#createreactivestorefromdatapublisherfactory-abortsignal-createdatapublisher-datachannelname-errorchannelname-)), the store transitions to `status: 'retrying'` and reconnects. Stores that cannot be restarted throw a `SolanaError` with code `SOLANA_ERROR__SUBSCRIBABLE__RETRY_NOT_SUPPORTED` instead.

The individual `getState()` and `getError()` getters on `ReactiveStreamStore<T>` are `@deprecated` &mdash; prefer `getUnifiedState()`, which exposes the same information with a stable snapshot identity and `status` discriminator.

### `ActionStore<TArgs, TResult>`

A framework-agnostic state machine for wrapping an async action (a function you dispatch on demand — like a form submission, a mutation, or an on-click fetch). It exposes a `{ dispatch, getState, subscribe, reset }` contract that bridges trivially into `useSyncExternalStore`, Svelte stores, Vue's `shallowRef`, and similar reactive primitives.

The snapshot is a discriminated union:

```ts
type ActionState<TResult> =
    | { status: 'idle'; data: undefined; error: undefined }
    | { status: 'running'; data: TResult | undefined; error: undefined }
    | { status: 'success'; data: TResult; error: undefined }
    | { status: 'error'; data: TResult | undefined; error: unknown };
```

`data` is the last successful result and survives across transitions — a `running` or `error` snapshot still carries the last value so UIs can render stale content while a retry is in flight. Only `reset()` clears it.

Unlike `ReactiveStreamStore<T>` (which models a stream of values with a separate error channel), `ActionStore` models a one-shot-per-dispatch lifecycle where errors are part of the snapshot.

### `TypedEventEmitter<TEventMap>`

This type allows you to type `addEventListener` and `removeEventListener` so that the call signature of the listener matches the event type given.

```ts
const emitter: TypedEventEmitter<{ message: MessageEvent }> = new WebSocket('wss://api.devnet.solana.com');
emitter.addEventListener('data', handleData); // ERROR. `data` is not a known event type.
emitter.addEventListener('message', message => {
    console.log(message.origin); // OK. `message` is a `MessageEvent` so it has an `origin` property.
});
```

### `TypedEventTarget<TEventMap>`

This type is a superset of `TypedEventEmitter` that allows you to constrain calls to `dispatchEvent`.

```ts
const target: TypedEventTarget<{ candyVended: CustomEvent<{ flavour: string }> }> = new EventTarget();
target.dispatchEvent(new CustomEvent('candyVended', { detail: { flavour: 'raspberry' } })); // OK.
target.dispatchEvent(new CustomEvent('candyVended', { detail: { flavor: 'raspberry' } })); // ERROR. Misspelling in detail.
```

## Functions

### `createActionStore(fn)`

Wraps an async function in an `ActionStore`. Each `dispatch` creates a fresh `AbortController` and aborts the previous one, so a rapid succession of dispatches only produces one final state transition — the outcome of the most recent call. The wrapped function receives the `AbortSignal` as its first argument, followed by the arguments passed to `dispatch`.

```tsx
const store = createActionStore(async (signal: AbortSignal, accountId: Address) => {
    const response = await fetch(`/api/accounts/${accountId}`, { signal });
    return response.json();
});

// React — stale-while-revalidate: keep showing the card during retries.
const { data, error, status } = useSyncExternalStore(store.subscribe, store.getState);
return (
    <>
        {data !== undefined && <AccountCard account={data} />}
        {status === 'running' && <InlineSpinner />}
        {status === 'error' && <RetryBanner error={error} onRetry={() => store.dispatch(someAccountId)} />}
        {status === 'idle' && data === undefined && <button onClick={() => store.dispatch(someAccountId)}>Load</button>}
    </>
);
```

Things to note:

- Starts at `{ status: 'idle' }`. `getState()` always returns a defined snapshot.
- `dispatch` is a stable reference — safe to pass into memoized callbacks without re-renders.
- Two ways to trigger the action:
    - `dispatch(...)` — fire-and-forget. Returns `undefined` synchronously and never throws; safe to call from UI event handlers without a `.catch`. Failures surface on state as `{ status: 'error' }`.
    - `dispatchAsync(...)` — returns a promise that resolves to the wrapped function's result. Rejects on failure and with an `AbortError` when superseded or `reset()`. Use from imperative code that needs the resolved value; pair with [`isAbortError`](../promises#isaborterrorerr) from `@solana/promises` to filter abort rejections.
- Calling either dispatch while one is in flight aborts the previous call; its outcome is dropped from state regardless of which variant started it.
- `data` survives across transitions: a fresh `running` or `error` snapshot carries the last successful result so call sites can keep rendering stale content while a retry is in flight. Only `reset()` clears it.
- `reset()` aborts the in-flight dispatch and restores the idle snapshot, clearing both `data` and `error`.
- Subscribers are notified only when the snapshot's `status`, `data`, or `error` actually changes, so redundant transitions (`dispatch` while already `running` with the same `data`, `reset` while already `idle`) are silent.
- `fn` is captured at construction, so the store holds a closure over whatever `fn` referenced at that moment. In React, create the store once (`useState(() => createActionStore(...))` or `useRef`) and read the latest closure through a ref if you need it to change between renders — don't call `createActionStore` directly in a render body.
- The store holds strong references to its subscribers. Non-framework consumers that subscribe without unsubscribing will keep their listeners (and anything the listeners close over) alive for the lifetime of the store.

### `createAsyncIterableFromDataPublisher({ abortSignal, dataChannelName, dataPublisher, errorChannelName })`

Returns an `AsyncIterable` given a data publisher. The iterable will produce iterators that vend messages published to `dataChannelName` and will throw the first time a message is published to `errorChannelName`. Triggering the abort signal will cause all iterators spawned from this iterator to return once they have published all queued messages.

```ts
const iterable = createAsyncIterableFromDataPublisher({
    abortSignal: AbortSignal.timeout(10_000),
    dataChannelName: 'message',
    dataPublisher,
    errorChannelName: 'error',
});
try {
    for await (const message of iterable) {
        console.log('Got message', message);
    }
} catch (e) {
    console.error('An error was published to the error channel', e);
} finally {
    console.log("It's been 10 seconds; that's enough for now.");
}
```

Things to note:

- If a message is published over a channel before the `AsyncIterator` attached to it has polled for the next result, the message will be queued in memory.
- Messages only begin to be queued after the first time an iterator begins to poll. Channel messages published before that time will be dropped.
- If there are messages in the queue and an error occurs, all queued messages will be vended to the iterator before the error is thrown.
- If there are messages in the queue and the abort signal fires, all queued messages will be vended to the iterator after which it will return.
- Any new iterators created after the first error is encountered will reject with that error when polled.

### `createReactiveStoreFromDataPublisher({ abortSignal, dataChannelName, dataPublisher, errorChannelName })`

> **Deprecated.** Prefer [`createReactiveStoreFromDataPublisherFactory`](#createreactivestorefromdatapublisherfactory-abortsignal-createdatapublisher-datachannelname-errorchannelname-) &mdash; it supports `retry()`. Because this function accepts a ready-made `DataPublisher` rather than a factory, it cannot restart the underlying source, and calling `retry()` on the returned store throws a `SolanaError` with code `SOLANA_ERROR__SUBSCRIBABLE__RETRY_NOT_SUPPORTED`.

Returns a `ReactiveStreamStore` given a data publisher. The store holds the most recent message published to `dataChannelName` and notifies subscribers on each update. When a message is published to `errorChannelName`, the store transitions to `status: 'error'` preserving the last known value. Triggering the abort signal disconnects the store from the data publisher.

```ts
const store = createReactiveStoreFromDataPublisher({
    abortSignal: AbortSignal.timeout(10_000),
    dataChannelName: 'notification',
    dataPublisher,
    errorChannelName: 'error',
});
const unsubscribe = store.subscribe(() => {
    console.log('State updated:', store.getUnifiedState());
});
```

Things to note:

- `getUnifiedState()` starts in `status: 'loading'` until the first notification arrives.
- On error, `status` becomes `'error'` with the last known value preserved on `data`. Only the first error is captured.
- The function returned by `subscribe` is idempotent &mdash; calling it multiple times is safe.

### `createReactiveStoreFromDataPublisherFactory({ abortSignal, createDataPublisher, dataChannelName, errorChannelName })`

Returns a `ReactiveStreamStore` that wires itself to a fresh `DataPublisher` on construction and on every `retry()`. Unlike `createReactiveStoreFromDataPublisher`, this variant accepts an async factory so the store can tear down a broken stream and open a new one without losing subscribers or the last known value.

```ts
const store = createReactiveStoreFromDataPublisherFactory({
    abortSignal: AbortSignal.timeout(60_000),
    async createDataPublisher() {
        return await openMyConnection();
    },
    dataChannelName: 'notification',
    errorChannelName: 'error',
});
store.subscribe(() => {
    const snapshot = store.getUnifiedState();
    if (snapshot.status === 'error') store.retry();
});
```

Things to note:

- `createDataPublisher` is called once on construction and again on every `retry()`.
- `retry()` is a no-op unless the store is in `status: 'error'`; otherwise the store transitions to `status: 'retrying'` (preserving stale data) and reconnects.
- If `createDataPublisher` rejects, the store transitions to `status: 'error'` with the rejection as the error. Call `retry()` to try again.
- Triggering the caller's `abortSignal` disconnects the store permanently; subsequent `retry()` calls are no-ops.

### `demultiplexDataPublisher(publisher, sourceChannelName, messageTransformer)`

Given a channel that carries messages for multiple subscribers on a single channel name, this function returns a new `DataPublisher` that splits them into multiple channel names.

Imagine a channel that carries multiple notifications whose destination is contained within the message itself.

```ts
const demuxedDataPublisher = demultiplexDataPublisher(channel, 'message', message => {
    const destinationChannelName = `notification-for:${message.subscriberId}`;
    return [destinationChannelName, message];
});
```

Now you can subscribe to _only_ the messages you are interested in, without having to subscribe to the entire `'message'` channel and filter out the messages that are not for you.

```ts
demuxedDataPublisher.on(
    'notification-for:123',
    message => {
        console.log('Got a message for subscriber 123', message);
    },
    { signal: AbortSignal.timeout(5_000) },
);
```

### `getDataPublisherFromEventEmitter(emitter)`

Returns an object with an `on` function that you can call to subscribe to certain data over a named channel. The `on` function returns an unsubscribe function.

```ts
const socketDataPublisher = getDataPublisherFromEventEmitter(new WebSocket('wss://api.devnet.solana.com'));
const unsubscribe = socketDataPublisher.on('message', message => {
    if (JSON.parse(message.data).id === 42) {
        console.log('Got response 42');
        unsubscribe();
    }
});
```
