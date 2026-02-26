import { assertIsAddress } from '@solana/addresses';
import { Instruction } from '@solana/instructions';
import { Blockhash } from '@solana/rpc-types';

import { BlockhashLifetimeConstraint } from '../../blockhash';
import { Nonce, setTransactionMessageLifetimeUsingDurableNonce } from '../../durable-nonce';
import { isAdvanceNonceAccountInstruction } from '../../durable-nonce-instruction';

type LifetimeConstraint =
    | BlockhashLifetimeConstraint
    | Parameters<typeof setTransactionMessageLifetimeUsingDurableNonce>[0];

export function getLifetimeConstraint(
    messageLifetimeToken: string,
    instructions: Instruction[],
    lastValidBlockHeight?: bigint,
): LifetimeConstraint {
    const firstInstruction = instructions[0];
    if (!firstInstruction || !isAdvanceNonceAccountInstruction(firstInstruction)) {
        // first instruction is not advance durable nonce, so use blockhash lifetime constraint
        return {
            blockhash: messageLifetimeToken as Blockhash,
            lastValidBlockHeight: lastValidBlockHeight ?? 2n ** 64n - 1n, // U64 MAX
        };
    } else {
        // We know these accounts are defined because we checked `isAdvanceNonceAccountInstruction`
        const nonceAccountAddress = firstInstruction.accounts[0].address;
        assertIsAddress(nonceAccountAddress);

        const nonceAuthorityAddress = firstInstruction.accounts[2].address;
        assertIsAddress(nonceAuthorityAddress);

        return {
            nonce: messageLifetimeToken as Nonce,
            nonceAccountAddress,
            nonceAuthorityAddress,
        };
    }
}
