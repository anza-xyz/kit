import { SOLANA_ERROR__PLUGIN_INTERFACES__MISSING_CLIENT_CAPABILITIES, SolanaError } from '@solana/errors';

import type { ClientWithAirdrop } from './airdrop';
import type { ClientWithFetchAccounts } from './fetch-accounts';
import type { ClientWithGetMinimumBalance } from './get-minimum-balance';
import type { ClientWithIdentity } from './identity';
import type { ClientWithTransactionPlanning, ClientWithTransactionSending } from './instruction-plans';
import type { ClientWithPayer } from './payer';
import type { ClientWithRpc, ClientWithRpcSubscriptions } from './rpc';
import type { ClientWithSubscribeToIdentity, ClientWithSubscribeToPayer } from './subscribe-to';

type ClientCapabilityRequirement = Readonly<{
    kind: 'function' | 'property';
    name: string;
}>;

const AIRDROP_CAPABILITIES = [{ kind: 'function', name: 'airdrop' }] as const;
const FETCH_ACCOUNTS_CAPABILITIES = [{ kind: 'function', name: 'fetchAccounts' }] as const;
const GET_MINIMUM_BALANCE_CAPABILITIES = [{ kind: 'function', name: 'getMinimumBalance' }] as const;
const IDENTITY_CAPABILITIES = [{ kind: 'property', name: 'identity' }] as const;
const PAYER_CAPABILITIES = [{ kind: 'property', name: 'payer' }] as const;
const RPC_CAPABILITIES = [{ kind: 'property', name: 'rpc' }] as const;
const RPC_SUBSCRIPTIONS_CAPABILITIES = [{ kind: 'property', name: 'rpcSubscriptions' }] as const;
const SUBSCRIBE_TO_IDENTITY_CAPABILITIES = [{ kind: 'function', name: 'subscribeToIdentity' }] as const;
const SUBSCRIBE_TO_PAYER_CAPABILITIES = [{ kind: 'function', name: 'subscribeToPayer' }] as const;
const TRANSACTION_PLANNING_CAPABILITIES = [
    { kind: 'function', name: 'planTransaction' },
    { kind: 'function', name: 'planTransactions' },
] as const;
const TRANSACTION_SENDING_CAPABILITIES = [
    { kind: 'function', name: 'sendTransaction' },
    { kind: 'function', name: 'sendTransactions' },
] as const;

function getMissingClientCapabilities(
    client: unknown,
    capabilities: readonly ClientCapabilityRequirement[],
): readonly string[] {
    if (client === null || typeof client !== 'object') {
        return capabilities.map(({ name }) => name);
    }
    return capabilities.flatMap(({ kind, name }) => {
        try {
            if (!Object.hasOwn(client, name)) {
                return [name];
            }
            if (kind === 'function' && typeof (client as Record<string, unknown>)[name] !== 'function') {
                return [name];
            }
            return [];
        } catch {
            return [name];
        }
    });
}

function isClientWithCapabilities(client: unknown, capabilities: readonly ClientCapabilityRequirement[]): boolean {
    return getMissingClientCapabilities(client, capabilities).length === 0;
}

function assertIsClientWithCapabilities(client: unknown, capabilities: readonly ClientCapabilityRequirement[]): void {
    const missingCapabilities = getMissingClientCapabilities(client, capabilities);
    if (missingCapabilities.length > 0) {
        throw new SolanaError(SOLANA_ERROR__PLUGIN_INTERFACES__MISSING_CLIENT_CAPABILITIES, {
            capabilities: missingCapabilities,
        });
    }
}

/**
 * Returns whether a value implements {@link ClientWithAirdrop} and narrows its type when it does.
 *
 * @param client - The value to inspect.
 * @returns `true` when the value has an `airdrop` function.
 * @see {@link assertIsClientWithAirdrop}
 */
export function isClientWithAirdrop(client: unknown): client is ClientWithAirdrop {
    return isClientWithCapabilities(client, AIRDROP_CAPABILITIES);
}

/**
 * Asserts that a value implements {@link ClientWithAirdrop} and narrows its type.
 *
 * @param client - The value to inspect.
 * @throws A {@link SolanaError} when the value does not have an `airdrop` function.
 * @see {@link isClientWithAirdrop}
 */
export function assertIsClientWithAirdrop(client: unknown): asserts client is ClientWithAirdrop {
    assertIsClientWithCapabilities(client, AIRDROP_CAPABILITIES);
}

/**
 * Returns whether a value implements {@link ClientWithFetchAccounts} and narrows its type when it does.
 *
 * @param client - The value to inspect.
 * @returns `true` when the value has a `fetchAccounts` function.
 * @see {@link assertIsClientWithFetchAccounts}
 */
export function isClientWithFetchAccounts(client: unknown): client is ClientWithFetchAccounts {
    return isClientWithCapabilities(client, FETCH_ACCOUNTS_CAPABILITIES);
}

/**
 * Asserts that a value implements {@link ClientWithFetchAccounts} and narrows its type.
 *
 * @param client - The value to inspect.
 * @throws A {@link SolanaError} when the value does not have a `fetchAccounts` function.
 * @see {@link isClientWithFetchAccounts}
 */
export function assertIsClientWithFetchAccounts(client: unknown): asserts client is ClientWithFetchAccounts {
    assertIsClientWithCapabilities(client, FETCH_ACCOUNTS_CAPABILITIES);
}

/**
 * Returns whether a value implements {@link ClientWithGetMinimumBalance} and narrows its type when it does.
 *
 * @param client - The value to inspect.
 * @returns `true` when the value has a `getMinimumBalance` function.
 * @see {@link assertIsClientWithGetMinimumBalance}
 */
export function isClientWithGetMinimumBalance(client: unknown): client is ClientWithGetMinimumBalance {
    return isClientWithCapabilities(client, GET_MINIMUM_BALANCE_CAPABILITIES);
}

/**
 * Asserts that a value implements {@link ClientWithGetMinimumBalance} and narrows its type.
 *
 * @param client - The value to inspect.
 * @throws A {@link SolanaError} when the value does not have a `getMinimumBalance` function.
 * @see {@link isClientWithGetMinimumBalance}
 */
export function assertIsClientWithGetMinimumBalance(client: unknown): asserts client is ClientWithGetMinimumBalance {
    assertIsClientWithCapabilities(client, GET_MINIMUM_BALANCE_CAPABILITIES);
}

/**
 * Returns whether a value implements {@link ClientWithIdentity} and narrows its type when it does.
 *
 * This checks that the `identity` capability is installed without reading its value, so reactive
 * getters that temporarily throw while a wallet is disconnected are still recognized.
 *
 * @param client - The value to inspect.
 * @returns `true` when the value has an `identity` property.
 * @see {@link assertIsClientWithIdentity}
 */
export function isClientWithIdentity(client: unknown): client is ClientWithIdentity {
    return isClientWithCapabilities(client, IDENTITY_CAPABILITIES);
}

/**
 * Asserts that a value implements {@link ClientWithIdentity} and narrows its type.
 *
 * @param client - The value to inspect.
 * @throws A {@link SolanaError} when the value does not have an `identity` property.
 * @see {@link isClientWithIdentity}
 */
export function assertIsClientWithIdentity(client: unknown): asserts client is ClientWithIdentity {
    assertIsClientWithCapabilities(client, IDENTITY_CAPABILITIES);
}

/**
 * Returns whether a value implements {@link ClientWithPayer} and narrows its type when it does.
 *
 * This checks that the `payer` capability is installed without reading its value, so reactive
 * getters that temporarily throw while a wallet is disconnected are still recognized.
 *
 * @param client - The value to inspect.
 * @returns `true` when the value has a `payer` property.
 * @see {@link assertIsClientWithPayer}
 */
export function isClientWithPayer(client: unknown): client is ClientWithPayer {
    return isClientWithCapabilities(client, PAYER_CAPABILITIES);
}

/**
 * Asserts that a value implements {@link ClientWithPayer} and narrows its type.
 *
 * @param client - The value to inspect.
 * @throws A {@link SolanaError} when the value does not have a `payer` property.
 * @see {@link isClientWithPayer}
 */
export function assertIsClientWithPayer(client: unknown): asserts client is ClientWithPayer {
    assertIsClientWithCapabilities(client, PAYER_CAPABILITIES);
}

/**
 * Returns whether a value implements {@link ClientWithRpc} and narrows its type when it does.
 *
 * @typeParam TRpcMethods - The RPC methods expected by the caller.
 * @param client - The value to inspect.
 * @returns `true` when the value has an `rpc` property.
 * @see {@link assertIsClientWithRpc}
 */
export function isClientWithRpc<TRpcMethods = unknown>(client: unknown): client is ClientWithRpc<TRpcMethods> {
    return isClientWithCapabilities(client, RPC_CAPABILITIES);
}

/**
 * Asserts that a value implements {@link ClientWithRpc} and narrows its type.
 *
 * @typeParam TRpcMethods - The RPC methods expected by the caller.
 * @param client - The value to inspect.
 * @throws A {@link SolanaError} when the value does not have an `rpc` property.
 * @see {@link isClientWithRpc}
 */
export function assertIsClientWithRpc<TRpcMethods = unknown>(
    client: unknown,
): asserts client is ClientWithRpc<TRpcMethods> {
    assertIsClientWithCapabilities(client, RPC_CAPABILITIES);
}

/**
 * Returns whether a value implements {@link ClientWithRpcSubscriptions} and narrows its type when it does.
 *
 * @typeParam TRpcSubscriptionsMethods - The RPC subscription methods expected by the caller.
 * @param client - The value to inspect.
 * @returns `true` when the value has an `rpcSubscriptions` property.
 * @see {@link assertIsClientWithRpcSubscriptions}
 */
export function isClientWithRpcSubscriptions<TRpcSubscriptionsMethods = unknown>(
    client: unknown,
): client is ClientWithRpcSubscriptions<TRpcSubscriptionsMethods> {
    return isClientWithCapabilities(client, RPC_SUBSCRIPTIONS_CAPABILITIES);
}

/**
 * Asserts that a value implements {@link ClientWithRpcSubscriptions} and narrows its type.
 *
 * @typeParam TRpcSubscriptionsMethods - The RPC subscription methods expected by the caller.
 * @param client - The value to inspect.
 * @throws A {@link SolanaError} when the value does not have an `rpcSubscriptions` property.
 * @see {@link isClientWithRpcSubscriptions}
 */
export function assertIsClientWithRpcSubscriptions<TRpcSubscriptionsMethods = unknown>(
    client: unknown,
): asserts client is ClientWithRpcSubscriptions<TRpcSubscriptionsMethods> {
    assertIsClientWithCapabilities(client, RPC_SUBSCRIPTIONS_CAPABILITIES);
}

/**
 * Returns whether a value implements {@link ClientWithSubscribeToIdentity} and narrows its type when it does.
 *
 * @param client - The value to inspect.
 * @returns `true` when the value has a `subscribeToIdentity` function.
 * @see {@link assertIsClientWithSubscribeToIdentity}
 */
export function isClientWithSubscribeToIdentity(client: unknown): client is ClientWithSubscribeToIdentity {
    return isClientWithCapabilities(client, SUBSCRIBE_TO_IDENTITY_CAPABILITIES);
}

/**
 * Asserts that a value implements {@link ClientWithSubscribeToIdentity} and narrows its type.
 *
 * @param client - The value to inspect.
 * @throws A {@link SolanaError} when the value does not have a `subscribeToIdentity` function.
 * @see {@link isClientWithSubscribeToIdentity}
 */
export function assertIsClientWithSubscribeToIdentity(
    client: unknown,
): asserts client is ClientWithSubscribeToIdentity {
    assertIsClientWithCapabilities(client, SUBSCRIBE_TO_IDENTITY_CAPABILITIES);
}

/**
 * Returns whether a value implements {@link ClientWithSubscribeToPayer} and narrows its type when it does.
 *
 * @param client - The value to inspect.
 * @returns `true` when the value has a `subscribeToPayer` function.
 * @see {@link assertIsClientWithSubscribeToPayer}
 */
export function isClientWithSubscribeToPayer(client: unknown): client is ClientWithSubscribeToPayer {
    return isClientWithCapabilities(client, SUBSCRIBE_TO_PAYER_CAPABILITIES);
}

/**
 * Asserts that a value implements {@link ClientWithSubscribeToPayer} and narrows its type.
 *
 * @param client - The value to inspect.
 * @throws A {@link SolanaError} when the value does not have a `subscribeToPayer` function.
 * @see {@link isClientWithSubscribeToPayer}
 */
export function assertIsClientWithSubscribeToPayer(client: unknown): asserts client is ClientWithSubscribeToPayer {
    assertIsClientWithCapabilities(client, SUBSCRIBE_TO_PAYER_CAPABILITIES);
}

/**
 * Returns whether a value implements {@link ClientWithTransactionPlanning} and narrows its type when it does.
 *
 * Both `planTransaction` and `planTransactions` must be functions for this guard to succeed.
 *
 * @example
 * ```ts
 * if (isClientWithTransactionPlanning(client)) {
 *     const transactionPlan = await client.planTransactions(instructions);
 * }
 * ```
 *
 * @param client - The value to inspect.
 * @returns `true` when the value has both transaction-planning functions.
 * @see {@link assertIsClientWithTransactionPlanning}
 */
export function isClientWithTransactionPlanning(client: unknown): client is ClientWithTransactionPlanning {
    return isClientWithCapabilities(client, TRANSACTION_PLANNING_CAPABILITIES);
}

/**
 * Asserts that a value implements {@link ClientWithTransactionPlanning} and narrows its type.
 *
 * Both `planTransaction` and `planTransactions` must be functions for this assertion to succeed.
 *
 * @example
 * ```ts
 * assertIsClientWithTransactionPlanning(client);
 * const transactionPlan = await client.planTransactions(instructions);
 * ```
 *
 * @param client - The value to inspect.
 * @throws A {@link SolanaError} listing any missing transaction-planning functions.
 * @see {@link isClientWithTransactionPlanning}
 */
export function assertIsClientWithTransactionPlanning(
    client: unknown,
): asserts client is ClientWithTransactionPlanning {
    assertIsClientWithCapabilities(client, TRANSACTION_PLANNING_CAPABILITIES);
}

/**
 * Returns whether a value implements {@link ClientWithTransactionSending} and narrows its type when it does.
 *
 * Both `sendTransaction` and `sendTransactions` must be functions for this guard to succeed.
 *
 * @param client - The value to inspect.
 * @returns `true` when the value has both transaction-sending functions.
 * @see {@link assertIsClientWithTransactionSending}
 */
export function isClientWithTransactionSending(client: unknown): client is ClientWithTransactionSending {
    return isClientWithCapabilities(client, TRANSACTION_SENDING_CAPABILITIES);
}

/**
 * Asserts that a value implements {@link ClientWithTransactionSending} and narrows its type.
 *
 * Both `sendTransaction` and `sendTransactions` must be functions for this assertion to succeed.
 *
 * @param client - The value to inspect.
 * @throws A {@link SolanaError} listing any missing transaction-sending functions.
 * @see {@link isClientWithTransactionSending}
 */
export function assertIsClientWithTransactionSending(client: unknown): asserts client is ClientWithTransactionSending {
    assertIsClientWithCapabilities(client, TRANSACTION_SENDING_CAPABILITIES);
}
