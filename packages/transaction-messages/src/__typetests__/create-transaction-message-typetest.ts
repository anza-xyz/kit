import { createTransactionMessage } from '../create-transaction-message';
import { TransactionMessage } from '../transaction-message';

type LegacyTransactionMessage = Extract<TransactionMessage, { version: 'legacy' }>;
type V0TransactionMessage = Extract<TransactionMessage, { version: 0 }>;

// It creates legacy transaction messages.
{
    const message = createTransactionMessage({ version: 'legacy' });
    message satisfies LegacyTransactionMessage;
    // @ts-expect-error Should not be V0.
    message satisfies V0TransactionMessage;
}

// It creates v0 transaction messages.
{
    const message = createTransactionMessage({ version: 0 });
    message satisfies V0TransactionMessage;
    // @ts-expect-error Should not be legacy.
    message satisfies LegacyTransactionMessage;
}
