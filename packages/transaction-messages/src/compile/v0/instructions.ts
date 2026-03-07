import { Address } from '@solana/addresses';
import { Instruction } from '@solana/instructions';

import { CompiledInstruction } from '../legacy/instructions';
import { OrderedAccounts } from './accounts';

function getAccountIndex(orderedAccounts: OrderedAccounts) {
    const out: Record<Address, number> = {};
    for (const [index, account] of orderedAccounts.entries()) {
        out[account.address] = index;
    }
    return out;
}

export function getCompiledInstructions(
    instructions: readonly Instruction[],
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
