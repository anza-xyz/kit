import { TransactionMessage, TransactionMessageWithFeePayer } from '@solana/transaction-messages';

import { setTransactionMessageFeePayerSigner, TransactionMessageWithFeePayerSigner } from '../fee-payer-signer';
import { TransactionSigner } from '../transaction-signer';

const aliceSigner = null as unknown as TransactionSigner<'alice'>;
const bobSigner = null as unknown as TransactionSigner<'bob'>;

const message = null as unknown as TransactionMessage;

// [DESCRIBE] setTransactionFeePayerSigner
{
    // It adds the fee payer signer to the new message
    {
        const messageWithFeePayer = setTransactionMessageFeePayerSigner(aliceSigner, message);
        messageWithFeePayer satisfies TransactionMessageWithFeePayerSigner<'alice'>;
    }

    // It *replaces* an existing fee payer signer with the new one
    {
        const messageWithAliceFeePayerSigner = null as unknown as TransactionMessage &
            TransactionMessageWithFeePayerSigner<'alice'>;
        const messageWithBobFeePayerSigner = setTransactionMessageFeePayerSigner(
            bobSigner,
            messageWithAliceFeePayerSigner,
        );
        // @ts-expect-error Alice should no longer be a payer.
        messageWithBobFeePayerSigner satisfies TransactionMessageWithFeePayerSigner<'alice'>;
        messageWithBobFeePayerSigner satisfies TransactionMessageWithFeePayerSigner<'bob'>;
    }

    // It *replaces* an existing fee payer address with the new signer
    {
        const messageWithMalloryFeePayer = null as unknown as TransactionMessage &
            TransactionMessageWithFeePayer<'mallory'>;
        const messageWithBobFeePayerSigner = setTransactionMessageFeePayerSigner(bobSigner, messageWithMalloryFeePayer);
        // @ts-expect-error Mallory should no longer be a payer.
        messageWithBobFeePayerSigner satisfies TransactionMessageWithFeePayer<'mallory'>;
        messageWithBobFeePayerSigner satisfies TransactionMessageWithFeePayerSigner<'bob'>;
    }

    // It can narrow the result by transaction version
    {
        type TransactionMessageNotLegacy = Exclude<TransactionMessage, { version: 'legacy' }>;
        const message = null as unknown as TransactionMessage;
        const messageWithFeePayer = setTransactionMessageFeePayerSigner(aliceSigner, message);
        // @ts-expect-error Could be legacy
        messageWithFeePayer satisfies TransactionMessageNotLegacy;
        if (messageWithFeePayer.version === 0) {
            messageWithFeePayer satisfies TransactionMessageNotLegacy;
        }
    }
}
