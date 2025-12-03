import type { Slot } from '@solana/rpc-types';

type RootNotificationsApiNotification = Slot;

export type RootNotificationsApi = {
    /**
     * Subscribe to receive notifications anytime a new root is set by the validator.
     *
     * @returns The number of the rooted slot
     * @see https://solana.com/docs/rpc/websocket/rootsubscribe
     */
    rootNotifications(): RootNotificationsApiNotification;
};
