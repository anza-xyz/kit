import { SOLANA_ERROR__PLUGIN_INTERFACES__MISSING_CLIENT_CAPABILITIES, SolanaError } from '@solana/errors';
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

/**
 * Checks whether the provided client has a `getMinimumBalance` function installed.
 *
 * @param client - The client to check.
 * @return `true` if the client has a `getMinimumBalance` function, narrowing it to a
 * {@link ClientWithGetMinimumBalance}.
 *
 * @example
 * ```ts
 * if (isClientWithGetMinimumBalance(client)) {
 *     const minimumBalance = await client.getMinimumBalance(dataSize);
 * }
 * ```
 *
 * @see {@link assertIsClientWithGetMinimumBalance}
 */
export function isClientWithGetMinimumBalance(client: object): client is ClientWithGetMinimumBalance {
    return Object.hasOwn(client, 'getMinimumBalance');
}

/**
 * Asserts that the provided client has a `getMinimumBalance` function installed.
 *
 * @param client - The client to check.
 * @throws A {@link SolanaError} with code {@link SOLANA_ERROR__PLUGIN_INTERFACES__MISSING_CLIENT_CAPABILITIES}
 * if the client has no `getMinimumBalance` function.
 *
 * @example
 * ```ts
 * async function logAccountCost(client: object, dataSize: number) {
 *     assertIsClientWithGetMinimumBalance(client);
 *     const minimumBalance = await client.getMinimumBalance(dataSize);
 *     console.log(`Minimum balance for ${dataSize} bytes: ${minimumBalance} lamports`);
 * }
 * ```
 *
 * @see {@link isClientWithGetMinimumBalance}
 */
export function assertIsClientWithGetMinimumBalance(client: object): asserts client is ClientWithGetMinimumBalance {
    if (!isClientWithGetMinimumBalance(client)) {
        throw new SolanaError(SOLANA_ERROR__PLUGIN_INTERFACES__MISSING_CLIENT_CAPABILITIES, {
            capabilities: ['getMinimumBalance'],
        });
    }
}
