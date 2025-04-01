import type { Slot } from '@solana/rpc-types';

type SlotsUpdatesNotificationsApiNotificationBase = Readonly<{
    /** The newly updated slot */
    slot: Slot;
    /** The Unix timestamp of the update in milliseconds */
    timestamp: bigint;
    type: 'completed' | 'firstShredReceived' | 'optimisticConfirmation' | 'root';
}>;

type SlotsUpdatesNotificationsApiNotificationCreatedBank = Readonly<{
    /** The parent slot */
    parent: Slot;
    type: 'createdBank';
}> &
    SlotsUpdatesNotificationsApiNotificationBase;

type SlotsUpdatesNotificationsApiNotificationDead = Readonly<{
    err: string;
    type: 'dead';
}> &
    SlotsUpdatesNotificationsApiNotificationBase;

type SlotsUpdatesNotificationsApiNotificationFrozen = Readonly<{
    stats: Readonly<{
        maxTransactionsPerEntry: bigint;
        numFailedTransactions: bigint;
        numSuccessfulTransactions: bigint;
        numTransactionEntries: bigint;
    }>;
    type: 'frozen';
}> &
    SlotsUpdatesNotificationsApiNotificationBase;

type SlotsUpdatesNotificationsApiNotification =
    | SlotsUpdatesNotificationsApiNotificationBase
    | SlotsUpdatesNotificationsApiNotificationCreatedBank
    | SlotsUpdatesNotificationsApiNotificationDead
    | SlotsUpdatesNotificationsApiNotificationFrozen;

export type SlotsUpdatesNotificationsApi = {
    /**
     * Subscribe to receive a notification from the validator on a variety of updates on every slot.
     *
     * This subscription is unstable. The format of this subscription may change in the future, and
     * may not be supported by every node.
     *
     * @see https://solana.com/docs/rpc/websocket/slotsupdatessubscribe
     */
    slotsUpdatesNotifications(): SlotsUpdatesNotificationsApiNotification;
};
