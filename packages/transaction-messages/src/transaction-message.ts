import { AccountMeta, Instruction } from '@solana/instructions';

import { V1TransactionConfig } from './v1-transaction-config';

type BaseTransactionMessage<
    TVersion extends TransactionVersion = TransactionVersion,
    TInstruction extends Instruction = Instruction,
> = Readonly<{
    instructions: readonly TInstruction[];
    version: TVersion;
}>;

export const MAX_SUPPORTED_TRANSACTION_VERSION = 1;

type InstructionWithoutLookupTables<TProgramAddress extends string = string> = Instruction<
    TProgramAddress,
    readonly AccountMeta[]
>;
type LegacyTransactionMessage = BaseTransactionMessage<'legacy', InstructionWithoutLookupTables>;
type V0TransactionMessage = BaseTransactionMessage<0, Instruction>;
type V1TransactionMessage = BaseTransactionMessage<1, InstructionWithoutLookupTables> &
    Readonly<{
        /** A set of optional configuration values for the transaction */
        config?: V1TransactionConfig;
    }>;
export type TransactionMessage = LegacyTransactionMessage | V0TransactionMessage | V1TransactionMessage;
export type TransactionVersion = 'legacy' | 0 | 1;
