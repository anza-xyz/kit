import type {
    Base58EncodedBytes,
    Blockhash,
    Commitment,
    Reward,
    Slot,
    TransactionForAccounts,
    TransactionForFullBase58,
    TransactionForFullBase64,
    TransactionForFullJson,
    TransactionForFullJsonParsed,
    UnixTimestamp,
} from '@solana/rpc-types';
import type { TransactionVersion } from '@solana/transaction-messages';

// API response types

type GetBlockApiResponseBase = Readonly<{
    /** The number of blocks beneath this block */
    blockHeight: bigint;
    /** Estimated production time, as Unix timestamp */
    blockTime: UnixTimestamp;
    /** the blockhash of this block */
    blockhash: Blockhash;
    /** The slot index of this block's parent */
    parentSlot: Slot;
    /** The blockhash of this block's parent */
    previousBlockhash: Blockhash;
}>;

type GetBlockApiResponseWithRewards = Readonly<{
    /** Block-level rewards */
    rewards: readonly Reward[];
}>;

type GetBlockApiResponseWithSignatures = Readonly<{
    /** List of signatures applied to transactions in this block */
    signatures: readonly Base58EncodedBytes[];
}>;

type GetBlockApiResponseWithTransactions<TTransaction> = Readonly<{
    transactions: readonly TTransaction[];
}>;

// API parameter types

type GetBlockCommonConfig = Readonly<{
    /**
     * Fetch blocks from slots that have reached at least this level of commitment.
     *
     * @defaultValue Whichever default is applied by the underlying {@link RpcApi} in use. For
     * example, when using an API created by a `createSolanaRpc*()` helper, the default commitment
     * is `"confirmed"` unless configured otherwise. Unmitigated by an API layer on the client, the
     * default commitment applied by the server is `"finalized"`.
     */
    commitment?: Omit<Commitment, 'processed'>;
    /**
     * Determines how the transaction property should be encoded in the response.
     *
     * - `'base58'` produces a tuple whose first element is the wire transaction as a base58-encoded
     *   string.
     * - `'base64'` produces a tuple whose first element is the wire transaction as a base64-encoded
     *   string.
     * - `'json'` produces an object with `message` and `signatures` properties. The `instructions`
     *   property of the message is an array of instructions, each an object containing the indices
     *   of the instruction's accounts, the instruction data, the index of the program address, and
     * - `'jsonParsed'` produces an object with `message` and `signatures` properties. This property
     *   will cause the server to attempt to process each instruction using a parser specific to its
     *   program. If successful, the parsed instruction will be returned in the response as JSON.
     *   Otherwise, each instruction will be returned according to the rules of `'json'` encoding.
     *
     * @defaultValue "json"
     */
    encoding?: GetBlockEncoding;
    /**
     * The newest transaction version that the caller wants to receive in the response. This
     * argument has no effect unless the {@link GetBlockCommonConfig.transactionDetails | transactionDetails}
     * argument is set to `'accounts'` or `'full'`.
     *
     * When not supplied, only legacy (unversioned) transactions will be returned, and no `version`
     * property will be returned in the response.
     *
     * If a block contains any transaction at a version higher than this, the server will throw
     * {@link SolanaErrorCode.SOLANA_ERROR__JSON_RPC__SERVER_ERROR_UNSUPPORTED_TRANSACTION_VERSION | SOLANA_ERROR__JSON_RPC__SERVER_ERROR_UNSUPPORTED_TRANSACTION_VERSION}.
     */
    maxSupportedTransactionVersion?: GetBlockMaxSupportedTransactionVersion;
    /**
     * Set this to `false` to omit block rewards from the response. These typically only
     * materialize on the first block of an epoch.
     * @defaultValue true
     */
    rewards?: boolean;
    /**
     * The level of transaction detail to include in the response.
     *
     * - `'accounts'` includes signatures, an annotated list of accounts, and some transaction
     *   metadata.
     * - `'full'` includes the entire transaction message and its signatures.
     * - `'none'` excludes transaction details completely.
     * - `'signatures'` includes transaction signatures only.
     *
     * @defaultValue "full"
     */
    transactionDetails?: GetBlockTransactionDetailsMode;
}>;

type GetBlockEncoding = 'base58' | 'base64' | 'json' | 'jsonParsed';
type GetBlockTransactionDetailsMode = 'accounts' | 'full' | 'none' | 'signatures';

type GetBlockMaxSupportedTransactionVersion = Exclude<TransactionVersion, 'legacy'>;

export type GetBlockApi = {
    /**
     * Returns identity and transaction information about a confirmed block in the ledger
     *
     * {@label transactions-none--rewards-none}
     * @see https://solana.com/docs/rpc/http/getblock
     */
    getBlock(
        slot: Slot,
        // transactionDetails=none, rewards=false, encoding + maxSupportedTransactionVersion irrelevant
        config: GetBlockCommonConfig &
            Readonly<{
                rewards: false;
                transactionDetails: 'none';
            }>,
    ): GetBlockApiResponseBase | null;
    /**
     * Returns identity and transaction information about a confirmed block in the ledger
     *
     * {@label transactions-none--rewards-included}
     * @see https://solana.com/docs/rpc/http/getblock
     */
    getBlock(
        slot: Slot,
        // transactionDetails=none, rewards=missing/true, encoding + maxSupportedTransactionVersion irrelevant
        config: GetBlockCommonConfig &
            Readonly<{
                rewards?: true;
                transactionDetails: 'none';
            }>,
    ): (GetBlockApiResponseBase & GetBlockApiResponseWithRewards) | null;
    /**
     * Returns identity and transaction information about a confirmed block in the ledger
     *
     * {@label transactions-signatures--rewards-none}
     * @see https://solana.com/docs/rpc/http/getblock
     */
    getBlock(
        slot: Slot,
        // transactionDetails=signatures, rewards=false, encoding + maxSupportedTransactionVersion irrelevant
        config: GetBlockCommonConfig &
            Readonly<{
                rewards: false;
                transactionDetails: 'signatures';
            }>,
    ): (GetBlockApiResponseBase & GetBlockApiResponseWithSignatures) | null;
    /**
     * Returns identity and transaction information about a confirmed block in the ledger
     *
     * {@label transactions-signatures--rewards-included}
     * @see https://solana.com/docs/rpc/http/getblock
     */
    getBlock(
        slot: Slot,
        // transactionDetails=signatures, rewards=missing/true, encoding + maxSupportedTransactionVersion irrelevant
        config: GetBlockCommonConfig &
            Readonly<{
                rewards?: true;
                transactionDetails: 'signatures';
            }>,
    ): (GetBlockApiResponseBase & GetBlockApiResponseWithRewards & GetBlockApiResponseWithSignatures) | null;
    /**
     * Returns identity and transaction information about a confirmed block in the ledger
     *
     * {@label transactions-accounts--rewards-none--version-specified}
     * @see https://solana.com/docs/rpc/http/getblock
     */
    getBlock(
        slot: Slot,
        // transactionDetails=accounts, rewards=false, maxSupportedTransactionVersion=0, encoding irrelevant
        config: GetBlockCommonConfig &
            Readonly<{
                maxSupportedTransactionVersion: GetBlockMaxSupportedTransactionVersion;
                rewards: false;
                transactionDetails: 'accounts';
            }>,
    ):
        | (GetBlockApiResponseBase &
              GetBlockApiResponseWithTransactions<TransactionForAccounts<GetBlockMaxSupportedTransactionVersion>>)
        | null;
    /**
     * Returns identity and transaction information about a confirmed block in the ledger
     *
     * {@label transactions-accounts--rewards-none--version-legacy}
     * @see https://solana.com/docs/rpc/http/getblock
     */
    getBlock(
        slot: Slot,
        // transactionDetails=accounts, rewards=false, maxSupportedTransactionVersion=missing, encoding irrelevant
        config: Omit<GetBlockCommonConfig, 'maxSupportedTransactionVersion'> &
            Readonly<{
                rewards: false;
                transactionDetails: 'accounts';
            }>,
    ): (GetBlockApiResponseBase & GetBlockApiResponseWithTransactions<TransactionForAccounts<void>>) | null;
    /**
     * Returns identity and transaction information about a confirmed block in the ledger
     *
     * {@label transactions-accounts--rewards-included--version-specified}
     * @see https://solana.com/docs/rpc/http/getblock
     */
    getBlock(
        slot: Slot,
        // transactionDetails=accounts, rewards=missing/true, maxSupportedTransactionVersion=0, encoding irrelevant
        config: GetBlockCommonConfig &
            Readonly<{
                maxSupportedTransactionVersion: GetBlockMaxSupportedTransactionVersion;
                rewards?: true;
                transactionDetails: 'accounts';
            }>,
    ):
        | (GetBlockApiResponseBase &
              GetBlockApiResponseWithRewards &
              GetBlockApiResponseWithTransactions<TransactionForAccounts<GetBlockMaxSupportedTransactionVersion>>)
        | null;
    /**
     * Returns identity and transaction information about a confirmed block in the ledger
     *
     * {@label transactions-accounts--rewards-included--version-legacy}
     * @see https://solana.com/docs/rpc/http/getblock
     */
    getBlock(
        slot: Slot,
        // transactionDetails=accounts, rewards=missing/true, maxSupportedTransactionVersion=missing, encoding irrelevant
        config: Omit<GetBlockCommonConfig, 'maxSupportedTransactionVersion'> &
            Readonly<{
                rewards?: true;
                transactionDetails: 'accounts';
            }>,
    ):
        | (GetBlockApiResponseBase &
              GetBlockApiResponseWithRewards &
              GetBlockApiResponseWithTransactions<TransactionForAccounts<void>>)
        | null;
    /**
     * Returns identity and transaction information about a confirmed block in the ledger
     *
     * {@label transactions-base58--rewards-none--version-specified}
     * @see https://solana.com/docs/rpc/http/getblock
     */
    getBlock(
        slot: Slot,
        // transactionDetails=full (default), encoding=base58, rewards=false, maxSupportedTransactionVersion=0
        config: GetBlockCommonConfig &
            Readonly<{
                encoding: 'base58';
                maxSupportedTransactionVersion: GetBlockMaxSupportedTransactionVersion;
                rewards: false;
                transactionDetails?: 'full';
            }>,
    ):
        | (GetBlockApiResponseBase &
              GetBlockApiResponseWithTransactions<TransactionForFullBase58<GetBlockMaxSupportedTransactionVersion>>)
        | null;
    /**
     * Returns identity and transaction information about a confirmed block in the ledger
     *
     * {@label transactions-base58--rewards-none--version-legacy}
     * @see https://solana.com/docs/rpc/http/getblock
     */
    getBlock(
        slot: Slot,
        // transactionDetails=full (default), encoding=base58, rewards=false, maxSupportedTransactionVersion=missing
        config: Omit<GetBlockCommonConfig, 'maxSupportedTransactionVersion'> &
            Readonly<{
                encoding: 'base58';
                rewards: false;
                transactionDetails?: 'full';
            }>,
    ): (GetBlockApiResponseBase & GetBlockApiResponseWithTransactions<TransactionForFullBase58<void>>) | null;
    /**
     * Returns identity and transaction information about a confirmed block in the ledger
     *
     * {@label transactions-base58--rewards-included--version-specified}
     * @see https://solana.com/docs/rpc/http/getblock
     */
    getBlock(
        slot: Slot,
        // transactionDetails=full (default), encoding=base58, rewards=missing/true, maxSupportedTransactionVersion=0
        config: GetBlockCommonConfig &
            Readonly<{
                encoding: 'base58';
                maxSupportedTransactionVersion: GetBlockMaxSupportedTransactionVersion;
                rewards?: true;
                transactionDetails?: 'full';
            }>,
    ):
        | (GetBlockApiResponseBase &
              GetBlockApiResponseWithRewards &
              GetBlockApiResponseWithTransactions<TransactionForFullBase58<GetBlockMaxSupportedTransactionVersion>>)
        | null;
    /**
     * Returns identity and transaction information about a confirmed block in the ledger
     *
     * {@label transactions-base58--rewards-included--version-legacy}
     * @see https://solana.com/docs/rpc/http/getblock
     */
    getBlock(
        slot: Slot,
        // transactionDetails=full (default), encoding=base58, rewards=missing/true, maxSupportedTransactionVersion=missing
        config: Omit<GetBlockCommonConfig, 'maxSupportedTransactionVersion'> &
            Readonly<{
                encoding: 'base58';
                rewards?: true;
                transactionDetails?: 'full';
            }>,
    ):
        | (GetBlockApiResponseBase &
              GetBlockApiResponseWithRewards &
              GetBlockApiResponseWithTransactions<TransactionForFullBase58<void>>)
        | null;
    /**
     * Returns identity and transaction information about a confirmed block in the ledger
     *
     * {@label transactions-base64--rewards-none--version-specified}
     * @see https://solana.com/docs/rpc/http/getblock
     */
    getBlock(
        slot: Slot,
        // transactionDetails=full (default), encoding=base64, rewards=false, maxSupportedTransactionVersion=0
        config: GetBlockCommonConfig &
            Readonly<{
                encoding: 'base64';
                maxSupportedTransactionVersion: GetBlockMaxSupportedTransactionVersion;
                rewards: false;
                transactionDetails?: 'full';
            }>,
    ):
        | (GetBlockApiResponseBase &
              GetBlockApiResponseWithTransactions<TransactionForFullBase64<GetBlockMaxSupportedTransactionVersion>>)
        | null;
    /**
     * Returns identity and transaction information about a confirmed block in the ledger
     *
     * {@label transactions-base64--rewards-none--version-legacy}
     * @see https://solana.com/docs/rpc/http/getblock
     */
    getBlock(
        slot: Slot,
        // transactionDetails=full (default), encoding=base64, rewards=false, maxSupportedTransactionVersion=missing
        config: Omit<GetBlockCommonConfig, 'maxSupportedTransactionVersion'> &
            Readonly<{
                encoding: 'base64';
                rewards: false;
                transactionDetails?: 'full';
            }>,
    ): (GetBlockApiResponseBase & GetBlockApiResponseWithTransactions<TransactionForFullBase64<void>>) | null;
    /**
     * Returns identity and transaction information about a confirmed block in the ledger
     *
     * {@label transactions-base64--rewards-included--version-specified}
     * @see https://solana.com/docs/rpc/http/getblock
     */
    getBlock(
        slot: Slot,
        // transactionDetails=full (default), encoding=base64, rewards=missing/true, maxSupportedTransactionVersion=0
        config: GetBlockCommonConfig &
            Readonly<{
                encoding: 'base64';
                maxSupportedTransactionVersion: GetBlockMaxSupportedTransactionVersion;
                rewards?: true;
                transactionDetails?: 'full';
            }>,
    ):
        | (GetBlockApiResponseBase &
              GetBlockApiResponseWithRewards &
              GetBlockApiResponseWithTransactions<TransactionForFullBase64<GetBlockMaxSupportedTransactionVersion>>)
        | null;
    /**
     * Returns identity and transaction information about a confirmed block in the ledger
     *
     * {@label transactions-base64--rewards-included--version-legacy}
     * @see https://solana.com/docs/rpc/http/getblock
     */
    getBlock(
        slot: Slot,
        // transactionDetails=full (default), encoding=base64, rewards=missing/true, maxSupportedTransactionVersion=missing
        config: Omit<GetBlockCommonConfig, 'maxSupportedTransactionVersion'> &
            Readonly<{
                encoding: 'base64';
                rewards?: true;
                transactionDetails?: 'full';
            }>,
    ):
        | (GetBlockApiResponseBase &
              GetBlockApiResponseWithRewards &
              GetBlockApiResponseWithTransactions<TransactionForFullBase64<void>>)
        | null;
    /**
     * Returns identity and transaction information about a confirmed block in the ledger
     *
     * {@label transactions-parsed--rewards-none--version-specified}
     * @see https://solana.com/docs/rpc/http/getblock
     */
    getBlock(
        slot: Slot,
        // transactionDetails=full (default), encoding=jsonParsed, rewards=false, maxSupportedTransactionVersion=0
        config: GetBlockCommonConfig &
            Readonly<{
                encoding: 'jsonParsed';
                maxSupportedTransactionVersion: GetBlockMaxSupportedTransactionVersion;
                rewards: false;
                transactionDetails?: 'full';
            }>,
    ):
        | (GetBlockApiResponseBase &
              GetBlockApiResponseWithTransactions<TransactionForFullJsonParsed<GetBlockMaxSupportedTransactionVersion>>)
        | null;
    /**
     * Returns identity and transaction information about a confirmed block in the ledger
     *
     * {@label transactions-parsed--rewards-none--version-legacy}
     * @see https://solana.com/docs/rpc/http/getblock
     */
    getBlock(
        slot: Slot,
        // transactionDetails=full (default), encoding=jsonParsed, rewards=false, maxSupportedTransactionVersion=missing
        config: Omit<GetBlockCommonConfig, 'maxSupportedTransactionVersion'> &
            Readonly<{
                encoding: 'jsonParsed';
                rewards: false;
                transactionDetails?: 'full';
            }>,
    ): (GetBlockApiResponseBase & GetBlockApiResponseWithTransactions<TransactionForFullJsonParsed<void>>) | null;
    /**
     * Returns identity and transaction information about a confirmed block in the ledger
     *
     * {@label transactions-parsed--rewards-included--version-specified}
     * @see https://solana.com/docs/rpc/http/getblock
     */
    getBlock(
        slot: Slot,
        // transactionDetails=full (default), encoding=jsonParsed, rewards=missing/true, maxSupportedTransactionVersion=0
        config: GetBlockCommonConfig &
            Readonly<{
                encoding: 'jsonParsed';
                maxSupportedTransactionVersion: GetBlockMaxSupportedTransactionVersion;
                transactionDetails?: 'full';
            }>,
    ):
        | (GetBlockApiResponseBase &
              GetBlockApiResponseWithRewards &
              GetBlockApiResponseWithTransactions<TransactionForFullJsonParsed<GetBlockMaxSupportedTransactionVersion>>)
        | null;
    /**
     * Returns identity and transaction information about a confirmed block in the ledger
     *
     * {@label transactions-parsed--rewards-included--version-legacy}
     * @see https://solana.com/docs/rpc/http/getblock
     */
    getBlock(
        slot: Slot,
        // transactionDetails=full (default), encoding=jsonParsed, rewards=missing/true, maxSupportedTransactionVersion=missing
        config: Omit<GetBlockCommonConfig, 'maxSupportedTransactionVersion'> &
            Readonly<{
                encoding: 'jsonParsed';
                rewards?: boolean;
                transactionDetails?: 'full';
            }>,
    ):
        | (GetBlockApiResponseBase &
              GetBlockApiResponseWithRewards &
              GetBlockApiResponseWithTransactions<TransactionForFullJsonParsed<void>>)
        | null;
    /**
     * Returns identity and transaction information about a confirmed block in the ledger
     *
     * {@label transactions-json--rewards-none--version-specified}
     * @see https://solana.com/docs/rpc/http/getblock
     */
    getBlock(
        slot: Slot,
        // transactionDetails=full (default), encoding=json (default), rewards=false, maxSupportedTransactionVersion=0
        config: GetBlockCommonConfig &
            Readonly<{
                encoding?: 'json';
                maxSupportedTransactionVersion: GetBlockMaxSupportedTransactionVersion;
                rewards: false;
                transactionDetails?: 'full';
            }>,
    ):
        | (GetBlockApiResponseBase &
              GetBlockApiResponseWithTransactions<TransactionForFullJson<GetBlockMaxSupportedTransactionVersion>>)
        | null;
    /**
     * Returns identity and transaction information about a confirmed block in the ledger
     *
     * {@label transactions-json--rewards-none--version-legacy}
     * @see https://solana.com/docs/rpc/http/getblock
     */
    getBlock(
        slot: Slot,
        // transactionDetails=full (default), encoding=json (default), rewards=false, maxSupportedTransactionVersion=missing
        config: Omit<GetBlockCommonConfig, 'maxSupportedTransactionVersion'> &
            Readonly<{
                encoding?: 'json';
                rewards: false;
                transactionDetails?: 'full';
            }>,
    ): (GetBlockApiResponseBase & GetBlockApiResponseWithTransactions<TransactionForFullJson<void>>) | null;
    /**
     * Returns identity and transaction information about a confirmed block in the ledger
     *
     * {@label transactions-json--rewards-included--version-specified}
     * @see https://solana.com/docs/rpc/http/getblock
     */
    getBlock(
        slot: Slot,
        // transactionDetails=full (default), encoding=json (default), rewards=missing/true, maxSupportedTransactionVersion=0
        config: GetBlockCommonConfig &
            Readonly<{
                encoding?: 'json';
                maxSupportedTransactionVersion: GetBlockMaxSupportedTransactionVersion;
                transactionDetails?: 'full';
            }>,
    ):
        | (GetBlockApiResponseBase &
              GetBlockApiResponseWithRewards &
              GetBlockApiResponseWithTransactions<TransactionForFullJson<GetBlockMaxSupportedTransactionVersion>>)
        | null;
    /**
     * Returns identity and transaction information about a confirmed block in the ledger
     *
     * {@label transactions-json--rewards-included--version-legacy}
     * @see https://solana.com/docs/rpc/http/getblock
     */
    getBlock(
        slot: Slot,
        // transactionDetails=full (default), encoding=json (default), rewards=missing/true, maxSupportedTransactionVersion=missing
        config?: Omit<GetBlockCommonConfig, 'maxSupportedTransactionVersion'> &
            Readonly<{
                encoding?: 'json';
                transactionDetails?: 'full';
            }>,
    ):
        | (GetBlockApiResponseBase &
              GetBlockApiResponseWithRewards &
              GetBlockApiResponseWithTransactions<TransactionForFullJson<void>>)
        | null;
};
