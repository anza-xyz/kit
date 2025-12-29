import { isTransactionMessageWithBlockhashLifetime, TransactionMessageWithBlockhashLifetime } from '../blockhash';
import { CompiledTransactionMessage, CompiledTransactionMessageWithLifetime } from '../compile/message';
import { decompileTransactionMessage } from '../decompile-message';
import { TransactionMessageWithFeePayer } from '../fee-payer';
import { TransactionMessageWithLifetime } from '../lifetime';
import { TransactionMessage } from '../transaction-message';

// [DESCRIBE] decompileTransactionMessage
{
    const compiledTransactionMessage = null as unknown as CompiledTransactionMessage &
        CompiledTransactionMessageWithLifetime;

    // Returns a TransactionMessage
    {
        decompileTransactionMessage(compiledTransactionMessage) satisfies TransactionMessage;
    }

    // Has a fee payer
    {
        decompileTransactionMessage(compiledTransactionMessage) satisfies TransactionMessageWithFeePayer;
    }

    // Has a lifetime
    {
        decompileTransactionMessage(compiledTransactionMessage) satisfies TransactionMessageWithLifetime;
    }

    // Lifetime can be narrowed
    {
        const transactionMessage = decompileTransactionMessage(compiledTransactionMessage);
        // @ts-expect-error Lifetime could be different
        transactionMessage satisfies TransactionMessageWithBlockhashLifetime;
        if (isTransactionMessageWithBlockhashLifetime(transactionMessage)) {
            transactionMessage satisfies TransactionMessageWithBlockhashLifetime;
        }
    }

    // The version can be narrowed
    {
        // Given a function that only accepts a non-legacy transaction message
        type TransactionMessageNotLegacy = Exclude<TransactionMessage, { version: 'legacy' }>;
        const transactionMessage = decompileTransactionMessage(compiledTransactionMessage);
        // @ts-expect-error Version could be legacy
        transactionMessage satisfies TransactionMessageNotLegacy;
        if (transactionMessage.version === 0) {
            transactionMessage satisfies TransactionMessageNotLegacy;
        }
    }
}
