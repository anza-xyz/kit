---
'@solana/react': minor
---

Added `createProgramHooks`, a factory that builds typed React hooks over a Codama-generated program plugin installed on the client published by `ClientProvider`.

The generated plugin is already a fully typed runtime map — codecs with `fetch` helpers, instruction builders with `sendTransaction`, PDA finders — so a single factory covers every program with no per-program code generation:

```tsx
const { useTrackedAccount, useSendInstruction } = createProgramHooks<TokenClient>()('token');

function MintSupply({ mint }: { mint: Address }) {
    const { data } = useTrackedAccount('mint', mint);
    const transfer = useSendInstruction('transfer');
    return <span>{data?.value?.supply}</span>;
}
```

Each hook maps one plugin function onto one existing primitive from this package, and is named for the primitive it uses. `useAccount`, `useMaybeAccount`, `useAllAccounts`, `useAllMaybeAccounts` and `usePda` issue a single request through `useRequest`; `useTrackedAccount` additionally opens a subscription through `useTrackedData`, decoding both the initial `getAccountInfo` response and later `accountNotifications` with the plugin's own codec; `useSendInstruction` builds, signs and sends through `useAction`. Passing a `null` address, address list or seed object disables a hook rather than requiring a conditional call.
