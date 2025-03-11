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
    encoding?: GetBlockEncoding;
    maxSupportedTransactionVersion?: GetBlockMaxSupportedTransactionVersion;
    rewards?: boolean;
    transactionDetails?: GetBlockTransactionDetailsMode;
}>;

type GetBlockEncoding = 'base58' | 'base64' | 'json' | 'jsonParsed';
type GetBlockTransactionDetailsMode = 'accounts' | 'full' | 'none' | 'signatures';

// Max supported transaction version parameter:
// - `maxSupportedTransactionVersion` can only be provided with a number value. "legacy" is not a valid argument.
// This will throw a parse error (code -32602).
// - If `maxSupportedTransactionVersion` is not provided, the default value is "legacy".
// This will error if the block contains any transactions with a version greater than "legacy" (code -32015).
// - Also, If `maxSupportedTransactionVersion` is not provided, the `version` field of each transaction is omitted.
// - These rules apply to both "accounts" and "full" transaction details.
type GetBlockMaxSupportedTransactionVersion = Exclude<TransactionVersion, 'legacy'>;

export type GetBlockApi = {
    /**
     * Returns identity and transaction information about a confirmed block in the ledger
     */
    // transactionDetails=none, rewards=false, encoding + maxSupportedTransactionVersion irrelevant
    getBlock(
        slot: Slot,
        config: GetBlockCommonConfig &
            Readonly<{
                rewards: false;
                transactionDetails: 'none';
            }>,
    ): GetBlockApiResponseBase | null;
    // transactionDetails=none, rewards=missing/true, encoding + maxSupportedTransactionVersion irrelevant
    getBlock(
        slot: Slot,
        config: GetBlockCommonConfig &
            Readonly<{
                rewards?: true;
                transactionDetails: 'none';
            }>,
    ): (GetBlockApiResponseBase & GetBlockApiResponseWithRewards) | null;
    // transactionDetails=signatures, rewards=false, encoding + maxSupportedTransactionVersion irrelevant
    getBlock(
        slot: Slot,
        config: GetBlockCommonConfig &
            Readonly<{
                rewards: false;
                transactionDetails: 'signatures';
            }>,
    ): (GetBlockApiResponseBase & GetBlockApiResponseWithSignatures) | null;
    // transactionDetails=signatures, rewards=missing/true, encoding + maxSupportedTransactionVersion irrelevant
    getBlock(
        slot: Slot,
        config: GetBlockCommonConfig &
            Readonly<{
                rewards?: true;
                transactionDetails: 'signatures';
            }>,
    ): (GetBlockApiResponseBase & GetBlockApiResponseWithRewards & GetBlockApiResponseWithSignatures) | null;
    // transactionDetails=accounts, rewards=false, maxSupportedTransactionVersion=0, encoding irrelevant
    getBlock(
        slot: Slot,
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
    // // transactionDetails=accounts, rewards=false, maxSupportedTransactionVersion=missing, encoding irrelevant
    getBlock(
        slot: Slot,
        config: Omit<GetBlockCommonConfig, 'maxSupportedTransactionVersion'> &
            Readonly<{
                rewards: false;
                transactionDetails: 'accounts';
            }>,
    ): (GetBlockApiResponseBase & GetBlockApiResponseWithTransactions<TransactionForAccounts<void>>) | null;
    // transactionDetails=accounts, rewards=missing/true, maxSupportedTransactionVersion=0, encoding irrelevant
    getBlock(
        slot: Slot,
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
    // transactionDetails=accounts, rewards=missing/true, maxSupportedTransactionVersion=missing, encoding irrelevant
    getBlock(
        slot: Slot,
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
    // transactionDetails=full (default), encoding=base58, rewards=false, maxSupportedTransactionVersion=0
    getBlock(
        slot: Slot,
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
    // transactionDetails=full (default), encoding=base58, rewards=false, maxSupportedTransactionVersion=missing
    getBlock(
        slot: Slot,
        config: Omit<GetBlockCommonConfig, 'maxSupportedTransactionVersion'> &
            Readonly<{
                encoding: 'base58';
                rewards: false;
                transactionDetails?: 'full';
            }>,
    ): (GetBlockApiResponseBase & GetBlockApiResponseWithTransactions<TransactionForFullBase58<void>>) | null;
    // transactionDetails=full (default), encoding=base58, rewards=missing/true, maxSupportedTransactionVersion=0
    getBlock(
        slot: Slot,
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
    // transactionDetails=full (default), encoding=base58, rewards=missing/true, maxSupportedTransactionVersion=missing
    getBlock(
        slot: Slot,
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
    // transactionDetails=full (default), encoding=base64, rewards=false, maxSupportedTransactionVersion=0
    getBlock(
        slot: Slot,
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
    // transactionDetails=full (default), encoding=base64, rewards=false, maxSupportedTransactionVersion=missing
    getBlock(
        slot: Slot,
        config: Omit<GetBlockCommonConfig, 'maxSupportedTransactionVersion'> &
            Readonly<{
                encoding: 'base64';
                rewards: false;
                transactionDetails?: 'full';
            }>,
    ): (GetBlockApiResponseBase & GetBlockApiResponseWithTransactions<TransactionForFullBase64<void>>) | null;
    // transactionDetails=full (default), encoding=base64, rewards=missing/true, maxSupportedTransactionVersion=0
    getBlock(
        slot: Slot,
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
    // transactionDetails=full (default), encoding=base64, rewards=missing/true, maxSupportedTransactionVersion=missing
    getBlock(
        slot: Slot,
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
    // transactionDetails=full (default), encoding=jsonParsed, rewards=false, maxSupportedTransactionVersion=0
    getBlock(
        slot: Slot,
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
    // transactionDetails=full (default), encoding=jsonParsed, rewards=false, maxSupportedTransactionVersion=missing
    getBlock(
        slot: Slot,
        config: Omit<GetBlockCommonConfig, 'maxSupportedTransactionVersion'> &
            Readonly<{
                encoding: 'jsonParsed';
                rewards: false;
                transactionDetails?: 'full';
            }>,
    ): (GetBlockApiResponseBase & GetBlockApiResponseWithTransactions<TransactionForFullJsonParsed<void>>) | null;
    // transactionDetails=full (default), encoding=jsonParsed, rewards=missing/true, maxSupportedTransactionVersion=0
    getBlock(
        slot: Slot,
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
    // transactionDetails=full (default), encoding=jsonParsed, rewards=missing/true, maxSupportedTransactionVersion=missing
    getBlock(
        slot: Slot,
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
    // transactionDetails=full (default), encoding=json (default), rewards=false, maxSupportedTransactionVersion=0
    getBlock(
        slot: Slot,
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
    // transactionDetails=full (default), encoding=json (default), rewards=false, maxSupportedTransactionVersion=missing
    getBlock(
        slot: Slot,
        config: Omit<GetBlockCommonConfig, 'maxSupportedTransactionVersion'> &
            Readonly<{
                encoding?: 'json';
                rewards: false;
                transactionDetails?: 'full';
            }>,
    ): (GetBlockApiResponseBase & GetBlockApiResponseWithTransactions<TransactionForFullJson<void>>) | null;
    // transactionDetails=full (default), encoding=json (default), rewards=missing/true, maxSupportedTransactionVersion=0
    getBlock(
        slot: Slot,
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
    // transactionDetails=full (default), encoding=json (default), rewards=missing/true, maxSupportedTransactionVersion=missing
    getBlock(
        slot: Slot,
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
