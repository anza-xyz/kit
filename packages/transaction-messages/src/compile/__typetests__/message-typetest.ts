import {
    CompiledTransactionMessage,
    CompiledTransactionMessageWithLifetime,
    TransactionMessage,
    TransactionMessageWithFeePayer,
    TransactionMessageWithLifetime,
} from '../..';
import { compileTransactionMessage } from '../message';

// [DESCRIBE] compileTransactionMessage
{
    // It returns a CompiledTransactionMessage
    {
        // For legacy
        {
            const message = null as unknown as TransactionMessage &
                TransactionMessageWithFeePayer & { version: 'legacy' };
            compileTransactionMessage(message) satisfies CompiledTransactionMessage;
        }

        // For v0
        {
            const message = null as unknown as TransactionMessage & TransactionMessageWithFeePayer & { version: 0 };
            compileTransactionMessage(message) satisfies CompiledTransactionMessage;
        }
    }

    // It does not satisfy `CompiledTransactionMessageWithLifetime` if the source message does not have a lifetime constraint
    {
        // For legacy
        {
            const message = null as unknown as TransactionMessage &
                TransactionMessageWithFeePayer & { version: 'legacy' };
            const compiled = compileTransactionMessage(message);
            // @ts-expect-error Should not have a lifetime token
            compiled satisfies CompiledTransactionMessageWithLifetime;
        }

        // For v0
        {
            const message = null as unknown as TransactionMessage & TransactionMessageWithFeePayer & { version: 0 };
            const compiled = compileTransactionMessage(message);
            // @ts-expect-error Should not have a lifetime token
            compiled satisfies CompiledTransactionMessageWithLifetime;
        }
    }

    // It satisfies `CompiledTransactionMessageWithLifetime` if the source message has a lifetime constraint
    {
        // For legacy
        {
            const message = null as unknown as TransactionMessage &
                TransactionMessageWithFeePayer &
                TransactionMessageWithLifetime & { version: 'legacy' };
            const compiled = compileTransactionMessage(message);
            compiled satisfies CompiledTransactionMessageWithLifetime;
        }

        // For v0
        {
            const message = null as unknown as TransactionMessage &
                TransactionMessageWithFeePayer &
                TransactionMessageWithLifetime & { version: 0 };
            const compiled = compileTransactionMessage(message);
            compiled satisfies CompiledTransactionMessageWithLifetime;
        }
    }

    // It forwards a legacy version from the source message to the compiled message
    {
        const message = null as unknown as TransactionMessage & TransactionMessageWithFeePayer & { version: 'legacy' };
        compileTransactionMessage(message) satisfies CompiledTransactionMessage & { version: 'legacy' };
    }

    // It forwards a v0 version from the source message to the compiled message
    {
        const message = null as unknown as TransactionMessage & TransactionMessageWithFeePayer & { version: 0 };
        compileTransactionMessage(message) satisfies CompiledTransactionMessage & { version: 0 };
    }
}
