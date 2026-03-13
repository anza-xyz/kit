import { TransactionMessage } from '..';
import {
    getTransactionMessageLoadedAccountsDataSizeLimit,
    setTransactionMessageLoadedAccountsDataSizeLimit,
} from '../loaded-accounts-data-size-limit';

type LegacyTransactionMessage = Extract<TransactionMessage, { version: 'legacy' }>;
type V0TransactionMessage = Extract<TransactionMessage, { version: 0 }>;
type V1TransactionMessage = Extract<TransactionMessage, { version: 1 }>;

// [DESCRIBE] setTransactionMessageLoadedAccountsDataSizeLimit
{
    // It accepts v1 messages
    {
        const message = null as unknown as V1TransactionMessage;
        const result = setTransactionMessageLoadedAccountsDataSizeLimit(64_000, message);
        result satisfies V1TransactionMessage;
    }

    // It accepts legacy messages
    {
        const message = null as unknown as LegacyTransactionMessage;
        const result = setTransactionMessageLoadedAccountsDataSizeLimit(64_000, message);
        result satisfies LegacyTransactionMessage;
    }

    // It accepts v0 messages
    {
        const message = null as unknown as V0TransactionMessage;
        const result = setTransactionMessageLoadedAccountsDataSizeLimit(64_000, message);
        result satisfies V0TransactionMessage;
    }

    // It preserves input type
    {
        const message = null as unknown as V1TransactionMessage & { some: 1 };
        const result = setTransactionMessageLoadedAccountsDataSizeLimit(64_000, message);
        result satisfies V1TransactionMessage & { some: 1 };
    }

    // It preserves input type for legacy
    {
        const message = null as unknown as LegacyTransactionMessage & { some: 1 };
        const result = setTransactionMessageLoadedAccountsDataSizeLimit(64_000, message);
        result satisfies LegacyTransactionMessage & { some: 1 };
    }

    // It can set undefined value
    {
        const message = null as unknown as V1TransactionMessage & { some: 1 };
        const result = setTransactionMessageLoadedAccountsDataSizeLimit(undefined, message);
        result satisfies V1TransactionMessage & { some: 1 };
    }

    // It can set undefined value for legacy
    {
        const message = null as unknown as LegacyTransactionMessage;
        const result = setTransactionMessageLoadedAccountsDataSizeLimit(undefined, message);
        result satisfies LegacyTransactionMessage;
    }
}

// [DESCRIBE] getTransactionMessageLoadedAccountsDataSizeLimit
{
    // It returns number | undefined for v1 messages
    {
        const message = null as unknown as V1TransactionMessage;
        const result = getTransactionMessageLoadedAccountsDataSizeLimit(message);
        result satisfies number | undefined;
    }

    // It returns number | undefined for legacy messages
    {
        const message = null as unknown as LegacyTransactionMessage;
        const result = getTransactionMessageLoadedAccountsDataSizeLimit(message);
        result satisfies number | undefined;
    }

    // It returns number | undefined for v0 messages
    {
        const message = null as unknown as V0TransactionMessage;
        const result = getTransactionMessageLoadedAccountsDataSizeLimit(message);
        result satisfies number | undefined;
    }
}
