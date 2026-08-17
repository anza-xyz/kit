import { RpcSubscriptionsChannel } from '@solana/rpc-subscriptions-spec';

import { createSolanaRpcSubscriptionsApi_UNSTABLE } from '../index';

const MOCK_TOKEN_BALANCE = {
    accountIndex: 1,
    mint: 'So11111111111111111111111111111111111111112',
    uiTokenAmount: {
        amount: '1000000000',
        decimals: 9,
        uiAmount: 1,
        uiAmountString: '1',
    },
};

function createMockChannel() {
    const messageListeners: ((message: unknown) => void)[] = [];
    let lastSent: { id?: number } | undefined;
    const channel: RpcSubscriptionsChannel<unknown, unknown> = {
        on(type, listener) {
            if (type === 'message') {
                messageListeners.push(listener as (message: unknown) => void);
            }
            return () => {};
        },
        send(message) {
            lastSent = message as { id?: number };
            return Promise.resolve();
        },
    };
    return {
        channel,
        /** Delivers `message` to everything subscribed to the channel's `message` events. */
        receive(message: unknown) {
            for (const listener of messageListeners) {
                listener(message);
            }
        },
        /** The last message the subject under test sent over the channel, if any. */
        sentMessage: () => lastSent,
    };
}

async function subscribeAndNotify(
    execute: (config: {
        channel: RpcSubscriptionsChannel<unknown, unknown>;
        signal: AbortSignal;
    }) => Promise<{ on(type: string, listener: (data: unknown) => void): void }>,
    notificationMethod: string,
    result: unknown,
) {
    const { channel, receive, sentMessage } = createMockChannel();
    const publisherPromise = execute({
        channel,
        signal: new AbortController().signal,
    });
    await Promise.resolve();
    const subscriptionId = 42;
    receive({ id: sentMessage()?.id, jsonrpc: '2.0', result: subscriptionId });
    const publisher = await publisherPromise;
    const notificationListener = jest.fn();
    publisher.on('notification', notificationListener);
    receive({
        jsonrpc: '2.0',
        method: notificationMethod,
        params: { result, subscription: subscriptionId },
    });
    if (!notificationListener.mock.calls.length) {
        throw new Error('notification listener was never called');
    }
    return notificationListener.mock.calls[0][0];
}

describe('the default response transformer for Solana RPC subscriptions', () => {
    it('leaves block notification transaction `version` as a number', async () => {
        expect.assertions(1);
        const api = createSolanaRpcSubscriptionsApi_UNSTABLE();
        const notification = await subscribeAndNotify(
            api.blockNotifications('all', {
                encoding: 'json',
                maxSupportedTransactionVersion: 0,
                transactionDetails: 'full',
            }).execute,
            'blockNotification',
            {
                value: {
                    block: {
                        transactions: [{ meta: null, version: 0 }],
                    },
                },
            },
        );
        expect(notification.value.block.transactions[0].version).toBe(0);
    });
    it('leaves block notification token balance `decimals` and `uiAmount` as numbers', async () => {
        expect.assertions(1);
        const api = createSolanaRpcSubscriptionsApi_UNSTABLE();
        const notification = await subscribeAndNotify(
            api.blockNotifications('all', {
                encoding: 'json',
                maxSupportedTransactionVersion: 0,
                transactionDetails: 'full',
            }).execute,
            'blockNotification',
            {
                value: {
                    block: {
                        transactions: [{ meta: { preTokenBalances: [MOCK_TOKEN_BALANCE] } }],
                    },
                },
            },
        );
        expect(notification.value.block.transactions[0].meta.preTokenBalances[0].uiTokenAmount).toMatchObject({
            decimals: 9,
            uiAmount: 1,
        });
    });
    it('leaves block notification instruction `stackHeight` as a number', async () => {
        expect.assertions(2);
        const api = createSolanaRpcSubscriptionsApi_UNSTABLE();
        const notification = await subscribeAndNotify(
            api.blockNotifications('all', {
                encoding: 'json',
                maxSupportedTransactionVersion: 0,
                transactionDetails: 'full',
            }).execute,
            'blockNotification',
            {
                value: {
                    block: {
                        transactions: [
                            {
                                meta: {
                                    innerInstructions: [{ index: 0, instructions: [{ stackHeight: 2 }] }],
                                },
                                transaction: {
                                    message: { instructions: [{ stackHeight: 1 }] },
                                },
                            },
                        ],
                    },
                },
            },
        );
        expect(notification.value.block.transactions[0].transaction.message.instructions[0].stackHeight).toBe(1);
        expect(notification.value.block.transactions[0].meta.innerInstructions[0].instructions[0].stackHeight).toBe(2);
    });
});
