import { TransactionMessage } from '..';
import {
    getTransactionMessagePriorityFeeLamports,
    setTransactionMessagePriorityFeeLamports,
} from '../priority-fee-lamports';

type LegacyTransactionMessage = Extract<TransactionMessage, { version: 'legacy' }>;
type V0TransactionMessage = Extract<TransactionMessage, { version: 0 }>;
type V1TransactionMessage = Extract<TransactionMessage, { version: 1 }>;

// [DESCRIBE] setTransactionMessagePriorityFeeLamports
{
    // It accepts v1 messages
    {
        const message = null as unknown as V1TransactionMessage;
        const result = setTransactionMessagePriorityFeeLamports(5_000n, message);
        result satisfies V1TransactionMessage;
    }

    // It rejects legacy messages
    {
        const message = null as unknown as LegacyTransactionMessage;
        // @ts-expect-error legacy messages are not supported
        setTransactionMessagePriorityFeeLamports(5_000n, message);
    }

    // It rejects v0 messages
    {
        const message = null as unknown as V0TransactionMessage;
        // @ts-expect-error v0 messages are not supported
        setTransactionMessagePriorityFeeLamports(5_000n, message);
    }

    // It preserves input type
    {
        const message = null as unknown as V1TransactionMessage & { some: 1 };
        const result = setTransactionMessagePriorityFeeLamports(5_000n, message);
        result satisfies V1TransactionMessage & { some: 1 };
    }

    // It can set undefined value
    {
        const message = null as unknown as V1TransactionMessage & { some: 1 };
        const result = setTransactionMessagePriorityFeeLamports(undefined, message);
        result satisfies V1TransactionMessage & { some: 1 };
    }
}

// [DESCRIBE] getTransactionMessagePriorityFeeLamports
{
    // It returns bigint | undefined for v1 messages
    {
        const message = null as unknown as V1TransactionMessage;
        const result = getTransactionMessagePriorityFeeLamports(message);
        result satisfies bigint | undefined;
    }

    // It rejects legacy messages
    {
        const message = null as unknown as LegacyTransactionMessage;
        // @ts-expect-error legacy messages are not supported
        getTransactionMessagePriorityFeeLamports(message);
    }

    // It rejects v0 messages
    {
        const message = null as unknown as V0TransactionMessage;
        // @ts-expect-error v0 messages are not supported
        getTransactionMessagePriorityFeeLamports(message);
    }
}
