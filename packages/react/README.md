[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]
<br />
[![code-style-prettier][code-style-prettier-image]][code-style-prettier-url]

[code-style-prettier-image]: https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square
[code-style-prettier-url]: https://github.com/prettier/prettier
[npm-downloads-image]: https://img.shields.io/npm/dm/@solana/react?style=flat
[npm-image]: https://img.shields.io/npm/v/@solana/react?style=flat
[npm-url]: https://www.npmjs.com/package/@solana/react

# @solana/react

This package contains React hooks for building Solana apps.

## Kit client bindings

The Kit client is a plugin-extensible value built outside the React tree (`createClient().use(...)`) and published to descendants by `ClientProvider`. The hooks in this section connect the React tree to that client. Higher-level hooks (live data, RPC requests, wallet actions) sit on top of these and ship from each Kit plugin's `/react` subpath.

### `ClientProvider`

Publishes a caller-owned Kit client to its subtree. Required for `useClient`, `useClientCapability`, and any plugin-specific hook that depends on a client capability. Generic primitives like `useAction` work against arbitrary async functions and don't need a provider.

```tsx
import { createClient } from '@solana/kit';
import { ClientProvider } from '@solana/react';

const client = createClient(); // .use(...) plugins as needed

function App() {
    return (
        <ClientProvider client={client}>
            <Shell />
        </ClientProvider>
    );
}
```

The `client` reference must be stable across renders — build it at module scope, or memoise it with `useMemo` when its config is reactive (e.g. a cluster toggle).

When a plugin's `.use()` is async, `createClient().use(...)` returns a promise. Pass it directly; the provider suspends via the nearest `<Suspense>` boundary until it resolves.

```tsx
import { Suspense, useMemo } from 'react';

function Root() {
    const clientPromise = useMemo(() => createClient().use(someAsyncPlugin()), []);
    return (
        <Suspense fallback={<Splash />}>
            <ClientProvider client={clientPromise}>
                <Shell />
            </ClientProvider>
        </Suspense>
    );
}
```

### `useClient<TClient>()`

Reads the Kit client published by the nearest `ClientProvider`. Throws a `SolanaError` with code `SOLANA_ERROR__REACT__MISSING_PROVIDER` if no provider is mounted.

Defaults to the base `Client` shape. Callers who know a specific plugin is installed may widen the type via the generic — this is a pure cast with no runtime check, so reach for `useClientCapability` when a missing plugin should fail loudly at mount instead of surfacing later as `undefined`.

```tsx
import { ClientWithRpc, GetEpochInfoApi } from '@solana/kit';
import { useClient } from '@solana/react';

function ManualSend() {
    const client = useClient<ClientWithRpc<GetEpochInfoApi>>();
    return <button onClick={() => client.rpc.getEpochInfo().send()}>Fetch</button>;
}
```

### `useClientCapability<TClient>(config)`

Reads the client and asserts at mount that the requested capability is installed, narrowing the return type via the generic. Throws a `SolanaError` with code `SOLANA_ERROR__REACT__MISSING_CAPABILITY` when the capability is absent — including `hookName` and `providerHint` so users can fix the mistake without cross-referencing docs.

Use this from the implementation of plugin-specific hooks. Apps that need ad-hoc access can reach for `useClient` directly and supply their own narrowing.

```tsx
import { ClientWithRpc, GetEpochInfoApi } from '@solana/kit';
import { useClientCapability } from '@solana/react';

function useRpc() {
    return useClientCapability<ClientWithRpc<GetEpochInfoApi>>({
        capability: 'rpc',
        hookName: 'useRpc',
        providerHint: 'Install `solanaRpc()` on the client.',
    });
}
```

Pass an array of capability names when a hook needs more than one (e.g. `['rpc', 'rpcSubscriptions']`) — the same `providerHint` is surfaced for whichever is missing.

### `useAction(fn)`

Bridges any async function into a tracked action with `dispatch` / `status` / `data` / `error` / `reset`. Each `dispatch(...)` runs `fn` with a fresh `AbortSignal` and tracks the lifecycle through React state; calling `dispatch` again while a prior call is in flight aborts the first.

`fn` is held in a ref that always points at the latest closure — there is no `deps` array to maintain. Each `dispatch(...)` invokes the most recently rendered `fn`, so values captured inside (e.g. form state, route params) are always fresh. In-flight calls are unaffected — they continue with the closure they captured at dispatch time.

```tsx
import { useAction } from '@solana/react';
import { isAbortError } from '@solana/promises';

function PostMessageButton({ url, body }: { url: string; body: string }) {
    const { dispatch, isRunning, error } = useAction(async (signal, content: string) => {
        const res = await fetch(url, { body: content, method: 'POST', signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    });

    return (
        <button disabled={isRunning} onClick={() => dispatch(body)}>
            {isRunning ? 'Posting…' : error ? 'Retry' : 'Post'}
        </button>
    );
}
```

`dispatch` returns `Promise<TResult>`. Fire-and-forget callers can ignore it and render from `status` / `data` / `error`. Awaiters that read the resolved value (e.g. to navigate on success) should filter superseded calls with `isAbortError` from `@solana/promises`:

```tsx
try {
    const { id } = await dispatch(body);
    navigate(`/messages/${id}`);
} catch (err) {
    if (isAbortError(err)) return; // superseded — state already reflects the newer call
    // handle real error
}
```

### `useRequest(source, options?)`

Fires a one-shot request on mount and re-fires whenever `source` changes identity. Returns `{ data, error, status, refresh }` where `status` is one of `'fetching' | 'success' | 'error' | 'disabled'`. Use it for RPC reads, or for any other one-shot async work an app needs (a `fetch`, a third-party SDK call, etc.).

`source` is either an async function `(signal: AbortSignal) => Promise<T>` (most general), or any reactive store source `{ reactiveStore(): ReactiveActionStore<[], T> }` — `PendingRpcRequest` is the canonical implementation. Pass `null` to disable (the result reports `status: 'disabled'`).

> Unlike `useAction`, `useRequest` needs the input to have stable identity across renders — it's how the hook knows when to re-fire. Memoize with `useMemo` (for a reactive store source) or `useCallback` (for a function), keyed on whatever inputs your call depends on.

```tsx
import { useClient, useRequest } from '@solana/react';
import type { ClientWithRpc, GetLatestBlockhashApi } from '@solana/kit';

function LatestBlockhash() {
    const client = useClient<ClientWithRpc<GetLatestBlockhashApi>>();
    const source = useMemo(() => client.rpc.getLatestBlockhash(), [client]);
    const { data, error, refresh } = useRequest(source);
    if (error) return <button onClick={refresh}>Retry</button>;
    return <p>{data ? `Blockhash: ${data.value.blockhash}` : 'Loading…'}</p>;
}
```

`refresh()` re-fires the request manually. While a refresh is in flight, `status` returns to `'fetching'` and `data` / `error` from the prior outcome stay populated until the new attempt resolves (stale-while-revalidate). On the first attempt both are `undefined`.

```tsx
function Balance({ address }: { address: Address | null }) {
    const client = useClient<ClientWithRpc<GetBalanceApi>>();
    // Disabled until an address is selected.
    const source = useMemo(() => (address ? client.rpc.getBalance(address) : null), [client, address]);
    const { data, status } = useRequest(source);
    if (status === 'disabled') return <p>Select an account to see its balance.</p>;
    return <p>{data?.value !== undefined ? `${data.value} lamports` : 'Loading…'}</p>;
}
```

For any other one-shot async work — `fetch`, a third-party SDK call, or anything that isn't a `ReactiveActionSource` — pass an async function instead of a source. The `signal` argument fires when the request is superseded, the source changes, or the component unmounts; thread it into your call's own abort plumbing:

```tsx
function Profile({ userId }: { userId: string }) {
    const fetcher = useCallback(
        (signal: AbortSignal) => fetch(`/api/users/${userId}`, { signal }).then(r => r.json()),
        [userId],
    );
    const { data, error, refresh } = useRequest(fetcher);
    if (error) return <button onClick={refresh}>Retry</button>;
    return <p>{data ? data.name : 'Loading…'}</p>;
}
```

#### Per-attempt cancellation

Pass `getAbortSignal` to attach a cancellation signal to each individual attempt — initial fire plus every `refresh()`. The natural use is per-attempt timeouts:

```tsx
const { data, error, refresh } = useRequest(source, {
    // Each attempt gets a fresh 5-second clock. `refresh()` resets it.
    getAbortSignal: () => AbortSignal.timeout(5_000),
});
```

The factory is held in a ref synced to the latest render, so inline closures are fine — no `useCallback` needed. To kill the hook entirely (e.g. on a route change), set the memoized source to `null` (the result reports `disabled`), or let the component unmount.

`refresh()` accepts an optional `{ abortSignal }` override that replaces the configured factory for just that attempt — useful when one specific refresh needs different cancellation semantics:

```tsx
const userInitiatedCtrl = new AbortController();
refresh({ abortSignal: userInitiatedCtrl.signal }); // override: use this signal, ignore the factory
refresh({ abortSignal: undefined }); // no abort signal for this attempt
refresh(); // omit the key to use the factory (default)
```

### `useSubscription(source, options?)`

Subscribe to a stream-store source and surface the latest notification as reactive state. Returns `{ data, error, reconnect, status }` where `status` is one of `'loading' | 'loaded' | 'error' | 'disabled'`. Use it for any RPC subscription (`accountNotifications`, `slotNotifications`, `logsNotifications`, etc.) or any plugin-authored stream that satisfies `ReactiveStreamSource<T>`.

`source` is any `ReactiveStreamSource<T>` — the `{ reactiveStore() }` duck-type satisfied by `PendingRpcSubscriptionsRequest`. Pass `null` to disable. Memoize the source with `useMemo` keyed on whatever inputs it depends on; stable identity is how the hook knows when to tear down and re-open.

`data` is the notification as the source emits it. For RPC subscriptions that emit `SolanaRpcResponse<U>`, read the inner value at `data.value` and the slot at `data.context.slot`. For raw notifications, `data` is the raw shape.

```tsx
import { useClient, useSubscription } from '@solana/react';
import type { Address, AccountNotificationsApi, ClientWithRpcSubscriptions } from '@solana/kit';

function AccountBalance({ address }: { address: Address }) {
    const client = useClient<ClientWithRpcSubscriptions<AccountNotificationsApi>>();
    const source = useMemo(() => client.rpcSubscriptions.accountNotifications(address), [client, address]);
    const { data, error, reconnect } = useSubscription(source);
    if (error) return <button onClick={reconnect}>Reconnect</button>;
    return <p>{data ? `${data.value.lamports} lamports at slot ${data.context.slot}` : 'Connecting…'}</p>;
}
```

`reconnect()` re-opens the connection. After a `loaded` outcome that transitions to `error`, calling `reconnect()` returns `status` to `'loading'` while preserving the stale `data` and `error` (stale-while-revalidate) → `'loaded'` (or `'error'` again). The hook tears the connection down on unmount via the store's `reset()`; StrictMode's mount → unmount → mount cycle re-opens cleanly.

#### Per-connection cancellation

Pass `getAbortSignal` to attach a cancellation signal to each individual connection — initial subscribe plus every `reconnect()`. The natural use is per-connection timeouts:

```tsx
const { data, error, reconnect } = useSubscription(source, {
    // Each connection gets a fresh 30-second clock. `reconnect()` resets it.
    getAbortSignal: () => AbortSignal.timeout(30_000),
});
```

The factory is held in a ref synced to the latest render, so inline closures are fine — no `useCallback` needed. To kill the subscription entirely (e.g. on a route change), set the memoized source to `null` (the result reports `disabled`), or let the component unmount.

`reconnect()` accepts an optional `{ abortSignal }` override that replaces the configured factory for just that attempt — useful when one specific reconnect needs different cancellation semantics:

```tsx
const userInitiatedCtrl = new AbortController();
reconnect({ abortSignal: userInitiatedCtrl.signal }); // override: use this signal, ignore the factory
reconnect({ abortSignal: undefined }); // no abort signal for this attempt
reconnect(); // omit the key to use the factory (default)
```

### `useTrackedData(spec, options?)`

Render reactive state for an RPC subscription seeded by a one-shot RPC fetch, slot-deduped. The subscription (e.g. `accountNotifications`) is the primary source of live updates; the initial fetch (e.g. `getBalance`, `getAccountInfo`) provides a value to surface as soon as it resolves — typically before the first subscription notification arrives — so the `loading` paint is shorter than subscription-only would give you. Surfaces a unified `{ data, error, refresh, status }` view where `data` is the underlying kit primitive's `SolanaRpcResponse<TItem>` envelope (the primitive's type guarantees the shape, so callers can read `data.value` and `data.context.slot` directly) and `status` is one of `'loading' | 'loaded' | 'error' | 'disabled'`. The underlying store slot-dedupes between the two sources — out-of-order arrivals never regress the surfaced value.

`spec` is a `TrackedDataSpec<TRpcValue, TSubscriptionValue, TItem>` with four fields: a pending RPC request, a pending RPC subscription request, and two mappers that unify their value shapes into a common `TItem`. Both RPC responses and subscription notifications must have shape `SolanaRpcResponse` for slot de-dupe. Pass `null` to disable (the result reports `status: 'disabled'`). Memoize the spec with `useMemo` keyed on its inputs — stable identity is how the hook knows when to tear down and re-run.

```tsx
import { useClient, useTrackedData } from '@solana/react';
import type {
    Address,
    AccountNotificationsApi,
    ClientWithRpc,
    ClientWithRpcSubscriptions,
    GetBalanceApi,
} from '@solana/kit';

function AccountBalance({ address }: { address: Address }) {
    const client = useClient<ClientWithRpc<GetBalanceApi> & ClientWithRpcSubscriptions<AccountNotificationsApi>>();
    const spec = useMemo(
        () => ({
            rpcRequest: client.rpc.getBalance(address),
            rpcSubscriptionRequest: client.rpcSubscriptions.accountNotifications(address),
            rpcValueMapper: (lamports: bigint) => lamports,
            rpcSubscriptionValueMapper: ({ lamports }: { lamports: bigint }) => lamports,
        }),
        [client, address],
    );
    const { data, error, refresh } = useTrackedData(spec);
    if (error) return <button onClick={refresh}>Retry</button>;
    return <p>{data ? `${data.value} lamports at slot ${data.context.slot}` : 'Loading…'}</p>;
}
```

`refresh()` re-runs both the initial RPC and the subscription. While a refresh is in flight, `status` returns to `'loading'` and `data` / `error` from the prior outcome stay populated until the new attempt resolves (stale-while-revalidate). `data.context.slot` is the slot the underlying store dedup'd on and stays paired with `data.value` across status transitions — useful for "data as of slot X" UIs.

#### Per-attempt cancellation

Pass `getAbortSignal` to attach a cancellation signal to each attempt — initial run plus every `refresh()`. The natural use is per-attempt timeouts:

```tsx
const { data, error, refresh } = useTrackedData(spec, {
    // Each attempt gets a fresh 30-second clock. `refresh()` resets it.
    getAbortSignal: () => AbortSignal.timeout(30_000),
});
```

The factory is held in a ref synced to the latest render, so inline closures are fine — no `useCallback` needed. To kill the hook entirely (e.g. on a route change), set the memoized spec to `null` (the result reports `disabled`), or let the component unmount.

`refresh()` accepts an optional `{ abortSignal }` override that replaces the configured factory for just that attempt:

```tsx
const userInitiatedCtrl = new AbortController();
refresh({ abortSignal: userInitiatedCtrl.signal }); // override: use this signal, ignore the factory
refresh({ abortSignal: undefined }); // no abort signal for this attempt
refresh(); // omit the key to use the factory (default)
```

## SWR adapter (`@solana/react/swr`)

Opt-in subpath that bridges Kit's reactive primitives into SWR's cache. Import from `@solana/react/swr`; `swr@^2` is an optional peer dependency. Hooks carry the `Swr` suffix to keep the cache backing visible at the call site.

### `useRequestSWR(key, source, options?)`

SWR-backed counterpart to `useRequest`. Same `source` shape (a `ReactiveActionSource<T>` or `(signal: AbortSignal) => Promise<T>`). Returns SWR's native `SWRResponse<T>`. Pass `null` for either `key` or `source` to disable — useful when one of the source's inputs isn't yet known.

```tsx
import { useClient } from '@solana/react';
import { useRequestSWR } from '@solana/react/swr';
import type { ClientWithRpc, GetLatestBlockhashApi } from '@solana/kit';

function LatestBlockhash() {
    const client = useClient<ClientWithRpc<GetLatestBlockhashApi>>();
    const { data, error, isLoading, mutate } = useRequestSWR(['latestBlockhash'], client.rpc.getLatestBlockhash());
    if (error) return <button onClick={() => mutate()}>Retry</button>;
    if (isLoading) return <p>Loading…</p>;
    return <p>Blockhash: {data!.value.blockhash}</p>;
}
```

`mutate()` is SWR's revalidate verb — call it to re-fire the request manually (the equivalent of `refresh()` from `useRequest`).

Pass any SWR `SWRConfiguration` field in options. The Kit-only `getAbortSignal: () => AbortSignal` factory is invoked on every attempt SWR makes — initial fire, focus / reconnect / poll revalidation, and `mutate()` — and the returned signal is threaded into the source. Typically a per-attempt timeout. SWR won't specifically handle the abort but will surface the rejection via `error`.

```tsx
useRequestSWR(['latestBlockhash'], source, {
    getAbortSignal: () => AbortSignal.timeout(5_000),
});
```

Unlike `useRequest.refresh({ abortSignal })`, SWR's `mutate()` has no per-attempt override for the abort signal so `getAbortSignal` will be used on every call.

For any one-shot async work that isn't a `ReactiveActionSource` — `fetch`, a third-party SDK call, etc. — you can pass an async function instead of a source. This can be any function of shape `(signal: AbortSignal) => Promise<T>`. The signal from `getAbortSignal` is passed to this function on each request. Other than this signal, this is the equivalent of `useSWR(key, fetcher)` and both are interoperable.

```tsx
function Profile({ userId }: { userId: string }) {
    const fetcher = useCallback(
        (signal: AbortSignal) => fetch(`/api/users/${userId}`, { signal }).then(r => r.json()),
        [userId],
    );
    const { data, error, isLoading, mutate } = useRequestSWR(['users', userId], fetcher, {
        getAbortSignal: () => AbortSignal.timeout(5_000),
    });
    if (error) return <button onClick={() => mutate()}>Retry</button>;
    if (isLoading) return <p>Loading…</p>;
    return <p>{data!.name}</p>;
}
```

When `getAbortSignal` isn't configured the signal is a fresh never-aborting `AbortSignal` (so the function's signature is satisfied) — it does **not** fire on unmount or when SWR supersedes the request. SWR's model is to discard the stale result rather than cancel the network call.

### Why no `useActionSWR`?

It would just be a wrapper around SWR's built-in [`useSWRMutation`](https://swr.vercel.app/docs/mutation#useswrmutation) with no additional functionality. Either use `useSWRMutation` or, if you don't need the SWR integration, use `useAction`.

## Hooks

### `useSignIn(uiWalletAccount, chain)`

Given a `UiWallet` or `UiWalletAccount` this hook returns a function that you can call to trigger a wallet's [&lsquo;Sign In With Solana&rsquo;](https://phantom.app/learn/developers/sign-in-with-solana) feature.

#### Example

```tsx
import { useSignIn } from '@solana/react';

function SignInButton({ wallet }) {
    const csrfToken = useCsrfToken();
    const signIn = useSignIn(wallet);
    return (
        <button
            onClick={async () => {
                try {
                    const { account, signedMessage, signature } = await signIn({
                        requestId: csrfToken,
                    });
                    // Authenticate the user, typically on the server, by verifying that
                    // `signedMessage` was signed by the person who holds the private key for
                    // `account.publicKey`.
                    //
                    // Authorize the user, also on the server, by decoding `signedMessage` as the
                    // text of a Sign In With Solana message, verifying that it was not modified
                    // from the values your application expects, and that its content is sufficient
                    // to grant them access.
                    window.alert(`You are now signed in with the address ${account.address}`);
                } catch (e) {
                    console.error('Failed to sign in', e);
                }
            }}
        >
            Sign In
        </button>
    );
}
```

### `useWalletAccountMessageSigner(uiWalletAccount)`

Given a `UiWalletAccount`, this hook returns an object that conforms to the `MessageModifyingSigner` interface of `@solana/signers`.

#### Example

```tsx
import { useWalletAccountMessageSigner } from '@solana/react';
import { createSignableMessage } from '@solana/signers';

function SignMessageButton({ account, text }) {
    const messageSigner = useWalletAccountMessageSigner(account);
    return (
        <button
            onClick={async () => {
                try {
                    const signableMessage = createSignableMessage(text);
                    const [signedMessage] = await messageSigner.modifyAndSignMessages([signableMessage]);
                    const messageWasModified = signableMessage.content !== signedMessage.content;
                    const signatureBytes = signedMessage.signatures[messageSigner.address];
                    window.alert(
                        `Signature bytes: ${signatureBytes.toString()}${
                            messageWasModified ? ' (message was modified)' : ''
                        }`,
                    );
                } catch (e) {
                    console.error('Failed to sign message', e);
                }
            }}
        >
            Sign Message: {text}
        </button>
    );
}
```

> [!NOTE]
> The type `MessageModifyingSigner` is returned from this hook instead of `MessageSigner` or `MessagePartialSigner`. This is a conservative assumption based on the fact that your application can not control whether or not the wallet will modify the message before signing it.

### `useWalletAccountTransactionSigner(uiWalletAccount, chain)`

Given a `UiWalletAccount` and a chain that begins with `solana:`, this hook returns an object that conforms to the `TransactionModifyingSigner` interface of `@solana/signers`.

#### Example

```tsx
import { useWalletAccountTransactionSigner } from '@solana/react';

function SignTransactionButton({ account, transaction }) {
    const transactionSigner = useWalletAccountTransactionSigner(account, 'solana:devnet');
    return (
        <button
            onClick={async () => {
                try {
                    const [{ signatures }] = await transactionSigner.modifyAndSignTransactions([transaction]);
                    const signatureBytes = signatures[transactionSigner.address];
                    window.alert(`Signature bytes: ${signatureBytes.toString()}`);
                } catch (e) {
                    console.error('Failed to sign transaction', e);
                }
            }}
        >
            Sign Transaction
        </button>
    );
}
```

> [!NOTE]
> The type `TransactionModifyingSigner` is returned from this hook instead of `TransactionSigner` or `TransactionPartialSigner`. This is a conservative assumption based on the fact that your application can not control whether or not the wallet will modify the transaction before signing it (eg. to add guard instructions, or a priority fee budget).

### `useWalletAccountTransactionSendingSigner(uiWalletAccount, chain)`

Given a `UiWalletAccount` and a chain that begins with `solana:`, this hook returns an object that conforms to the `TransactionSendingSigner` interface of `@solana/signers`.

#### Example

```tsx
import { useWalletAccountTransactionSendingSigner } from '@solana/react';
import {
    appendTransactionMessageInstruction,
    createSolanaRpc,
    getBase58Decoder,
    pipe,
    setTransactionMessageFeePayerSigner,
    setTransactionMessageLifetimeUsingBlockhash,
    signAndSendTransactionMessageWithSigners,
} from '@solana/kit';

function RecordMemoButton({ account, rpc, text }) {
    const signer = useWalletAccountTransactionSendingSigner(account, 'solana:devnet');
    return (
        <button
            onClick={async () => {
                try {
                    const { value: latestBlockhash } = await createSolanaRpc('https://api.devnet.solana.com')
                        .getLatestBlockhash()
                        .send();
                    const message = pipe(
                        createTransactionMessage({ version: 'legacy' }),
                        m => setTransactionMessageFeePayerSigner(signer, m),
                        m => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
                        m => appendTransactionMessageInstruction(getAddMemoInstruction({ memo: text }), m),
                    );
                    const signatureBytes = await signAndSendTransactionMessageWithSigners(message);
                    const base58Signature = getBase58Decoder().decode(signature);
                    window.alert(`View transaction: https://explorer.solana.com/tx/${base58Signature}?cluster=devnet`);
                } catch (e) {
                    console.error('Failed to record memo', e);
                }
            }}
        >
            Record Memo
        </button>
    );
}
```

### `useSignMessage(uiWalletAccount)`

Given a `UiWalletAccount`, this hook returns a function you can call to sign a byte array.

#### Arguments

A config object with the following properties:

- `message`: A `Uint8Array` of bytes to sign

#### Returns

An object with the following properties:

- `signature`: The 64-byte Ed25519 signature as a `Uint8Array`
- `signedMessage`: The `Uint8Array` of bytes signed by the wallet. These bytes might differ from the input bytes if the wallet modified the message

#### Example

```tsx
import { useSignMessage } from '@solana/react';

function SignMessageButton({ account, messageBytes }) {
    const signMessage = useSignMessage(account);
    return (
        <button
            onClick={async () => {
                try {
                    const { signature } = await signMessage({
                        message: messageBytes,
                    });
                    window.alert(`Signature bytes: ${signature.toString()}`);
                } catch (e) {
                    console.error('Failed to sign message', e);
                }
            }}
        >
            Sign Message
        </button>
    );
}
```

### `useSignTransaction(uiWalletAccount, chain)`

Given a `UiWalletAccount` and a chain that begins with `solana:`, this hook returns a function you can call to sign a serialized transaction.

#### Arguments

A config object with the following properties:

- `options`: An object with the following properties:
    - `minContextSlot`: A slot at which any blockhash/nonce in the transaction is known to exist. This may be used by the signer and/or RPC to determine the validity of the blockhashes/nonces it has observed.
- `transaction`: A `Uint8Array` of bytes that conforms to the [Solana transaction schema](https://solana.com/docs/core/transactions#transaction)

#### Returns

An object with the following properties:

- `signedTransaction`: A `Uint8Array` of bytes that conforms to the [Solana transaction schema](https://solana.com/docs/core/transactions#transaction)

#### Example

```tsx
import { useSignTransaction } from '@solana/react';

function SignTransactionButton({ account, transactionBytes }) {
    const signTransaction = useSignTransaction(account, 'solana:devnet');
    return (
        <button
            onClick={async () => {
                try {
                    const { signedTransaction } = await signTransaction({
                        transaction: transactionBytes,
                    });
                    window.alert(`Signed transaction bytes: ${signedTransaction.toString()}`);
                } catch (e) {
                    console.error('Failed to sign transaction', e);
                }
            }}
        >
            Sign Transaction
        </button>
    );
}
```

### `useSignAndSendTransaction(uiWalletAccount, chain)`

Given a `UiWalletAccount` and a chain that begins with `solana:`, this hook returns a function you can call to sign and send a serialized transaction.

#### Arguments

A config object with the following properties:

- `options`: An object with the following properties:
    - `minContextSlot`: A slot at which any blockhash/nonce in the transaction is known to exist. This may be used by the signer and/or RPC to determine the validity of the blockhashes/nonces it has observed.
- `transaction`: A `Uint8Array` of bytes that conforms to the [Solana transaction schema](https://solana.com/docs/core/transactions#transaction)

#### Returns

That function returns an object with the following properties:

- `signature`: A `Uint8Array` of bytes representing the signature of the sent transaction.

#### Example

```tsx
import { getBase58Decoder } from '@solana/codecs-strings';
import { useSignAndSendTransaction } from '@solana/react';

function SignAndSendTransactionButton({ account, transactionBytes }) {
    const signAndSendTransaction = useSignAndSendTransaction(account, 'solana:devnet');
    return (
        <button
            onClick={async () => {
                try {
                    const { signature } = await signAndSendTransaction({
                        transaction: transactionBytes,
                    });
                    const base58TransactionSignature = getBase58Decoder().decode(signature);
                    window.alert(
                        `View transaction: https://explorer.solana.com/tx/${base58TransactionSignature}?cluster=devnet`,
                    );
                } catch (e) {
                    console.error('Failed to send transaction', e);
                }
            }}
        >
            Sign and Send Transaction
        </button>
    );
}
```

### `useSignTransactions(uiWalletAccount, chain)`

Given a `UiWalletAccount` and a chain that begins with `solana:`, this hook returns a function you can call to sign one or more serialized transactions in a single request.

#### Arguments

One or more config objects with the following properties:

- `options`: An object with the following properties:
    - `minContextSlot`: A slot at which any blockhash/nonce in the transaction is known to exist. This may be used by the signer and/or RPC to determine the validity of the blockhashes/nonces it has observed.
- `transaction`: A `Uint8Array` of bytes that conforms to the [Solana transaction schema](https://solana.com/docs/core/transactions#transaction)

#### Returns

An array of objects with the following properties:

- `signedTransaction`: A `Uint8Array` of bytes that conforms to the [Solana transaction schema](https://solana.com/docs/core/transactions#transaction)

#### Example

```tsx
import { useSignTransactions } from '@solana/react';

function SignTransactionsButton({ account, transactionBytes1, transactionBytes2 }) {
    const signTransactions = useSignTransactions(account, 'solana:devnet');
    return (
        <button
            onClick={async () => {
                try {
                    const [{ signedTransaction: first }, { signedTransaction: second }] = await signTransactions(
                        { transaction: transactionBytes1 },
                        { transaction: transactionBytes2 },
                    );
                    window.alert(`Signed transaction bytes: ${first.toString()} and ${second.toString()}`);
                } catch (e) {
                    console.error('Failed to sign transactions', e);
                }
            }}
        >
            Sign Transactions
        </button>
    );
}
```

### `useSignAndSendTransactions(uiWalletAccount, chain)`

Given a `UiWalletAccount` and a chain that begins with `solana:`, this hook returns a function you can call to sign and send one or more serialized transactions in a single request.

#### Arguments

One or more config objects with the following properties:

- `options`: An object with the following properties:
    - `minContextSlot`: A slot at which any blockhash/nonce in the transaction is known to exist. This may be used by the signer and/or RPC to determine the validity of the blockhashes/nonces it has observed.
- `transaction`: A `Uint8Array` of bytes that conforms to the [Solana transaction schema](https://solana.com/docs/core/transactions#transaction)

#### Returns

An array of objects with the following properties:

- `signature`: A `Uint8Array` of bytes representing the signature of each sent transaction.

#### Example

```tsx
import { getBase58Decoder } from '@solana/codecs-strings';
import { useSignAndSendTransactions } from '@solana/react';

function SignAndSendTransactionsButton({ account, transactionBytes1, transactionBytes2 }) {
    const signAndSendTransactions = useSignAndSendTransactions(account, 'solana:devnet');
    return (
        <button
            onClick={async () => {
                try {
                    const [first, second] = await signAndSendTransactions(
                        { transaction: transactionBytes1 },
                        { transaction: transactionBytes2 },
                    );
                    const [firstSignature, secondSignature] = [first.signature, second.signature].map(signature =>
                        getBase58Decoder().decode(signature),
                    );
                    window.alert(
                        `View transactions: https://explorer.solana.com/tx/${firstSignature}?cluster=devnet and https://explorer.solana.com/tx/${secondSignature}?cluster=devnet`,
                    );
                } catch (e) {
                    console.error('Error returned by signAndSendTransactions', e);
                }
            }}
        >
            Sign and Send Transactions
        </button>
    );
}
```

### `useSelectedWalletAccount()`

This hook returns the wallet account that is selected, a function to change the selection, and a list of wallets which pass a filter condition you have provided. This hook must be used in a React Component inside `SelectedWalletAccountContextProvider`.

#### Arguments

This hook doesn't take any arguments.

#### Returns

The function returns an array consisting of the following elements in the order given:

- `SelectedWalletAccount`: This element could be a `UiWalletAccount` or `undefined`, and represents the selected wallet account.
- `SetSelectedWalletAccount`: A setter function to set the SelectedWalletAccount state. It takes an argument which could be a callback function `(prevState)=>newState` or `newState`.
- `filteredWallets`: List of filtered wallets using the function provided as `filterWallet` function in `SelectedWalletAccountContextProvider`

#### Example

```tsx
import React from 'react';
import { useSelectedWalletAccount } from '@solana/react';

function WalletInfo() {
    const [selectedAccount, setSelectedAccount, filteredWallets] = useSelectedWalletAccount();

    if (!selectedAccount) {
        return <div>No wallet selected</div>;
    }

    return (
        <div>
            <p>Address: {selectedAccount.address}</p>

            <button onClick={() => setSelectedAccount(undefined)}>Clear selection</button>

            <p>Available wallets: {filteredWallets.length}</p>
        </div>
    );
}
```

### `SelectedWalletAccountContextProvider`

This is a react context provider for `SelectedWalletAccountContext`. It provides its children access to the context by using either `useSelectedWalletAccount()` or `useContext(SelectedWalletAccountContext)`.

#### Props

The provider takes the following props:

- `filterWallet`: a function used to filter supported wallets. For example you might use this to restrict your app to wallets that support `solana:mainnet`.
- `stateSync`: an object to store the selected wallet, with these properties:
    - `storeSelectedWallet`: a function used to store a selected wallet account identifier (as a string) into persistent storage. For example this might write to local storage in the browser. The string stored is `${walletName}:${accountAddress}`.
    - `getSelectedWallet`: a function used to retrieve the persisted wallet account identifier from the persistent storage.
    - `deleteSelectedWallet`: clears any persisted wallet account identifier from the persistent storage.

#### Example

```tsx
import React from 'react';
import { SelectedWalletAccountContextProvider } from '@solana/react';
import type { UiWallet } from '@wallet-standard/react';

const STORAGE_KEY = 'solana-wallet-account-id';

export function App() {
    return (
        <SelectedWalletAccountContextProvider
            filterWallet={(wallet: UiWallet) => wallet.accounts.length > 0}
            stateSync={{
                getSelectedWallet: () => localStorage.getItem(STORAGE_KEY),
                storeSelectedWallet: accountKey => localStorage.setItem(STORAGE_KEY, accountKey),
                deleteSelectedWallet: () => localStorage.removeItem(STORAGE_KEY),
            }}
        >
            <WalletInfo />
        </SelectedWalletAccountContextProvider>
    );
}
```
