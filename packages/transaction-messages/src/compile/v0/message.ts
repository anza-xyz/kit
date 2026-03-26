import { Address } from '@solana/addresses';
import {
    SOLANA_ERROR__TRANSACTION__TOO_MANY_ACCOUNT_ADDRESSES,
    SOLANA_ERROR__TRANSACTION__TOO_MANY_ACCOUNTS_IN_INSTRUCTION,
    SOLANA_ERROR__TRANSACTION__TOO_MANY_INSTRUCTIONS,
    SOLANA_ERROR__TRANSACTION__TOO_MANY_SIGNER_ADDRESSES,
    SolanaError,
} from '@solana/errors';
import { isSignerRole } from '@solana/instructions';

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
    const numAccounts = orderedAccounts.length;
    if (numAccounts > 64) {
        throw new SolanaError(SOLANA_ERROR__TRANSACTION__TOO_MANY_ACCOUNT_ADDRESSES, {
            actualCount: numAccounts,
            maxAllowed: 64,
        });
    }
    const numSigners = orderedAccounts.filter(account => isSignerRole(account.role)).length;
    if (numSigners > 12) {
        throw new SolanaError(SOLANA_ERROR__TRANSACTION__TOO_MANY_SIGNER_ADDRESSES, {
            actualCount: numSigners,
            maxAllowed: 12,
        });
    }
    const numInstructions = transactionMessage.instructions.length;
    if (numInstructions > 64) {
        throw new SolanaError(SOLANA_ERROR__TRANSACTION__TOO_MANY_INSTRUCTIONS, {
            actualCount: numInstructions,
            maxAllowed: 64,
        });
    }
    for (let i = 0; i < transactionMessage.instructions.length; i++) {
        const numAccountsInInstruction = transactionMessage.instructions[i].accounts?.length ?? 0;
        if (numAccountsInInstruction > 255) {
            throw new SolanaError(SOLANA_ERROR__TRANSACTION__TOO_MANY_ACCOUNTS_IN_INSTRUCTION, {
                actualCount: numAccountsInInstruction,
                instructionIndex: i,
                maxAllowed: 255,
            });
        }
    }
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
