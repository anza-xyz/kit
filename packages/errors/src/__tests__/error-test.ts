import '@solana/test-matchers/toBeFrozenObject';

import { SOLANA_ERROR__INSTRUCTION_ERROR__UNKNOWN } from '../codes';
import { isSolanaError, SolanaError } from '../error';
import * as MessagesModule from '../messages';

jest.mock('../messages', () => ({
    get SolanaErrorMessages() {
        return {};
    },
    __esModule: true,
}));

function mockMessage(code: number, message: string) {
    jest.spyOn(MessagesModule, 'SolanaErrorMessages', 'get').mockReturnValue({
        [code]: message,
    } as unknown as typeof MessagesModule.SolanaErrorMessages);
}

describe('SolanaError', () => {
    let originalDev: boolean | undefined;
    beforeEach(() => {
        originalDev = (globalThis as { __DEV__?: boolean }).__DEV__;
        (globalThis as { __DEV__?: boolean }).__DEV__ = true;
        mockMessage(123, 'mock message');
    });
    afterEach(() => {
        (globalThis as { __DEV__?: boolean }).__DEV__ = originalDev;
    });
    it('exposes the public constructor name on the class and instances', () => {
        const err = new SolanaError(
            // @ts-expect-error Mock error codes don't conform to `SolanaErrorCode`
            123,
            undefined,
        );
        expect(SolanaError.name).toBe('SolanaError');
        expect(err.constructor.name).toBe('SolanaError');
    });
    describe('given an error with context', () => {
        let errorWithContext: SolanaError;
        beforeEach(() => {
            errorWithContext = new SolanaError(
                // @ts-expect-error Mock error codes don't conform to `SolanaErrorCode`
                123,
                { foo: 'bar' },
            );
        });
        it('exposes its error code', () => {
            expect(errorWithContext.context).toHaveProperty('__code', 123);
        });
        it('exposes its context', () => {
            expect(errorWithContext.context).toHaveProperty('foo', 'bar');
        });
        it('exposes no cause', () => {
            expect(errorWithContext.cause).toBeUndefined();
        });
        it('freezes the context object', () => {
            expect(errorWithContext.context).toBeFrozenObject();
        });
    });
    describe('given an error with no context', () => {
        let errorWithoutContext: SolanaError;
        beforeEach(() => {
            errorWithoutContext = new SolanaError(
                // @ts-expect-error Mock error codes don't conform to `SolanaErrorCode`
                123,
                undefined,
            );
        });
        it('exposes only the `__code` on context', () => {
            expect(errorWithoutContext.context).toEqual({ __code: 123 });
        });
    });
    describe('given an error with a cause', () => {
        let errorWithCause: SolanaError;
        let cause: unknown;
        beforeEach(() => {
            cause = {};
            errorWithCause = new SolanaError(
                // @ts-expect-error Mock error codes don't conform to `SolanaErrorCode`
                123,
                { cause },
            );
        });
        it('exposes its cause', () => {
            expect(errorWithCause.cause).toBe(cause);
        });
    });
    describe.each(['cause'])('given an error with only the `%s` property from `ErrorOptions` present', propName => {
        let errorOptionValue: unknown;
        let errorWithOption: SolanaError;
        beforeEach(() => {
            errorOptionValue = Symbol();
            errorWithOption = new SolanaError(
                // @ts-expect-error Mock error codes don't conform to `SolanaErrorCode`
                123,
                { [propName]: errorOptionValue },
            );
        });
        it('omits the error option from its context', () => {
            expect(errorWithOption.context).not.toHaveProperty(propName);
        });
    });
    it('sets its message to the formatted template for the code', () => {
        mockMessage(456, 'o no');
        const error456 = new SolanaError(
            // @ts-expect-error Mock error codes don't conform to `SolanaErrorCode`
            456,
            undefined,
        );
        expect(error456).toHaveProperty('message', 'o no');
    });
    describe('instruction-index suffix (dev mode)', () => {
        beforeEach(() => {
            mockMessage(SOLANA_ERROR__INSTRUCTION_ERROR__UNKNOWN, 'Some instruction error');
        });
        it('appends `(instruction #N)` for codes in the instruction-error range when context carries `index`', () => {
            const err = new SolanaError(SOLANA_ERROR__INSTRUCTION_ERROR__UNKNOWN, { errorName: 'X', index: 0 });
            expect(err.message).toBe('Some instruction error (instruction #1)');
        });
        it('uses one-based instruction numbering', () => {
            const err = new SolanaError(SOLANA_ERROR__INSTRUCTION_ERROR__UNKNOWN, { errorName: 'X', index: 5 });
            expect(err.message).toBe('Some instruction error (instruction #6)');
        });
        it('does not append the suffix when the context has no `index`', () => {
            const err = new SolanaError(SOLANA_ERROR__INSTRUCTION_ERROR__UNKNOWN, {
                errorName: 'X',
            } as ConstructorParameters<typeof SolanaError<typeof SOLANA_ERROR__INSTRUCTION_ERROR__UNKNOWN>>[1]);
            expect(err.message).toBe('Some instruction error');
        });
        it('does not append the suffix to non-instruction error codes', () => {
            mockMessage(123, 'Some instruction error');
            const err = new SolanaError(
                // @ts-expect-error Mock error codes don't conform to `SolanaErrorCode`
                123,
                { index: 0 },
            );
            expect(err.message).toBe('Some instruction error');
        });
    });
    describe('in production mode', () => {
        let originalNodeEnv: string | undefined;
        beforeEach(() => {
            (globalThis as { __DEV__?: boolean }).__DEV__ = false;
            // The compiled `@solana/errors-core` (loaded from `dist`) replaces `__DEV__` with
            // `process.env.NODE_ENV !== "production"`, so toggling `globalThis.__DEV__` alone is
            // not enough to put it into prod mode.
            originalNodeEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';
        });
        afterEach(() => {
            process.env.NODE_ENV = originalNodeEnv;
        });
        // Outer `afterEach` restores `__DEV__` to its pre-test value.
        it('renders the prod message prefix and decode command without context', () => {
            const err = new SolanaError(
                // @ts-expect-error Mock error codes don't conform to `SolanaErrorCode`
                123,
                undefined,
            );
            expect(err.message).toBe(
                'Solana error #123; Decode this error by running `npx @solana/errors decode -- 123`',
            );
        });
        it('renders the prod message prefix, decode command, and encoded context when context is present', () => {
            const err = new SolanaError(
                // @ts-expect-error Mock error codes don't conform to `SolanaErrorCode`
                123,
                { foo: 'bar' },
            );
            expect(err.message).toMatch(
                /^Solana error #123; Decode this error by running `npx @solana\/errors decode -- 123 '[^']+'`$/,
            );
        });
    });
});

describe('isSolanaError()', () => {
    let error123: SolanaError;
    beforeEach(() => {
        jest.spyOn(MessagesModule, 'SolanaErrorMessages', 'get').mockReturnValue({
            // @ts-expect-error Mock error codes don't conform to `SolanaErrorCode`.
            123: 'mock message',
        });
        // @ts-expect-error Mock error codes don't conform to `SolanaErrorCode`
        error123 = new SolanaError(123);
    });
    it('returns `true` for an instance of `SolanaError`', () => {
        expect(isSolanaError(error123)).toBe(true);
    });
    it('returns `false` for an instance of `Error`', () => {
        expect(isSolanaError(new Error('bad thing'))).toBe(false);
    });
    it('returns `true` when the error code matches', () => {
        expect(
            isSolanaError(
                error123,
                // @ts-expect-error Mock error codes don't conform to `SolanaErrorCode`
                123,
            ),
        ).toBe(true);
    });
    it('returns `false` when the error code does not match', () => {
        expect(
            isSolanaError(
                error123,
                // @ts-expect-error Mock error codes don't conform to `SolanaErrorCode`
                456,
            ),
        ).toBe(false);
    });
});
