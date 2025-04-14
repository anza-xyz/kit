import { Address, getAddressComparator } from '@solana/addresses';
import { AccountRole } from '@solana/instructions';

import { OrderedAccounts } from '../compile/accounts';

type AddressTableLookup = Readonly<{
    /** The address of the address lookup table account. */
    lookupTableAddress: Address;
    /** Indices of accounts in a lookup table to load as read-only. */
    readableIndices: readonly number[];
    /** Indices of accounts in a lookup table to load as writable. */
    writableIndices: readonly number[];
}>;

export function getCompiledAddressTableLookups(orderedAccounts: OrderedAccounts): AddressTableLookup[] {
    const index: Record<Address, { readonly readableIndices: number[]; readonly writableIndices: number[] }> = {};
    for (const account of orderedAccounts) {
        if (!('lookupTableAddress' in account)) {
            continue;
        }
        const entry = (index[account.lookupTableAddress] ||= {
            readableIndices: [],
            writableIndices: [],
        });
        if (account.role === AccountRole.WRITABLE) {
            entry.writableIndices.push(account.addressIndex);
        } else {
            entry.readableIndices.push(account.addressIndex);
        }
    }
    return Object.keys(index)
        .sort(getAddressComparator())
        .map(lookupTableAddress => ({
            lookupTableAddress: lookupTableAddress as Address,
            ...index[lookupTableAddress as unknown as Address],
        }));
}
