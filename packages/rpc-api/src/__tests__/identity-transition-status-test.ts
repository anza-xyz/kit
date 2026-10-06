import { createRpc, type Rpc } from '@solana/rpc-spec';

import { createSolanaRpcApi, IdentityTransitionStatusApi } from '../index';

const ADDRESS = '11111111111111111111111111111111';
const RESPONSE = {
    consensus: 'tower',
    currentIdentity: ADDRESS,
    error: null,
    fromIdentity: ADDRESS,
    fromIdentityLastSubmittedVoteSlot: null,
    processInstanceId: 'validator-instance',
    sequence: 42,
    state: 'complete',
    toIdentity: ADDRESS,
    towerRootSlot: null,
    version: 1,
    voteAccount: ADDRESS,
};

function createMockRpc(result: unknown) {
    const transport = jest.fn().mockResolvedValue({ result });
    const rpc: Rpc<IdentityTransitionStatusApi> = createRpc({ api: createSolanaRpcApi<never>(), transport });
    return { rpc, transport };
}

describe('identityTransitionStatus', () => {
    it('sends the exact RPC method with no arguments or injected commitment', async () => {
        expect.assertions(2);
        const { rpc, transport } = createMockRpc(RESPONSE);
        await rpc.identityTransitionStatus().send();
        expect(transport).toHaveBeenCalledTimes(1);
        expect(transport).toHaveBeenCalledWith({
            payload: { id: expect.any(String), jsonrpc: '2.0', method: 'identityTransitionStatus', params: [] },
        });
    });

    it.each([
        [null, null],
        [0, 0n],
        [123, 123n],
        [18446744073709551615n, 18446744073709551615n],
    ])('preserves the nullable slot %s and u64 precision', async (slot, expectedSlot) => {
        expect.assertions(1);
        const { rpc } = createMockRpc({
            ...RESPONSE,
            fromIdentityLastSubmittedVoteSlot: slot,
            sequence: 18446744073709551615n,
            towerRootSlot: slot,
        });
        await expect(rpc.identityTransitionStatus().send()).resolves.toStrictEqual({
            ...RESPONSE,
            fromIdentityLastSubmittedVoteSlot: expectedSlot,
            sequence: 18446744073709551615n,
            towerRootSlot: expectedSlot,
            version: 1n,
        });
    });

    it.each(['idle', 'transitioning', 'complete', 'failed'])('preserves state %s and diagnostics', async state => {
        expect.assertions(1);
        const { rpc } = createMockRpc({ ...RESPONSE, error: 'diagnostic', state, voteAccount: '' });
        await expect(rpc.identityTransitionStatus().send()).resolves.toMatchObject({
            error: 'diagnostic',
            state,
            voteAccount: '',
        });
    });

    it.each(['unknown', 'tower', 'alpenglow'])('preserves the %s consensus context', async consensus => {
        expect.assertions(1);
        const { rpc } = createMockRpc({ ...RESPONSE, consensus });
        await expect(rpc.identityTransitionStatus().send()).resolves.toMatchObject({ consensus });
    });

    it('propagates method-not-found errors from older validators', async () => {
        expect.assertions(1);
        const transport = jest.fn().mockResolvedValue({ error: { code: -32601, message: 'Method not found' } });
        const rpc: Rpc<IdentityTransitionStatusApi> = createRpc({ api: createSolanaRpcApi<never>(), transport });
        await expect(rpc.identityTransitionStatus().send()).rejects.toMatchObject({
            context: expect.objectContaining({ __code: -32601 }),
        });
    });
});
