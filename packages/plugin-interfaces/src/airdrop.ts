import { Address } from '@solana/addresses';
import { SOLANA_ERROR__PLUGIN_INTERFACES__MISSING_CLIENT_CAPABILITIES, SolanaError } from '@solana/errors';
import { Signature } from '@solana/keys';
import { Lamports } from '@solana/rpc-types';

/**
 * Represents a client that can request airdrops of SOL to a specified address.
 *
 * The airdrop capability is typically available on test networks (devnet, testnet)
 * and local validators. It allows funding accounts with SOL for testing purposes.
 *
 * @example
 * ```ts
 * async function fundAccount(client: ClientWithAirdrop, address: Address) {
 *     const signature = await client.airdrop(address, lamports(1_000_000_000n));
 *     console.log(`Airdrop confirmed: ${signature ?? '[no signature]'}`);
 * }
 * ```
 */
export type ClientWithAirdrop = {
    /**
     * Requests an airdrop of SOL to the specified address.
     *
     * The returned promise resolves when the airdrop succeeds and rejects on failure.
     * Some implementations (e.g., LiteSVM) update account balances directly without
     * sending a transaction, in which case no signature is returned.
     *
     * @param address - The address to receive the airdrop.
     * @param amount - The amount of lamports to airdrop.
     * @param abortSignal - An optional signal to abort the airdrop request.
     * @returns A promise resolving to the transaction signature if the airdrop was
     *          performed via a transaction, or `undefined` if no transaction was used.
     */
    airdrop: (address: Address, amount: Lamports, abortSignal?: AbortSignal) => Promise<Signature | undefined>;
};

/**
 * Checks whether the provided client has an `airdrop` function installed.
 *
 * @param client - The client to check.
 * @return `true` if the client has an `airdrop` function, narrowing it to a {@link ClientWithAirdrop}.
 *
 * @example
 * ```ts
 * if (isClientWithAirdrop(client)) {
 *     await client.airdrop(address, lamports(1_000_000_000n));
 * }
 * ```
 *
 * @see {@link assertIsClientWithAirdrop}
 */
export function isClientWithAirdrop(client: object): client is ClientWithAirdrop {
    return Object.hasOwn(client, 'airdrop');
}

/**
 * Asserts that the provided client has an `airdrop` function installed.
 *
 * @param client - The client to check.
 * @throws A {@link SolanaError} with code {@link SOLANA_ERROR__PLUGIN_INTERFACES__MISSING_CLIENT_CAPABILITIES}
 * if the client has no `airdrop` function.
 *
 * @example
 * ```ts
 * async function fundAccount(client: object, address: Address) {
 *     assertIsClientWithAirdrop(client);
 *     await client.airdrop(address, lamports(1_000_000_000n));
 * }
 * ```
 *
 * @see {@link isClientWithAirdrop}
 */
export function assertIsClientWithAirdrop(client: object): asserts client is ClientWithAirdrop {
    if (!isClientWithAirdrop(client)) {
        throw new SolanaError(SOLANA_ERROR__PLUGIN_INTERFACES__MISSING_CLIENT_CAPABILITIES, {
            capabilities: ['airdrop'],
        });
    }
}
