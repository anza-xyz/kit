import {
    setTransactionMessageComputeUnitLimit,
    setTransactionMessageConfig,
    setTransactionMessageHeapSize,
    setTransactionMessageLoadedAccountsDataSizeLimit,
    setTransactionMessagePriorityFeeLamports,
    TransactionConfig,
} from '../transaction-config';
import { TransactionMessage } from '../transaction-message';

type LegacyTransactionMessage = Extract<TransactionMessage, { version: 'legacy' }>;
type V0TransactionMessage = Extract<TransactionMessage, { version: 0 }>;
type V1TransactionMessage = Extract<TransactionMessage, { version: 1 }>;

// [DESCRIBE] setTransactionMessageConfig
{
    const mockConfig = null as unknown as TransactionConfig;

    // It accepts v1 messages
    {
        const message = null as unknown as V1TransactionMessage;
        const result = setTransactionMessageConfig(mockConfig, message);
        result satisfies V1TransactionMessage;
    }

    // It preserves input message type
    {
        const message = null as unknown as V1TransactionMessage & { some: 1 };
        const result = setTransactionMessageConfig(mockConfig, message);
        result satisfies V1TransactionMessage & { some: 1 };
    }

    // It rejects legacy messages
    {
        const message = null as unknown as LegacyTransactionMessage;
        // @ts-expect-error Legacy transactions are not supported
        setTransactionMessageConfig(mockConfig, message);
    }

    // It rejects v0 messages
    {
        const message = null as unknown as V0TransactionMessage;
        // @ts-expect-error V0 transactions are not supported
        setTransactionMessageConfig(mockConfig, message);
    }
}

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

// [DESCRIBE] setTransactionMessageHeapSize
{
    // It accepts v1 messages
    {
        const message = null as unknown as V1TransactionMessage;
        const result = setTransactionMessageHeapSize(32_768, message);
        result satisfies V1TransactionMessage;
    }

    // It preserves input message type
    {
        const message = null as unknown as V1TransactionMessage & { some: 1 };
        const result = setTransactionMessageHeapSize(32_768, message);
        result satisfies V1TransactionMessage & { some: 1 };
    }

    // It can set undefined value
    {
        const message = null as unknown as V1TransactionMessage & { some: 1 };
        const result = setTransactionMessageHeapSize(undefined, message);
        result satisfies V1TransactionMessage & { some: 1 };
    }

    // It rejects legacy messages
    {
        const message = null as unknown as LegacyTransactionMessage;
        // @ts-expect-error Legacy transactions are not supported
        setTransactionMessageHeapSize(32_768, message);
    }

    // It rejects v0 messages
    {
        const message = null as unknown as V0TransactionMessage;
        // @ts-expect-error V0 transactions are not supported
        setTransactionMessageHeapSize(32_768, message);
    }
}

// [DESCRIBE] setTransactionMessageLoadedAccountsDataSizeLimit
{
    // It accepts v1 messages
    {
        const message = null as unknown as V1TransactionMessage;
        const result = setTransactionMessageLoadedAccountsDataSizeLimit(64_000, message);
        result satisfies V1TransactionMessage;
    }

    // It preserves input message type
    {
        const message = null as unknown as V1TransactionMessage & { some: 1 };
        const result = setTransactionMessageLoadedAccountsDataSizeLimit(64_000, message);
        result satisfies V1TransactionMessage & { some: 1 };
    }

    // It can set undefined value
    {
        const message = null as unknown as V1TransactionMessage & { some: 1 };
        const result = setTransactionMessageLoadedAccountsDataSizeLimit(undefined, message);
        result satisfies V1TransactionMessage & { some: 1 };
    }

    // It rejects legacy messages
    {
        const message = null as unknown as LegacyTransactionMessage;
        // @ts-expect-error Legacy transactions are not supported
        setTransactionMessageLoadedAccountsDataSizeLimit(64_000, message);
    }

    // It rejects v0 messages
    {
        const message = null as unknown as V0TransactionMessage;
        // @ts-expect-error V0 transactions are not supported
        setTransactionMessageLoadedAccountsDataSizeLimit(64_000, message);
    }
}

// [DESCRIBE] setTransactionMessagePriorityFeeLamports
{
    // It accepts v1 messages
    {
        const message = null as unknown as V1TransactionMessage;
        const result = setTransactionMessagePriorityFeeLamports(5_000n, message);
        result satisfies V1TransactionMessage;
    }

    // It preserves input message type
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

    // It rejects legacy messages
    {
        const message = null as unknown as LegacyTransactionMessage;
        // @ts-expect-error Legacy transactions are not supported
        setTransactionMessagePriorityFeeLamports(5_000n, message);
    }

    // It rejects v0 messages
    {
        const message = null as unknown as V0TransactionMessage;
        // @ts-expect-error V0 transactions are not supported
        setTransactionMessagePriorityFeeLamports(5_000n, message);
    }
}
