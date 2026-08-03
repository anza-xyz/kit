import type { Address, ClientWithAirdrop, Lamports, Signature } from '@solana/kit';

import { type ActionResult, useAction } from './useAction';

/**
 * Requests an airdrop of SOL to an address, as a reactive action.
 *
 * Wraps `client.airdrop` with {@link useAction}: each `dispatch(address, amount)` runs the airdrop
 * with a fresh `AbortSignal` and tracks its lifecycle through React state. Calling `dispatch` again
 * while a previous airdrop is in flight aborts the first. This is a great fit for a devnet or
 * localnet "fund this account" button, where the `isRunning` / `data` / `error` tracking drives the
 * UI directly.
 *
 * The airdrop capability is typically available on test networks (devnet, testnet) and local
 * validators. Some implementations (e.g. LiteSVM) update balances directly without sending a
 * transaction, in which case the resolved `data` is `undefined` rather than a {@link Signature}.
 *
 * @param client - A client with an airdrop plugin installed (`ClientWithAirdrop`).
 * @returns An {@link ActionResult} whose `dispatch`/`dispatchAsync` take the recipient `address` and
 *   the `amount` of lamports, and resolve with the transaction {@link Signature}, or `undefined`
 *   when the airdrop was performed without a transaction.
 *
 * @example
 * ```tsx
 * import { useAirdrop } from '@solana/react';
 * import { lamports } from '@solana/kit';
 *
 * function AirdropButton({ client, address }) {
 *     const { dispatch, isRunning } = useAirdrop(client);
 *     return (
 *         <button disabled={isRunning} onClick={() => dispatch(address, lamports(1_000_000_000n))}>
 *             {isRunning ? 'Airdropping…' : 'Airdrop 1 SOL'}
 *         </button>
 *     );
 * }
 * ```
 *
 * @see {@link ActionResult}
 * @see {@link useAction}
 */
export function useAirdrop(
    client: ClientWithAirdrop,
): ActionResult<[address: Address, amount: Lamports], Signature | undefined> {
    return useAction((abortSignal, address: Address, amount: Lamports) => client.airdrop(address, amount, abortSignal));
}
