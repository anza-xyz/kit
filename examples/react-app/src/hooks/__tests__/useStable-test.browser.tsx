import { renderHook } from '../../__test-utils__/render';
import { useStable } from '../useStable';

describe('useStable', () => {
    it('caches the first computed value and ignores later getter results', () => {
        let count = 0;
        const { result, rerender } = renderHook(() => useStable(() => ++count));
        const first = result.current;
        rerender();
        rerender();
        expect(result.current).toBe(first);
    });

    it('returns the same reference across renders for an object result', () => {
        const { result, rerender } = renderHook(() => useStable(() => ({ token: Symbol() })));
        const first = result.current;
        rerender();
        expect(result.current).toBe(first);
    });

    it('treats `undefined` as a valid cached value (not "unresolved")', () => {
        const getValue = jest.fn().mockReturnValue(undefined);
        const { result, rerender } = renderHook(() => useStable(getValue));
        expect(result.current).toBeUndefined();
        const callsAfterFirstMount = getValue.mock.calls.length;
        rerender();
        rerender();
        // The getter must not run again on subsequent renders.
        expect(getValue.mock.calls).toHaveLength(callsAfterFirstMount);
    });
});
