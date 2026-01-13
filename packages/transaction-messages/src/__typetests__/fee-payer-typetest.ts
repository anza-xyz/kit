import { Address } from '@solana/addresses';

import { TransactionMessageWithBlockhashLifetime } from '../blockhash';
import { TransactionMessageWithDurableNonceLifetime } from '../durable-nonce';
import { setTransactionMessageFeePayer, TransactionMessageWithFeePayer } from '../fee-payer';
import { TransactionMessage } from '../transaction-message';

const mockFeePayer = 'mock' as Address<'mockFeePayer'>;
const aliceAddress = 'alice' as Address<'alice'>;
const bobAddress = 'bob' as Address<'bob'>;

type LegacyTransactionMessage = Extract<TransactionMessage, { version: 'legacy' }>;
type V0TransactionMessage = Extract<TransactionMessage, { version: 0 }>;

// [DESCRIBE] setTransactionFeePayer
{
    // It adds the fee payer to the new message
    {
        const message = null as unknown as TransactionMessage & { some: 1 };
        const messageWithFeePayer = setTransactionMessageFeePayer(aliceAddress, message);
        messageWithFeePayer satisfies TransactionMessage & TransactionMessageWithFeePayer<'alice'> & { some: 1 };
    }

    // It *replaces* an existing fee payer with the new one
    {
        const messageWithAliceFeePayer = null as unknown as TransactionMessage &
            TransactionMessageWithFeePayer<'alice'> & { some: 1 };
        const messageWithBobFeePayer = setTransactionMessageFeePayer(bobAddress, messageWithAliceFeePayer);
        messageWithBobFeePayer satisfies TransactionMessage & TransactionMessageWithFeePayer<'bob'> & { some: 1 };
        // @ts-expect-error Alice should no longer be a payer.
        messageWithBobFeePayer satisfies TransactionMessageWithFeePayer<'alice'>;
    }

    // Legacy messages with no lifetimes.
    {
        const message = null as unknown as LegacyTransactionMessage;
        const messageWithFeePayer = setTransactionMessageFeePayer(mockFeePayer, message);
        messageWithFeePayer satisfies LegacyTransactionMessage & TransactionMessageWithFeePayer<'mockFeePayer'>;
        // @ts-expect-error Should not be V0.
        messageWithFeePayer satisfies TransactionMessageWithFeePayer<'mockFeePayer'> & V0TransactionMessage;
    }

    // V0 messages with no lifetimes.
    {
        const message = null as unknown as V0TransactionMessage;
        const messageWithFeePayer = setTransactionMessageFeePayer(mockFeePayer, message);
        messageWithFeePayer satisfies TransactionMessageWithFeePayer<'mockFeePayer'> & V0TransactionMessage;
        // @ts-expect-error Should not be legacy.
        messageWithFeePayer satisfies LegacyTransactionMessage & TransactionMessageWithFeePayer<'mockFeePayer'>;
    }

    // Legacy messages with blockhash lifetime.
    {
        const message = null as unknown as LegacyTransactionMessage & TransactionMessageWithBlockhashLifetime;
        const messageWithFeePayer = setTransactionMessageFeePayer(mockFeePayer, message);
        messageWithFeePayer satisfies LegacyTransactionMessage &
            TransactionMessageWithBlockhashLifetime &
            TransactionMessageWithFeePayer<'mockFeePayer'>;
        // @ts-expect-error Should not be V0.
        messageWithFeePayer satisfies TransactionMessageWithBlockhashLifetime &
            TransactionMessageWithFeePayer<'mockFeePayer'> &
            V0TransactionMessage;
    }

    // V0 messages with blockhash lifetime.
    {
        const message = null as unknown as TransactionMessageWithBlockhashLifetime & V0TransactionMessage;
        const messageWithFeePayer = setTransactionMessageFeePayer(mockFeePayer, message);
        messageWithFeePayer satisfies TransactionMessageWithBlockhashLifetime &
            TransactionMessageWithFeePayer<'mockFeePayer'> &
            V0TransactionMessage;
        // @ts-expect-error Should not be legacy.
        messageWithFeePayer satisfies LegacyTransactionMessage &
            TransactionMessageWithBlockhashLifetime &
            TransactionMessageWithFeePayer<'mockFeePayer'>;
    }

    // Legacy messages with durable nonce lifetime.
    {
        const message = null as unknown as LegacyTransactionMessage & TransactionMessageWithDurableNonceLifetime;
        const messageWithFeePayer = setTransactionMessageFeePayer(mockFeePayer, message);
        messageWithFeePayer satisfies LegacyTransactionMessage &
            TransactionMessageWithDurableNonceLifetime &
            TransactionMessageWithFeePayer<'mockFeePayer'>;
        // @ts-expect-error Should not be V0.
        messageWithFeePayer satisfies TransactionMessageWithDurableNonceLifetime &
            TransactionMessageWithFeePayer<'mockFeePayer'> &
            V0TransactionMessage;
    }

    // V0 messages with durable nonce lifetime.
    {
        const message = null as unknown as TransactionMessageWithDurableNonceLifetime & V0TransactionMessage;
        const messageWithFeePayer = setTransactionMessageFeePayer(mockFeePayer, message);
        messageWithFeePayer satisfies TransactionMessageWithDurableNonceLifetime &
            TransactionMessageWithFeePayer<'mockFeePayer'> &
            V0TransactionMessage;
        // @ts-expect-error Should not be legacy.
        messageWithFeePayer satisfies LegacyTransactionMessage &
            TransactionMessageWithDurableNonceLifetime &
            TransactionMessageWithFeePayer<'mockFeePayer'>;
    }

    // It can narrow the result by transaction version
    {
        type TransactionMessageNotLegacy = Exclude<TransactionMessage, { version: 'legacy' }>;

        const message = null as unknown as TransactionMessage;
        const messageWithFeePayer = setTransactionMessageFeePayer(mockFeePayer, message);
        // @ts-expect-error Could be legacy
        messageWithFeePayer satisfies TransactionMessageNotLegacy;
        if (messageWithFeePayer.version === 0) {
            messageWithFeePayer satisfies TransactionMessageNotLegacy;
        }
    }
}
