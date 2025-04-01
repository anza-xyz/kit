import type { Address } from '@solana/addresses';
import type { Signature } from '@solana/keys';
import type { Blockhash, Slot, UnixTimestamp } from '@solana/rpc-types';

type VoteNotificationsApiNotification = Readonly<{
    /** The vote hash */
    hash: Blockhash;
    /** The signature of the transaction that contained this vote */
    signature: Signature;
    /** The slots covered by the vote */
    slots: readonly Slot[];
    /** The timestamp of the vote */
    timestamp: UnixTimestamp | null;
    /** The address of the vote account */
    votePubkey: Address;
}>;

export type VoteNotificationsApi = {
    /**
     * Subscribe to receive notifications anytime a new vote is observed in gossip.
     *
     * These votes are pre-consensus therefore there is no guarantee these votes will enter the
     * ledger.
     *
     * This subscription is unstable and only available if the validator was started with the
     * `--rpc-pubsub-enable-vote-subscription` flag. The format of this subscription may change in
     * the future.
     *
     * @see https://solana.com/docs/rpc/websocket/votesubscribe
     */
    voteNotifications(): VoteNotificationsApiNotification;
};
