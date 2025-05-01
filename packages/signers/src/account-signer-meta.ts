import { AccountRole, IAccountLookupMeta, IAccountMeta, IInstruction } from '@solana/instructions';
import {
    BaseTransactionMessage,
    TransactionMessageWithFeePayer,
    TransactionVersion,
} from '@solana/transaction-messages';

import { deduplicateSigners } from './deduplicate-signers';
import { TransactionMessageWithFeePayerSigner } from './fee-payer-signer';
import { isTransactionSigner, TransactionSigner } from './transaction-signer';

/**
 * An extension of the {@link IAccountMeta} type that allows us to store {@link TransactionSigner | TransactionSigners} inside it.
 *
 * Note that, because this type represents a signer, it must use one the following two roles:
 * - {@link AccountRole.READONLY_SIGNER}
 * - {@link AccountRole.WRITABLE_SIGNER}
 *
 * @typeParam TAddress - Supply a string literal to define an account having a particular address.
 * @typeParam TSigner - Optionally provide a narrower type for the {@link TransactionSigner} to use within the account meta.
 *
 * @interface
 *
 * @example
 * ```ts
 * import { AccountRole } from '@solana/instructions';
 * import { generateKeyPairSigner, IAccountSignerMeta } from '@solana/signers';
 *
 * const signer = await generateKeyPairSigner();
 * const account: IAccountSignerMeta = {
 *     address: signer.address,
 *     role: AccountRole.READONLY_SIGNER,
 *     signer,
 * };
 * ```
 */
export interface IAccountSignerMeta<
    TAddress extends string = string,
    TSigner extends TransactionSigner<TAddress> = TransactionSigner<TAddress>,
> extends IAccountMeta<TAddress> {
    readonly role: AccountRole.READONLY_SIGNER | AccountRole.WRITABLE_SIGNER;
    readonly signer: TSigner;
}

/**
 * A union type that supports base account metas as well as {@link IAccountSignerMeta | signer account metas}.
 */
type IAccountMetaWithSigner<TSigner extends TransactionSigner = TransactionSigner> =
    | IAccountLookupMeta
    | IAccountMeta
    | IAccountSignerMeta<string, TSigner>;

/**
 * Composable type that allows {@link IAccountSignerMeta | IAccountSignerMetas} to be used inside the instruction's `accounts` array
 *
 * @typeParam TSigner - Optionally provide a narrower type for {@link TransactionSigner | TransactionSigners}.
 * @typeParam TAccounts - Optionally provide a narrower type for the account metas.
 *
 * @interface
 *
 * @example
 * ```ts
 * import { AccountRole, IInstruction } from '@solana/instructions';
 * import { generateKeyPairSigner, IInstructionWithSigners } from '@solana/signers';
 *
 * const [authority, buffer] = await Promise.all([
 *     generateKeyPairSigner(),
 *     generateKeyPairSigner(),
 * ]);
 * const instruction: IInstruction & IInstructionWithSigners = {
 *     programAddress: address('1234..5678'),
 *     accounts: [
 *         // The authority is a signer account.
 *         {
 *             address: authority.address,
 *             role: AccountRole.READONLY_SIGNER,
 *             signer: authority,
 *         },
 *         // The buffer is a writable account.
 *         { address: buffer.address, role: AccountRole.WRITABLE },
 *     ],
 * };
 * ```
 */
export type IInstructionWithSigners<
    TSigner extends TransactionSigner = TransactionSigner,
    TAccounts extends readonly IAccountMetaWithSigner<TSigner>[] = readonly IAccountMetaWithSigner<TSigner>[],
> = Pick<IInstruction<string, TAccounts>, 'accounts'>;

/**
 * A {@link BaseTransactionMessage} type extension that accept {@link TransactionSigner | TransactionSigners}.
 *
 * Namely, it allows:
 * - a {@link TransactionSigner} to be used as the fee payer and
 * - {@link IInstructionWithSigners} to be used in its instructions.
 *
 *
 * @typeParam TAddress - Supply a string literal to define an account having a particular address.
 * @typeParam TSigner - Optionally provide a narrower type for {@link TransactionSigner | TransactionSigners}.
 * @typeParam TAccounts - Optionally provide a narrower type for the account metas.
 *
 * @example
 * ```ts
 * import { IInstruction } from '@solana/instructions';
 * import { BaseTransactionMessage } from '@solana/transaction-messages';
 * import { generateKeyPairSigner, IInstructionWithSigners, TransactionMessageWithSigners } from '@solana/signers';
 *
 * const signer = await generateKeyPairSigner();
 * const firstInstruction: IInstruction = { ... };
 * const secondInstruction: IInstructionWithSigners = { ... };
 * const transactionMessage: BaseTransactionMessage & TransactionMessageWithSigners = {
 *     feePayer: signer,
 *     instructions: [firstInstruction, secondInstruction],
 * }
 * ```
 */
export type TransactionMessageWithSigners<
    TAddress extends string = string,
    TSigner extends TransactionSigner<TAddress> = TransactionSigner<TAddress>,
    TAccounts extends readonly IAccountMetaWithSigner<TSigner>[] = readonly IAccountMetaWithSigner<TSigner>[],
> = Partial<TransactionMessageWithFeePayer<TAddress> | TransactionMessageWithFeePayerSigner<TAddress, TSigner>> &
    Pick<
        BaseTransactionMessage<TransactionVersion, IInstruction & IInstructionWithSigners<TSigner, TAccounts>>,
        'instructions'
    >;

/**
 * Extracts and deduplicates all {@link TransactionSigner | TransactionSigners} stored
 * inside the account metas of an {@link IInstructionWithSigners | instruction}.
 *
 * Any extracted signers that share the same {@link Address} will be de-duplicated.
 *
 * @typeParam TSigner - Optionally provide a narrower type for {@link TransactionSigner | TransactionSigners}.
 *
 * @example
 * ```ts
 * import { IInstructionWithSigners, getSignersFromInstruction } from '@solana/signers';
 *
 * const signerA = { address: address('1111..1111'), signTransactions: async () => {} };
 * const signerB = { address: address('2222..2222'), signTransactions: async () => {} };
 * const instructionWithSigners: IInstructionWithSigners = {
 *     accounts: [
 *         { address: signerA.address, signer: signerA, ... },
 *         { address: signerB.address, signer: signerB, ... },
 *         { address: signerA.address, signer: signerA, ... },
 *     ],
 * };
 *
 * const instructionSigners = getSignersFromInstruction(instructionWithSigners);
 * // ^ [signerA, signerB]
 * ```
 */
export function getSignersFromInstruction<TSigner extends TransactionSigner = TransactionSigner>(
    instruction: IInstructionWithSigners<TSigner>,
): readonly TSigner[] {
    return deduplicateSigners(
        (instruction.accounts ?? []).flatMap(account => ('signer' in account ? account.signer : [])),
    );
}

/**
 * Extracts and deduplicates all {@link TransactionSigner | TransactionSigners} stored
 * inside a given {@link TransactionMessageWithSigners | transaction message}.
 *
 * This includes any {@link TransactionSigner | TransactionSigners} stored
 * as the fee payer or in the instructions of the transaction message.
 *
 * Any extracted signers that share the same {@link Address} will be de-duplicated.
 *
 * @typeParam TAddress - Supply a string literal to define an account having a particular address.
 * @typeParam TSigner - Optionally provide a narrower type for {@link TransactionSigner | TransactionSigners}.
 * @typeParam TTransactionMessage - The inferred type of the transaction message provided.
 *
 * @example
 * ```ts
 * import { IInstruction } from '@solana/instructions';
 * import { IInstructionWithSigners, TransactionMessageWithSigners, getSignersFromTransactionMessage } from '@solana/signers';
 *
 * const signerA = { address: address('1111..1111'), signTransactions: async () => {} };
 * const signerB = { address: address('2222..2222'), signTransactions: async () => {} };
 * const firstInstruction: IInstruction & IInstructionWithSigners = {
 *     programAddress: address('1234..5678'),
 *     accounts: [{ address: signerA.address, signer: signerA, ... }],
 * };
 * const secondInstruction: IInstruction & IInstructionWithSigners = {
 *     programAddress: address('1234..5678'),
 *     accounts: [{ address: signerB.address, signer: signerB, ... }],
 * };
 * const transactionMessage: TransactionMessageWithSigners = {
 *     feePayer: signerA,
 *     instructions: [firstInstruction, secondInstruction],
 * }
 *
 * const transactionSigners = getSignersFromTransactionMessage(transactionMessage);
 * // ^ [signerA, signerB]
 * ```
 */
export function getSignersFromTransactionMessage<
    TAddress extends string = string,
    TSigner extends TransactionSigner<TAddress> = TransactionSigner<TAddress>,
    TTransactionMessage extends TransactionMessageWithSigners<TAddress, TSigner> = TransactionMessageWithSigners<
        TAddress,
        TSigner
    >,
>(transaction: TTransactionMessage): readonly TSigner[] {
    return deduplicateSigners([
        ...(transaction.feePayer && isTransactionSigner(transaction.feePayer) ? [transaction.feePayer as TSigner] : []),
        ...transaction.instructions.flatMap(getSignersFromInstruction),
    ]);
}
