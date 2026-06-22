import type { Address } from '@solana/addresses';
import type { Signature } from '@solana/keys';
import type {
    Base58EncodedDataResponse,
    Base64EncodedDataResponse,
    Commitment,
    Slot,
    TransactionError,
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

/** A range comparison applied to a slot. All bounds are optional and combined with AND. */
type SlotComparison = Readonly<{
    /** Match values strictly greater than this slot. */
    gt?: Slot;
    /** Match values greater than or equal to this slot. */
    gte?: Slot;
    /** Match values strictly less than this slot. */
    lt?: Slot;
    /** Match values less than or equal to this slot. */
    lte?: Slot;
}>;

/**
 * A comparison applied to a transaction's block time. All bounds are optional and combined with
 * AND. Unlike the slot and signature comparisons, block time additionally supports an exact `eq`
 * match.
 */
type BlockTimeComparison = Readonly<{
    /** Match transactions whose block time is exactly this timestamp. */
    eq?: UnixTimestamp;
    /** Match transactions whose block time is strictly after this timestamp. */
    gt?: UnixTimestamp;
    /** Match transactions whose block time is at or after this timestamp. */
    gte?: UnixTimestamp;
    /** Match transactions whose block time is strictly before this timestamp. */
    lt?: UnixTimestamp;
    /** Match transactions whose block time is at or before this timestamp. */
    lte?: UnixTimestamp;
}>;

/**
 * A comparison applied to a transaction's signature ordering. All bounds are optional and combined
 * with AND.
 */
type SignatureComparison = Readonly<{
    /** Match transactions ordered strictly after this signature. */
    gt?: Signature;
    /** Match transactions ordered at or after this signature. */
    gte?: Signature;
    /** Match transactions ordered strictly before this signature. */
    lt?: Signature;
    /** Match transactions ordered at or before this signature. */
    lte?: Signature;
}>;

/**
 * Server-side filters that narrow the set of returned transactions. Every filter is optional, and
 * supplying more than one combines them with AND semantics.
 */
type GetTransactionsForAddressFilters = Readonly<{
    /** Restrict results to a range of block times. */
    blockTime?: BlockTimeComparison;
    /** Restrict results to a range of signature orderings. */
    signature?: SignatureComparison;
    /** Restrict results to a range of slots. */
    slot?: SlotComparison;
    /**
     * Restrict results by execution status.
     *
     * - `'any'` returns both succeeded and failed transactions.
     * - `'succeeded'` returns only transactions that did not error.
     * - `'failed'` returns only transactions that errored.
     *
     * @defaultValue `'any'`
     */
    status?: 'any' | 'failed' | 'succeeded';
    /**
     * Control whether activity on token accounts owned by the queried address is included.
     *
     * - `'none'` returns only transactions that reference the address directly.
     * - `'balanceChanged'` additionally returns transactions that changed the balance of a token
     *   account owned by the address.
     * - `'all'` additionally returns every transaction that references a token account owned by the
     *   address.
     *
     * @defaultValue `'none'`
     */
    tokenAccounts?: 'all' | 'balanceChanged' | 'none';
}>;

type AllowedCommitmentForGetTransactionsForAddress = Exclude<Commitment, 'processed'>;

/**
 * The set of transaction versions that may be requested via `maxSupportedTransactionVersion`.
 *
 * `'legacy'` is excluded because requesting legacy transactions is expressed by omitting
 * `maxSupportedTransactionVersion` entirely.
 */
type GetTransactionsForAddressMaxSupportedTransactionVersion = Exclude<TransactionVersion, 'legacy'>;

type GetTransactionsForAddressCommonConfig = Readonly<{
    /**
     * Fetch transactions as of the highest slot that has reached this level of commitment.
     *
     * The `'processed'` commitment is not supported by this method.
     *
     * @defaultValue Whichever default is applied by the underlying {@link RpcApi} in use. For
     * example, when using an API created by a `createSolanaRpc*()` helper, the default commitment
     * is `"confirmed"` unless configured otherwise. Unmitigated by an API layer on the client, the
     * default commitment applied by the server is `"finalized"`.
     */
    commitment?: AllowedCommitmentForGetTransactionsForAddress;
    /** Optional server-side filters that narrow the set of returned transactions. */
    filters?: GetTransactionsForAddressFilters;
    /**
     * Maximum number of results to return.
     *
     * The server caps this value at 1000 when `transactionDetails` is `'signatures'`, and at 100
     * when `transactionDetails` is `'full'`.
     *
     * @defaultValue The server applies its own default (at this cap) when omitted.
     */
    limit?: number;
    /**
     * Prevents accessing stale data by enforcing that the RPC node has processed transactions up to
     * this slot.
     */
    minContextSlot?: Slot;
    /**
     * A cursor returned as `paginationToken` by a previous response, used to continue scanning from
     * where that response left off. The token has the format `"<slot>:<position>"`.
     *
     * @defaultValue When omitted, scanning starts from the beginning of the requested sort order.
     */
    paginationToken?: string;
    /**
     * The order in which transactions are returned, sorted by slot and then by position within the
     * block.
     *
     * - `'desc'` returns the newest transactions first.
     * - `'asc'` returns the oldest transactions first.
     *
     * @defaultValue `'desc'`
     */
    sortOrder?: 'asc' | 'desc';
}>;

type GetTransactionsForAddressFullOnlyConfig = Readonly<{
    /**
     * Determines how each transaction is encoded in the response.
     *
     * - `'base58'` returns each transaction as a tuple whose first element is the bytes of the wire
     *   transaction as a base58-encoded string.
     * - `'base64'` returns each transaction as a tuple whose first element is the bytes of the wire
     *   transaction as a base64-encoded string.
     * - `'json'` returns each transaction as structured {@link TransactionJson}.
     * - `'jsonParsed'` returns each transaction as structured {@link TransactionJsonParsed}, which
     *   the server will attempt to further process using account parsers and parsers specific to
     *   the transaction instructions' owning program.
     *
     * @defaultValue `'json'`
     */
    encoding?: 'base58' | 'base64' | 'json' | 'jsonParsed';
    /**
     * The newest transaction version that the caller wants to receive in the response.
     *
     * When not supplied, only legacy (unversioned) transactions will be returned, no `version`
     * property will be returned in the response, and the request will fail if a versioned
     * transaction would otherwise be returned. Set to `0` to include version-0 transactions.
     */
    maxSupportedTransactionVersion?: GetTransactionsForAddressMaxSupportedTransactionVersion;
}>;

/** The result envelope shared by every mode of {@link GetTransactionsForAddressApi}. */
type GetTransactionsForAddressApiResponse<TData> = Readonly<{
    /** The matching transactions, ordered according to the requested `sortOrder`. */
    data: readonly TData[];
    /**
     * A cursor to pass as `paginationToken` in a subsequent request to continue scanning, or `null`
     * when there are no more results.
     */
    paginationToken: string | null;
}>;

/** A single result when `transactionDetails` is `'signatures'`. */
type GetTransactionsForAddressSignature = Readonly<{
    /** The estimated production time of when the transaction was processed. `null` if not available. */
    blockTime: UnixTimestamp | null;
    /** The transaction's cluster confirmation status. */
    confirmationStatus: Commitment | null;
    /** Error if the transaction failed, `null` if the transaction succeeded. */
    err: TransactionError | null;
    /** Memo associated with the transaction, `null` if no memo is present. */
    memo: string | null;
    /** The transaction signature as a base-58 encoded string. */
    signature: Signature;
    /** The slot that contains the block with the transaction. */
    slot: Slot;
    /** The 0-based index of the transaction within its block. */
    transactionIndex: number;
}>;

/**
 * The fields shared by every result when `transactionDetails` is `'full'`, regardless of encoding.
 */
type GetTransactionsForAddressFullBase = Readonly<{
    /** The estimated production time of when the transaction was processed. `null` if not available. */
    blockTime: UnixTimestamp | null;
    /** The slot that contains the block with the transaction. */
    slot: Slot;
    /** The 0-based index of the transaction within its block. */
    transactionIndex: number;
}>;

/**
 * The `version` field, present on a `'full'` result only when `maxSupportedTransactionVersion` was
 * set on the request.
 */
type GetTransactionsForAddressVersion = Readonly<{
    /** The transaction version. */
    version: TransactionVersion;
}>;

/**
 * The transaction metadata returned for a legacy `'full'` result whose inner instructions are not
 * parsed (`json`, `base58`, and `base64` encodings). Legacy results omit `loadedAddresses`.
 */
type GetTransactionsForAddressFullMetaNotParsedLegacy =
    | (TransactionMetaBase & TransactionMetaInnerInstructionsNotParsed)
    | null;

/**
 * The transaction metadata returned for a versioned `'full'` result whose inner instructions are
 * not parsed (`json`, `base58`, and `base64` encodings). Versioned results carry `loadedAddresses`.
 */
type GetTransactionsForAddressFullMetaNotParsedVersioned =
    | (TransactionMetaBase & TransactionMetaInnerInstructionsNotParsed & TransactionMetaLoadedAddresses)
    | null;

/**
 * The transaction metadata returned for a legacy `'full'`, `jsonParsed`-encoded result. Legacy
 * results omit `loadedAddresses`.
 */
type GetTransactionsForAddressFullMetaParsedLegacy =
    | (TransactionMetaBase & TransactionMetaInnerInstructionsParsed)
    | null;

/**
 * The transaction metadata returned for a versioned `'full'`, `jsonParsed`-encoded result.
 * Versioned results carry `loadedAddresses`.
 */
type GetTransactionsForAddressFullMetaParsedVersioned =
    | (TransactionMetaBase & TransactionMetaInnerInstructionsParsed & TransactionMetaLoadedAddresses)
    | null;

/**
 * A `'full'`, `jsonParsed`-encoded result.
 *
 * When `maxSupportedTransactionVersion` is set, the result additionally carries a `version`, the
 * `meta` carries `loadedAddresses`, and the message carries `addressTableLookups`.
 */
type GetTransactionsForAddressFullJsonParsed<TMaxSupportedTransactionVersion extends TransactionVersion | void> =
    TMaxSupportedTransactionVersion extends void
        ? GetTransactionsForAddressFullBase &
              Readonly<{
                  meta: GetTransactionsForAddressFullMetaParsedLegacy;
                  transaction: TransactionJsonParsed;
              }>
        : GetTransactionsForAddressFullBase &
              GetTransactionsForAddressVersion &
              Readonly<{
                  meta: GetTransactionsForAddressFullMetaParsedVersioned;
                  transaction: TransactionAddressTableLookups & TransactionJsonParsed;
              }>;

/**
 * A `'full'`, `json`-encoded result.
 *
 * When `maxSupportedTransactionVersion` is set, the result additionally carries a `version`, the
 * `meta` carries `loadedAddresses`, and the message carries `addressTableLookups`.
 */
type GetTransactionsForAddressFullJson<TMaxSupportedTransactionVersion extends TransactionVersion | void> =
    TMaxSupportedTransactionVersion extends void
        ? GetTransactionsForAddressFullBase &
              Readonly<{
                  meta: GetTransactionsForAddressFullMetaNotParsedLegacy;
                  transaction: TransactionJson;
              }>
        : GetTransactionsForAddressFullBase &
              GetTransactionsForAddressVersion &
              Readonly<{
                  meta: GetTransactionsForAddressFullMetaNotParsedVersioned;
                  transaction: TransactionAddressTableLookups & TransactionJson;
              }>;

/**
 * A `'full'` result encoded as a base58 or base64 wire-transaction tuple.
 *
 * When `maxSupportedTransactionVersion` is set, the result additionally carries a `version` and the
 * `meta` carries `loadedAddresses`. The wire-transaction tuple itself is unaffected.
 */
type GetTransactionsForAddressFullEncoded<
    TMaxSupportedTransactionVersion extends TransactionVersion | void,
    TTransaction,
> = TMaxSupportedTransactionVersion extends void
    ? GetTransactionsForAddressFullBase &
          Readonly<{
              meta: GetTransactionsForAddressFullMetaNotParsedLegacy;
              transaction: TTransaction;
          }>
    : GetTransactionsForAddressFullBase &
          GetTransactionsForAddressVersion &
          Readonly<{
              meta: GetTransactionsForAddressFullMetaNotParsedVersioned;
              transaction: TTransaction;
          }>;

export type GetTransactionsForAddressApi = {
    /**
     * Returns full transactions, parsed as JSON, for confirmed transactions that load the given
     * address. Because `maxSupportedTransactionVersion` is set, each result carries a `version`, its
     * `meta` carries `loadedAddresses`, and its message carries `addressTableLookups`.
     *
     * Each instruction the server is able to parse will materialize as parsed data; otherwise it
     * will materialize as a list of accounts, a program address, and base58-encoded instruction
     * data.
     *
     * Note: Check your RPC provider for support for this method.
     *
     * {@label full-parsed--version-specified}
     */
    getTransactionsForAddress(
        address: Address,
        config: GetTransactionsForAddressCommonConfig &
            GetTransactionsForAddressFullOnlyConfig &
            Readonly<{
                encoding: 'jsonParsed';
                maxSupportedTransactionVersion: GetTransactionsForAddressMaxSupportedTransactionVersion;
                transactionDetails: 'full';
            }>,
    ): GetTransactionsForAddressApiResponse<
        GetTransactionsForAddressFullJsonParsed<GetTransactionsForAddressMaxSupportedTransactionVersion>
    >;
    /**
     * Returns full transactions, parsed as JSON, for confirmed transactions that load the given
     * address. Because `maxSupportedTransactionVersion` is omitted, only legacy transactions are
     * returned and no `version` property is present.
     *
     * Each instruction the server is able to parse will materialize as parsed data; otherwise it
     * will materialize as a list of accounts, a program address, and base58-encoded instruction
     * data.
     *
     * Note: Check your RPC provider for support for this method.
     *
     * {@label full-parsed--version-legacy}
     */
    getTransactionsForAddress(
        address: Address,
        config: GetTransactionsForAddressCommonConfig &
            Omit<GetTransactionsForAddressFullOnlyConfig, 'maxSupportedTransactionVersion'> &
            Readonly<{
                encoding: 'jsonParsed';
                transactionDetails: 'full';
            }>,
    ): GetTransactionsForAddressApiResponse<GetTransactionsForAddressFullJsonParsed<void>>;
    /**
     * Returns full transactions, as base64-encoded wire transactions, for confirmed transactions
     * that load the given address. Because `maxSupportedTransactionVersion` is set, each result
     * carries a `version` and its `meta` carries `loadedAddresses`.
     *
     * Note: Check your RPC provider for support for this method.
     *
     * {@label full-base64--version-specified}
     */
    getTransactionsForAddress(
        address: Address,
        config: GetTransactionsForAddressCommonConfig &
            GetTransactionsForAddressFullOnlyConfig &
            Readonly<{
                encoding: 'base64';
                maxSupportedTransactionVersion: GetTransactionsForAddressMaxSupportedTransactionVersion;
                transactionDetails: 'full';
            }>,
    ): GetTransactionsForAddressApiResponse<
        GetTransactionsForAddressFullEncoded<
            GetTransactionsForAddressMaxSupportedTransactionVersion,
            Base64EncodedDataResponse
        >
    >;
    /**
     * Returns full transactions, as base64-encoded wire transactions, for confirmed transactions
     * that load the given address. Because `maxSupportedTransactionVersion` is omitted, only legacy
     * transactions are returned and no `version` property is present.
     *
     * Note: Check your RPC provider for support for this method.
     *
     * {@label full-base64--version-legacy}
     */
    getTransactionsForAddress(
        address: Address,
        config: GetTransactionsForAddressCommonConfig &
            Omit<GetTransactionsForAddressFullOnlyConfig, 'maxSupportedTransactionVersion'> &
            Readonly<{
                encoding: 'base64';
                transactionDetails: 'full';
            }>,
    ): GetTransactionsForAddressApiResponse<GetTransactionsForAddressFullEncoded<void, Base64EncodedDataResponse>>;
    /**
     * Returns full transactions, as base58-encoded wire transactions, for confirmed transactions
     * that load the given address. Because `maxSupportedTransactionVersion` is set, each result
     * carries a `version` and its `meta` carries `loadedAddresses`.
     *
     * Note: Check your RPC provider for support for this method.
     *
     * {@label full-base58--version-specified}
     */
    getTransactionsForAddress(
        address: Address,
        config: GetTransactionsForAddressCommonConfig &
            GetTransactionsForAddressFullOnlyConfig &
            Readonly<{
                encoding: 'base58';
                maxSupportedTransactionVersion: GetTransactionsForAddressMaxSupportedTransactionVersion;
                transactionDetails: 'full';
            }>,
    ): GetTransactionsForAddressApiResponse<
        GetTransactionsForAddressFullEncoded<
            GetTransactionsForAddressMaxSupportedTransactionVersion,
            Base58EncodedDataResponse
        >
    >;
    /**
     * Returns full transactions, as base58-encoded wire transactions, for confirmed transactions
     * that load the given address. Because `maxSupportedTransactionVersion` is omitted, only legacy
     * transactions are returned and no `version` property is present.
     *
     * Note: Check your RPC provider for support for this method.
     *
     * {@label full-base58--version-legacy}
     */
    getTransactionsForAddress(
        address: Address,
        config: GetTransactionsForAddressCommonConfig &
            Omit<GetTransactionsForAddressFullOnlyConfig, 'maxSupportedTransactionVersion'> &
            Readonly<{
                encoding: 'base58';
                transactionDetails: 'full';
            }>,
    ): GetTransactionsForAddressApiResponse<GetTransactionsForAddressFullEncoded<void, Base58EncodedDataResponse>>;
    /**
     * Returns full transactions, as structured JSON, for confirmed transactions that load the given
     * address. Because `maxSupportedTransactionVersion` is set, each result carries a `version`, its
     * `meta` carries `loadedAddresses`, and its message carries `addressTableLookups`.
     *
     * Note: Check your RPC provider for support for this method.
     *
     * {@label full-json--version-specified}
     */
    getTransactionsForAddress(
        address: Address,
        config: GetTransactionsForAddressCommonConfig &
            GetTransactionsForAddressFullOnlyConfig &
            Readonly<{
                encoding?: 'json';
                maxSupportedTransactionVersion: GetTransactionsForAddressMaxSupportedTransactionVersion;
                transactionDetails: 'full';
            }>,
    ): GetTransactionsForAddressApiResponse<
        GetTransactionsForAddressFullJson<GetTransactionsForAddressMaxSupportedTransactionVersion>
    >;
    /**
     * Returns full transactions, as structured JSON, for confirmed transactions that load the given
     * address. Because `maxSupportedTransactionVersion` is omitted, only legacy transactions are
     * returned and no `version` property is present.
     *
     * Note: Check your RPC provider for support for this method.
     *
     * {@label full-json--version-legacy}
     */
    getTransactionsForAddress(
        address: Address,
        config: GetTransactionsForAddressCommonConfig &
            Omit<GetTransactionsForAddressFullOnlyConfig, 'maxSupportedTransactionVersion'> &
            Readonly<{
                encoding?: 'json';
                transactionDetails: 'full';
            }>,
    ): GetTransactionsForAddressApiResponse<GetTransactionsForAddressFullJson<void>>;
    /**
     * Returns signature-level results for confirmed transactions that load the given address.
     *
     * This is the default mode. It combines the discovery step of
     * {@link GetSignaturesForAddressApi.getSignaturesForAddress} with server-side filtering, sorting
     * and cursor-based pagination.
     *
     * Note: Check your RPC provider for support for this method.
     *
     * @example
     * ```ts
     * const { data, paginationToken } = await rpc
     *     .getTransactionsForAddress(address, {
     *         filters: { status: 'succeeded' },
     *         limit: 100,
     *         sortOrder: 'desc',
     *     })
     *     .send();
     * ```
     *
     * {@label signatures}
     */
    getTransactionsForAddress(
        address: Address,
        config?: GetTransactionsForAddressCommonConfig &
            Readonly<{
                transactionDetails?: 'signatures';
            }>,
    ): GetTransactionsForAddressApiResponse<GetTransactionsForAddressSignature>;
};
