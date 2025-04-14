import { IInstruction } from '@solana/instructions';

import { TransactionMessageWithBlockhashLifetime } from './blockhash';
import { TransactionMessageWithDurableNonceLifetime } from './durable-nonce';
import { ITransactionMessageWithFeePayer } from './fee-payer';
import { BaseTransactionMessage, TransactionVersion } from './transaction-message';

/**
 * A transaction message having sufficient detail to be compiled for execution on the network.
 *
 * In essence, this means that it has at minimum a version, a fee payer, and a lifetime constraint.
 */
export type CompilableTransactionMessage<
    TVersion extends TransactionVersion = TransactionVersion,
    TInstruction extends IInstruction = IInstruction,
> = BaseTransactionMessage<TVersion, TInstruction> &
    ITransactionMessageWithFeePayer &
    (TransactionMessageWithBlockhashLifetime | TransactionMessageWithDurableNonceLifetime);
