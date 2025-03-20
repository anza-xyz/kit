import type { Address } from '@solana/addresses';
import type { MicroLamports, Slot } from '@solana/rpc-types';

type RecentPrioritizationFee = Readonly<{
    /**
     * The smallest per-compute-unit fee paid by at least one successfully landed transaction,
     * specified in increments of {@link MicroLamports} (0.000001 {@link Lamports}).
     */
    prioritizationFee: MicroLamports;
    /** Slot in which the fee was observed */
    slot: Slot;
}>;

type GetRecentPrioritizationFeesApiResponse = readonly RecentPrioritizationFee[];

export type GetRecentPrioritizationFeesApi = {
    /**
     * Returns a list of the smallest prioritization fees paid in recent blocks.
     *
     * Currently, a node's prioritization-fee cache stores data from up to 150 blocks.
     *
     * @param addresses A maximum of 128 addresses. When supplied, the response will reflect the
     * prioritization fee paid for transactions which take a write-lock on all of them.
     *
     * @see https://solana.com/docs/rpc/http/getrecentprioritizationfees
     */
    getRecentPrioritizationFees(addresses?: Address[]): GetRecentPrioritizationFeesApiResponse;
};
