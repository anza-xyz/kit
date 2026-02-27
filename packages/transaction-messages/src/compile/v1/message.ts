import { TransactionMessageWithFeePayer } from '../../fee-payer';
import { TransactionMessageWithLifetime } from '../../lifetime';
import { TransactionMessage } from '../../transaction-message';
import { getAddressMapFromInstructions, getOrderedAccountsFromAddressMap } from '../legacy/accounts';
import { getCompiledMessageHeader } from '../legacy/header';
import { getAccountIndex } from '../legacy/instructions';
import { getCompiledLifetimeToken } from '../legacy/lifetime-token';
import { BaseCompiledTransactionMessage, ForwardTransactionMessageLifetime } from '../message-types';
import { getTransactionConfigMask, getTransactionConfigValues } from './config';
import { getInstructionHeader, getInstructionPayload } from './instructions';

type ConfigValue =
    | {
          kind: 'u32';
          value: number;
      }
    | {
          kind: 'u64';
          value: bigint;
      };

type InstructionHeader = {
    numInstructionAccounts: number;
    numInstructionDataBytes: number;
    programAccountIndex: number;
};

type InstructionPayload = {
    instructionAccountIndices: number[];
    instructionData: Uint8Array;
};

export type V1CompiledTransactionMessage = BaseCompiledTransactionMessage &
    Readonly<{
        /** A mask indicating which transaction config values are present */
        configMask: number;
        /** The configuration values for the transaction */
        configValues: ConfigValue[];
        /** The headers for each instruction in the transaction */
        instructionHeaders: InstructionHeader[];
        /** The payload for each instruction in the transaction */
        instructionPayloads: InstructionPayload[];
        /** The number of instructions in the transaction */
        numInstructions: number;
        /** The number of static accounts in the transaction */
        numStaticAccounts: number;
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
