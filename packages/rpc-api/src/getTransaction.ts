import type { Signature } from '@solana/keys';
import type {
    Base58EncodedDataResponse,
    Base64EncodedDataResponse,
    Commitment,
    Slot,
    UnixTimestamp,
} from '@solana/rpc-types';
import type { TransactionVersion } from '@solana/transaction-messages';

import type {
    TransactionAddressTableLookups,
    TransactionJson,
    TransactionJsonParsed,
    TransactionMetaBase,
    TransactionMetaInnerInstructionsNotParsed,
    TransactionMetaInnerInstructionsParsed,
    TransactionMetaLoadedAddresses,
} from './transaction-meta';

type GetTransactionCommonConfig<TMaxSupportedTransactionVersion> = Readonly<{
    /**
     * Fetch the transaction details as of the highest slot that has reached this level of
     * commitment.
     *
     * @defaultValue Whichever default is applied by the underlying {@link RpcApi} in use. For
     * example, when using an API created by a `createSolanaRpc*()` helper, the default commitment
     * is `"confirmed"` unless configured otherwise. Unmitigated by an API layer on the client, the
     * default commitment applied by the server is `"finalized"`.
     */
    commitment?: Commitment;
    /**
     * Determines how the transaction should be encoded in the response.
     *
     * - `'base58'` returns a tuple whose first element is the bytes of the wire transaction as a
     *   base58-encoded string.
     * - `'base64'` returns a tuple whose first element is the bytes of the wire transaction as a
     *   base64-encoded string.
     * - `'json'` returns structured {@link TransactionJson}
     * - `'jsonParsed'` returns structured {@link TransactionJson} which the server will attempt to
     *   further process using account parsers and parsers specific to the transaction instructions'
     *   owning program. Whenever an instruction parser is successful, instruction will consist of
     *   parsed data as JSON. Otherwise, the instruction will materialize as a list of accounts, a
     *   program address, and base64-encoded instruction data.
     */
    encoding: 'base58' | 'base64' | 'json' | 'jsonParsed';
    /**
     * The newest transaction version that the caller wants to receive in the response.
     *
     * When not supplied, only legacy (unversioned) transactions will be returned, and no `version`
     * property will be returned in the response.
     *
     * If a transaction with the supplied signature is found with a version higher than this, the
     * server will throw
     * {@link SolanaErrorCode.SOLANA_ERROR__JSON_RPC__SERVER_ERROR_UNSUPPORTED_TRANSACTION_VERSION | SOLANA_ERROR__JSON_RPC__SERVER_ERROR_UNSUPPORTED_TRANSACTION_VERSION}.
     */
    maxSupportedTransactionVersion?: TMaxSupportedTransactionVersion;
}>;

type GetTransactionApiResponseBase = Readonly<{
    /**
     * The estimated production time at which the transaction was processed. `null` if not
     * available.
     */
    blockTime: UnixTimestamp | null;
    /** The slot during which this transaction was processed */
    slot: Slot;
}>;

/**
 * Common envelope for every non-null `getTransaction` response, regardless of
 * encoding. The conditional shape mirrors the API: when
 * `TMaxSupportedTransactionVersion` is unset (`void`), the response carries no
 * `version` field; when set, the resolved `TransactionVersion` is included.
 */
type GetTransactionApiResponseEnvelope<TMaxSupportedTransactionVersion extends TransactionVersion | void = void> =
    GetTransactionApiResponseBase &
        (TMaxSupportedTransactionVersion extends void ? Record<string, never> : { version: TransactionVersion });

/**
 * The non-parsed `meta` shape returned with `encoding: 'base64'`, `'base58'`, or
 * `'json'`. `loadedAddresses` is only populated when
 * `TMaxSupportedTransactionVersion` is set on the request.
 */
type TransactionMetaNotParsed<TMaxSupportedTransactionVersion extends TransactionVersion | void = void> =
    | (TransactionMetaBase &
          TransactionMetaInnerInstructionsNotParsed &
          (TMaxSupportedTransactionVersion extends void ? Record<string, never> : TransactionMetaLoadedAddresses))
    | null;

/**
 * The shape of a non-null `getTransaction` response when called with
 * `encoding: 'base64'`.
 */
export type GetTransactionApiResponseBase64<TMaxSupportedTransactionVersion extends TransactionVersion | void = void> =
    GetTransactionApiResponseEnvelope<TMaxSupportedTransactionVersion> & {
        meta: TransactionMetaNotParsed<TMaxSupportedTransactionVersion>;
        transaction: Base64EncodedDataResponse;
    };

/**
 * The shape of a non-null `getTransaction` response when called with
 * `encoding: 'base58'`.
 */
export type GetTransactionApiResponseBase58<TMaxSupportedTransactionVersion extends TransactionVersion | void = void> =
    GetTransactionApiResponseEnvelope<TMaxSupportedTransactionVersion> & {
        meta: TransactionMetaNotParsed<TMaxSupportedTransactionVersion>;
        transaction: Base58EncodedDataResponse;
    };

/**
 * The shape of a non-null `getTransaction` response when called with
 * `encoding: 'json'` (the default).
 */
export type GetTransactionApiResponseJson<TMaxSupportedTransactionVersion extends TransactionVersion | void = void> =
    GetTransactionApiResponseEnvelope<TMaxSupportedTransactionVersion> & {
        meta: TransactionMetaNotParsed<TMaxSupportedTransactionVersion>;
        transaction: TransactionJson &
            (TMaxSupportedTransactionVersion extends void ? Record<string, never> : TransactionAddressTableLookups);
    };

/**
 * The shape of a non-null `getTransaction` response when called with
 * `encoding: 'jsonParsed'`. Inner instructions and instruction data are
 * parsed by the server when a parser is registered for the program.
 */
export type GetTransactionApiResponseJsonParsed<
    TMaxSupportedTransactionVersion extends TransactionVersion | void = void,
> = GetTransactionApiResponseEnvelope<TMaxSupportedTransactionVersion> & {
    meta: (TransactionMetaBase & TransactionMetaInnerInstructionsParsed) | null;
    transaction: TransactionJsonParsed &
        (TMaxSupportedTransactionVersion extends void ? Record<string, never> : TransactionAddressTableLookups);
};

export type GetTransactionApi = {
    /**
     * Returns details of the confirmed transaction identified by the given signature.
     *
     * @param signature A 64 byte Ed25519 signature, encoded as a base-58 string, that uniquely
     * identifies a transaction by virtue of being the first or only signature in its list of
     * signatures.
     *
     * Materializes the transaction as structured {@link TransactionJson} which the server will
     * attempt to further process using account parsers and parsers specific to the transaction
     * instructions' owning program. Whenever an instruction parser is successful, instruction will
     * consist of parsed data as JSON. Otherwise, the instruction will materialize as a list of
     * accounts, a program address, and base64-encoded instruction data.
     *
     * {@label parsed}
     * @see https://solana.com/docs/rpc/http/gettransaction
     */
    getTransaction<TMaxSupportedTransactionVersion extends TransactionVersion | void = void>(
        signature: Signature,
        config: GetTransactionCommonConfig<TMaxSupportedTransactionVersion> &
            Readonly<{
                encoding: 'jsonParsed';
            }>,
    ): GetTransactionApiResponseJsonParsed<TMaxSupportedTransactionVersion> | null;
    /**
     * Returns details of the confirmed transaction identified by the given signature.
     *
     * @param signature A 64 byte Ed25519 signature, encoded as a base-58 string, that uniquely
     * identifies a transaction by virtue of being the first or only signature in its list of
     * signatures.
     *
     * Materializes the transaction as a tuple whose first element is the bytes of the wire
     * transaction as a base64-encoded string.
     *
     * {@label base64}
     * @see https://solana.com/docs/rpc/http/gettransaction
     */
    getTransaction<TMaxSupportedTransactionVersion extends TransactionVersion | void = void>(
        signature: Signature,
        config: GetTransactionCommonConfig<TMaxSupportedTransactionVersion> &
            Readonly<{
                encoding: 'base64';
            }>,
    ): GetTransactionApiResponseBase64<TMaxSupportedTransactionVersion> | null;
    /**
     * Returns details of the confirmed transaction identified by the given signature.
     *
     * @param signature A 64 byte Ed25519 signature, encoded as a base-58 string, that uniquely
     * identifies a transaction by virtue of being the first or only signature in its list of
     * signatures.
     *
     * Materializes the transaction as a tuple whose first element is the bytes of the wire
     * transaction as a base58-encoded string.
     *
     * {@label base58}
     * @see https://solana.com/docs/rpc/http/gettransaction
     */
    getTransaction<TMaxSupportedTransactionVersion extends TransactionVersion | void = void>(
        signature: Signature,
        config: GetTransactionCommonConfig<TMaxSupportedTransactionVersion> &
            Readonly<{
                encoding: 'base58';
            }>,
    ): GetTransactionApiResponseBase58<TMaxSupportedTransactionVersion> | null;
    /**
     * Returns details of the confirmed transaction identified by the given signature.
     *
     * @param signature A 64 byte Ed25519 signature, encoded as a base-58 string, that uniquely
     * identifies a transaction by virtue of being the first or only signature in its list of
     * signatures.
     *
     * Materializes the transaction as structured {@link TransactionJson}.
     *
     * {@label json}
     * @see https://solana.com/docs/rpc/http/gettransaction
     */
    getTransaction<TMaxSupportedTransactionVersion extends TransactionVersion | void = void>(
        signature: Signature,
        config?: GetTransactionCommonConfig<TMaxSupportedTransactionVersion> &
            Readonly<{
                encoding?: 'json';
            }>,
    ): GetTransactionApiResponseJson<TMaxSupportedTransactionVersion> | null;
};
