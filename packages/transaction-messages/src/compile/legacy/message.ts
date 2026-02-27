import { TransactionMessageWithFeePayer, TransactionMessageWithLifetime } from '../..';
import { TransactionMessage } from '../../transaction-message';
import { BaseCompiledTransactionMessage, ForwardTransactionMessageLifetime } from '../message-types';
import { getAddressMapFromInstructions, getOrderedAccountsFromAddressMap } from './accounts';
import { getCompiledMessageHeader } from './header';
import { getCompiledInstructions } from './instructions';
import { getCompiledLifetimeToken } from './lifetime-token';

export type LegacyCompiledTransactionMessage = BaseCompiledTransactionMessage &
    Readonly<{
        /** A list of instructions that this transaction will execute */
        instructions: ReturnType<typeof getCompiledInstructions>;
        version: 'legacy';
    }>;

/**
 * Converts the type of transaction message data structure that you create in your application to
 * the type of transaction message data structure that can be encoded for execution on the network.
 *
 * This is a lossy process; you can not fully reconstruct a source message from a compiled message
 * without extra information. In particular, supporting details about the lifetime constraint will
 * be lost to compilation.
 *
 * @see {@link decompileTransactionMessage}
 */
export function compileTransactionMessage<
    TTransactionMessage extends TransactionMessage & TransactionMessageWithFeePayer & { version: 'legacy' },
>(
    transactionMessage: TTransactionMessage,
): ForwardTransactionMessageLifetime<LegacyCompiledTransactionMessage, TTransactionMessage> {
    type ReturnType = ForwardTransactionMessageLifetime<LegacyCompiledTransactionMessage, TTransactionMessage>;

    const addressMap = getAddressMapFromInstructions(
        transactionMessage.feePayer.address,
        transactionMessage.instructions,
    );
    const orderedAccounts = getOrderedAccountsFromAddressMap(addressMap);
    const lifetimeConstraint = (transactionMessage as Partial<TransactionMessageWithLifetime>).lifetimeConstraint;

    return {
        ...(lifetimeConstraint ? { lifetimeToken: getCompiledLifetimeToken(lifetimeConstraint) } : null),
        header: getCompiledMessageHeader(orderedAccounts),
        instructions: getCompiledInstructions(transactionMessage.instructions, orderedAccounts),
        staticAccounts: orderedAccounts.map(account => account.address),
        version: transactionMessage.version,
    } as ReturnType;
}
