import { TransactionMessage } from '..';
import { getTransactionMessageComputeUnitPrice, setTransactionMessageComputeUnitPrice } from '../compute-unit-price';

type LegacyTransactionMessage = Extract<TransactionMessage, { version: 'legacy' }>;
type V0TransactionMessage = Extract<TransactionMessage, { version: 0 }>;
type V1TransactionMessage = Extract<TransactionMessage, { version: 1 }>;

// [DESCRIBE] setTransactionMessageComputeUnitPrice
{
    // It accepts legacy messages
    {
        const message = null as unknown as LegacyTransactionMessage;
        const result = setTransactionMessageComputeUnitPrice(10_000n, message);
        result satisfies LegacyTransactionMessage;
    }

    // It accepts v0 messages
    {
        const message = null as unknown as V0TransactionMessage;
        const result = setTransactionMessageComputeUnitPrice(10_000n, message);
        result satisfies V0TransactionMessage;
    }

    // It rejects v1 messages
    {
        const message = null as unknown as V1TransactionMessage;
        // @ts-expect-error v1 messages are not supported
        setTransactionMessageComputeUnitPrice(10_000n, message);
    }

    // It preserves input type for legacy
    {
        const message = null as unknown as LegacyTransactionMessage & { some: 1 };
        const result = setTransactionMessageComputeUnitPrice(10_000n, message);
        result satisfies LegacyTransactionMessage & { some: 1 };
    }

    // It preserves input type for v0
    {
        const message = null as unknown as V0TransactionMessage & { some: 1 };
        const result = setTransactionMessageComputeUnitPrice(10_000n, message);
        result satisfies V0TransactionMessage & { some: 1 };
    }

    // It can set undefined value for legacy
    {
        const message = null as unknown as LegacyTransactionMessage;
        const result = setTransactionMessageComputeUnitPrice(undefined, message);
        result satisfies LegacyTransactionMessage;
    }

    // It can set undefined value for v0
    {
        const message = null as unknown as V0TransactionMessage;
        const result = setTransactionMessageComputeUnitPrice(undefined, message);
        result satisfies V0TransactionMessage;
    }
}

// [DESCRIBE] getTransactionMessageComputeUnitPrice
{
    // It returns bigint | undefined for legacy messages
    {
        const message = null as unknown as LegacyTransactionMessage;
        const result = getTransactionMessageComputeUnitPrice(message);
        result satisfies bigint | undefined;
    }

    // It returns bigint | undefined for v0 messages
    {
        const message = null as unknown as V0TransactionMessage;
        const result = getTransactionMessageComputeUnitPrice(message);
        result satisfies bigint | undefined;
    }

    // It rejects v1 messages
    {
        const message = null as unknown as V1TransactionMessage;
        // @ts-expect-error v1 messages are not supported
        getTransactionMessageComputeUnitPrice(message);
    }
}
