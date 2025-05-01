import type { IAccountLookupMeta, IAccountMeta } from '@solana/instructions';
import type { Brand } from '@solana/nominal-types';

import type { IAccountSignerMeta, TransactionMessageWithSigners } from './account-signer-meta';
import type { TransactionSigner } from './transaction-signer';

/**
 * A {@link BaseTransactionMessage} type extension that accept {@link TransactionSigner | TransactionSigners}.
 *
 * Namely, it allows:
 * - a {@link TransactionSigner} to be used as the fee payer and
 * - {@link IInstructionWithSigners} to be used in its instructions.
 *
 * @deprecated Use {@link TransactionMessageWithSigners} instead. It was only renamed.
 *
 * @typeParam TAddress - Supply a string literal to define an account having a particular address.
 * @typeParam TSigner - Optionally provide a narrower type for {@link TransactionSigner | TransactionSigners}.
 * @typeParam TAccounts - Optionally provide a narrower type for the account metas.
 *
 * @example
 * ```ts
 * import { IInstruction } from '@solana/instructions';
 * import { BaseTransactionMessage } from '@solana/transaction-messages';
 * import { generateKeyPairSigner, IInstructionWithSigners, ITransactionMessageWithSigners } from '@solana/signers';
 *
 * const signer = await generateKeyPairSigner();
 * const firstInstruction: IInstruction = { ... };
 * const secondInstruction: IInstructionWithSigners = { ... };
 * const transactionMessage: BaseTransactionMessage & ITransactionMessageWithSigners = {
 *     feePayer: signer,
 *     instructions: [firstInstruction, secondInstruction],
 * }
 * ```
 */
export type ITransactionMessageWithSigners<
    TAddress extends string = string,
    TSigner extends TransactionSigner<TAddress> = TransactionSigner<TAddress>,
    TAccounts extends readonly IAccountMetaWithSigner<TSigner>[] = readonly IAccountMetaWithSigner<TSigner>[],
> = TransactionMessageWithSigners<TAddress, TSigner, TAccounts>;

type IAccountMetaWithSigner<TSigner extends TransactionSigner = TransactionSigner> =
    | IAccountLookupMeta
    | IAccountMeta
    | IAccountSignerMeta<string, TSigner>;

/**
 * Alternative to {@link TransactionMessageWithFeePayer} that uses a {@link TransactionSigner} for the fee payer.
 *
 * @deprecated Use {@link TransactionMessageWithFeePayer} instead. It was only renamed.
 *
 * @typeParam TAddress - Supply a string literal to define a fee payer having a particular address.
 * @typeParam TSigner - Optionally provide a narrower type for the {@link TransactionSigner}.
 *
 * @example
 * ```ts
 * import { BaseTransactionMessage } from '@solana/transaction-messages';
 * import { generateKeyPairSigner, ITransactionMessageWithFeePayerSigner } from '@solana/signers';
 *
 * const transactionMessage: BaseTransactionMessage & ITransactionMessageWithFeePayerSigner = {
 *     feePayer: await generateKeyPairSigner(),
 *     instructions: [],
 *     version: 0,
 * };
 * ```
 */
export interface ITransactionMessageWithFeePayerSigner<
    TAddress extends string = string,
    TSigner extends TransactionSigner<TAddress> = TransactionSigner<TAddress>,
> {
    readonly feePayer: TSigner;
}

/**
 * Defines a transaction message with exactly one {@link TransactionSendingSigner}.
 *
 * This type is used to narrow the type of transaction messages that have been
 * checked to have exactly one sending signer.
 *
 * @deprecated Use {@link TransactionMessageWithSingleSendingSigner} instead. It was only renamed.
 *
 * @example
 * ```ts
 * import { assertIsTransactionMessageWithSingleSendingSigner } from '@solana/signers';
 *
 * assertIsTransactionMessageWithSingleSendingSigner(transactionMessage);
 * transactionMessage satisfies ITransactionMessageWithSingleSendingSigner;
 * ```
 *
 * @see {@link isTransactionMessageWithSingleSendingSigner}
 * @see {@link assertIsTransactionMessageWithSingleSendingSigner}
 */
export type ITransactionMessageWithSingleSendingSigner = Brand<
    TransactionMessageWithSigners,
    'TransactionMessageWithSingleSendingSigner'
>;
