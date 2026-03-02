/**
 * This file is for types that are exported for use in multiple places within the compile directory,
 * but that are not intended to be exported from the package as part of the public API.
 */

import { CompiledTransactionMessage, CompiledTransactionMessageWithLifetime } from '..';
import { TransactionMessageWithLifetime } from '../lifetime';
import { TransactionMessage } from '../transaction-message';

export type ForwardTransactionMessageLifetime<
    TCompiledTransactionMessage extends CompiledTransactionMessage,
    TTransactionMessage extends TransactionMessage,
> = TTransactionMessage extends TransactionMessageWithLifetime
    ? CompiledTransactionMessageWithLifetime & TCompiledTransactionMessage
    : TCompiledTransactionMessage;
