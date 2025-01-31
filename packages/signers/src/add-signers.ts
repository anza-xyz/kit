import { IInstruction, isSignerRole } from '@solana/instructions';
import { BaseTransactionMessage } from '@solana/transaction-messages';

import { IAccountSignerMeta, IInstructionWithSigners, ITransactionMessageWithSigners } from './account-signer-meta';
import { deduplicateSigners } from './deduplicate-signers';
import { TransactionSigner } from './transaction-signer';

/**
 * Attaches the provided {@link TransactionSigner | TransactionSigners} to the
 * account metas of an instruction when applicable.
 *
 * For an account meta to match a provided signer it:
 * - Must have a signer role ({@link AccountRole.READONLY_SIGNER} or {@link AccountRole.WRITABLE_SIGNER}).
 * - Must have the same address as the provided signer.
 * - Must not have an attached signer already.
 *
 * @typeParam TInstruction - The inferred type of the instruction provided.
 *
 * @example
 * ```ts
 * import { AccountRole, IInstruction } from '@solana/instructions';
 * import { addSignersToInstruction, TransactionSigner } from '@solana/signers';
 *
 * const instruction: IInstruction = {
 *     accounts: [
 *         { address: '1111' as Address, role: AccountRole.READONLY_SIGNER },
 *         { address: '2222' as Address, role: AccountRole.WRITABLE_SIGNER },
 *     ],
 *     // ...
 * };
 *
 * const signerA: TransactionSigner<'1111'>;
 * const signerB: TransactionSigner<'2222'>;
 * const instructionWithSigners = addSignersToInstruction(
 *     [signerA, signerB],
 *     instruction
 * );
 *
 * // instructionWithSigners.accounts[0].signer === signerA
 * // instructionWithSigners.accounts[1].signer === signerB
 * ```
 */
export function addSignersToInstruction<TInstruction extends IInstruction>(
    signers: TransactionSigner[],
    instruction: TInstruction | (IInstructionWithSigners & TInstruction),
): IInstructionWithSigners & TInstruction {
    if (!instruction.accounts || instruction.accounts.length === 0) {
        return instruction as IInstructionWithSigners & TInstruction;
    }

    const signerByAddress = new Map(deduplicateSigners(signers).map(signer => [signer.address, signer]));
    return Object.freeze({
        ...instruction,
        accounts: instruction.accounts.map(account => {
            const signer = signerByAddress.get(account.address);
            if (!isSignerRole(account.role) || 'signer' in account || !signer) {
                return account;
            }
            return Object.freeze({ ...account, signer } as IAccountSignerMeta);
        }),
    });
}

/**
 * Attaches the provided {@link TransactionSigner | TransactionSigners} to the
 * account metas of all instructions inside a transaction message, when applicable.
 *
 * For an account meta to match a provided signer it:
 * - Must have a signer role ({@link AccountRole.READONLY_SIGNER} or {@link AccountRole.WRITABLE_SIGNER}).
 * - Must have the same address as the provided signer.
 * - Must not have an attached signer already.
 *
 * @typeParam TTransactionMessage - The inferred type of the transaction message provided.
 *
 * @example
 * ```ts
 * import { AccountRole, IInstruction } from '@solana/instructions';
 * import { BaseTransactionMessage } from '@solana/transaction-messages';
 * import { addSignersToTransactionMessage, TransactionSigner } from '@solana/signers';
 *
 * const instructionA: IInstruction = {
 *     accounts: [{ address: '1111' as Address, role: AccountRole.READONLY_SIGNER }],
 *     // ...
 * };
 * const instructionB: IInstruction = {
 *     accounts: [{ address: '2222' as Address, role: AccountRole.WRITABLE_SIGNER }],
 *     // ...
 * };
 * const transactionMessage: BaseTransactionMessage = {
 *     instructions: [instructionA, instructionB],
 *     // ...
 * }
 *
 * const signerA: TransactionSigner<'1111'>;
 * const signerB: TransactionSigner<'2222'>;
 * const transactionMessageWithSigners = addSignersToTransactionMessage(
 *     [signerA, signerB],
 *     transactionMessage
 * );
 *
 * // transactionMessageWithSigners.instructions[0].accounts[0].signer === signerA
 * // transactionMessageWithSigners.instructions[1].accounts[0].signer === signerB
 * ```
 */
export function addSignersToTransactionMessage<TTransactionMessage extends BaseTransactionMessage>(
    signers: TransactionSigner[],
    transactionMessage: TTransactionMessage | (ITransactionMessageWithSigners & TTransactionMessage),
): ITransactionMessageWithSigners & TTransactionMessage {
    if (transactionMessage.instructions.length === 0) {
        return transactionMessage as ITransactionMessageWithSigners & TTransactionMessage;
    }

    return Object.freeze({
        ...transactionMessage,
        instructions: transactionMessage.instructions.map(instruction => addSignersToInstruction(signers, instruction)),
    });
}
