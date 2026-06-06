import type { RpcRequestTransformer } from '@solana/rpc-spec-types';
import type { Commitment } from '@solana/rpc-types';

import { getDefaultRequestTransformerForSolanaRpc } from '../request-transformer';
import { OPTIONS_OBJECT_POSITION_BY_METHOD } from '../request-transformer-options-object-position-config';

describe('getDefaultRequestTransformerForSolanaRpc', () => {
    describe('given no config', () => {
        let createRequest: (params: unknown) => { methodName: 'getFoo'; params: unknown };
        let requestTransformer: RpcRequestTransformer;
        beforeEach(() => {
            createRequest = params => ({ methodName: 'getFoo', params });
            requestTransformer = getDefaultRequestTransformerForSolanaRpc();
        });
        describe('given an array as input', () => {
            const input = [10n, 10, '10', ['10', [10, 10n], 10n]] as const;
            it('leaves bigints in the array untouched, to be serialized losslessly downstream', () => {
                const request = createRequest(input);
                expect(requestTransformer(request).params).toStrictEqual(input);
            });
        });
        describe('given an object as input', () => {
            const input = { a: 10n, b: 10, c: { c1: '10', c2: 10n } } as const;
            it('leaves bigints in the object untouched, to be serialized losslessly downstream', () => {
                const request = createRequest(input);
                expect(requestTransformer(request).params).toStrictEqual(input);
            });
        });
        describe('given a `bigint` larger than `Number.MAX_SAFE_INTEGER` and no overflow handler', () => {
            it('preserves the `bigint` losslessly rather than downcasting it to a `number`', () => {
                const input = BigInt(Number.MAX_SAFE_INTEGER) + 2n; // 9007199254740993
                const request = createRequest([input]);
                expect((requestTransformer(request).params as readonly unknown[])[0]).toBe(input);
            });
        });
    });
    describe('with respect to the default commitment', () => {
        const METHODS_SUBJECT_TO_COMMITMENT_DEFAULTING = [
            'accountNotifications',
            'blockNotifications',
            'getAccountInfo',
            'getBalance',
            'getBlock',
            'getBlockHeight',
            'getBlockProduction',
            'getBlocks',
            'getBlocksWithLimit',
            'getEpochInfo',
            'getFeeForMessage',
            'getInflationGovernor',
            'getInflationReward',
            'getLargestAccounts',
            'getLatestBlockhash',
            'getLeaderSchedule',
            'getMinimumBalanceForRentExemption',
            'getMultipleAccounts',
            'getProgramAccounts',
            'getSignaturesForAddress',
            'getSlot',
            'getSlotLeader',
            'getStakeMinimumDelegation',
            'getSupply',
            'getTokenAccountBalance',
            'getTokenAccountsByDelegate',
            'getTokenAccountsByOwner',
            'getTokenLargestAccounts',
            'getTokenSupply',
            'getTransaction',
            'getTransactionCount',
            'getVoteAccounts',
            'isBlockhashValid',
            'logsNotifications',
            'programNotifications',
            'requestAirdrop',
            'signatureNotifications',
            'simulateTransaction',
        ];
        describe.each(['processed', 'confirmed'] as Commitment[])(
            'with the default commitment set to `%s`',
            defaultCommitment => {
                let requestTransformer: RpcRequestTransformer;
                beforeEach(() => {
                    requestTransformer = getDefaultRequestTransformerForSolanaRpc({ defaultCommitment });
                });
                it.each(METHODS_SUBJECT_TO_COMMITMENT_DEFAULTING)(
                    'adds a default commitment on calls for `%s`',
                    methodName => {
                        expect(requestTransformer({ methodName, params: [] }).params).toContainEqual({
                            commitment: defaultCommitment,
                        });
                    },
                );
                it('adds a default preflight commitment on calls to `sendTransaction`', () => {
                    expect(requestTransformer({ methodName: 'sendTransaction', params: [] }).params).toContainEqual({
                        preflightCommitment: defaultCommitment,
                    });
                });
            },
        );
        describe('with the default commitment set to `finalized`', () => {
            let requestTransformer: RpcRequestTransformer;
            beforeEach(() => {
                requestTransformer = getDefaultRequestTransformerForSolanaRpc({ defaultCommitment: 'finalized' });
            });
            it.each(METHODS_SUBJECT_TO_COMMITMENT_DEFAULTING)('adds no commitment on calls for `%s`', methodName => {
                expect(requestTransformer({ methodName, params: [] }).params).not.toContainEqual(
                    expect.objectContaining({ commitment: expect.anything() }),
                );
            });
            it('adds no preflight commitment on calls to `sendTransaction`', () => {
                expect(requestTransformer({ methodName: 'sendTransaction', params: [] }).params).not.toContainEqual(
                    expect.objectContaining({ preflightCommitment: expect.anything() }),
                );
            });
        });
        describe('with no default commitment set', () => {
            let requestTransformer: RpcRequestTransformer;
            beforeEach(() => {
                requestTransformer = getDefaultRequestTransformerForSolanaRpc();
            });
            it.each(METHODS_SUBJECT_TO_COMMITMENT_DEFAULTING)('sets no commitment on calls to `%s`', methodName => {
                expect(requestTransformer({ methodName, params: [] }).params).not.toContainEqual(
                    expect.objectContaining({ commitment: expect.anything() }),
                );
            });
            it('adds no preflight commitment on calls to `sendTransaction`', () => {
                expect(requestTransformer({ methodName: 'sendTransaction', params: [] }).params).not.toContainEqual(
                    expect.objectContaining({ preflightCommitment: expect.anything() }),
                );
            });
        });
        describe.each(['finalized', undefined])(
            'when the params already specify a commitment of `%s`',
            existingCommitment => {
                describe.each(METHODS_SUBJECT_TO_COMMITMENT_DEFAULTING)('on calls to `%s`', methodName => {
                    const optionsObjectPosition = OPTIONS_OBJECT_POSITION_BY_METHOD[methodName];
                    it('removes the commitment property on calls to `%s` when there are other properties in the config object', () => {
                        expect.assertions(1);
                        const params = [
                            ...new Array(optionsObjectPosition),
                            { commitment: existingCommitment, other: 'property' },
                        ];
                        const requestTransformer = getDefaultRequestTransformerForSolanaRpc();
                        expect(requestTransformer({ methodName, params }).params).toStrictEqual([
                            ...new Array(optionsObjectPosition).map(() => expect.anything()),
                            { other: 'property' },
                        ]);
                    });
                    it('deletes the commitment on calls to `%s` when there are no other properties left and the config object is not the last param', () => {
                        expect.assertions(1);
                        const params = [
                            ...new Array(optionsObjectPosition),
                            { commitment: existingCommitment },
                            'someParam',
                        ];
                        const requestTransformer = getDefaultRequestTransformerForSolanaRpc();
                        expect(requestTransformer({ methodName, params }).params).toStrictEqual([
                            ...new Array(optionsObjectPosition).map(() => expect.anything()),
                            undefined,
                            'someParam',
                        ]);
                    });
                    it('truncates the params on calls to `%s` when there are no other properties left and the config object is the last param', () => {
                        expect.assertions(1);
                        const params = [...new Array(optionsObjectPosition), { commitment: existingCommitment }];
                        const requestTransformer = getDefaultRequestTransformerForSolanaRpc();
                        expect(requestTransformer({ methodName, params }).params).toStrictEqual([
                            ...new Array(optionsObjectPosition).map(() => expect.anything()),
                        ]);
                    });
                });
                it('removes the preflight commitment property on calls to `%s` when there are other properties in the config object', () => {
                    expect.assertions(1);
                    const optionsObjectPosition = OPTIONS_OBJECT_POSITION_BY_METHOD['sendTransaction'];
                    const params = [
                        ...new Array(optionsObjectPosition),
                        { other: 'property', preflightCommitment: existingCommitment },
                    ];
                    const requestTransformer = getDefaultRequestTransformerForSolanaRpc();
                    expect(requestTransformer({ methodName: 'sendTransaction', params }).params).toStrictEqual([
                        ...new Array(optionsObjectPosition).map(() => expect.anything()),
                        { other: 'property' },
                    ]);
                });
                it('deletes the preflight commitment on calls to `%s` when there are no other properties left and the config object is not the last param', () => {
                    expect.assertions(1);
                    const optionsObjectPosition = OPTIONS_OBJECT_POSITION_BY_METHOD['sendTransaction'];
                    const params = [
                        ...new Array(optionsObjectPosition),
                        { preflightCommitment: existingCommitment },
                        'someParam',
                    ];
                    const requestTransformer = getDefaultRequestTransformerForSolanaRpc();
                    expect(requestTransformer({ methodName: 'sendTransaction', params }).params).toStrictEqual([
                        ...new Array(optionsObjectPosition).map(() => expect.anything()),
                        undefined,
                        'someParam',
                    ]);
                });
                it('truncates the params on calls to `%s` when there are no other properties left and the config object is the last param', () => {
                    expect.assertions(1);
                    const optionsObjectPosition = OPTIONS_OBJECT_POSITION_BY_METHOD['sendTransaction'];
                    const params = [...new Array(optionsObjectPosition), { preflightCommitment: existingCommitment }];
                    const requestTransformer = getDefaultRequestTransformerForSolanaRpc();
                    expect(requestTransformer({ methodName: 'sendTransaction', params }).params).toStrictEqual([
                        ...new Array(optionsObjectPosition).map(() => expect.anything()),
                    ]);
                });
            },
        );
    });
    describe('given an integer overflow handler', () => {
        let onIntegerOverflow: jest.Mock;
        let requestTransformer: RpcRequestTransformer;
        let createRequest = (params: unknown) => ({ methodName: 'getFoo', params });
        beforeEach(() => {
            onIntegerOverflow = jest.fn();
            requestTransformer = getDefaultRequestTransformerForSolanaRpc({ onIntegerOverflow });
            createRequest = params => ({ methodName: 'getFoo', params });
        });
        Object.entries({
            'value above `Number.MAX_SAFE_INTEGER`': BigInt(Number.MAX_SAFE_INTEGER) + 1n,
            'value below `Number.MAX_SAFE_INTEGER`': -BigInt(Number.MAX_SAFE_INTEGER) - 1n,
        }).forEach(([description, value]) => {
            it('calls `onIntegerOverflow` when passed a value ' + description, () => {
                const request = createRequest(value);
                requestTransformer(request);
                expect(onIntegerOverflow).toHaveBeenCalledWith(
                    request,
                    [], // Equivalent to `params`
                    value,
                );
            });
            it('calls `onIntegerOverflow` when passed a nested array having a value ' + description, () => {
                const request = createRequest([1, 2, [3, value]]);
                requestTransformer(request);
                expect(onIntegerOverflow).toHaveBeenCalledWith(
                    request,
                    [2, 1], // Equivalent to `params[2][1]`.
                    value,
                );
            });
            it('calls `onIntegerOverflow` when passed a nested object having a value ' + description, () => {
                const request = createRequest({ a: 1, b: { b1: 2, b2: value } });
                requestTransformer(request);
                expect(onIntegerOverflow).toHaveBeenCalledWith(
                    request,
                    ['b', 'b2'], // Equivalent to `params.b.b2`.
                    value,
                );
            });
            it('does not call `onIntegerOverflow` when passed `Number.MAX_SAFE_INTEGER`', () => {
                const request = createRequest(BigInt(Number.MAX_SAFE_INTEGER));
                requestTransformer(request);
                expect(onIntegerOverflow).not.toHaveBeenCalled();
            });
        });
    });
});
