import {
    SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_ADDRESS_LOOKUP_TABLE_CONTENTS_MISSING,
    SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_ADDRESS_LOOKUP_TABLE_INDEX_OUT_OF_RANGE,
    SolanaError,
} from '@solana/errors';
import { AccountLookupMeta, AccountRole } from '@solana/instructions';

import { AddressesByLookupTableAddress } from '../../addresses-by-lookup-table-address';
import { getCompiledAddressTableLookups } from '../../compile/v0/address-table-lookups';

export function getAddressLookupMetas(
    compiledAddressTableLookups: ReturnType<typeof getCompiledAddressTableLookups>,
    addressesByLookupTableAddress: AddressesByLookupTableAddress,
): AccountLookupMeta[] {
    // check that all message lookups are known
    const compiledAddressTableLookupAddresses = compiledAddressTableLookups.map(l => l.lookupTableAddress);
    const missing = compiledAddressTableLookupAddresses.filter(a => addressesByLookupTableAddress[a] === undefined);
    if (missing.length > 0) {
        throw new SolanaError(SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_ADDRESS_LOOKUP_TABLE_CONTENTS_MISSING, {
            lookupTableAddresses: missing,
        });
    }

    const readOnlyMetas: AccountLookupMeta[] = [];
    const writableMetas: AccountLookupMeta[] = [];

    // we know that for each lookup, knownLookups[lookup.lookupTableAddress] is defined
    for (const lookup of compiledAddressTableLookups) {
        const addresses = addressesByLookupTableAddress[lookup.lookupTableAddress];
        const readonlyIndexes = lookup.readonlyIndexes;
        const writableIndexes = lookup.writableIndexes;

        const highestIndex = Math.max(...readonlyIndexes, ...writableIndexes);
        if (highestIndex >= addresses.length) {
            throw new SolanaError(
                SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_ADDRESS_LOOKUP_TABLE_INDEX_OUT_OF_RANGE,
                {
                    highestKnownIndex: addresses.length - 1,
                    highestRequestedIndex: highestIndex,
                    lookupTableAddress: lookup.lookupTableAddress,
                },
            );
        }

        const readOnlyForLookup: AccountLookupMeta[] = readonlyIndexes.map(r => ({
            address: addresses[r],
            addressIndex: r,
            lookupTableAddress: lookup.lookupTableAddress,
            role: AccountRole.READONLY,
        }));
        readOnlyMetas.push(...readOnlyForLookup);

        const writableForLookup: AccountLookupMeta[] = writableIndexes.map(w => ({
            address: addresses[w],
            addressIndex: w,
            lookupTableAddress: lookup.lookupTableAddress,
            role: AccountRole.WRITABLE,
        }));
        writableMetas.push(...writableForLookup);
    }

    return [...writableMetas, ...readOnlyMetas];
}
