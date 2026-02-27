import { isTransactionMessageWithBlockhashLifetime, TransactionMessageWithBlockhashLifetime } from '../../blockhash';
import { CompiledTransactionMessage, CompiledTransactionMessageWithLifetime } from '../../compile/message';
import { TransactionMessageWithFeePayer } from '../../fee-payer';
import { TransactionMessageWithLifetime } from '../../lifetime';
import { TransactionMessage } from '../../transaction-message';
import { decompileTransactionMessage } from '../message';

// [DESCRIBE] decompileTransactionMessage
{
    // Returns a TransactionMessage
    {
        const compiledTransactionMessage = null as unknown as CompiledTransactionMessage &
            CompiledTransactionMessageWithLifetime;
        decompileTransactionMessage(compiledTransactionMessage) satisfies TransactionMessage;
    }

    // Has a fee payer
    {
        const compiledTransactionMessage = null as unknown as CompiledTransactionMessage &
            CompiledTransactionMessageWithLifetime;
        decompileTransactionMessage(compiledTransactionMessage) satisfies TransactionMessageWithFeePayer;
    }

    // Has a lifetime
    {
        const compiledTransactionMessage = null as unknown as CompiledTransactionMessage &
            CompiledTransactionMessageWithLifetime;
        decompileTransactionMessage(compiledTransactionMessage) satisfies TransactionMessageWithLifetime;
    }

    // Has the correct version
    {
        // for legacy
        {
            const compiledTransactionMessage = null as unknown as CompiledTransactionMessage &
                CompiledTransactionMessageWithLifetime & { version: 'legacy' };
            decompileTransactionMessage(compiledTransactionMessage) satisfies TransactionMessage & {
                version: 'legacy';
            };
        }

        // for v0
        {
            const compiledTransactionMessage = null as unknown as CompiledTransactionMessage &
                CompiledTransactionMessageWithLifetime & { version: 0 };
            decompileTransactionMessage(compiledTransactionMessage) satisfies TransactionMessage & { version: 0 };
        }
    }

    // Lifetime can be narrowed
    {
        {
            const compiledTransactionMessage = null as unknown as CompiledTransactionMessage &
                CompiledTransactionMessageWithLifetime;
            const transactionMessage = decompileTransactionMessage(compiledTransactionMessage);
            // @ts-expect-error Lifetime could be different
            transactionMessage satisfies TransactionMessageWithBlockhashLifetime;
            if (isTransactionMessageWithBlockhashLifetime(transactionMessage)) {
                transactionMessage satisfies TransactionMessageWithBlockhashLifetime;
            }
        }
    }

    // Version can be narrowed
    {
        const compiledTransactionMessage = null as unknown as CompiledTransactionMessage &
            CompiledTransactionMessageWithLifetime;
        const transactionMessage = decompileTransactionMessage(compiledTransactionMessage);
        // @ts-expect-error Version could be different
        transactionMessage satisfies TransactionMessage & { version: 'legacy' };
        if (transactionMessage.version === 'legacy') {
            transactionMessage satisfies TransactionMessage & { version: 'legacy' };
        } else if (transactionMessage.version === 0) {
            transactionMessage satisfies TransactionMessage & { version: 0 };
        }
    }
}
