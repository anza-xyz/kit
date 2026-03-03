import { Address } from '@solana/addresses';

import { TransactionMessageWithFeePayer } from '../../fee-payer';
import { TransactionMessageWithLifetime } from '../../lifetime';
import { TransactionMessage } from '../../transaction-message';
import { getAddressMapFromInstructions, getOrderedAccountsFromAddressMap } from '../legacy/accounts';
import { getCompiledMessageHeader } from '../legacy/header';
import { getAccountIndex } from '../legacy/instructions';
import { getCompiledLifetimeToken } from '../legacy/lifetime-token';
import { ForwardTransactionMessageLifetime } from '../message-types';
import { getTransactionConfigMask, getTransactionConfigValues } from './config';
import { getInstructionHeader, getInstructionPayload } from './instructions';

export type V1CompiledTransactionMessage = Readonly<{
    /** A mask indicating which transaction config values are present */
    configMask: number;
    /** The configuration values for the transaction */
    configValues: ReturnType<typeof getTransactionConfigValues>;
    /** Information about the role of the accounts loaded. */
    header: ReturnType<typeof getCompiledMessageHeader>;
    /** The headers for each instruction in the transaction */
    instructionHeaders: ReturnType<typeof getInstructionHeader>[];
    /** The payload for each instruction in the transaction */
    instructionPayloads: ReturnType<typeof getInstructionPayload>[];
    /** The number of instructions in the transaction */
    numInstructions: number;
    /** The number of static accounts in the transaction */
    numStaticAccounts: number;
    /** A list of addresses indicating which accounts to load */
    staticAccounts: Address[];
    version: 1;
}>;

export function compileTransactionMessage<
    TTransactionMessage extends TransactionMessage & TransactionMessageWithFeePayer & { version: 1 },
>(
    transactionMessage: TTransactionMessage,
): ForwardTransactionMessageLifetime<V1CompiledTransactionMessage, TTransactionMessage> {
    type ReturnType = ForwardTransactionMessageLifetime<V1CompiledTransactionMessage, TTransactionMessage>;
    const addressMap = getAddressMapFromInstructions(
        transactionMessage.feePayer.address,
        transactionMessage.instructions,
    );
    const orderedAccounts = getOrderedAccountsFromAddressMap(addressMap);
    const accountIndex = getAccountIndex(orderedAccounts);
    const lifetimeConstraint = (transactionMessage as Partial<TransactionMessageWithLifetime>).lifetimeConstraint;

    return {
        version: 1,
        ...(lifetimeConstraint ? { lifetimeToken: getCompiledLifetimeToken(lifetimeConstraint) } : null),
        configMask: getTransactionConfigMask(transactionMessage.config ?? {}),
        configValues: getTransactionConfigValues(transactionMessage.config ?? {}),
        header: getCompiledMessageHeader(orderedAccounts),
        instructionHeaders: transactionMessage.instructions.map(instruction =>
            getInstructionHeader(instruction, accountIndex),
        ),
        instructionPayloads: transactionMessage.instructions.map(instruction =>
            getInstructionPayload(instruction, accountIndex),
        ),
        numInstructions: transactionMessage.instructions.length,
        numStaticAccounts: orderedAccounts.length,
        staticAccounts: orderedAccounts.map(account => account.address),
    } as ReturnType;
}
