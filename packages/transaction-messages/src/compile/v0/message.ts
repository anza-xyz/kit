import { Address } from '@solana/addresses';

import { TransactionMessageWithFeePayer } from '../../fee-payer';
import { TransactionMessageWithLifetime } from '../../lifetime';
import { TransactionMessage } from '../../transaction-message';
import { getCompiledMessageHeader } from '../legacy/header';
import { getCompiledLifetimeToken } from '../legacy/lifetime-token';
import { ForwardTransactionMessageLifetime } from '../message-types';
import { getAddressMapFromInstructions, getOrderedAccountsFromAddressMap } from './accounts';
import { getCompiledAddressTableLookups } from './address-table-lookups';
import { getCompiledInstructions } from './instructions';
import { getCompiledStaticAccounts } from './static-accounts';

export type V0CompiledTransactionMessage = Readonly<{
    /** A list of address tables and the accounts that this transaction loads from them */
    addressTableLookups?: ReturnType<typeof getCompiledAddressTableLookups>;
    /** Information about the role of the accounts loaded. */
    header: ReturnType<typeof getCompiledMessageHeader>;
    /** A list of instructions that this transaction will execute */
    instructions: ReturnType<typeof getCompiledInstructions>;
    /** A list of addresses indicating which accounts to load */
    staticAccounts: Address[];
    version: 0;
}>;

export function compileTransactionMessage<
    TTransactionMessage extends TransactionMessage & TransactionMessageWithFeePayer,
>(
    transactionMessage: TTransactionMessage,
): ForwardTransactionMessageLifetime<V0CompiledTransactionMessage, TTransactionMessage> {
    type ReturnType = ForwardTransactionMessageLifetime<V0CompiledTransactionMessage, TTransactionMessage>;

    const addressMap = getAddressMapFromInstructions(
        transactionMessage.feePayer.address,
        transactionMessage.instructions,
    );
    const orderedAccounts = getOrderedAccountsFromAddressMap(addressMap);
    const lifetimeConstraint = (transactionMessage as Partial<TransactionMessageWithLifetime>).lifetimeConstraint;

    return {
        addressTableLookups: getCompiledAddressTableLookups(orderedAccounts),
        ...(lifetimeConstraint ? { lifetimeToken: getCompiledLifetimeToken(lifetimeConstraint) } : null),
        header: getCompiledMessageHeader(orderedAccounts),
        instructions: getCompiledInstructions(transactionMessage.instructions, orderedAccounts),
        staticAccounts: getCompiledStaticAccounts(orderedAccounts),
        version: transactionMessage.version,
    } as ReturnType;
}
