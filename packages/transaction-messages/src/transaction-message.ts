import { AccountMeta, Instruction } from '@solana/instructions';

/**
 * @deprecated Use `TransactionMessage` instead.
 */
// TODO(#1147) Stop exporting this in a future major version.
export type BaseTransactionMessage<
    TVersion extends TransactionVersion = TransactionVersion,
    TInstruction extends Instruction = Instruction,
> = Readonly<{
    instructions: readonly TInstruction[];
    version: TVersion;
}>;

export const MAX_SUPPORTED_TRANSACTION_VERSION = 0;

type LegacyInstruction<TProgramAddress extends string = string> = Instruction<TProgramAddress, readonly AccountMeta[]>;
type LegacyTransactionMessage = BaseTransactionMessage<'legacy', LegacyInstruction>;
type V0TransactionMessage = BaseTransactionMessage<0, Instruction>;

export type TransactionMessage = LegacyTransactionMessage | V0TransactionMessage;
export type TransactionVersion = 'legacy' | 0;
