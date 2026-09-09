import type { Address } from '@solana/kit';
import { useMemo } from 'react';

import {
    type Base64AccountValue,
    decodeAccountValue,
    getAccountEntry,
    getInstructionEntry,
    getPdaEntry,
    type ProgramHooksClient,
} from './programNamespace';
import type {
    DecodedProgramAccount,
    FetchedMaybeProgramAccount,
    FetchedMaybeProgramAccounts,
    FetchedProgramAccount,
    FetchedProgramAccounts,
    ProgramAccountKey,
    ProgramInstructionInput,
    ProgramInstructionKey,
    ProgramPdaKey,
    ProgramPdaResult,
    ProgramPdaSeeds,
    ProgramSendConfig,
    ProgramSendResult,
} from './programPlugin';
import { type ActionResult, useAction } from './useAction';
import { useClientCapability } from './useClientCapability';
import { type RequestResult, useRequest, type UseRequestOptions } from './useRequest';
import { useStableValue } from './useStableValue';
import { type TrackedDataResult, useTrackedData, type UseTrackedDataOptions } from './useTrackedData';

/**
 * The hooks produced by {@link createProgramHooks} for one program plugin.
 *
 * Each hook is a direct mapping from one function on the plugin to one of this package's
 * primitives, and its name states which: the `use*Account*` hooks that read through the plugin's
 * `fetch*` family issue a single request via {@link useRequest}, while {@link
 * ProgramHooks.useTrackedAccount | useTrackedAccount} additionally opens a subscription via
 * {@link useTrackedData}.
 *
 * @typeParam TPlugin - The Codama-generated program plugin the hooks read from.
 */
export type ProgramHooks<TPlugin> = {
    /**
     * Fetches one account through the plugin's `fetch`, resolving to the decoded `Account`
     * envelope. Rejects if the account does not exist — use {@link
     * ProgramHooks.useMaybeAccount | useMaybeAccount} when absence is expected.
     *
     * Issues one request when the address changes; it opens no subscription and so does not
     * observe later on-chain writes. Reach for {@link ProgramHooks.useTrackedAccount |
     * useTrackedAccount} when the UI must stay live.
     *
     * Passing a `null` address disables the hook (`status: 'disabled'`).
     */
    useAccount<TKey extends ProgramAccountKey<TPlugin>>(
        key: TKey,
        address: Address | null,
        options?: UseRequestOptions,
    ): RequestResult<FetchedProgramAccount<TPlugin, TKey>>;

    /**
     * Fetches several accounts of the same type in one request through the plugin's `fetchAll`.
     * Rejects if any of the accounts does not exist — use {@link
     * ProgramHooks.useAllMaybeAccounts | useAllMaybeAccounts} when absence is expected.
     *
     * Issues one request when the address list changes by value; it opens no subscription and so
     * does not observe later on-chain writes.
     *
     * Passing a `null` address list disables the hook (`status: 'disabled'`).
     */
    useAllAccounts<TKey extends ProgramAccountKey<TPlugin>>(
        key: TKey,
        addresses: readonly Address[] | null,
        options?: UseRequestOptions,
    ): RequestResult<FetchedProgramAccounts<TPlugin, TKey>>;

    /**
     * Fetches several accounts of the same type in one request through the plugin's
     * `fetchAllMaybe`, resolving to a `MaybeAccount` for each so that absent accounts are reported
     * rather than thrown.
     *
     * Issues one request when the address list changes by value; it opens no subscription and so
     * does not observe later on-chain writes.
     *
     * Passing a `null` address list disables the hook (`status: 'disabled'`).
     */
    useAllMaybeAccounts<TKey extends ProgramAccountKey<TPlugin>>(
        key: TKey,
        addresses: readonly Address[] | null,
        options?: UseRequestOptions,
    ): RequestResult<FetchedMaybeProgramAccounts<TPlugin, TKey>>;

    /**
     * Fetches one account through the plugin's `fetchMaybe`, resolving to a `MaybeAccount` so that
     * an absent account is reported as `exists: false` rather than thrown.
     *
     * Issues one request when the address changes; it opens no subscription and so does not
     * observe later on-chain writes.
     *
     * Passing a `null` address disables the hook (`status: 'disabled'`).
     */
    useMaybeAccount<TKey extends ProgramAccountKey<TPlugin>>(
        key: TKey,
        address: Address | null,
        options?: UseRequestOptions,
    ): RequestResult<FetchedMaybeProgramAccount<TPlugin, TKey>>;

    /**
     * Derives a program derived address from the plugin's `find*Pda` function.
     *
     * Passing `null` seeds disables the hook (`status: 'disabled'`).
     */
    usePda<TKey extends ProgramPdaKey<TPlugin>>(
        key: TKey,
        seeds: ProgramPdaSeeds<TPlugin, TKey> | null,
        options?: UseRequestOptions,
    ): RequestResult<ProgramPdaResult<TPlugin, TKey>>;

    /**
     * Builds, signs and sends an instruction through the plugin's builder and its
     * `sendTransaction`, as a {@link useAction} mutation.
     *
     * `dispatch` takes the instruction builder's own input plus an optional `sendTransaction`
     * config; the hook's abort signal is merged into that config, so a caller-supplied
     * `abortSignal` still cancels the send.
     */
    useSendInstruction<TKey extends ProgramInstructionKey<TPlugin>>(
        key: TKey,
    ): ActionResult<
        [input: ProgramInstructionInput<TPlugin, TKey>, config?: ProgramSendConfig<TPlugin, TKey>],
        ProgramSendResult<TPlugin, TKey>
    >;

    /**
     * Keeps one account live: an initial `getAccountInfo` fetch followed by `accountNotifications`
     * updates, slot-deduplicated by {@link useTrackedData} and decoded with the program plugin's
     * own codec.
     *
     * This holds a subscription open for as long as the component is mounted, which costs an
     * RPC-subscription slot per address. Prefer {@link ProgramHooks.useAccount | useAccount} when
     * a value read once at mount is enough.
     *
     * `data` is the `SolanaRpcResponse` envelope — read `data?.value`, which is `null` while the
     * account does not exist and after it is closed.
     *
     * Requires `rpcSubscriptions` on the client in addition to the program plugin.
     *
     * Passing a `null` address disables the hook (`status: 'disabled'`).
     */
    useTrackedAccount<TKey extends ProgramAccountKey<TPlugin>>(
        key: TKey,
        address: Address | null,
        options?: UseTrackedDataOptions,
    ): TrackedDataResult<DecodedProgramAccount<TPlugin, TKey> | null>;
};

type UnionToIntersection<TUnion> = (TUnion extends unknown ? (member: TUnion) => void : never) extends (
    member: infer TIntersection,
) => void
    ? TIntersection
    : never;

type IsUnion<TType> = [TType] extends [UnionToIntersection<TType>] ? false : true;

/**
 * The `capability` argument of the direct call form. TypeScript never infers a type parameter that
 * also has a default, so when only `TNamespace` is given explicitly, `TCapability` resolves to its
 * default — the union of every key. A single-key namespace makes that union one literal and the
 * call is fully typed; a multi-key namespace would silently type the hooks against the union of
 * every installed plugin, so the parameter degrades to an instructive error literal instead of
 * accepting any key.
 */
type CapabilityArgument<TCapability extends string> =
    IsUnion<TCapability> extends true
        ? 'Error: the capability cannot be inferred from a client type with several plugins. Use the curried form createProgramHooks<Client>()(capability), or pass the capability as a second type argument.'
        : TCapability;

/**
 * Builds typed React hooks over a Codama-generated program plugin installed on the client
 * published by {@link ClientProvider}.
 *
 * The plugin is already a fully typed runtime map — codecs with `fetch` helpers, instruction
 * builders with `sendTransaction`, PDA finders — so one factory covers every program with no
 * per-program code generation. Each returned hook is a thin mapping onto one of this package's
 * primitives, named for the primitive it uses.
 *
 * Point `TNamespace` at the client type itself and an uninstalled plugin is a compile-time error
 * rather than a first-render runtime error. Because the client type carries every installed
 * capability, the capability literal must be recovered through the curried call —
 * `createProgramHooks<Client>()` — so the returned function can infer it from the argument. The
 * direct call `createProgramHooks<{ token: TokenPlugin }>('token')` remains available for a
 * hand-written single-plugin slice.
 *
 * @typeParam TNamespace - The client type (or the slice of it the plugin occupies, e.g. `{ token:
 *   TokenPlugin }`). The `capability` argument is constrained to its keys, so a mismatched string
 *   is a compile-time error.
 * @param capability - The key the plugin is installed under, e.g. `'token'`.
 *
 * @example
 * ```tsx
 * import { createTokenClient } from './client';
 *
 * type TokenClient = Awaited<ReturnType<typeof createTokenClient>>;
 *
 * const { useTrackedAccount, useSendInstruction } = createProgramHooks<TokenClient>()('token');
 *
 * function MintSupply({ mint }: { mint: Address }) {
 *     const { data } = useTrackedAccount('mint', mint);
 *     const transfer = useSendInstruction('transfer');
 *     return <span>{data?.value?.supply}</span>;
 * }
 * ```
 *
 * @see {@link ProgramHooks}
 */
export function createProgramHooks<TNamespace extends object>(): <TCapability extends string & keyof TNamespace>(
    capability: TCapability,
) => ProgramHooks<TNamespace[TCapability]>;
export function createProgramHooks<
    TNamespace extends object,
    TCapability extends string & keyof TNamespace = string & keyof TNamespace,
>(capability: CapabilityArgument<TCapability>): ProgramHooks<TNamespace[TCapability]>;
export function createProgramHooks(capability?: string): unknown {
    if (capability === undefined) {
        return (inferredCapability: string) => buildProgramHooks(inferredCapability);
    }
    return buildProgramHooks(capability);
}

function buildProgramHooks<TPlugin>(capability: string): ProgramHooks<TPlugin> {
    const providerHint = `Install the "${capability}" program plugin on the client you pass to <ClientProvider>.`;

    function useProgramClient(hookName: string, ...extraCapabilities: string[]): ProgramHooksClient {
        return useClientCapability<ProgramHooksClient>({
            capability: [capability, ...extraCapabilities],
            hookName,
            providerHint,
        });
    }

    return {
        useAccount(key, address, options) {
            const client = useProgramClient('useAccount', 'rpc');
            const source = useMemo(() => {
                if (address == null) return null;
                return (abortSignal: AbortSignal) =>
                    getAccountEntry(client, capability, key).fetch(address, { abortSignal });
            }, [client, key, address]);
            return useRequest(source, options) as RequestResult<never>;
        },

        useAllAccounts(key, addresses, options) {
            const client = useProgramClient('useAllAccounts', 'rpc');
            const stableAddresses = useStableValue(addresses);
            const source = useMemo(() => {
                if (stableAddresses == null) return null;
                return (abortSignal: AbortSignal) =>
                    getAccountEntry(client, capability, key).fetchAll([...stableAddresses], { abortSignal });
            }, [client, key, stableAddresses]);
            return useRequest(source, options) as RequestResult<never>;
        },

        useAllMaybeAccounts(key, addresses, options) {
            const client = useProgramClient('useAllMaybeAccounts', 'rpc');
            const stableAddresses = useStableValue(addresses);
            const source = useMemo(() => {
                if (stableAddresses == null) return null;
                return (abortSignal: AbortSignal) =>
                    getAccountEntry(client, capability, key).fetchAllMaybe([...stableAddresses], { abortSignal });
            }, [client, key, stableAddresses]);
            return useRequest(source, options) as RequestResult<never>;
        },

        useMaybeAccount(key, address, options) {
            const client = useProgramClient('useMaybeAccount', 'rpc');
            const source = useMemo(() => {
                if (address == null) return null;
                return (abortSignal: AbortSignal) =>
                    getAccountEntry(client, capability, key).fetchMaybe(address, { abortSignal });
            }, [client, key, address]);
            return useRequest(source, options) as RequestResult<never>;
        },

        usePda(key, seeds, options) {
            const client = useProgramClient('usePda');
            const stableSeeds = useStableValue(seeds);
            const source = useMemo(() => {
                if (stableSeeds == null) return null;
                return async () => await getPdaEntry(client, capability, key)(stableSeeds as never);
            }, [client, key, stableSeeds]);
            return useRequest(source, options) as RequestResult<never>;
        },

        useSendInstruction<TKey extends ProgramInstructionKey<TPlugin>>(key: TKey) {
            const client = useProgramClient('useSendInstruction');
            return useAction<
                [input: ProgramInstructionInput<TPlugin, TKey>, config?: ProgramSendConfig<TPlugin, TKey>],
                ProgramSendResult<TPlugin, TKey>
            >((abortSignal, input, config) => {
                const instruction = getInstructionEntry(client, capability, key)(input as never);
                const sendConfig = config as { abortSignal?: AbortSignal } | undefined;
                return instruction.sendTransaction({
                    ...sendConfig,
                    abortSignal: sendConfig?.abortSignal
                        ? AbortSignal.any([abortSignal, sendConfig.abortSignal])
                        : abortSignal,
                }) as Promise<ProgramSendResult<TPlugin, TKey>>;
            });
        },

        useTrackedAccount(key, address, options) {
            const client = useProgramClient('useTrackedAccount', 'rpc', 'rpcSubscriptions');
            const spec = useMemo(() => {
                if (address == null) return null;
                const entry = getAccountEntry(client, capability, key);
                const decode = (value: Base64AccountValue) => decodeAccountValue(entry, value);
                return {
                    initialValueMapper: decode,
                    initialValueSource: client.rpc.getAccountInfo(address, { encoding: 'base64' }),
                    streamSource: client.rpcSubscriptions.accountNotifications(address, { encoding: 'base64' }),
                    streamValueMapper: decode,
                };
            }, [client, key, address]);
            return useTrackedData(spec, options) as TrackedDataResult<never>;
        },
    };
}
