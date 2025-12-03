import { Address, getAddressComparator } from '@solana/addresses';
import { AccountRole } from '@solana/instructions';

import { OrderedAccounts } from '../compile/accounts';

type AddressTableLookup = Readonly<{
    /** The address of the address lookup table account. */
    lookupTableAddress: Address;
    /** Indexes of accounts in a lookup table to load as read-only. */
    readonlyIndexes: readonly number[];
    /** Indexes of accounts in a lookup table to load as writable. */
    writableIndexes: readonly number[];
}>;

export function getCompiledAddressTableLookups(orderedAccounts: OrderedAccounts): AddressTableLookup[] {
    const index: Record<
        Address,
        Readonly<{
            [K in keyof Omit<AddressTableLookup, 'lookupTableAddress'>]: number[];
        }>
    > = {};
    for (const account of orderedAccounts) {
        if (!('lookupTableAddress' in account)) {
            continue;
        }
        const entry = (index[account.lookupTableAddress] ||= {
            readonlyIndexes: [],
            writableIndexes: [],
        });
        if (account.role === AccountRole.WRITABLE) {
            entry.writableIndexes.push(account.addressIndex);
        } else {
            entry.readonlyIndexes.push(account.addressIndex);
        }
    }
    return Object.keys(index)
        .sort(getAddressComparator())
        .map(lookupTableAddress => ({
            lookupTableAddress: lookupTableAddress as Address,
            ...index[lookupTableAddress as unknown as Address],
        }));
}
