import type { Signature } from '@solana/keys';
import type { Commitment, Slot } from '@solana/rpc-types';
import type { Base64EncodedWireTransaction } from '@solana/transactions';

type SendTransactionConfig = Readonly<{
    /**
     * Maximum number of times for the RPC node to retry sending the transaction to the leader.
     *
     * @defaultValue When omitted, the RPC node will retry the transaction until it is finalized or
     * until its lifetime specifier (ie. its recent blockhash or nonce) expires.
     */
    maxRetries?: bigint;
    /**
     * Prevents accessing stale data by enforcing that the RPC node has processed transactions up to
     * this slot
     */
    minContextSlot?: Slot;
    /**
     * Simulate the transaction as of the highest slot that has reached this level of commitment.
     *
     * Has no effect when `skipPreflight` is set to `true`.
     *
     * @defaultValue Whichever default is applied by the underlying {@link RpcApi} in use. For
     * example, when using an API created by a `createSolanaRpc*()` helper, the default commitment
     * is `"confirmed"` unless configured otherwise. Unmitigated by an API layer on the client, the
     * default commitment applied by the server is `"finalized"`.
     */
    preflightCommitment?: Commitment;
    /** @defaultValue `false` */
    skipPreflight?: boolean;
}>;

type SendTransactionResponse = Signature;

export type SendTransactionApi = {
    /** @deprecated Set `encoding` to `'base64'` when calling this method */
    sendTransaction(
        base64EncodedWireTransaction: Base64EncodedWireTransaction,
        config?: SendTransactionConfig & { encoding?: 'base58' },
    ): SendTransactionResponse;
    /**
     * Submits a signed transaction to the cluster for processing.
     *
     * This method does not alter the transaction in any way; it relays the transaction created by
     * clients to the node as-is.
     *
     * If the node's RPC service receives the transaction, this method immediately succeeds, without
     * waiting for any confirmations. A successful response from this method does not guarantee the
     * transaction will be processed or confirmed by the cluster.
     *
     * While the RPC service will reasonably retry to submit it, the transaction could fail to be
     * committed if the transaction's lifetime specifier (ie. its recent blockhash or nonce) expires
     * before it lands.
     *
     * Use {@link GetSignatureStatusesApi.getSignatureStatuses} to ensure that a transaction has
     * been processed and confirmed.
     *
     * Before submitting, the following preflight checks are performed:
     *
     *     1. The transaction signatures are verified
     *     2. The transaction is simulated against the bank slot specified by the preflight
     *        commitment. On failure, an error will be returned. It is recommended to specify the
     *        same commitment and preflight commitment to avoid confusing behavior. You can disable
     *        preflight checks if desired.
     *
     * @param base64EncodedWireTransaction A fully signed transaction in wire format, as a base-64
     * encoded string. Use {@link getBase64EncodedWireTransaction} to obtain this.
     *
     * @returns The signature of the transaction, as a base-58 encoded string. This is the first
     * signature in the transaction, which is used to uniquely identify it. You do not have to wait
     * for this method to return to obtain the signature; you can extract it from the transaction
     * before sending it.
     *
     * @see https://solana.com/docs/rpc/http/sendtransaction
     */
    sendTransaction(
        base64EncodedWireTransaction: Base64EncodedWireTransaction,
        config?: SendTransactionConfig & { encoding: 'base64' },
    ): SendTransactionResponse;
};
