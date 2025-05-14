import { Instruction } from '@solana/instructions';

import { TransactionMessageWithFeePayer } from './fee-payer';
import { TransactionMessageWithLifetime } from './lifetime';
import { BaseTransactionMessage, TransactionVersion } from './transaction-message';

/**
 * A transaction message having sufficient detail to be compiled for execution on the network.
 *
 * In essence, this means that it has at minimum a version, a fee payer, and a lifetime constraint.
 */
export type CompilableTransactionMessage<
    TVersion extends TransactionVersion = TransactionVersion,
    TInstruction extends Instruction = Instruction,
> = BaseTransactionMessage<TVersion, TInstruction> & TransactionMessageWithFeePayer & TransactionMessageWithLifetime;
