import { type RpcSubscriptions } from '@solana/rpc-subscriptions-spec';

import type { VoteNotificationsApi } from '../vote-notifications';
import { createLocalhostSolanaRpcSubscriptions } from './__setup__';

describe('voteNotifications', () => {
    let rpc: RpcSubscriptions<VoteNotificationsApi>;
    beforeEach(() => {
        rpc = createLocalhostSolanaRpcSubscriptions();
    });

    // FIXME: Re-enable once https://github.com/anza-xyz/agave/pull/6645 is live.
    it.failing('produces vote notifications', async () => {
        expect.assertions(
            // FIXME: Set back to `1` once https://github.com/anza-xyz/agave/pull/6645 is live.
            0,
        );

        const abortController = new AbortController();
        try {
            const voteNotifications = await rpc.voteNotifications().subscribe({ abortSignal: abortController.signal });
            const iterator = voteNotifications[Symbol.asyncIterator]();
            await expect(iterator.next()).resolves.toHaveProperty(
                'value',
                expect.objectContaining({
                    hash: expect.any(String),
                    signature: expect.any(String),
                    slots: expect.arrayContaining([expect.any(BigInt)]),
                    // TODO: Test for null. It appears this is maybe non-deterministic? Seems to maybe occur on delayed votes?
                    timestamp: expect.any(BigInt),
                    votePubkey: expect.any(String),
                }),
            );
        } finally {
            abortController.abort();
        }
    });
});
