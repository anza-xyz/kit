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
    /** start searching backwards from this transaction signature. If not provided the search starts from the top of the highest max confirmed block. */
    before?: Signature;
    /**
     * Fetch the signatures as of the highest slot that has reached this level of commitment.
     * @defaultValue "finalized"
     */
    commitment?: AllowedCommitmentForGetSignaturesForAddress;
    /** maximum transaction signatures to return (between 1 and 1,000). Default: 1000 */
    limit?: number;
    /**
     * Prevents accessing stale data by enforcing that the RPC node has processed transactions up to
     * this slot
     */
    minContextSlot?: Slot;
    /** search until this transaction signature, if found before limit reached */
    until?: Signature;
}>;

export type GetSignaturesForAddressApi = {
    /**
     * Returns signatures for confirmed transactions that include the given address in their accountKeys list.
     * Returns signatures backwards in time from the provided signature or most recent confirmed block
     */
    getSignaturesForAddress(
        address: Address,
        config?: GetSignaturesForAddressConfig,
    ): GetSignaturesForAddressApiResponse;
};
