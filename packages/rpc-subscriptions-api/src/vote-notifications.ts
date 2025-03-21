import type { Address } from '@solana/addresses';
import type { Signature } from '@solana/keys';
import type { Blockhash, Slot, UnixTimestamp } from '@solana/rpc-types';

type VoteNotificationsApiNotification = Readonly<{
    hash: Blockhash;
    signature: Signature;
    slots: readonly Slot[];
    timestamp: UnixTimestamp | null;
    votePubkey: Address;
}>;

export type VoteNotificationsApi = {
    /**
     * Subscribe to receive a notification from the validator on a variety of updates on every slot
     */
    voteNotifications(): VoteNotificationsApiNotification;
};
