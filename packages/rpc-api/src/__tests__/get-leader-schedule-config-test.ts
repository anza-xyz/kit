import type { Address } from '@solana/addresses';
import { createRpc, type Rpc } from '@solana/rpc-spec';

import { createSolanaRpcApi, GetLeaderScheduleApi } from '../index';

describe('getLeaderSchedule keyByVoteAccount', () => {
    const identity = '11111111111111111111111111111111' as Address;
    const voteAccount = 'Vote111111111111111111111111111111111111111' as Address;

    it.each([
        { key: voteAccount, keyByVoteAccount: true },
        { key: identity, keyByVoteAccount: false },
    ])(
        'forwards keyByVoteAccount=$keyByVoteAccount alongside the validator identity',
        async ({ key, keyByVoteAccount }) => {
            expect.assertions(2);
            const transport = jest.fn().mockResolvedValue({ result: { [key]: [0, 1] } });
            const rpc: Rpc<GetLeaderScheduleApi> = createRpc({ api: createSolanaRpcApi(), transport });

            const result = await rpc.getLeaderSchedule(null, { identity, keyByVoteAccount }).send();

            expect(transport).toHaveBeenCalledWith(
                expect.objectContaining({
                    payload: expect.objectContaining({
                        method: 'getLeaderSchedule',
                        params: [null, { identity, keyByVoteAccount }],
                    }),
                }),
            );
            expect(result).toStrictEqual({ [key]: [0n, 1n] });
        },
    );
});
