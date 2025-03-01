/* eslint-disable sort-keys-fix/sort-keys-fix */
import { SOLANA_ERROR__BLOCK_HEIGHT_EXCEEDED, SolanaError } from '@solana/errors';
import { AbortController } from '@solana/event-target-impl';
import { Commitment } from '@solana/rpc-types';

import { createBlockHeightExceedenceByPollingPromiseFactory } from '../confirmation-strategy-blockheight-polling';

describe('createBlockHeightExceedenceByPollingPromiseFactory', () => {
    let getBlockHeightExceedenceByPollingPromise: ReturnType<typeof createBlockHeightExceedenceByPollingPromiseFactory>;
    let getEpochInfoMock: jest.Mock;
    let getEpochInfoRequestSender: jest.Mock;
    let rpc: { getEpochInfo: jest.Mock };

    beforeEach(() => {
        jest.useFakeTimers();
        getEpochInfoRequestSender = jest.fn();
        getEpochInfoMock = jest.fn().mockReturnValue({
            send: getEpochInfoRequestSender,
        });
        rpc = {
            getEpochInfo: getEpochInfoMock,
        };
        getBlockHeightExceedenceByPollingPromise = createBlockHeightExceedenceByPollingPromiseFactory({
            rpc,
        });
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('throws when the block height has already been exceeded when called', async () => {
        expect.assertions(1);
        getEpochInfoRequestSender.mockResolvedValue({ absoluteSlot: 101n, blockHeight: 101n });
        const exceedencePromise = getBlockHeightExceedenceByPollingPromise({
            abortSignal: new AbortController().signal,
            lastValidBlockHeight: 100n,
        });
        await expect(exceedencePromise).rejects.toThrow(
            new SolanaError(SOLANA_ERROR__BLOCK_HEIGHT_EXCEEDED, {
                currentBlockHeight: 101n,
                lastValidBlockHeight: 100n,
            }),
        );
    });

    it('continues to poll when the block height in the initial fetch is lower than the last valid block height', async () => {
        expect.assertions(2);
        getEpochInfoRequestSender
            .mockResolvedValueOnce({ absoluteSlot: 100n, blockHeight: 99n })
            .mockResolvedValueOnce({ absoluteSlot: 100n, blockHeight: 99n }); // Keep returning lower value

        const exceedencePromise = getBlockHeightExceedenceByPollingPromise({
            abortSignal: new AbortController().signal,
            lastValidBlockHeight: 100n,
        });

        await jest.advanceTimersByTimeAsync(1000);
        await expect(Promise.race([exceedencePromise, Promise.resolve('pending')])).resolves.toBe('pending');
        expect(getEpochInfoMock).toHaveBeenCalledTimes(2);
    });

    it('uses custom polling interval when provided', async () => {
        expect.assertions(2);
        getEpochInfoRequestSender
            .mockResolvedValueOnce({ absoluteSlot: 100n, blockHeight: 99n })
            .mockResolvedValueOnce({ absoluteSlot: 101n, blockHeight: 101n });

        const exceedencePromise = getBlockHeightExceedenceByPollingPromise({
            abortSignal: new AbortController().signal,
            lastValidBlockHeight: 100n,
            pollingInterval: 2000,
        });

        // eslint-disable-next-line jest/valid-expect
        const promiseRejection = expect(exceedencePromise).rejects.toThrow(
            new SolanaError(SOLANA_ERROR__BLOCK_HEIGHT_EXCEEDED, {
                currentBlockHeight: 101n,
                lastValidBlockHeight: 100n,
            }),
        );

        await jest.advanceTimersByTimeAsync(2000);
        expect(getEpochInfoMock).toHaveBeenCalledTimes(2);

        await promiseRejection;
    });

    it('uses default polling interval when none provided', async () => {
        expect.assertions(2);
        getEpochInfoRequestSender
            .mockResolvedValueOnce({ absoluteSlot: 100n, blockHeight: 99n })
            .mockResolvedValueOnce({ absoluteSlot: 101n, blockHeight: 101n });

        const exceedencePromise = getBlockHeightExceedenceByPollingPromise({
            abortSignal: new AbortController().signal,
            lastValidBlockHeight: 100n,
        });

        // eslint-disable-next-line jest/valid-expect
        const promiseRejection = expect(exceedencePromise).rejects.toThrow(
            new SolanaError(SOLANA_ERROR__BLOCK_HEIGHT_EXCEEDED, {
                currentBlockHeight: 101n,
                lastValidBlockHeight: 100n,
            }),
        );

        await jest.advanceTimersByTimeAsync(1000);
        expect(getEpochInfoMock).toHaveBeenCalledTimes(2);

        await promiseRejection;
    });

    it('continues polling while block height is not exceeded', async () => {
        expect.assertions(2);
        getEpochInfoRequestSender
            .mockResolvedValueOnce({ absoluteSlot: 100n, blockHeight: 99n })
            .mockResolvedValueOnce({ absoluteSlot: 101n, blockHeight: 100n });

        const exceedencePromise = getBlockHeightExceedenceByPollingPromise({
            abortSignal: new AbortController().signal,
            lastValidBlockHeight: 100n,
        });

        await jest.advanceTimersByTimeAsync(1000);
        await expect(Promise.race([exceedencePromise, 'pending'])).resolves.toBe('pending');
        expect(getEpochInfoMock).toHaveBeenCalledTimes(2);
    });

    it.each(['processed', 'confirmed', 'finalized'] as Commitment[])(
        'calls the epoch info getter with the configured commitment when configured with `%s` commitment',
        commitment => {
            getEpochInfoRequestSender.mockResolvedValue({ absoluteSlot: 100n, blockHeight: 100n });
            getBlockHeightExceedenceByPollingPromise({
                abortSignal: new AbortController().signal,
                commitment,
                lastValidBlockHeight: 100n,
            }).catch(() => {});
            expect(getEpochInfoMock).toHaveBeenCalledWith({ commitment });
        },
    );

    it('calls the abort signal passed to the epoch info fetcher when aborted', () => {
        const abortController = new AbortController();
        getBlockHeightExceedenceByPollingPromise({
            abortSignal: abortController.signal,
            lastValidBlockHeight: 100n,
        }).catch(() => {});
        expect(getEpochInfoRequestSender).toHaveBeenCalledWith({
            abortSignal: expect.objectContaining({ aborted: false }),
        });
        abortController.abort();
        expect(getEpochInfoRequestSender).toHaveBeenCalledWith({
            abortSignal: expect.objectContaining({ aborted: true }),
        });
    });

    it('throws errors thrown from the epoch info fetcher', async () => {
        expect.assertions(1);
        const abortController = new AbortController();
        getEpochInfoRequestSender.mockRejectedValue(new Error('o no'));
        await expect(
            getBlockHeightExceedenceByPollingPromise({
                abortSignal: abortController.signal,
                lastValidBlockHeight: 100n,
            }),
        ).rejects.toThrow('o no');
    });

    it('throws if started aborted', async () => {
        expect.assertions(1);
        const abortController = new AbortController();
        abortController.abort();
        await expect(
            getBlockHeightExceedenceByPollingPromise({
                abortSignal: abortController.signal,
                lastValidBlockHeight: 100n,
            }),
        ).rejects.toThrow(/operation was aborted/);
    });

    it('throws if aborted while waiting for the epoch info', async () => {
        expect.assertions(1);
        const abortController = new AbortController();
        let resolveEpochInfo!: (value: { absoluteSlot: bigint; blockHeight: bigint }) => void;
        const epochInfoPromise = new Promise(r => {
            resolveEpochInfo = r;
        });
        getEpochInfoRequestSender.mockReturnValue(epochInfoPromise);
        const blockHeightExceedencePromise = getBlockHeightExceedenceByPollingPromise({
            abortSignal: abortController.signal,
            lastValidBlockHeight: 100n,
        });
        await jest.runAllTimersAsync();
        abortController.abort();
        resolveEpochInfo({ absoluteSlot: 101n, blockHeight: 101n });
        await expect(blockHeightExceedencePromise).rejects.toThrow(/operation was aborted/);
    });

    it('stops polling when aborted', async () => {
        expect.assertions(2);
        const abortController = new AbortController();

        getEpochInfoRequestSender
            .mockResolvedValueOnce({ absoluteSlot: 100n, blockHeight: 99n })
            .mockImplementation(() => {
                throw new Error('operation was aborted');
            });

        const exceedencePromise = getBlockHeightExceedenceByPollingPromise({
            abortSignal: abortController.signal,
            lastValidBlockHeight: 100n,
        });

        // eslint-disable-next-line jest/valid-expect
        const promiseRejection = expect(exceedencePromise).rejects.toThrow(/operation was aborted/);

        await jest.advanceTimersByTimeAsync(1000);
        expect(getEpochInfoMock).toHaveBeenCalledTimes(2);

        abortController.abort();

        await promiseRejection;
    });

    it('cleans up abort listener when finished', async () => {
        expect.assertions(1);
        const abortController = new AbortController();
        const removeEventListenerSpy = jest.spyOn(abortController.signal, 'removeEventListener');

        getEpochInfoRequestSender.mockResolvedValue({ absoluteSlot: 101n, blockHeight: 101n });

        await getBlockHeightExceedenceByPollingPromise({
            abortSignal: abortController.signal,
            lastValidBlockHeight: 100n,
        }).catch(() => {});

        expect(removeEventListenerSpy).toHaveBeenCalled();
    });
});
