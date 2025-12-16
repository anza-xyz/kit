import { Rpc } from '@solana/rpc';
import { GetMultipleAccountsApi } from '@solana/rpc-api';
import {
    CompiledTransactionMessage,
    CompiledTransactionMessageWithLifetime,
    isTransactionMessageWithBlockhashLifetime,
    TransactionMessage,
    TransactionMessageWithBlockhashLifetime,
    TransactionMessageWithFeePayer,
    TransactionMessageWithLifetime,
} from '@solana/transaction-messages';

import { decompileTransactionMessageFetchingLookupTables } from '../decompile-transaction-message-fetching-lookup-tables';

// [DESCRIBE] decompileTransactionMessageFetchingLookupTables
{
    const compiledTransactionMessage = null as unknown as CompiledTransactionMessage &
        CompiledTransactionMessageWithLifetime;

    const rpc = null as unknown as Rpc<GetMultipleAccountsApi>;

    // Returns a TransactionMessage
    void (async () => {
        const transactionMessage = await decompileTransactionMessageFetchingLookupTables(
            compiledTransactionMessage,
            rpc,
        );
        transactionMessage satisfies TransactionMessage;
    })();

    // Has a fee payer
    void (async () => {
        const transactionMessage = await decompileTransactionMessageFetchingLookupTables(
            compiledTransactionMessage,
            rpc,
        );
        transactionMessage satisfies TransactionMessageWithFeePayer;
    })();

    // Has a lifetime
    void (async () => {
        const transactionMessage = await decompileTransactionMessageFetchingLookupTables(
            compiledTransactionMessage,
            rpc,
        );
        transactionMessage satisfies TransactionMessageWithLifetime;
    })();

    // Lifetime can be narrowed
    void (async () => {
        // Given a function that only accepts a transaction message with a blockhash lifetime
        function acceptsTransactionMessageWithBlockhashLifetime(_msg: TransactionMessageWithBlockhashLifetime) {}

        const transactionMessage = await decompileTransactionMessageFetchingLookupTables(
            compiledTransactionMessage,
            rpc,
        );
        // @ts-expect-error Lifetime could be different
        acceptsTransactionMessageWithBlockhashLifetime(transactionMessage);
        if (isTransactionMessageWithBlockhashLifetime(transactionMessage)) {
            acceptsTransactionMessageWithBlockhashLifetime(transactionMessage);
        }
    })();

    // The version can be narrowed
    void (async () => {
        // Given a function that only accepts a non-legacy transaction message
        type TransactionMessageNotLegacy = Exclude<TransactionMessage, { version: 'legacy' }>;
        function acceptsNonLegacyTransactionMessage(_msg: TransactionMessageNotLegacy) {}

        const transactionMessage = await decompileTransactionMessageFetchingLookupTables(
            compiledTransactionMessage,
            rpc,
        );
        // @ts-expect-error Version could be legacy
        acceptsNonLegacyTransactionMessage(transactionMessage);
        if (transactionMessage.version === 0) {
            acceptsNonLegacyTransactionMessage(transactionMessage);
        }
    })();
}
