import type { Slot } from '@solana/rpc-types';

type SlotNotificationsApiNotification = Readonly<{
    /** The parent slot */
    parent: Slot;
    /** The current root slot */
    root: Slot;
    /** The newly set slot value */
    slot: Slot;
}>;

export type SlotNotificationsApi = {
    /**
     * Subscribe to receive notifications anytime a slot is processed by the validator.
     *
     * @see https://solana.com/docs/rpc/websocket/slotsubscribe
     */
    slotNotifications(): SlotNotificationsApiNotification;
};
