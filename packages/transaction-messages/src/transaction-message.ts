import { AccountMeta, Instruction } from '@solana/instructions';

export type BaseTransactionMessage<
    TVersion extends TransactionVersion = TransactionVersion,
    TInstruction extends Instruction = Instruction,
> = Readonly<{
    instructions: readonly TInstruction[];
    version: TVersion;
}>;

type LegacyInstruction<TProgramAddress extends string = string> = Instruction<TProgramAddress, readonly AccountMeta[]>;
type LegacyTransactionMessage = BaseTransactionMessage<'legacy', LegacyInstruction>;
type V0TransactionMessage = BaseTransactionMessage<0, Instruction>;

export type TransactionMessage = LegacyTransactionMessage | V0TransactionMessage;
export type TransactionVersion = 'legacy' | 0;
