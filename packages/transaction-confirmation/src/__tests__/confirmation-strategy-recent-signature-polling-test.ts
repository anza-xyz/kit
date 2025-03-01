/* eslint-disable sort-keys-fix/sort-keys-fix */
import { AbortController } from '@solana/event-target-impl';
import { Signature } from '@solana/keys';
import { Commitment } from '@solana/rpc-types';

import { createRecentSignatureConfirmationByPollingPromiseFactory } from '../confirmation-strategy-recent-signature-polling';

// Utility function to convert string to Signature type
function toSignature(str: string): Signature {
    return str as unknown as Signature;
}

describe('createRecentSignatureConfirmationByPollingPromiseFactory', () => {
    let getSignatureStatusesMock: jest.Mock;
    let getSignatureStatusesRequestSender: jest.Mock;
    let getRecentSignatureConfirmationByPollingPromise: ReturnType<
        typeof createRecentSignatureConfirmationByPollingPromiseFactory
    >;
    let rpc: { getSignatureStatuses: jest.Mock };

    beforeEach(() => {
        jest.useFakeTimers();
        getSignatureStatusesRequestSender = jest.fn();
        getSignatureStatusesMock = jest.fn().mockReturnValue({
            send: getSignatureStatusesRequestSender,
        });
        rpc = {
            getSignatureStatuses: getSignatureStatusesMock,
        };
        getRecentSignatureConfirmationByPollingPromise = createRecentSignatureConfirmationByPollingPromiseFactory({
            rpc,
        });
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('polls for signature status with default interval', async () => {
        expect.assertions(2);
        const signature = toSignature('test-signature');
        const commitment = 'confirmed' as Commitment;

        getSignatureStatusesRequestSender
            .mockResolvedValueOnce({
                value: [{ confirmationStatus: 'processed' }],
            })
            .mockResolvedValueOnce({
                value: [{ confirmationStatus: 'confirmed' }],
            });

        const confirmationPromise = getRecentSignatureConfirmationByPollingPromise({
            abortSignal: new AbortController().signal,
            commitment,
            signature,
        });

        await jest.advanceTimersByTimeAsync(1000);
        await confirmationPromise;

        expect(getSignatureStatusesMock).toHaveBeenCalledWith([signature]);
        expect(getSignatureStatusesMock).toHaveBeenCalledTimes(2);
    });

    it('uses custom polling interval when provided', async () => {
        expect.assertions(2);
        const signature = toSignature('test-signature');
        const commitment = 'confirmed' as Commitment;

        getSignatureStatusesRequestSender
            .mockResolvedValueOnce({
                value: [{ confirmationStatus: 'processed' }],
            })
            .mockResolvedValueOnce({
                value: [{ confirmationStatus: 'confirmed' }],
            });

        const confirmationPromise = getRecentSignatureConfirmationByPollingPromise({
            abortSignal: new AbortController().signal,
            commitment,
            signature,
            pollingInterval: 2000,
        });

        await jest.advanceTimersByTimeAsync(2000);
        await confirmationPromise;

        expect(getSignatureStatusesMock).toHaveBeenCalledWith([signature]);
        expect(getSignatureStatusesMock).toHaveBeenCalledTimes(2);
    });

    it('continues polling until desired commitment level is reached', async () => {
        expect.assertions(2);
        const signature = toSignature('test-signature');
        const commitment = 'finalized' as Commitment;

        getSignatureStatusesRequestSender
            .mockResolvedValueOnce({
                value: [{ confirmationStatus: 'processed' }],
            })
            .mockResolvedValueOnce({
                value: [{ confirmationStatus: 'confirmed' }],
            })
            .mockResolvedValueOnce({
                value: [{ confirmationStatus: 'finalized' }],
            });

        const confirmationPromise = getRecentSignatureConfirmationByPollingPromise({
            abortSignal: new AbortController().signal,
            commitment,
            signature,
        });

        await jest.advanceTimersByTimeAsync(2000);
        await confirmationPromise;

        expect(getSignatureStatusesMock).toHaveBeenCalledWith([signature]);
        expect(getSignatureStatusesMock).toHaveBeenCalledTimes(3);
    });

    it('throws error when signature status contains an error', async () => {
        expect.assertions(1);
        const signature = toSignature('test-signature');
        const mockError = { InstructionError: [0, 'GenericError'] };

        getSignatureStatusesRequestSender.mockResolvedValueOnce({
            value: [{ err: mockError }],
        });

        const confirmationPromise = getRecentSignatureConfirmationByPollingPromise({
            abortSignal: new AbortController().signal,
            commitment: 'confirmed',
            signature,
        });

        await expect(confirmationPromise).rejects.toThrow();
    });

    it('stops polling when aborted', async () => {
        expect.assertions(2);
        const signature = toSignature('test-signature');
        const abortController = new AbortController();

        getSignatureStatusesRequestSender
            .mockResolvedValueOnce({
                value: [{ confirmationStatus: 'processed' }],
            })
            .mockImplementation(() => {
                throw new Error('operation was aborted');
            });

        const confirmationPromise = getRecentSignatureConfirmationByPollingPromise({
            abortSignal: abortController.signal,
            commitment: 'confirmed',
            signature,
        });

        // eslint-disable-next-line jest/valid-expect
        const promiseRejection = expect(confirmationPromise).rejects.toThrow(/operation was aborted/);

        await jest.advanceTimersByTimeAsync(1000);
        expect(getSignatureStatusesMock).toHaveBeenCalledTimes(2);

        abortController.abort();

        await promiseRejection;
    });

    it('handles null signature status result', async () => {
        expect.assertions(1);
        const signature = toSignature('test-signature');

        getSignatureStatusesRequestSender
            .mockResolvedValueOnce({
                value: [null],
            })
            .mockResolvedValueOnce({
                value: [{ confirmationStatus: 'confirmed' }],
            });

        const confirmationPromise = getRecentSignatureConfirmationByPollingPromise({
            abortSignal: new AbortController().signal,
            commitment: 'confirmed',
            signature,
        });

        await jest.advanceTimersByTimeAsync(1000);
        await confirmationPromise;

        expect(getSignatureStatusesMock).toHaveBeenCalledTimes(2);
    });

    it('cleans up abort listener when finished', async () => {
        expect.assertions(1);
        const signature = toSignature('test-signature');
        const abortController = new AbortController();
        const removeEventListenerSpy = jest.spyOn(abortController.signal, 'removeEventListener');

        getSignatureStatusesRequestSender.mockResolvedValueOnce({
            value: [{ confirmationStatus: 'confirmed' }],
        });

        await getRecentSignatureConfirmationByPollingPromise({
            abortSignal: abortController.signal,
            commitment: 'confirmed',
            signature,
        });

        expect(removeEventListenerSpy).toHaveBeenCalled();
    });
});
