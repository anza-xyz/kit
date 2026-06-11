import type { Address } from '@solana/addresses';

/**
 * Loaded ALT addresses as returned by `getTransaction`'s `meta.loadedAddresses`.
 *
 * The two arrays are kept in the same order the runtime uses to resolve
 * instruction account indices.
 *
 * @example
 * ```ts
 * const loaded: LoadedAddresses = rpcResponse.meta?.loadedAddresses ?? {
 *     readonly: [],
 *     writable: [],
 * };
 * ```
 */
export type LoadedAddresses = Readonly<{
    readonly: readonly Address[];
    writable: readonly Address[];
}>;
