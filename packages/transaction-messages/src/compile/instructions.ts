import { Address } from '@solana/addresses';
import { ReadonlyUint8Array } from '@solana/codecs-core';
import { IInstruction } from '@solana/instructions';

import { OrderedAccounts } from './accounts';

type CompiledInstruction = Readonly<{
    /**
     * An ordered list of indices that indicate which accounts in the transaction message's
     * accounts list are loaded by this instruction.
     */
    accountIndices?: number[];
    /** The input to the invoked program */
    data?: ReadonlyUint8Array;
    /**
     * The index of the address in the transaction message's accounts list associated with the
     * program to invoke.
     */
    programAddressIndex: number;
}>;

function getAccountIndex(orderedAccounts: OrderedAccounts) {
    const out: Record<Address, number> = {};
    for (const [index, account] of orderedAccounts.entries()) {
        out[account.address] = index;
    }
    return out;
}

export function getCompiledInstructions(
    instructions: readonly IInstruction[],
    orderedAccounts: OrderedAccounts,
): CompiledInstruction[] {
    const accountIndex = getAccountIndex(orderedAccounts);
    return instructions.map(({ accounts, data, programAddress }) => {
        return {
            programAddressIndex: accountIndex[programAddress],
            ...(accounts ? { accountIndices: accounts.map(({ address }) => accountIndex[address]) } : null),
            ...(data ? { data } : null),
        };
    });
}
