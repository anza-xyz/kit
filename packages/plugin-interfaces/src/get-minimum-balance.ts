import { Lamports } from '@solana/rpc-types';

/**
 * Configuration options for {@link ClientWithGetMinimumBalance.getMinimumBalance}.
 */
export type GetMinimumBalanceConfig = {
    /**
     * When `true`, the 128-byte account header is not added to the provided `space` value.
     *
     * By default, the account header (128 bytes) is included in the minimum balance computation
     * on top of the provided `space`. Set this to `true` if the provided `space` already accounts
     * for the header or if you want the minimum balance for the data portion only.
     *
     * @see {@link @solana/accounts#BASE_ACCOUNT_SIZE | BASE_ACCOUNT_SIZE} for the account header size constant.
     */
    withoutHeader?: boolean;
};

/**
 * Represents a client that can compute the minimum balance required for an account to be
 * exempt from deletion.
 *
 * Different implementations may compute this value differently — for example, by calling the
 * `getMinimumBalanceForRentExemption` RPC method, or by using a locally cached value.
 *
 * @example
 * ```ts
 * async function logAccountCost(client: ClientWithGetMinimumBalance, dataSize: number) {
 *     const minimumBalance = await client.getMinimumBalance(dataSize);
 *     console.log(`Minimum balance for ${dataSize} bytes: ${minimumBalance} lamports`);
 * }
 * ```
 */
export type ClientWithGetMinimumBalance = {
    /**
     * Computes the minimum lamports required for an account with the given data size.
     *
     * By default, the 128-byte account header is added on top of the provided `space`. Pass
     * `{ withoutHeader: true }` to skip adding the header bytes.
     *
     * @param space - The number of bytes of account data.
     * @param config - Optional configuration for the computation.
     * @returns A promise resolving to the minimum {@link Lamports} required.
     *
     * @see {@link @solana/accounts#BASE_ACCOUNT_SIZE | BASE_ACCOUNT_SIZE} for the account header size constant.
     */
    getMinimumBalance: (space: number, config?: GetMinimumBalanceConfig) => Promise<Lamports>;
};
