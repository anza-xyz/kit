import { TransactionMessage } from '..';
import { setTransactionMessageComputeUnitLimit } from '../compute-unit-limit';

type LegacyTransactionMessage = Extract<TransactionMessage, { version: 'legacy' }>;
type V0TransactionMessage = Extract<TransactionMessage, { version: 0 }>;
type V1TransactionMessage = Extract<TransactionMessage, { version: 1 }>;

// [DESCRIBE] setTransactionMessageComputeUnitLimit
{
    // It accepts v1 messages
    {
        const message = null as unknown as V1TransactionMessage;
        const result = setTransactionMessageComputeUnitLimit(200_000, message);
        result satisfies V1TransactionMessage;
    }

    // It preserves input type
    {
        const message = null as unknown as V1TransactionMessage & { some: 1 };
        const result = setTransactionMessageComputeUnitLimit(200_000, message);
        result satisfies V1TransactionMessage & { some: 1 };
    }

    // It can set undefined value
    {
        const message = null as unknown as V1TransactionMessage & { some: 1 };
        const result = setTransactionMessageComputeUnitLimit(undefined, message);
        result satisfies V1TransactionMessage & { some: 1 };
    }

    // It rejects legacy messages
    {
        const message = null as unknown as LegacyTransactionMessage;
        // @ts-expect-error Legacy transactions are not supported
        setTransactionMessageComputeUnitLimit(200_000, message);
    }

    // It rejects v0 messages
    {
        const message = null as unknown as V0TransactionMessage;
        // @ts-expect-error V0 transactions are not supported
        setTransactionMessageComputeUnitLimit(200_000, message);
    }
}
