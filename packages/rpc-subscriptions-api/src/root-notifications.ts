import type { Slot } from '@solana/rpc-types';

type RootNotificationsApiNotification = Slot;

export type RootNotificationsApi = {
    /**
     * Subscribe to receive notification anytime a new root is set by the validator
     */
    rootNotifications(): RootNotificationsApiNotification;
};
