import { getTimeoutPromise } from '../confirmation-strategy-timeout';

describe('getTimeoutPromise', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });
    it.each`
        commitment     | defaultTimeoutMs
        ${'processed'} | ${30_000}
        ${'confirmed'} | ${60_000}
        ${'finalized'} | ${60_000}
    `('pends for $defaultTimeoutMs when the commitment is `$commitment`', async ({ commitment, defaultTimeoutMs }) => {
        expect.assertions(2);
        const timeoutPromise = getTimeoutPromise({
            abortSignal: new AbortController().signal,
            commitment,
        });
        await jest.advanceTimersByTimeAsync(defaultTimeoutMs - 1);
        await expect(Promise.race([timeoutPromise, Promise.resolve('pending')])).resolves.toBe('pending');
        await jest.advanceTimersByTimeAsync(1);
        await expect(Promise.race([timeoutPromise, Promise.resolve('pending')])).rejects.toThrow();
    });
    it('throws an abort error when aborted before the timeout', async () => {
        expect.assertions(1);
        const abortController = new AbortController();
        const timeoutPromise = getTimeoutPromise({
            abortSignal: abortController.signal,
            commitment: 'finalized',
        });
        abortController.abort();
        await expect(timeoutPromise).rejects.toThrow(/operation was aborted/);
    });
    it('registers the caller abort listener with an auto-cleanup signal', () => {
        const abortController = new AbortController();
        const addEventListenerSpy = jest.spyOn(abortController.signal, 'addEventListener');
        const timeoutPromise = getTimeoutPromise({
            abortSignal: abortController.signal,
            commitment: 'finalized',
        });
        // Suppress the eventual rejection so the test does not produce an
        // unhandled rejection warning at teardown.
        timeoutPromise.catch(() => {});
        // The listener must be registered with the modern `signal` option so that
        // it is released automatically when the inner controller aborts in `finally`.
        expect(addEventListenerSpy).toHaveBeenCalledWith(
            'abort',
            expect.any(Function),
            expect.objectContaining({ signal: expect.objectContaining({ aborted: false }) }),
        );
    });
    it('aborts the cleanup signal once the timeout elapses', async () => {
        expect.assertions(1);
        const abortController = new AbortController();
        const addEventListenerSpy = jest.spyOn(abortController.signal, 'addEventListener');
        const settled = getTimeoutPromise({
            abortSignal: abortController.signal,
            commitment: 'finalized',
        }).catch((e: unknown) => e);
        await jest.advanceTimersByTimeAsync(60_000);
        await settled;
        const cleanupSignal = (addEventListenerSpy.mock.calls[0][2] as { signal: AbortSignal }).signal;
        expect(cleanupSignal.aborted).toBe(true);
    });
    it('aborts the cleanup signal when the caller aborts', async () => {
        expect.assertions(1);
        const abortController = new AbortController();
        const addEventListenerSpy = jest.spyOn(abortController.signal, 'addEventListener');
        const settled = getTimeoutPromise({
            abortSignal: abortController.signal,
            commitment: 'finalized',
        }).catch((e: unknown) => e);
        abortController.abort();
        await settled;
        const cleanupSignal = (addEventListenerSpy.mock.calls[0][2] as { signal: AbortSignal }).signal;
        expect(cleanupSignal.aborted).toBe(true);
    });
});
