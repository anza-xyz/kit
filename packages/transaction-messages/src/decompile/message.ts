import { SOLANA_ERROR__TRANSACTION__VERSION_NUMBER_NOT_SUPPORTED, SolanaError } from '@solana/errors';

import { CompiledTransactionMessage, CompiledTransactionMessageWithLifetime } from '..';
import { AddressesByLookupTableAddress } from '../addresses-by-lookup-table-address';
import { TransactionMessageWithFeePayer } from '../fee-payer';
import { TransactionMessageWithLifetime } from '../lifetime';
import { TransactionMessage } from '../transaction-message';
import { decompileTransactionMessage as decompileLegacyTransactionMessage } from './legacy/message';
import { decompileTransactionMessage as decompileV0TransactionMessage } from './v0/message';

export type DecompileTransactionMessageConfig = {
    /**
     * Only used for V0 transactions. If the compiled message loads addresses from one or more
     * address lookup tables, you will have to supply a map of those tables to an array of
     * the addresses they contained at the time that the transaction message was constructed.
     *
     * @see {@link decompileTransactionMessageFetchingLookupTables} if you do not already have this.
     */
    addressesByLookupTableAddress?: AddressesByLookupTableAddress;
    /**
     * If the compiled message has a blockhash-based lifetime constraint, you will have to supply
     * the block height after which that blockhash is no longer valid for use as a lifetime
     * constraint.
     */
    lastValidBlockHeight?: bigint;
};

/**
 * Converts the type of transaction message data structure appropriate for execution on the network
 * to the type of transaction message data structure designed for use in your application.
 *
 * Because compilation is a lossy process, you can not fully reconstruct a source message from a
 * compiled message without extra information. In order to faithfully reconstruct the original
 * source message you will need to supply supporting details about the lifetime constraint and the
 * concrete addresses of any accounts sourced from account lookup tables (for v0 transactions).
 *
 * @see {@link compileTransactionMessage}
 */
export function decompileTransactionMessage(
    compiledTransactionMessage: CompiledTransactionMessage &
        CompiledTransactionMessageWithLifetime & { version: 'legacy' },
    config?: DecompileTransactionMessageConfig,
): TransactionMessage & TransactionMessageWithFeePayer & TransactionMessageWithLifetime & { version: 'legacy' };
export function decompileTransactionMessage(
    compiledTransactionMessage: CompiledTransactionMessage & CompiledTransactionMessageWithLifetime & { version: 0 },
    config?: DecompileTransactionMessageConfig,
): TransactionMessage & TransactionMessageWithFeePayer & TransactionMessageWithLifetime & { version: 0 };
export function decompileTransactionMessage(
    compiledTransactionMessage: CompiledTransactionMessage & CompiledTransactionMessageWithLifetime,
    config?: DecompileTransactionMessageConfig,
): TransactionMessage & TransactionMessageWithFeePayer & TransactionMessageWithLifetime;
export function decompileTransactionMessage(
    compiledTransactionMessage: CompiledTransactionMessage & CompiledTransactionMessageWithLifetime,
    config?: DecompileTransactionMessageConfig,
): TransactionMessage & TransactionMessageWithFeePayer & TransactionMessageWithLifetime {
    const version = compiledTransactionMessage.version;

    if (version === 'legacy') {
        return decompileLegacyTransactionMessage(compiledTransactionMessage, config);
    } else if (version === 0) {
        return decompileV0TransactionMessage(compiledTransactionMessage, config);
    } else {
        throw new SolanaError(SOLANA_ERROR__TRANSACTION__VERSION_NUMBER_NOT_SUPPORTED, {
            version,
        });
    }
}
