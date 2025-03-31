import { Address } from '@solana/addresses';
import type {
    Base58EncodedBytes,
    Blockhash,
    Commitment,
    Reward,
    Slot,
    SolanaRpcResponse,
    TransactionForAccounts,
    TransactionForFullBase58,
    TransactionForFullBase64,
    TransactionForFullJson,
    TransactionForFullJsonParsed,
    UnixTimestamp,
} from '@solana/rpc-types';
import type { TransactionVersion } from '@solana/transaction-messages';

// Subscription notification types

type BlockNotificationsNotificationBase = Readonly<{
    /**
     * Errors can arise in generating a block notification.
     * If an error is encountered, this field will contain the error, and the `block` field will return null.
     * @see https://github.com/anza-xyz/agave/blob/6ea51280ddc235ed93e16906c3427efd20cd7ce4/rpc/src/rpc_subscriptions.rs#L1059-L1074
     * @see https://github.com/anza-xyz/agave/blob/6ea51280ddc235ed93e16906c3427efd20cd7ce4/rpc-client-api/src/response.rs#L507-L514
     */
    err: string | null;
    slot: Slot;
}>;

type BlockNotificationsNotificationBlock = Readonly<{
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

type BlockNotificationsNotificationBlockWithRewards = Readonly<{
    /** Block-level rewards */
    rewards: readonly Reward[];
}>;

type BlockNotificationsNotificationBlockWithSignatures = Readonly<{
    /** List of signatures applied to transactions in this block */
    signatures: readonly Base58EncodedBytes[];
}>;

type BlockNotificationsNotificationBlockWithTransactions<TTransaction> = Readonly<{
    transactions: readonly TTransaction[];
}>;

// Subscription parameter types

type BlockNotificationsFilter =
    | 'all'
    | {
          /**
           * This filter matches when a transaction mentions the provided address. If no transaction
           * mentions this address in a given block, then no notification will be sent for that
           * block.
           */
          mentionsAccountOrProgram: Address;
      };

type BlockNotificationsCommonConfig = Readonly<{
    /**
     * Get notified when a new block has reached this level of commitment.
     *
     * @defaultValue Whichever default is applied by the underlying {@link RpcSubscriptionsApi} in
     * use. For example, when using an API created by a `createSolanaRpcSubscriptions*()` helper,
     * the default commitment is `"confirmed"` unless configured otherwise. Unmitigated by an API
     * layer on the client, the default commitment applied by the server is `"finalized"`.
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
     *   optionally the stack height if it is an inner instruction.
     * - `'jsonParsed'` produces an object with `message` and `signatures` properties. This property
     *   will cause the server to attempt to process each instruction using a parser specific to its
     *   program. If successful, the parsed instruction will be returned in the response as JSON.
     *   Otherwise, each instruction will be returned according to the rules of `'json'` encoding.
     *
     * @defaultValue "json"
     */
    encoding?: BlockNotificationsEncoding;
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
    maxSupportedTransactionVersion?: BlockNotificationsMaxSupportedTransactionVersion;
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
    transactionDetails?: BlockNotificationTransactionDetailsMode;
}>;

type BlockNotificationsEncoding = 'base58' | 'base64' | 'json' | 'jsonParsed';
type BlockNotificationTransactionDetailsMode = 'accounts' | 'full' | 'none' | 'signatures';

type BlockNotificationsMaxSupportedTransactionVersion = Exclude<TransactionVersion, 'legacy'>;

export type BlockNotificationsApi = {
    /**
     * Subscribe to receive notifications anytime a new block reaches the specified level of
     * commitment.
     *
     * The notification format is the same as seen in the {@link GetBlockApi.getBlock} RPC HTTP
     * method.
     *
     * @param filter Notifications will only be produced for blocks that match this filter.
     *
     * {@label transactions-none--rewards-none}
     * @see https://solana.com/docs/rpc/websocket/blocksubscribe
     */
    blockNotifications(
        filter: BlockNotificationsFilter,
        // transactionDetails=none, rewards=false, encoding + maxSupportedTransactionVersion irrelevant
        config: BlockNotificationsCommonConfig &
            Readonly<{
                encoding?: BlockNotificationsEncoding;
                maxSupportedTransactionVersion?: BlockNotificationsMaxSupportedTransactionVersion;
                showRewards: false;
                transactionDetails: 'none';
            }>,
    ): SolanaRpcResponse<
        BlockNotificationsNotificationBase &
            Readonly<{
                block: BlockNotificationsNotificationBlock | null;
            }>
    >;
    /**
     * Subscribe to receive notifications anytime a new block reaches the specified level of
     * commitment.
     *
     * The notification format is the same as seen in the {@link GetBlockApi.getBlock} RPC HTTP
     * method.
     *
     * @param filter Notifications will only be produced for blocks that match this filter.
     *
     * {@label transactions-none--rewards-included}
     * @see https://solana.com/docs/rpc/websocket/blocksubscribe
     */
    blockNotifications(
        filter: BlockNotificationsFilter,
        // transactionDetails=none, rewards=missing/true, encoding + maxSupportedTransactionVersion irrelevant
        config: BlockNotificationsCommonConfig &
            Readonly<{
                encoding?: BlockNotificationsEncoding;
                maxSupportedTransactionVersion?: BlockNotificationsMaxSupportedTransactionVersion;
                showRewards?: true;
                transactionDetails: 'none';
            }>,
    ): SolanaRpcResponse<
        BlockNotificationsNotificationBase &
            Readonly<{
                block: (BlockNotificationsNotificationBlock & BlockNotificationsNotificationBlockWithRewards) | null;
            }>
    >;
    /**
     * Subscribe to receive notifications anytime a new block reaches the specified level of
     * commitment.
     *
     * The notification format is the same as seen in the {@link GetBlockApi.getBlock} RPC HTTP
     * method.
     *
     * @param filter Notifications will only be produced for blocks that match this filter. Only
     * signatures of transactions that match this filter will be included in the block.
     *
     * {@label transactions-signatures--rewards-none}
     * @see https://solana.com/docs/rpc/websocket/blocksubscribe
     */
    blockNotifications(
        filter: BlockNotificationsFilter,
        // transactionDetails=signatures, rewards=false, encoding + maxSupportedTransactionVersion irrelevant
        config: BlockNotificationsCommonConfig &
            Readonly<{
                encoding?: BlockNotificationsEncoding;
                maxSupportedTransactionVersion?: BlockNotificationsMaxSupportedTransactionVersion;
                showRewards: false;
                transactionDetails: 'signatures';
            }>,
    ): SolanaRpcResponse<
        BlockNotificationsNotificationBase &
            Readonly<{
                block: (BlockNotificationsNotificationBlock & BlockNotificationsNotificationBlockWithSignatures) | null;
            }>
    >;
    /**
     * Subscribe to receive notifications anytime a new block reaches the specified level of
     * commitment.
     *
     * The notification format is the same as seen in the {@link GetBlockApi.getBlock} RPC HTTP
     * method.
     *
     * @param filter Notifications will only be produced for blocks that match this filter. Only
     * signatures of transactions that match this filter will be included in the block.
     *
     * {@label transactions-signatures--rewards-included}
     * @see https://solana.com/docs/rpc/websocket/blocksubscribe
     */
    blockNotifications(
        filter: BlockNotificationsFilter,
        // transactionDetails=signatures, rewards=missing/true, encoding + maxSupportedTransactionVersion irrelevant
        config: BlockNotificationsCommonConfig &
            Readonly<{
                encoding?: BlockNotificationsEncoding;
                maxSupportedTransactionVersion?: BlockNotificationsMaxSupportedTransactionVersion;
                showRewards?: true;
                transactionDetails: 'signatures';
            }>,
    ): SolanaRpcResponse<
        BlockNotificationsNotificationBase &
            Readonly<{
                block:
                    | (BlockNotificationsNotificationBlock &
                          BlockNotificationsNotificationBlockWithRewards &
                          BlockNotificationsNotificationBlockWithSignatures)
                    | null;
            }>
    >;
    /**
     * Subscribe to receive notifications anytime a new block reaches the specified level of
     * commitment.
     *
     * The notification format is the same as seen in the {@link GetBlockApi.getBlock} RPC HTTP
     * method.
     *
     * @param filter Notifications will only be produced for blocks that match this filter. Only
     * transactions that match this filter will be included in the block.
     *
     * {@label transactions-accounts--rewards-none--version-specified}
     * @see https://solana.com/docs/rpc/websocket/blocksubscribe
     */
    blockNotifications(
        filter: BlockNotificationsFilter,
        // transactionDetails=accounts, rewards=false, maxSupportedTransactionVersion=0, encoding irrelevant
        config: BlockNotificationsCommonConfig &
            Readonly<{
                encoding?: BlockNotificationsEncoding;
                maxSupportedTransactionVersion: BlockNotificationsMaxSupportedTransactionVersion;
                showRewards: false;
                transactionDetails: 'accounts';
            }>,
    ): SolanaRpcResponse<
        BlockNotificationsNotificationBase &
            Readonly<{
                block:
                    | (BlockNotificationsNotificationBlock &
                          BlockNotificationsNotificationBlockWithTransactions<
                              TransactionForAccounts<BlockNotificationsMaxSupportedTransactionVersion>
                          >)
                    | null;
            }>
    >;
    /**
     * Subscribe to receive notifications anytime a new block reaches the specified level of
     * commitment.
     *
     * The notification format is the same as seen in the {@link GetBlockApi.getBlock} RPC HTTP
     * method.
     *
     * @param filter Notifications will only be produced for blocks that match this filter. Only
     * transactions that match this filter will be included in the block.
     *
     * {@label transactions-accounts--rewards-none--version-legacy}
     * @see https://solana.com/docs/rpc/websocket/blocksubscribe
     */
    blockNotifications(
        filter: BlockNotificationsFilter,
        // transactionDetails=accounts, rewards=false, maxSupportedTransactionVersion=missing, encoding irrelevant
        config: BlockNotificationsCommonConfig &
            Readonly<{
                encoding?: BlockNotificationsEncoding;
                showRewards: false;
                transactionDetails: 'accounts';
            }>,
    ): SolanaRpcResponse<
        BlockNotificationsNotificationBase &
            Readonly<{
                block:
                    | (BlockNotificationsNotificationBlock &
                          BlockNotificationsNotificationBlockWithTransactions<TransactionForAccounts<void>>)
                    | null;
            }>
    >;
    /**
     * Subscribe to receive notifications anytime a new block reaches the specified level of
     * commitment.
     *
     * The notification format is the same as seen in the {@link GetBlockApi.getBlock} RPC HTTP
     * method.
     *
     * @param filter Notifications will only be produced for blocks that match this filter. Only
     * transactions that match this filter will be included in the block.
     *
     * {@label transactions-accounts--rewards-included--version-specified}
     * @see https://solana.com/docs/rpc/websocket/blocksubscribe
     */
    blockNotifications(
        filter: BlockNotificationsFilter,
        // transactionDetails=accounts, rewards=missing/true, maxSupportedTransactionVersion=0, encoding irrelevant
        config: BlockNotificationsCommonConfig &
            Readonly<{
                encoding?: BlockNotificationsEncoding;
                maxSupportedTransactionVersion: BlockNotificationsMaxSupportedTransactionVersion;
                showRewards?: true;
                transactionDetails: 'accounts';
            }>,
    ): SolanaRpcResponse<
        BlockNotificationsNotificationBase &
            Readonly<{
                block:
                    | (BlockNotificationsNotificationBlock &
                          BlockNotificationsNotificationBlockWithRewards &
                          BlockNotificationsNotificationBlockWithTransactions<
                              TransactionForAccounts<BlockNotificationsMaxSupportedTransactionVersion>
                          >)
                    | null;
            }>
    >;
    /**
     * Subscribe to receive notifications anytime a new block reaches the specified level of
     * commitment.
     *
     * The notification format is the same as seen in the {@link GetBlockApi.getBlock} RPC HTTP
     * method.
     *
     * @param filter Notifications will only be produced for blocks that match this filter. Only
     * transactions that match this filter will be included in the block.
     *
     * {@label transactions-accounts--rewards-included--version-legacy}
     * @see https://solana.com/docs/rpc/websocket/blocksubscribe
     */
    blockNotifications(
        filter: BlockNotificationsFilter,
        // transactionDetails=accounts, rewards=missing/true, maxSupportedTransactionVersion=missing, encoding irrelevant
        config: BlockNotificationsCommonConfig &
            Readonly<{
                encoding?: BlockNotificationsEncoding;
                showRewards?: true;
                transactionDetails: 'accounts';
            }>,
    ): SolanaRpcResponse<
        BlockNotificationsNotificationBase &
            Readonly<{
                block:
                    | (BlockNotificationsNotificationBlock &
                          BlockNotificationsNotificationBlockWithRewards &
                          BlockNotificationsNotificationBlockWithTransactions<TransactionForAccounts<void>>)
                    | null;
            }>
    >;
    /**
     * Subscribe to receive notifications anytime a new block reaches the specified level of
     * commitment.
     *
     * The notification format is the same as seen in the {@link GetBlockApi.getBlock} RPC HTTP
     * method.
     *
     * @param filter Notifications will only be produced for blocks that match this filter. Only
     * transactions that match this filter will be included in the block.
     *
     * {@label transactions-base58--rewards-none--version-specified}
     * @see https://solana.com/docs/rpc/websocket/blocksubscribe
     */
    blockNotifications(
        filter: BlockNotificationsFilter,
        // transactionDetails=full (default), encoding=base58, rewards=false, maxSupportedTransactionVersion=0
        config: BlockNotificationsCommonConfig &
            Readonly<{
                encoding: 'base58';
                maxSupportedTransactionVersion: BlockNotificationsMaxSupportedTransactionVersion;
                showRewards: false;
                transactionDetails?: 'full';
            }>,
    ): SolanaRpcResponse<
        BlockNotificationsNotificationBase &
            Readonly<{
                block:
                    | (BlockNotificationsNotificationBlock &
                          BlockNotificationsNotificationBlockWithTransactions<
                              TransactionForFullBase58<BlockNotificationsMaxSupportedTransactionVersion>
                          >)
                    | null;
            }>
    >;
    /**
     * Subscribe to receive notifications anytime a new block reaches the specified level of
     * commitment.
     *
     * The notification format is the same as seen in the {@link GetBlockApi.getBlock} RPC HTTP
     * method.
     *
     * @param filter Notifications will only be produced for blocks that match this filter. Only
     * transactions that match this filter will be included in the block.
     *
     * {@label transactions-base58--rewards-none--version-legacy}
     * @see https://solana.com/docs/rpc/websocket/blocksubscribe
     */
    blockNotifications(
        filter: BlockNotificationsFilter,
        // transactionDetails=full (default), encoding=base58, rewards=false, maxSupportedTransactionVersion=missing
        config: BlockNotificationsCommonConfig &
            Readonly<{
                encoding: 'base58';
                showRewards: false;
                transactionDetails?: 'full';
            }>,
    ): SolanaRpcResponse<
        BlockNotificationsNotificationBase &
            Readonly<{
                block:
                    | (BlockNotificationsNotificationBlock &
                          BlockNotificationsNotificationBlockWithTransactions<TransactionForFullBase58<void>>)
                    | null;
            }>
    >;
    /**
     * Subscribe to receive notifications anytime a new block reaches the specified level of
     * commitment.
     *
     * The notification format is the same as seen in the {@link GetBlockApi.getBlock} RPC HTTP
     * method.
     *
     * @param filter Notifications will only be produced for blocks that match this filter. Only
     * transactions that match this filter will be included in the block.
     *
     * {@label transactions-base58--rewards-included--version-specified}
     * @see https://solana.com/docs/rpc/websocket/blocksubscribe
     */
    blockNotifications(
        filter: BlockNotificationsFilter,
        // transactionDetails=full (default), encoding=base58, rewards=missing/true, maxSupportedTransactionVersion=0
        config: BlockNotificationsCommonConfig &
            Readonly<{
                encoding: 'base58';
                maxSupportedTransactionVersion: BlockNotificationsMaxSupportedTransactionVersion;
                showRewards?: true;
                transactionDetails?: 'full';
            }>,
    ): SolanaRpcResponse<
        BlockNotificationsNotificationBase &
            Readonly<{
                block:
                    | (BlockNotificationsNotificationBlock &
                          BlockNotificationsNotificationBlockWithRewards &
                          BlockNotificationsNotificationBlockWithTransactions<
                              TransactionForFullBase58<BlockNotificationsMaxSupportedTransactionVersion>
                          >)
                    | null;
            }>
    >;
    /**
     * Subscribe to receive notifications anytime a new block reaches the specified level of
     * commitment.
     *
     * The notification format is the same as seen in the {@link GetBlockApi.getBlock} RPC HTTP
     * method.
     *
     * @param filter Notifications will only be produced for blocks that match this filter. Only
     * transactions that match this filter will be included in the block.
     *
     * {@label transactions-base58--rewards-included--version-legacy}
     * @see https://solana.com/docs/rpc/websocket/blocksubscribe
     */
    blockNotifications(
        filter: BlockNotificationsFilter,
        // transactionDetails=full (default), encoding=base58, rewards=missing/true, maxSupportedTransactionVersion=missing
        config: BlockNotificationsCommonConfig &
            Readonly<{
                encoding: 'base58';
                showRewards?: true;
                transactionDetails?: 'full';
            }>,
    ): SolanaRpcResponse<
        BlockNotificationsNotificationBase &
            Readonly<{
                block:
                    | (BlockNotificationsNotificationBlock &
                          BlockNotificationsNotificationBlockWithRewards &
                          BlockNotificationsNotificationBlockWithTransactions<TransactionForFullBase58<void>>)
                    | null;
            }>
    >;
    /**
     * Subscribe to receive notifications anytime a new block reaches the specified level of
     * commitment.
     *
     * The notification format is the same as seen in the {@link GetBlockApi.getBlock} RPC HTTP
     * method.
     *
     * @param filter Notifications will only be produced for blocks that match this filter. Only
     * transactions that match this filter will be included in the block.
     *
     * {@label transactions-base64--rewards-none--version-specified}
     * @see https://solana.com/docs/rpc/websocket/blocksubscribe
     */
    blockNotifications(
        filter: BlockNotificationsFilter,
        // transactionDetails=full (default), encoding=base64, rewards=false, maxSupportedTransactionVersion=0
        config: BlockNotificationsCommonConfig &
            Readonly<{
                encoding: 'base64';
                maxSupportedTransactionVersion: BlockNotificationsMaxSupportedTransactionVersion;
                showRewards: false;
                transactionDetails?: 'full';
            }>,
    ): SolanaRpcResponse<
        BlockNotificationsNotificationBase &
            Readonly<{
                block:
                    | (BlockNotificationsNotificationBlock &
                          BlockNotificationsNotificationBlockWithTransactions<
                              TransactionForFullBase64<BlockNotificationsMaxSupportedTransactionVersion>
                          >)
                    | null;
            }>
    >;
    /**
     * Subscribe to receive notifications anytime a new block reaches the specified level of
     * commitment.
     *
     * The notification format is the same as seen in the {@link GetBlockApi.getBlock} RPC HTTP
     * method.
     *
     * @param filter Notifications will only be produced for blocks that match this filter. Only
     * transactions that match this filter will be included in the block.
     *
     * {@label transactions-base64--rewards-none--version-legacy}
     * @see https://solana.com/docs/rpc/websocket/blocksubscribe
     */
    blockNotifications(
        filter: BlockNotificationsFilter,
        // transactionDetails=full (default), encoding=base64, rewards=false, maxSupportedTransactionVersion=missing
        config: BlockNotificationsCommonConfig &
            Readonly<{
                encoding: 'base64';
                showRewards: false;
                transactionDetails?: 'full';
            }>,
    ): SolanaRpcResponse<
        BlockNotificationsNotificationBase &
            Readonly<{
                block:
                    | (BlockNotificationsNotificationBlock &
                          BlockNotificationsNotificationBlockWithTransactions<TransactionForFullBase64<void>>)
                    | null;
            }>
    >;
    /**
     * Subscribe to receive notifications anytime a new block reaches the specified level of
     * commitment.
     *
     * The notification format is the same as seen in the {@link GetBlockApi.getBlock} RPC HTTP
     * method.
     *
     * @param filter Notifications will only be produced for blocks that match this filter. Only
     * transactions that match this filter will be included in the block.
     *
     * {@label transactions-base64--rewards-included--version-specified}
     * @see https://solana.com/docs/rpc/websocket/blocksubscribe
     */
    blockNotifications(
        filter: BlockNotificationsFilter,
        // transactionDetails=full (default), encoding=base64, rewards=missing/true, maxSupportedTransactionVersion=0
        config: BlockNotificationsCommonConfig &
            Readonly<{
                encoding: 'base64';
                maxSupportedTransactionVersion: BlockNotificationsMaxSupportedTransactionVersion;
                showRewards?: true;
                transactionDetails?: 'full';
            }>,
    ): SolanaRpcResponse<
        BlockNotificationsNotificationBase &
            Readonly<{
                block:
                    | (BlockNotificationsNotificationBlock &
                          BlockNotificationsNotificationBlockWithRewards &
                          BlockNotificationsNotificationBlockWithTransactions<
                              TransactionForFullBase64<BlockNotificationsMaxSupportedTransactionVersion>
                          >)
                    | null;
            }>
    >;
    /**
     * Subscribe to receive notifications anytime a new block reaches the specified level of
     * commitment.
     *
     * The notification format is the same as seen in the {@link GetBlockApi.getBlock} RPC HTTP
     * method.
     *
     * @param filter Notifications will only be produced for blocks that match this filter. Only
     * transactions that match this filter will be included in the block.
     *
     * {@label transactions-base64--rewards-included--version-legacy}
     * @see https://solana.com/docs/rpc/websocket/blocksubscribe
     */
    blockNotifications(
        filter: BlockNotificationsFilter,
        // transactionDetails=full (default), encoding=base64, rewards=missing/true, maxSupportedTransactionVersion=missing
        config: BlockNotificationsCommonConfig &
            Readonly<{
                encoding: 'base64';
                showRewards?: true;
                transactionDetails?: 'full';
            }>,
    ): SolanaRpcResponse<
        BlockNotificationsNotificationBase &
            Readonly<{
                block:
                    | (BlockNotificationsNotificationBlock &
                          BlockNotificationsNotificationBlockWithRewards &
                          BlockNotificationsNotificationBlockWithTransactions<TransactionForFullBase64<void>>)
                    | null;
            }>
    >;
    /**
     * Subscribe to receive notifications anytime a new block reaches the specified level of
     * commitment.
     *
     * The notification format is the same as seen in the {@link GetBlockApi.getBlock} RPC HTTP
     * method.
     *
     * @param filter Notifications will only be produced for blocks that match this filter. Only
     * transactions that match this filter will be included in the block.
     *
     * {@label transactions-parsed--rewards-none--version-specified}
     * @see https://solana.com/docs/rpc/websocket/blocksubscribe
     */
    blockNotifications(
        filter: BlockNotificationsFilter,
        // transactionDetails=full (default), encoding=jsonParsed, rewards=false, maxSupportedTransactionVersion=0
        config: BlockNotificationsCommonConfig &
            Readonly<{
                encoding: 'jsonParsed';
                maxSupportedTransactionVersion: BlockNotificationsMaxSupportedTransactionVersion;
                showRewards: false;
                transactionDetails?: 'full';
            }>,
    ): SolanaRpcResponse<
        BlockNotificationsNotificationBase &
            Readonly<{
                block:
                    | (BlockNotificationsNotificationBlock &
                          BlockNotificationsNotificationBlockWithTransactions<
                              TransactionForFullJsonParsed<BlockNotificationsMaxSupportedTransactionVersion>
                          >)
                    | null;
            }>
    >;
    /**
     * Subscribe to receive notifications anytime a new block reaches the specified level of
     * commitment.
     *
     * The notification format is the same as seen in the {@link GetBlockApi.getBlock} RPC HTTP
     * method.
     *
     * @param filter Notifications will only be produced for blocks that match this filter. Only
     * transactions that match this filter will be included in the block.
     *
     * {@label transactions-parsed--rewards-none--version-legacy}
     * @see https://solana.com/docs/rpc/websocket/blocksubscribe
     */
    blockNotifications(
        filter: BlockNotificationsFilter,
        // transactionDetails=full (default), encoding=jsonParsed, rewards=false, maxSupportedTransactionVersion=missing
        config: BlockNotificationsCommonConfig &
            Readonly<{
                encoding: 'jsonParsed';
                showRewards: false;
                transactionDetails?: 'full';
            }>,
    ): SolanaRpcResponse<
        BlockNotificationsNotificationBase &
            Readonly<{
                block:
                    | (BlockNotificationsNotificationBlock &
                          BlockNotificationsNotificationBlockWithTransactions<TransactionForFullJsonParsed<void>>)
                    | null;
            }>
    >;
    /**
     * Subscribe to receive notifications anytime a new block reaches the specified level of
     * commitment.
     *
     * The notification format is the same as seen in the {@link GetBlockApi.getBlock} RPC HTTP
     * method.
     *
     * @param filter Notifications will only be produced for blocks that match this filter. Only
     * transactions that match this filter will be included in the block.
     *
     * {@label transactions-parsed--rewards-included--version-specified}
     * @see https://solana.com/docs/rpc/websocket/blocksubscribe
     */
    blockNotifications(
        filter: BlockNotificationsFilter,
        // transactionDetails=full (default), encoding=jsonParsed, rewards=missing/true, maxSupportedTransactionVersion=0
        config: BlockNotificationsCommonConfig &
            Readonly<{
                encoding: 'jsonParsed';
                maxSupportedTransactionVersion: BlockNotificationsMaxSupportedTransactionVersion;
                showRewards?: true;
                transactionDetails?: 'full';
            }>,
    ): SolanaRpcResponse<
        BlockNotificationsNotificationBase &
            Readonly<{
                block:
                    | (BlockNotificationsNotificationBlock &
                          BlockNotificationsNotificationBlockWithRewards &
                          BlockNotificationsNotificationBlockWithTransactions<
                              TransactionForFullJsonParsed<BlockNotificationsMaxSupportedTransactionVersion>
                          >)
                    | null;
            }>
    >;
    /**
     * Subscribe to receive notifications anytime a new block reaches the specified level of
     * commitment.
     *
     * The notification format is the same as seen in the {@link GetBlockApi.getBlock} RPC HTTP
     * method.
     *
     * @param filter Notifications will only be produced for blocks that match this filter. Only
     * transactions that match this filter will be included in the block.
     *
     * {@label transactions-parsed--rewards-included--version-legacy}
     * @see https://solana.com/docs/rpc/websocket/blocksubscribe
     */
    blockNotifications(
        filter: BlockNotificationsFilter,
        // transactionDetails=full (default), encoding=jsonParsed, rewards=missing/true, maxSupportedTransactionVersion=missing
        config: BlockNotificationsCommonConfig &
            Readonly<{
                encoding: 'jsonParsed';
                showRewards?: true;
                transactionDetails?: 'full';
            }>,
    ): SolanaRpcResponse<
        BlockNotificationsNotificationBase &
            Readonly<{
                block:
                    | (BlockNotificationsNotificationBlock &
                          BlockNotificationsNotificationBlockWithRewards &
                          BlockNotificationsNotificationBlockWithTransactions<TransactionForFullJsonParsed<void>>)
                    | null;
            }>
    >;
    /**
     * Subscribe to receive notifications anytime a new block reaches the specified level of
     * commitment.
     *
     * The notification format is the same as seen in the {@link GetBlockApi.getBlock} RPC HTTP
     * method.
     *
     * @param filter Notifications will only be produced for blocks that match this filter. Only
     * transactions that match this filter will be included in the block.
     *
     * {@label transactions-json--rewards-none--version-specified}
     * @see https://solana.com/docs/rpc/websocket/blocksubscribe
     */
    blockNotifications(
        filter: BlockNotificationsFilter,
        // transactionDetails=full (default), encoding=json (default), rewards=false, maxSupportedTransactionVersion=0
        config: BlockNotificationsCommonConfig &
            Readonly<{
                encoding?: 'json';
                maxSupportedTransactionVersion: BlockNotificationsMaxSupportedTransactionVersion;
                showRewards: false;
                transactionDetails?: 'full';
            }>,
    ): SolanaRpcResponse<
        BlockNotificationsNotificationBase &
            Readonly<{
                block:
                    | (BlockNotificationsNotificationBlock &
                          BlockNotificationsNotificationBlockWithTransactions<
                              TransactionForFullJson<BlockNotificationsMaxSupportedTransactionVersion>
                          >)
                    | null;
            }>
    >;
    /**
     * Subscribe to receive notifications anytime a new block reaches the specified level of
     * commitment.
     *
     * The notification format is the same as seen in the {@link GetBlockApi.getBlock} RPC HTTP
     * method.
     *
     * @param filter Notifications will only be produced for blocks that match this filter. Only
     * transactions that match this filter will be included in the block.
     *
     * {@label transactions-json--rewards-none--version-legacy}
     * @see https://solana.com/docs/rpc/websocket/blocksubscribe
     */
    blockNotifications(
        filter: BlockNotificationsFilter,
        // transactionDetails=full (default), encoding=json (default), rewards=false, maxSupportedTransactionVersion=missing
        config: BlockNotificationsCommonConfig &
            Readonly<{
                encoding?: 'json';
                showRewards: false;
                transactionDetails?: 'full';
            }>,
    ): SolanaRpcResponse<
        BlockNotificationsNotificationBase &
            Readonly<{
                block:
                    | (BlockNotificationsNotificationBlock &
                          BlockNotificationsNotificationBlockWithTransactions<TransactionForFullJson<void>>)
                    | null;
            }>
    >;
    /**
     * Subscribe to receive notifications anytime a new block reaches the specified level of
     * commitment.
     *
     * The notification format is the same as seen in the {@link GetBlockApi.getBlock} RPC HTTP
     * method.
     *
     * @param filter Notifications will only be produced for blocks that match this filter. Only
     * transactions that match this filter will be included in the block.
     *
     * {@label transactions-json--rewards-included--version-specified}
     * @see https://solana.com/docs/rpc/websocket/blocksubscribe
     */
    blockNotifications(
        filter: BlockNotificationsFilter,
        // transactionDetails=full (default), encoding=json (default), rewards=missing/true, maxSupportedTransactionVersion=0
        config: BlockNotificationsCommonConfig &
            Readonly<{
                encoding?: 'json';
                maxSupportedTransactionVersion: BlockNotificationsMaxSupportedTransactionVersion;
                showRewards?: true;
                transactionDetails?: 'full';
            }>,
    ): SolanaRpcResponse<
        BlockNotificationsNotificationBase &
            Readonly<{
                block:
                    | (BlockNotificationsNotificationBlock &
                          BlockNotificationsNotificationBlockWithRewards &
                          BlockNotificationsNotificationBlockWithTransactions<
                              TransactionForFullJson<BlockNotificationsMaxSupportedTransactionVersion>
                          >)
                    | null;
            }>
    >;
    /**
     * Subscribe to receive notifications anytime a new block reaches the specified level of
     * commitment.
     *
     * The notification format is the same as seen in the {@link GetBlockApi.getBlock} RPC HTTP
     * method.
     *
     * @param filter Notifications will only be produced for blocks that match this filter. Only
     * transactions that match this filter will be included in the block.
     *
     * {@label transactions-json--rewards-included--version-legacy}
     * @see https://solana.com/docs/rpc/websocket/blocksubscribe
     */
    blockNotifications(
        filter: BlockNotificationsFilter,
        // transactionDetails=full (default), encoding=json (default), rewards=missing/true, maxSupportedTransactionVersion=missing
        config?: BlockNotificationsCommonConfig &
            Readonly<{
                encoding?: 'json';
                showRewards?: true;
                transactionDetails?: 'full';
            }>,
    ): SolanaRpcResponse<
        BlockNotificationsNotificationBase &
            Readonly<{
                block:
                    | (BlockNotificationsNotificationBlock &
                          BlockNotificationsNotificationBlockWithRewards &
                          BlockNotificationsNotificationBlockWithTransactions<TransactionForFullJson<void>>)
                    | null;
            }>
    >;
};
