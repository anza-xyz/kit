import { isAbortError } from '../abortable';

describe('isAbortError()', () => {
    it('returns `true` for a `DOMException` whose `name` is `AbortError`', () => {
        expect(isAbortError(new DOMException('The operation was aborted.', 'AbortError'))).toBe(true);
    });
    it('returns `true` for the default `reason` of an `AbortController` aborted without an argument', () => {
        const controller = new AbortController();
        controller.abort();
        expect(isAbortError(controller.signal.reason)).toBe(true);
    });
});
