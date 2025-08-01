import { TransactionMessageWithFeePayer } from '../fee-payer';
import { TransactionMessageWithLifetime } from '../lifetime';
import { BaseTransactionMessage } from '../transaction-message';
import { getAddressMapFromInstructions, getOrderedAccountsFromAddressMap } from './accounts';
import { getCompiledAddressTableLookups } from './address-table-lookups';
import { getCompiledMessageHeader } from './header';
import { getCompiledInstructions } from './instructions';
import { getCompiledLifetimeToken } from './lifetime-token';
import { getCompiledStaticAccounts } from './static-accounts';

type BaseCompiledTransactionMessage = Readonly<{
    /**
     * Information about the version of the transaction message and the role of the accounts it
     * loads.
     */
    header: ReturnType<typeof getCompiledMessageHeader>;
    instructions: ReturnType<typeof getCompiledInstructions>;
    /** A list of addresses indicating which accounts to load */
    staticAccounts: ReturnType<typeof getCompiledStaticAccounts>;
}>;

/**
 * A transaction message in a form suitable for encoding for execution on the network.
 *
 * You can not fully reconstruct a source message from a compiled message without extra information.
 * In particular, supporting details about the lifetime constraint and the concrete addresses of
 * accounts sourced from account lookup tables are lost to compilation.
 */
export type CompiledTransactionMessage = LegacyCompiledTransactionMessage | VersionedCompiledTransactionMessage;

export type CompiledTransactionMessageWithLifetime = Readonly<{
    /**
     * 32 bytes of data observed by the transaction proposed that makes a transaction eligible to
     * land on the network.
     *
     * In the case of a transaction message with a nonce lifetime constraint, this will be the value
     * of the nonce itself. In all other cases this will be a recent blockhash.
     */
    lifetimeToken: ReturnType<typeof getCompiledLifetimeToken>;
}>;

type LegacyCompiledTransactionMessage = BaseCompiledTransactionMessage &
    Readonly<{
        version: 'legacy';
    }>;

type VersionedCompiledTransactionMessage = BaseCompiledTransactionMessage &
    Readonly<{
        /** A list of address tables and the accounts that this transaction loads from them */
        addressTableLookups?: ReturnType<typeof getCompiledAddressTableLookups>;
        version: number;
    }>;

/**
 * Converts the type of transaction message data structure that you create in your application to
 * the type of transaction message data structure that can be encoded for execution on the network.
 *
 * This is a lossy process; you can not fully reconstruct a source message from a compiled message
 * without extra information. In particular, supporting details about the lifetime constraint and
 * the concrete addresses of accounts sourced from account lookup tables will be lost to
 * compilation.
 *
 * @see {@link decompileTransactionMessage}
 */
export function compileTransactionMessage<
    TTransactionMessage extends BaseTransactionMessage & TransactionMessageWithFeePayer,
>(transactionMessage: TTransactionMessage): CompiledTransactionMessageFromTransactionMessage<TTransactionMessage> {
    type ReturnType = CompiledTransactionMessageFromTransactionMessage<TTransactionMessage>;

    const addressMap = getAddressMapFromInstructions(
        transactionMessage.feePayer.address,
        transactionMessage.instructions,
    );
    const orderedAccounts = getOrderedAccountsFromAddressMap(addressMap);
    const lifetimeConstraint = (transactionMessage as Partial<TransactionMessageWithLifetime>).lifetimeConstraint;

    return {
        ...(transactionMessage.version !== 'legacy'
            ? { addressTableLookups: getCompiledAddressTableLookups(orderedAccounts) }
            : null),
        ...(lifetimeConstraint ? { lifetimeToken: getCompiledLifetimeToken(lifetimeConstraint) } : null),
        header: getCompiledMessageHeader(orderedAccounts),
        instructions: getCompiledInstructions(transactionMessage.instructions, orderedAccounts),
        staticAccounts: getCompiledStaticAccounts(orderedAccounts),
        version: transactionMessage.version,
    } as ReturnType;
}

type CompiledTransactionMessageFromTransactionMessage<TTransactionMessage extends BaseTransactionMessage> =
    ForwardTransactionMessageLifetime<ForwardTransactionMessageVersion<TTransactionMessage>, TTransactionMessage>;

type ForwardTransactionMessageVersion<TTransactionMessage extends BaseTransactionMessage> =
    TTransactionMessage extends Readonly<{ version: 'legacy' }>
        ? LegacyCompiledTransactionMessage
        : VersionedCompiledTransactionMessage;

type ForwardTransactionMessageLifetime<
    TCompiledTransactionMessage extends CompiledTransactionMessage,
    TTransactionMessage extends BaseTransactionMessage,
> = TTransactionMessage extends TransactionMessageWithLifetime
    ? CompiledTransactionMessageWithLifetime & TCompiledTransactionMessage
    : TCompiledTransactionMessage;
