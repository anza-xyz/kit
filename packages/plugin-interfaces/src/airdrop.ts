import { Address } from '@solana/addresses';
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
