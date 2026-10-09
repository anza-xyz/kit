import { SOLANA_ERROR__PLUGIN_INTERFACES__MISSING_CLIENT_CAPABILITIES, SolanaError } from '@solana/errors';
import { TransactionSigner } from '@solana/signers';

/**
 * Represents a client that provides a default transaction payer.
 *
 * The payer is a {@link TransactionSigner} used to sign and pay for transactions.
 * Clients implementing this interface can automatically fund transactions
 * without requiring callers to specify a fee payer explicitly. Unlike
 * {@link ClientWithIdentity}, which describes the signer whose assets the
 * application is acting upon, the payer describes the signer responsible for
 * paying transaction fees as well as storage costs — i.e. the minimum balance
 * required to keep newly created accounts alive based on their size.
 * In many apps the payer and identity refer to the same signer, but they can
 * differ — for example, when a service pays fees on behalf of a user.
 *
 * @example
 * ```ts
 * function createTransfer(client: ClientWithPayer, recipient: Address, amount: Lamports) {
 *     const feePayer = client.payer;
 *     // Use feePayer.address as the transaction fee payer
 * }
 * ```
 *
 * @see {@link ClientWithIdentity}
 */
export type ClientWithPayer = { payer: TransactionSigner };

/**
 * Checks whether the provided client has a `payer` installed.
 *
 * The check looks for an own `payer` property on the client without reading it, so a reactive
 * getter installed by a plugin is never invoked.
 *
 * @param client - The client to check.
 * @return `true` if the client has a `payer`, narrowing it to a {@link ClientWithPayer}.
 *
 * @example
 * ```ts
 * if (isClientWithPayer(client)) {
 *     console.log(`Fees will be paid by ${client.payer.address}`);
 * }
 * ```
 *
 * @see {@link assertIsClientWithPayer}
 */
export function isClientWithPayer(client: object): client is ClientWithPayer {
    return Object.hasOwn(client, 'payer');
}

/**
 * Asserts that the provided client has a `payer` installed.
 *
 * @param client - The client to check.
 * @throws A {@link SolanaError} with code {@link SOLANA_ERROR__PLUGIN_INTERFACES__MISSING_CLIENT_CAPABILITIES}
 * if the client has no `payer`.
 *
 * @example
 * ```ts
 * function memoPlugin() {
 *     return <T extends object>(client: T) => {
 *         assertIsClientWithPayer(client);
 *         return extendClient(client, {
 *             sendMemo: (message: string) => {
 *                 const feePayer = client.payer;
 *                 // ...
 *             },
 *         });
 *     };
 * }
 * ```
 *
 * @see {@link isClientWithPayer}
 */
export function assertIsClientWithPayer(client: object): asserts client is ClientWithPayer {
    if (!isClientWithPayer(client)) {
        throw new SolanaError(SOLANA_ERROR__PLUGIN_INTERFACES__MISSING_CLIENT_CAPABILITIES, {
            capabilities: ['payer'],
        });
    }
}
