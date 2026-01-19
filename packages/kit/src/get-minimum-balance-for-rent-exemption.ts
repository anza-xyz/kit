import type { Lamports } from '@solana/rpc-types';

/**
 * Calculates the minimum {@link Lamports | lamports} required to make an account rent exempt for a
 * given data size, without performing an RPC call.
 *
 * Values are sourced from the on-chain rent parameters in the Solana runtime:
 * https://github.com/anza-xyz/solana-sdk/blob/c07f692e41d757057c8700211a9300cdcd6d33b1/rent/src/lib.rs#L93-L97
 *
 * Note that this logic may change, or be incorrect depending on the cluster you are connected to.
 * You can always use the RPC method `getMinimumBalanceForRentExemption` to get the current value.
 *
 * @param space The number of bytes of account data.
 */
export function getMinimumBalanceForRentExemption(space: bigint | number): Lamports {
    const RENT = {
        ACCOUNT_STORAGE_OVERHEAD: 128n,
        DEFAULT_EXEMPTION_THRESHOLD: 2n,
        DEFAULT_LAMPORTS_PER_BYTE_YEAR: 3_480n,
    } as const;
    const requiredLamports =
        (RENT.ACCOUNT_STORAGE_OVERHEAD + BigInt(space)) *
        RENT.DEFAULT_LAMPORTS_PER_BYTE_YEAR *
        RENT.DEFAULT_EXEMPTION_THRESHOLD;
    return requiredLamports as Lamports;
}
