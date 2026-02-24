/**
 * This file is for types that are exported for use in multiple places within the compile directory,
 * but that are not intended to be exported from the package as part of the public API.
 */

import { CompiledTransactionMessage, CompiledTransactionMessageWithLifetime } from '..';
import { TransactionMessageWithLifetime } from '../lifetime';
import { TransactionMessage } from '../transaction-message';
import { getCompiledInstructions } from './instructions';
import { getCompiledMessageHeader } from './legacy/header';
import { getCompiledStaticAccounts } from './static-accounts';

export type BaseCompiledTransactionMessage = Readonly<{
    /**
     * Information about the version of the transaction message and the role of the accounts it
     * loads.
     */
    header: ReturnType<typeof getCompiledMessageHeader>;
    instructions: ReturnType<typeof getCompiledInstructions>;
    /** A list of addresses indicating which accounts to load */
    staticAccounts: ReturnType<typeof getCompiledStaticAccounts>;
}>;

export type ForwardTransactionMessageLifetime<
    TCompiledTransactionMessage extends CompiledTransactionMessage,
    TTransactionMessage extends TransactionMessage,
> = TTransactionMessage extends TransactionMessageWithLifetime
    ? CompiledTransactionMessageWithLifetime & TCompiledTransactionMessage
    : TCompiledTransactionMessage;
