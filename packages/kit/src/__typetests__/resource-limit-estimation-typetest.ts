import type { Rpc, SimulateTransactionApi } from '@solana/rpc';
import type {
    TransactionMessage,
    TransactionMessageWithDurableNonceLifetime,
    TransactionMessageWithFeePayer,
} from '@solana/transaction-messages';

import {
    estimateAndSetResourceLimitsFactory,
    estimateResourceLimitsFactory,
    fillTransactionMessageProvisoryResourceLimits,
} from '../resource-limit-estimation';

const rpc = null as unknown as Rpc<SimulateTransactionApi>;

const legacyMessage = null as unknown as Extract<TransactionMessage, { version: 'legacy' }> &
    TransactionMessageWithFeePayer;
const v0Message = null as unknown as Extract<TransactionMessage, { version: 0 }> & TransactionMessageWithFeePayer;
const v1Message = null as unknown as Extract<TransactionMessage, { version: 1 }> & TransactionMessageWithFeePayer;
const genericMessage = null as unknown as TransactionMessage & TransactionMessageWithFeePayer;

// [DESCRIBE] estimateResourceLimitsFactory
{
    const estimate = estimateResourceLimitsFactory({ rpc });

    // It returns both required fields for v1 messages
    void (async () => {
        const result = await estimate(v1Message);
        result satisfies { computeUnitLimit: number; loadedAccountsDataSizeLimit: number };
    })();

    // It returns an optional `loadedAccountsDataSizeLimit` for v0 messages
    void (async () => {
        const result = await estimate(v0Message);
        result satisfies { computeUnitLimit: number; loadedAccountsDataSizeLimit?: number };
    })();

    // It does not allow narrowing the optional field to `number` on v0 messages
    void (async () => {
        const result = await estimate(v0Message);
        // @ts-expect-error — `loadedAccountsDataSizeLimit` is optional, so it can be `undefined`.
        result.loadedAccountsDataSizeLimit satisfies number;
    })();

    // It returns an optional `loadedAccountsDataSizeLimit` for legacy messages
    void (async () => {
        const result = await estimate(legacyMessage);
        result satisfies { computeUnitLimit: number; loadedAccountsDataSizeLimit?: number };
    })();

    // It returns an optional `loadedAccountsDataSizeLimit` for a generic message union
    void (async () => {
        const result = await estimate(genericMessage);
        result satisfies { computeUnitLimit: number; loadedAccountsDataSizeLimit?: number };
    })();

    // It accepts the documented config fields
    {
        const abortController = new AbortController();
        void estimate(v1Message, { abortSignal: abortController.signal });
        void estimate(v1Message, { commitment: 'finalized' });
        void estimate(v1Message, { minContextSlot: 42n });
        void estimate(v1Message, {});
        void estimate(v1Message);
    }

    // It requires a transaction message with a fee payer
    {
        const messageWithoutFeePayer = null as unknown as TransactionMessage;
        // @ts-expect-error — missing fee payer.
        void estimate(messageWithoutFeePayer);
    }

    // It accepts a durable-nonce transaction message
    {
        const nonceMessage = null as unknown as TransactionMessage &
            TransactionMessageWithDurableNonceLifetime &
            TransactionMessageWithFeePayer;
        void estimate(nonceMessage);
    }
}

// [DESCRIBE] estimateAndSetResourceLimitsFactory
{
    const estimate = estimateResourceLimitsFactory({ rpc });
    const estimateAndSet = estimateAndSetResourceLimitsFactory(estimate);

    // It preserves the message type for v1 messages
    void (async () => {
        const result = await estimateAndSet(v1Message);
        result satisfies typeof v1Message;
    })();

    // It preserves the message type for v0 messages
    void (async () => {
        const result = await estimateAndSet(v0Message);
        result satisfies typeof v0Message;
    })();

    // It preserves the message type for legacy messages
    void (async () => {
        const result = await estimateAndSet(legacyMessage);
        result satisfies typeof legacyMessage;
    })();
}

// [DESCRIBE] fillTransactionMessageProvisoryResourceLimits
{
    // It preserves the input message type
    {
        const v1Result = fillTransactionMessageProvisoryResourceLimits(v1Message);
        v1Result satisfies typeof v1Message;

        const v0Result = fillTransactionMessageProvisoryResourceLimits(v0Message);
        v0Result satisfies typeof v0Message;

        const legacyResult = fillTransactionMessageProvisoryResourceLimits(legacyMessage);
        legacyResult satisfies typeof legacyMessage;
    }

    // It does not require a fee payer
    {
        const messageWithoutFeePayer = null as unknown as TransactionMessage;
        fillTransactionMessageProvisoryResourceLimits(messageWithoutFeePayer);
    }
}
