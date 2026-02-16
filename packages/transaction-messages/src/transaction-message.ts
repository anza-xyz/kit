import { AccountMeta, Instruction } from '@solana/instructions';

type BaseTransactionMessage<
    TVersion extends TransactionVersion = TransactionVersion,
    TInstruction extends Instruction = Instruction,
> = Readonly<{
    instructions: readonly TInstruction[];
    version: TVersion;
}>;

export const MAX_SUPPORTED_TRANSACTION_VERSION = 1;

type LegacyInstruction<TProgramAddress extends string = string> = Instruction<TProgramAddress, readonly AccountMeta[]>;
type LegacyTransactionMessage = BaseTransactionMessage<'legacy', LegacyInstruction>;
type V0TransactionMessage = BaseTransactionMessage<0, Instruction>;
export type TransactionMessage = LegacyTransactionMessage | V0TransactionMessage;
export type TransactionVersion = 'legacy' | 0 | 1;
