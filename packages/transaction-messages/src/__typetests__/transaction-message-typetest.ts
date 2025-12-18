import {
    assertIsLegacyTransactionMessage,
    assertIsV0TransactionMessage,
    BaseTransactionMessage,
    isLegacyTransactionMessage,
    isV0TransactionMessage,
    TransactionMessage,
} from '../transaction-message';

type LegacyTransactionMessage = Extract<TransactionMessage, { version: 'legacy' }>;
type V0TransactionMessage = Extract<TransactionMessage, { version: 0 }>;

// [DESCRIBE] isLegacyTransactionMessage
{
    // It narrows the transaction message type to a legacy transaction message
    {
        const message = null as unknown as BaseTransactionMessage & { version: 'legacy' };
        if (isLegacyTransactionMessage(message)) {
            message satisfies LegacyTransactionMessage;
        } else {
            message satisfies BaseTransactionMessage & { version: 0 };
            message satisfies V0TransactionMessage;
        }
    }
}

// [DESCRIBE] assertIsLegacyTransactionMessage
{
    // It narrows the transaction message type to one with a blockhash-based lifetime.
    {
        const message = null as unknown as BaseTransactionMessage & { version: 'legacy' };
        // @ts-expect-error Should not be a v0 transaction message
        message satisfies V0TransactionMessage;
        // @ts-expect-error Should not satisfy version 0
        message satisfies { version: 0 };
        assertIsLegacyTransactionMessage(message);
        message satisfies BaseTransactionMessage & { version: 'legacy' };
        message satisfies LegacyTransactionMessage;
    }
}

// [DESCRIBE] isV0TransactionMessage
{
    // It narrows the transaction message type to a v0 transaction message
    {
        const message = null as unknown as BaseTransactionMessage & { version: 0 };
        if (isV0TransactionMessage(message)) {
            message satisfies V0TransactionMessage;
        } else {
            message satisfies BaseTransactionMessage & { version: 'legacy' };
            message satisfies LegacyTransactionMessage;
        }
    }
}

// [DESCRIBE] assertIsV0TransactionMessage
{
    // It narrows the transaction message type to one with a blockhash-based lifetime.
    {
        const message = null as unknown as BaseTransactionMessage & { version: 0 };
        // @ts-expect-error Should not be a v0 transaction message
        message satisfies LegacyTransactionMessage;
        // @ts-expect-error Should not satisfy legacy version
        message satisfies { version: 'legacy' };
        assertIsV0TransactionMessage(message);
        message satisfies BaseTransactionMessage & { version: 0 };
        message satisfies V0TransactionMessage;
    }
}
