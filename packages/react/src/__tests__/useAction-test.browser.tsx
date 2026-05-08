import { isAbortError } from '@solana/promises';
import { act, renderHook } from '@testing-library/react';

import { useAction } from '../useAction';

describe('useAction', () => {
    it('transitions idle → running → success', async () => {
        const { promise, resolve } = Promise.withResolvers<string>();
        const fn = jest.fn((_s: AbortSignal, _arg: string) => promise);
        const { result } = renderHook(() => useAction(fn));

        expect(result.current.status).toBe('idle');
        expect(result.current.data).toBeUndefined();

        act(() => {
            void result.current.send('hello');
        });
        expect(result.current.status).toBe('running');
        expect(fn).toHaveBeenCalledWith(expect.any(AbortSignal), 'hello');

        await act(async () => resolve('world'));
        expect(result.current.status).toBe('success');
        expect(result.current.data).toBe('world');
    });

    it('transitions idle → running → error', async () => {
        const boom = new Error('boom');
        const { promise, reject } = Promise.withResolvers<string>();
        const { result } = renderHook(() => useAction((_s: AbortSignal) => promise));

        act(() => {
            result.current.send().catch(() => {});
        });
        expect(result.current.status).toBe('running');

        await act(async () => reject(boom));
        expect(result.current.status).toBe('error');
        expect(result.current.error).toBe(boom);
    });

    it('aborts the prior call when send is invoked again while one is in flight', async () => {
        const fn = jest.fn((signal: AbortSignal) => {
            const { promise, reject } = Promise.withResolvers<string>();
            signal.addEventListener('abort', () => reject(signal.reason));
            return promise;
        });
        const { result } = renderHook(() => useAction(fn));

        let firstCall!: Promise<string>;
        act(() => {
            firstCall = result.current.send();
        });
        // Pre-attach a no-op catch so the second call's eventual abort rejection (when the hook
        // unmounts) doesn't surface as an unhandled rejection.
        act(() => {
            result.current.send().catch(() => {});
        });

        expect(fn.mock.calls[0][0].aborted).toBe(true);
        expect(fn.mock.calls[1][0].aborted).toBe(false);

        const firstError = await firstCall.catch((err: unknown) => err);
        expect(isAbortError(firstError)).toBe(true);
    });

    it('await send(...) resolves to the function result on success', async () => {
        const { result } = renderHook(() => useAction(async (_s: AbortSignal, n: number) => n * 2));
        await act(async () => {
            await expect(result.current.send(21)).resolves.toBe(42);
        });
        expect(result.current.data).toBe(42);
    });

    it('reset() returns to idle and clears data', async () => {
        const { result } = renderHook(() => useAction(async () => 'hi'));
        await act(async () => {
            await result.current.send();
        });
        expect(result.current.data).toBe('hi');

        act(() => result.current.reset());
        expect(result.current.status).toBe('idle');
        expect(result.current.data).toBeUndefined();
    });

    it('keeps prior data through a subsequent running state (stale-while-revalidate)', async () => {
        const { promise: secondPending, resolve: resolveSecond } = Promise.withResolvers<string>();
        let n = 0;
        const fn = () => (++n === 1 ? Promise.resolve('first') : secondPending);
        const { result } = renderHook(() => useAction(fn));

        await act(async () => {
            await result.current.send();
        });
        expect(result.current.data).toBe('first');

        act(() => {
            void result.current.send();
        });
        expect(result.current.status).toBe('running');
        expect(result.current.data).toBe('first'); // stale data preserved during revalidation

        await act(async () => resolveSecond('second'));
        expect(result.current.data).toBe('second');
    });

    it('uses the latest fn closure on each new call', async () => {
        let captured: number | null = null;
        const { result, rerender } = renderHook(({ value }: { value: number }) => useAction(async () => (captured = value)), { initialProps: { value: 1 } });

        await act(async () => {
            await result.current.send();
        });
        expect(captured).toBe(1);

        rerender({ value: 2 });
        await act(async () => {
            await result.current.send();
        });
        expect(captured).toBe(2);
    });

    it('keeps stable send / reset references across re-renders even as fn changes', () => {
        const { result, rerender } = renderHook(({ tag }: { tag: string }) => useAction(async () => tag), {
            initialProps: { tag: 'a' },
        });
        const { send, reset } = result.current;

        rerender({ tag: 'b' });
        expect(result.current.send).toBe(send);
        expect(result.current.reset).toBe(reset);
    });
});
