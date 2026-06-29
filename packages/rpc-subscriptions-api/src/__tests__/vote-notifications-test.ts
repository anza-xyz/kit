describe('voteNotifications', () => {
    // TODO: As of Agave 4.1.0 the test validator rejects `voteSubscribe` (and `rootSubscribe`) at
    // subscribe time with `{ code: -32091, message: 'Subscription rejected' }`, regardless of the
    // `--rpc-pubsub-enable-vote-subscription` flag, so this subscription can no longer be
    // established against the local validator. Other subscriptions (slot, slotsUpdates, account)
    // are unaffected.
    it.todo('produces vote notifications');
});
