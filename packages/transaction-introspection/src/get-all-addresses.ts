import type { Address } from '@solana/addresses';
import type { CompiledTransactionMessage } from '@solana/transaction-messages';

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

/**
 * Returns a flat `Address[]` indexable by every account-index appearing in a
 * compiled transaction message's instructions.
 *
 * The Solana runtime resolves indices in this order:
 *
 * 1. Static accounts (the addresses serialized into the message itself).
 * 2. ALT-loaded writable accounts.
 * 3. ALT-loaded readonly accounts.
 *
 * For a legacy transaction (no address lookup tables), `loadedAddresses` may
 * be omitted; only the static accounts are returned.
 *
 * Most callers should use {@link getAccountMetasFromCompiledTransactionMessage}
 * instead — it returns the same ordering with `AccountRole` bits attached,
 * which is what the auto-generated `parseXInstruction` clients expect. This
 * helper is exposed for the rare case where you only need the address strings
 * (e.g. an indexer indexing by account-index without caring about roles).
 *
 * @example
 * ```ts
 * const allKeys = getAllAddressesFromCompiledTransactionMessage(
 *     compiled,
 *     rpcResponse.meta?.loadedAddresses,
 * );
 * const programAddress = allKeys[ix.programAddressIndex];
 * ```
 */
export function getAllAddressesFromCompiledTransactionMessage(
    compiledMessage: CompiledTransactionMessage,
    loadedAddresses?: LoadedAddresses | null,
): Address[] {
    const all: Address[] = [...compiledMessage.staticAccounts];
    if (loadedAddresses) {
        all.push(...loadedAddresses.writable, ...loadedAddresses.readonly);
    }
    return all;
}
