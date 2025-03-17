import type { Slot } from '@solana/rpc-types';

type SlotNotificationsApiNotification = Readonly<{
    parent: Slot;
    root: Slot;
    slot: Slot;
}>;

export type SlotNotificationsApi = {
    /**
     * Subscribe to receive notification anytime a slot is processed by the validator
     */
    slotNotifications(): SlotNotificationsApiNotification;
};
