import { AccountLookupMeta, AccountMeta, AccountRole } from '@solana/instructions';

import { TransactionSigner } from './transaction-signer';

/**
 * An extension of the {@link AccountMeta} type that allows us to store {@link TransactionSigner | TransactionSigners} inside it.
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
 * import { generateKeyPairSigner, AccountSignerMeta } from '@solana/signers';
 *
 * const signer = await generateKeyPairSigner();
 * const account: AccountSignerMeta = {
 *     address: signer.address,
 *     role: AccountRole.READONLY_SIGNER,
 *     signer,
 * };
 * ```
 */
export interface AccountSignerMeta<
    TAddress extends string = string,
    TSigner extends TransactionSigner<TAddress> = TransactionSigner<TAddress>,
> extends AccountMeta<TAddress> {
    readonly role: AccountRole.READONLY_SIGNER | AccountRole.WRITABLE_SIGNER;
    readonly signer: TSigner;
    readonly __signerBrand?: TSigner;
}

/**
 * A union type that supports base account metas as well as {@link AccountSignerMeta | signer account metas}.
 */
export type AccountMetaWithSigner<TSigner extends TransactionSigner = TransactionSigner> =
    | AccountLookupMeta
    | AccountMeta
    | AccountSignerMeta<string, TSigner>;

/**
 * An {@link AccountMeta} that is not a signer.
 */
export type NonSignerAccountMeta = { signer?: never } & (AccountLookupMeta | AccountMeta);
