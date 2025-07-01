import { type FetchAccountsConfig } from '@solana/accounts';
import type { GetMultipleAccountsApi, Rpc } from '@solana/rpc';
import {
    BaseTransactionMessage,
    CompiledTransactionMessage,
    CompiledTransactionMessageWithLifetime,
    decompileTransactionMessage,
    TransactionMessageWithFeePayer,
    TransactionMessageWithLifetime,
} from '@solana/transaction-messages';

import { fetchAddressesForLookupTables } from './fetch-lookup-tables';

type DecompileTransactionMessageFetchingLookupTablesConfig = FetchAccountsConfig & {
    lastValidBlockHeight?: bigint;
};

/**
 * Returns a {@link TransactionMessage} from a {@link CompiledTransactionMessage}. If any of the
 * accounts in the compiled message require an address lookup table to find their address, this
 * function will use the supplied RPC instance to fetch the contents of the address lookup table
 * from the network.
 *
 * @param rpc An object that supports the {@link GetMultipleAccountsApi} of the Solana RPC API
 * @param config
 */
export async function decompileTransactionMessageFetchingLookupTables(
    compiledTransactionMessage: CompiledTransactionMessage & CompiledTransactionMessageWithLifetime,
    rpc: Rpc<GetMultipleAccountsApi>,
    config?: DecompileTransactionMessageFetchingLookupTablesConfig,
): Promise<BaseTransactionMessage & TransactionMessageWithFeePayer & TransactionMessageWithLifetime> {
    const lookupTables =
        'addressTableLookups' in compiledTransactionMessage &&
        compiledTransactionMessage.addressTableLookups !== undefined &&
        compiledTransactionMessage.addressTableLookups.length > 0
            ? compiledTransactionMessage.addressTableLookups
            : [];
    const lookupTableAddresses = lookupTables.map(l => l.lookupTableAddress);

    const { lastValidBlockHeight, ...fetchAccountsConfig } = config ?? {};
    const addressesByLookupTableAddress =
        lookupTableAddresses.length > 0
            ? await fetchAddressesForLookupTables(lookupTableAddresses, rpc, fetchAccountsConfig)
            : {};

    return decompileTransactionMessage(compiledTransactionMessage, {
        addressesByLookupTableAddress,
        lastValidBlockHeight,
    });
}
