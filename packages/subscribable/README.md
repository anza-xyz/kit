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

This type represents a reactive store that holds the latest value published to a data channel. It exposes a `{ getState, retry, subscribe }` contract compatible with `useSyncExternalStore`, Svelte stores, and other reactive primitives.

`getState()` returns a discriminated snapshot of the store's lifecycle:

```ts
type ReactiveState<T> =
    | { data: T | undefined; error: unknown; status: 'loading' }
    | { data: T; error: undefined; status: 'loaded' }
    | { data: T | undefined; error: unknown; status: 'error' }
    | { data: undefined; error: undefined; status: 'idle' };
```

> Also exported as `ReactiveStore<T>` for backwards compatibility. That alias is deprecated and will be removed in a future major release.

The store starts in `status: 'idle'`. Call `connect()` to open the underlying stream; the store will transition through `loading` → `loaded` (or `error`). Every subsequent `connect()` transitions back through `loading`, preserving the last known `data` and `error` (stale-while-revalidate). A subsequent `loaded` clears the error; a subsequent `error` replaces it. Call `reset()` to tear down the connection and return to `idle` without permanently killing the store.

```tsx
const store: ReactiveStreamStore<AccountInfo> = /* ... */;

// React — snapshot identity is stable between updates, so it can be passed directly.
const state = useSyncExternalStore(store.subscribe, store.getState);
useEffect(() => {
    store.connect();
    return () => store.reset();
}, [store]);
// Stale-while-revalidate: keep showing the last value while a reconnect is in flight.
return (
    <>
        {state.data !== undefined && <View data={state.data} />}
        {state.status === 'loading' && state.data === undefined && <Spinner />}
        {state.status === 'error' && <RetryBanner error={state.error} onRetry={store.connect} />}
    </>
);

// Vue
const snapshot = shallowRef(store.getState());
store.subscribe(() => {
    snapshot.value = store.getState();
});
store.connect();
```

### `ReactiveActionStore<TArgs, TResult>`

A framework-agnostic state machine for wrapping an async action (a function you dispatch on demand — like a form submission, a mutation, or an on-click fetch). It exposes a `{ dispatch, getState, subscribe, reset }` contract that bridges trivially into `useSyncExternalStore`, Svelte stores, Vue's `shallowRef`, and similar reactive primitives.

The snapshot is a discriminated union:

```ts
type ReactiveActionState<TResult> =
    | { status: 'idle'; data: undefined; error: undefined }
    | { status: 'running'; data: TResult | undefined; error: unknown }
    | { status: 'success'; data: TResult; error: undefined }
    | { status: 'error'; data: TResult | undefined; error: unknown };
```

`data` is the last successful result and `error` is the last failure; both survive across transitions so UIs can render stale content (data **or** error) while a retry is in flight. `success` clears `error`; only `reset()` clears `data`.

Unlike `ReactiveStreamStore<T>` (which models a stream of values with a separate error channel), `ReactiveActionStore` models a one-shot-per-dispatch lifecycle where errors are part of the snapshot.

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

### `createReactiveActionStore(fn)`

Wraps an async function in a `ReactiveActionStore`. Each `dispatch` creates a fresh `AbortController` and aborts the previous one, so a rapid succession of dispatches only produces one final state transition — the outcome of the most recent call. The wrapped function receives the `AbortSignal` as its first argument, followed by the arguments passed to `dispatch`.

```tsx
const store = createReactiveActionStore(async (signal: AbortSignal, accountId: Address) => {
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
- Attach a caller-provided `AbortSignal` to a `dispatch` or `dispatchAsync` call via `store.withSignal(signal)`:

    ```ts
    // Per-attempt timeout — fresh signal per call:
    store.withSignal(AbortSignal.timeout(5_000)).dispatch(someAccountId);

    // Shared kill switch — bind the wrapper once, reuse everywhere:
    const killCtrl = new AbortController();
    const killable = store.withSignal(killCtrl.signal);
    killable.dispatch(someAccountId);
    killable.dispatch(someAccountId);
    killCtrl.abort(); // cancels in-flight and short-circuits future calls
    ```

    The wrapped signal is composed with the store's internal per-dispatch controller via `AbortSignal.any`, so aborting either cancels the in-flight call and surfaces the abort reason on state. The wrapper exposes only `dispatch` / `dispatchAsync` — `getState` / `subscribe` / `reset` stay on the parent store.

- Calling either dispatch while one is in flight aborts the previous call; its outcome is dropped from state regardless of which variant started it.
- `data` survives across transitions: a fresh `running` or `error` snapshot carries the last successful result so call sites can keep rendering stale content while a retry is in flight. Only `reset()` clears it.
- `reset()` aborts the in-flight dispatch and restores the idle snapshot, clearing both `data` and `error`.
- Subscribers are notified only when the snapshot's `status`, `data`, or `error` actually changes, so redundant transitions (`dispatch` while already `running` with the same `data`, `reset` while already `idle`) are silent.
- `fn` is captured at construction, so the store holds a closure over whatever `fn` referenced at that moment. In React, create the store once (`useState(() => createReactiveActionStore(...))` or `useRef`) and read the latest closure through a ref if you need it to change between renders — don't call `createReactiveActionStore` directly in a render body.
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

### `createReactiveStoreFromDataPublisherFactory({ createDataPublisher, dataChannelName, errorChannelName })`

Returns a `ReactiveStreamStore` that wires itself to a fresh `DataPublisher` on every `connect()`. Accepts an async factory so the store can tear down a broken stream and open a new one without losing subscribers or the last known value. The factory receives the per-connection `AbortSignal` so the underlying transport can stop when the connection window closes.

```ts
const store = createReactiveStoreFromDataPublisherFactory({
    createDataPublisher: signal => getDataPublisherFromEventEmitter(new WebSocket(url, { signal })),
    dataChannelName: 'message',
    errorChannelName: 'error',
});
const unsubscribe = store.subscribe(() => {
    const snapshot = store.getState();
    if (snapshot.status === 'error') console.error('Connection failed:', snapshot.error);
    else if (snapshot.status === 'loaded') console.log('Latest:', snapshot.data);
});
// Fresh 30-second clock per connection attempt:
store.withSignal(AbortSignal.timeout(30_000)).connect();
```

Things to note:

- The returned store starts in `status: 'idle'`. Call `connect()` to open the first stream.
- `createDataPublisher` is invoked on every `connect()`. The store transitions through `loading`, preserving the last known `data` and `error` (stale-while-revalidate).
- If `createDataPublisher` rejects, the store transitions to `status: 'error'` with the rejection as the error. Call `connect()` to try again.
- `reset()` aborts the current connection and returns the store to `idle`, clearing `data` and `error`. A follow-up `connect()` opens a fresh stream.
- Attach a caller-provided cancellation source via `store.withSignal(signal).connect()` — the signal is composed with the per-connection controller via `AbortSignal.any`. Aborting the caller's signal transitions the store to `error` with that abort reason.

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
