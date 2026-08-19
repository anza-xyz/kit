/**
 * Primitives for building strongly-typed, numerically-coded JavaScript error classes — the
 * factory machinery that powers {@link SolanaError}, exposed as a standalone package so that
 * downstream tools (paymasters, wallets, program clients, etc.) can build their own coded error
 * systems without growing the {@link SolanaError} catalog.
 *
 * # Quickstart
 *
 * ```ts
 * import { createCodedErrorClass } from '@solana/errors-core';
 *
 * export const KORA_ERROR__ACCOUNT_NOT_FOUND = -32050 as const;
 * export const KORA_ERROR__RATE_LIMIT_EXCEEDED = -32030 as const;
 *
 * type KoraErrorCode = typeof KORA_ERROR__ACCOUNT_NOT_FOUND | typeof KORA_ERROR__RATE_LIMIT_EXCEEDED;
 * type KoraErrorContext = {
 *     [KORA_ERROR__ACCOUNT_NOT_FOUND]: { address: string };
 *     [KORA_ERROR__RATE_LIMIT_EXCEEDED]: undefined;
 * };
 *
 * export const { ErrorClass: KoraError, isError: isKoraError } = createCodedErrorClass<
 *     KoraErrorCode,
 *     KoraErrorContext
 * >({
 *     messages: {
 *         [KORA_ERROR__ACCOUNT_NOT_FOUND]: 'Account $address not found',
 *         [KORA_ERROR__RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded',
 *     },
 *     name: 'KoraError',
 * });
 * ```
 *
 * @packageDocumentation
 */
export * from './coded-error';
export * from './context';
export * from './message-formatter';
