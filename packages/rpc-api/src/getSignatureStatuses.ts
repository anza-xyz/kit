import type { Signature } from '@solana/keys';
import type { Commitment, Slot, SolanaRpcResponse, TransactionError } from '@solana/rpc-types';

/** @deprecated */
type TransactionStatusOk = Readonly<{
    Ok: null;
}>;

/** @deprecated */
type TransactionStatusErr = Readonly<{
    Err: TransactionError;
}>;

type SignatureStatusResult = Readonly<{
    /**
     * The transaction's cluster confirmation status; either `processed`, `confirmed`, or
     * `finalized`.
     */
    confirmationStatus: Commitment | null;
    /**
     * Number of blocks since signature confirmation or `null` if rooted as well as finalized by a
     * supermajority of the cluster.
     */
    confirmations: bigint | null;
    /** If the transaction failed, this property will contain the error */
    err: TransactionError | null;
    /** The slot the transaction was processed */
    slot: Slot;
    /** @deprecated */
    status: TransactionStatusErr | TransactionStatusOk;
}>;

type GetSignatureStatusesApiResponse = readonly (SignatureStatusResult | null)[];

export type GetSignatureStatusesApi = {
    /**
     * Returns the statuses of a list of signatures.
     *
     * Each signature uniquely identifies a transaction by virtue of being the first or only
     * signature in its list of signatures.
     *
     * @see https://solana.com/docs/rpc/http/getsignaturestatuses
     */
    getSignatureStatuses(
        /**
         * An array of transaction signatures to confirm, as base-58 encoded strings (up to a
         * maximum of 256)
         */
        signatures: Signature[],
        config?: Readonly<{
            /**
             * Determines whether the search for a transaction with a given signature will consider
             * any more than what is available in the recent status cache that retains statuses for
             * the active slots plus `MAX_RECENT_BLOCKHASHES` rooted slots. When `true` the search
             * will proceed into local block storage then, if available, archival storage.
             *
             * @defaultValue `false`
             */
            searchTransactionHistory?: boolean;
        }>,
    ): SolanaRpcResponse<GetSignatureStatusesApiResponse>;
};
