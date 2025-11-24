import { Address } from '@solana/addresses';
import { TransactionMessage, TransactionMessageWithFeePayer } from '@solana/transaction-messages';

import {
    NonSignerFeePayer,
    setTransactionMessageFeePayerSigner,
    TransactionMessageWithFeePayerSigner,
} from '../fee-payer-signer';
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

    // It maintains the narrowed type of the signer
    {
        type CustomSigner = TransactionSigner<'alice'> & { customProperty: true };
        const aliceSignerWithNarrowedType = null as unknown as CustomSigner;
        const messageWithFeePayer = setTransactionMessageFeePayerSigner(aliceSignerWithNarrowedType, message);
        messageWithFeePayer satisfies TransactionMessageWithFeePayerSigner<'alice', CustomSigner>;
    }
}

// [DESCRIBE] NonSignerFeePayer
{
    // It allows a message with a fee payer that is not a signer
    {
        const message = null as unknown as TransactionMessage & TransactionMessageWithFeePayer<Address>;
        message.feePayer satisfies NonSignerFeePayer;
    }

    // It does not allow a messafge with a fee payer that is a signer
    {
        const message = null as unknown as TransactionMessage & TransactionMessageWithFeePayerSigner<Address>;
        // @ts-expect-error fee payer is a signer
        message.feePayer satisfies NonSignerFeePayer;
    }
}
