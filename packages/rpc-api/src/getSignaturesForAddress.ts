import type { Address } from '@solana/addresses';
import type { Signature } from '@solana/keys';
import type { Commitment, Slot, TransactionError, UnixTimestamp } from '@solana/rpc-types';

type GetSignaturesForAddressTransaction = Readonly<{
    /** estimated production time of when transaction was processed. null if not available. */
    blockTime: UnixTimestamp | null;
    /** The transaction's cluster confirmation status */
    confirmationStatus: Commitment | null;
    /** Error if transaction failed, null if transaction succeeded. */
    err: TransactionError | null;
    /** Memo associated with the transaction, null if no memo is present */
    memo: string | null;
    /** transaction signature as base-58 encoded string */
    signature: Signature;
    /** The slot that contains the block with the transaction */
    slot: Slot;
}>;

type GetSignaturesForAddressApiResponse = readonly GetSignaturesForAddressTransaction[];

type AllowedCommitmentForGetSignaturesForAddress = Exclude<Commitment, 'processed'>;

type GetSignaturesForAddressConfig = Readonly<{
    /**
     * Start the search from before, but excluding, this signature.
     *
     * @defaultValue When omitted, the search starts from the top of the latest confirmed block.
     */
    before?: Signature;
    /**
     * Fetch the signatures as of the highest slot that has reached this level of commitment.
     *
     * @defaultValue Whichever default is applied by the underlying {@link RpcApi} in use. For
     * example, when using an API created by a `createSolanaRpc*()` helper, the default commitment
     * is `"confirmed"` unless configured otherwise. Unmitigated by an API layer on the client, the
     * default commitment applied by the server is `"finalized"`.
     */
    commitment?: AllowedCommitmentForGetSignaturesForAddress;
    /**
     * Maximum transaction signatures to return (between 1 and 1,000).
     *
     * @defaultValue 1000
     */
    limit?: number;
    /**
     * Prevents accessing stale data by enforcing that the RPC node has processed transactions up to
     * this slot
     */
    minContextSlot?: Slot;
    /**
     * Search, back in time, until this transaction signature.
     *
     * @defaultValue When omitted, search will proceed until the limit (if supplied) or until 1,000
     * signatures have been found.
     */
    until?: Signature;
}>;

export type GetSignaturesForAddressApi = {
    /**
     * Returns signatures for confirmed transactions that load the given address.
     *
     * {@label before-signature}
     * @returns Signatures in reverse chronological order starting from before, but excluding, the
     * signature supplied.
     * @see https://solana.com/docs/rpc/http/getsignaturesforaddress
     */
    getSignaturesForAddress(
        address: Address,
        config?: GetSignaturesForAddressConfig &
            Readonly<{
                before: Signature;
            }>,
    ): GetSignaturesForAddressApiResponse;
    /**
     * Returns signatures for confirmed transactions that load the given address.
     *
     * {@label all}
     * @returns Signatures in reverse chronological order starting from the most recent confirmed
     * block.
     * @see https://solana.com/docs/rpc/http/getsignaturesforaddress
     */
    getSignaturesForAddress(
        address: Address,
        config?: GetSignaturesForAddressConfig,
    ): GetSignaturesForAddressApiResponse;
};
