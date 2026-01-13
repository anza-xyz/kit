import { AccountMeta, Instruction } from '@solana/instructions';

/**
 * Internal base type for transaction messages. External code should use `TransactionMessage` instead.
 * 
 * @internal This type is exported for internal package use only and should not be used by external consumers.
 * It may be removed in a future version without notice.
 */
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
