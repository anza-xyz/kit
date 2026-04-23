import '@solana/test-matchers/toBeFrozenObject';

import { createCodedErrorClass } from '../coded-error';

const CODE_WITH_CONTEXT = 1001;
const CODE_WITHOUT_CONTEXT = 1002;
const CODE_WITH_ESCAPED_DOLLAR = 1003;

type TestCode = typeof CODE_WITH_CONTEXT | typeof CODE_WITH_ESCAPED_DOLLAR | typeof CODE_WITHOUT_CONTEXT;
type TestContext = {
    [CODE_WITHOUT_CONTEXT]: undefined;
    [CODE_WITH_CONTEXT]: { count: number; name: string };
    [CODE_WITH_ESCAPED_DOLLAR]: { amount: number };
};

function makeBundle() {
    return createCodedErrorClass<TestCode, TestContext>({
        messages: {
            [CODE_WITHOUT_CONTEXT]: 'Something went wrong',
            [CODE_WITH_CONTEXT]: 'Hello $name, you have $count items',
            [CODE_WITH_ESCAPED_DOLLAR]: 'Price: \\$$amount',
        },
        name: 'TestError',
    });
}

describe('createCodedErrorClass', () => {
    let originalDev: boolean | undefined;
    beforeEach(() => {
        originalDev = (globalThis as { __DEV__?: boolean }).__DEV__;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (globalThis as any).__DEV__ = true;
    });
    afterEach(() => {
        (globalThis as { __DEV__?: boolean }).__DEV__ = originalDev;
    });

    describe('errorClass', () => {
        it('constructs an Error subclass with the configured name', () => {
            const { ErrorClass } = makeBundle();
            const err = new ErrorClass(CODE_WITHOUT_CONTEXT);
            expect(err).toBeInstanceOf(Error);
            expect(err.name).toBe('TestError');
        });
        it('freezes the context object and sets __code', () => {
            const { ErrorClass } = makeBundle();
            const err = new ErrorClass(CODE_WITH_CONTEXT, { count: 3, name: 'world' });
            expect(err.context).toHaveProperty('__code', CODE_WITH_CONTEXT);
            expect(err.context).toHaveProperty('name', 'world');
            expect(err.context).toHaveProperty('count', 3);
            expect(err.context).toBeFrozenObject();
        });
        it('exposes a default empty-ish context for codes without context', () => {
            const { ErrorClass } = makeBundle();
            const err = new ErrorClass(CODE_WITHOUT_CONTEXT);
            expect(err.context).toEqual({ __code: CODE_WITHOUT_CONTEXT });
        });
        it('extracts `cause` from context into ErrorOptions', () => {
            const { ErrorClass } = makeBundle();
            const rootCause = new Error('boom');
            const err = new ErrorClass(CODE_WITH_CONTEXT, {
                cause: rootCause,
                count: 1,
                name: 'x',
            } as unknown as TestContext[typeof CODE_WITH_CONTEXT]);
            expect(err.cause).toBe(rootCause);
            expect(err.context).not.toHaveProperty('cause');
        });
        it('interpolates $variable tokens in the message', () => {
            const { ErrorClass } = makeBundle();
            const err = new ErrorClass(CODE_WITH_CONTEXT, { count: 5, name: 'alice' });
            expect(err.message).toBe('Hello alice, you have 5 items');
        });
        it('leaves unmatched variables literal', () => {
            const { ErrorClass } = makeBundle();
            const err = new ErrorClass(CODE_WITH_CONTEXT, {
                name: 'alice',
            } as unknown as TestContext[typeof CODE_WITH_CONTEXT]);
            expect(err.message).toBe('Hello alice, you have $count items');
        });
        it('honors backslash escapes for literal $ in templates', () => {
            const { ErrorClass } = makeBundle();
            const err = new ErrorClass(CODE_WITH_ESCAPED_DOLLAR, { amount: 42 });
            expect(err.message).toBe('Price: $42');
        });
    });

    describe('isError guard', () => {
        it('returns true for any error produced by this bundle', () => {
            const { ErrorClass, isError } = makeBundle();
            expect(isError(new ErrorClass(CODE_WITHOUT_CONTEXT))).toBe(true);
        });
        it('returns false for unrelated Error instances', () => {
            const { isError } = makeBundle();
            expect(isError(new Error('nope'))).toBe(false);
            expect(isError({ name: 'TestError' })).toBe(false);
            expect(isError(null)).toBe(false);
        });
        it('narrows by code when one is supplied', () => {
            const { ErrorClass, isError } = makeBundle();
            const err: unknown = new ErrorClass(CODE_WITH_CONTEXT, { count: 1, name: 'x' });
            expect(isError(err, CODE_WITH_CONTEXT)).toBe(true);
            expect(isError(err, CODE_WITHOUT_CONTEXT)).toBe(false);
        });
        it('rejects a foreign Error whose name was manually reassigned to match', () => {
            const { isError } = makeBundle();
            const foreign = new Error('not one of ours');
            foreign.name = 'TestError';
            expect(isError(foreign)).toBe(false);
            expect(isError(foreign, CODE_WITH_CONTEXT)).toBe(false);
        });
        it('rejects an error whose context is missing __code even if the name matches', () => {
            const { isError } = makeBundle();
            const foreign = new Error('bogus');
            foreign.name = 'TestError';
            (foreign as unknown as { context: object }).context = { foo: 'bar' };
            expect(isError(foreign)).toBe(false);
            expect(isError(foreign, CODE_WITH_CONTEXT)).toBe(false);
        });
        it('does not throw when narrowing on a same-name error without context', () => {
            const { isError } = makeBundle();
            const foreign = new Error('bogus');
            foreign.name = 'TestError';
            expect(() => isError(foreign, CODE_WITH_CONTEXT)).not.toThrow();
        });
        it('does not cross-match between two bundles with different names', () => {
            const a = makeBundle();
            const b = createCodedErrorClass<TestCode, TestContext>({
                messages: {
                    [CODE_WITHOUT_CONTEXT]: 'other',
                    [CODE_WITH_CONTEXT]: 'other',
                    [CODE_WITH_ESCAPED_DOLLAR]: 'other',
                },
                name: 'OtherError',
            });
            const err = new a.ErrorClass(CODE_WITHOUT_CONTEXT);
            expect(a.isError(err)).toBe(true);
            expect(b.isError(err)).toBe(false);
        });
    });

    describe('getHumanReadableMessage', () => {
        it('renders a message without constructing an error', () => {
            const { getHumanReadableMessage } = makeBundle();
            expect(getHumanReadableMessage(CODE_WITH_CONTEXT, { count: 2, name: 'bob' })).toBe(
                'Hello bob, you have 2 items',
            );
        });
    });

    describe('messagePostProcessor', () => {
        it('is invoked with the code, context, and interpolated message in dev mode', () => {
            const postProcessor = jest.fn((_code, _ctx, message) => `${message}!!`);
            const { ErrorClass } = createCodedErrorClass<TestCode, TestContext>({
                messagePostProcessor: postProcessor,
                messages: {
                    [CODE_WITHOUT_CONTEXT]: 'Something went wrong',
                    [CODE_WITH_CONTEXT]: 'Hello $name',
                    [CODE_WITH_ESCAPED_DOLLAR]: 'ignored',
                },
                name: 'TestError',
            });
            const err = new ErrorClass(CODE_WITH_CONTEXT, { count: 1, name: 'alice' });
            expect(postProcessor).toHaveBeenCalledWith(
                CODE_WITH_CONTEXT,
                expect.objectContaining({ name: 'alice' }),
                'Hello alice',
            );
            expect(err.message).toBe('Hello alice!!');
        });
        it('is applied to the output of `getHumanReadableMessage`', () => {
            const { getHumanReadableMessage } = createCodedErrorClass<TestCode, TestContext>({
                messagePostProcessor: (_code, _ctx, message) => `${message} (suffix)`,
                messages: {
                    [CODE_WITHOUT_CONTEXT]: 'Something went wrong',
                    [CODE_WITH_CONTEXT]: 'Hello $name',
                    [CODE_WITH_ESCAPED_DOLLAR]: 'ignored',
                },
                name: 'TestError',
            });
            expect(getHumanReadableMessage(CODE_WITH_CONTEXT, { count: 1, name: 'bob' })).toBe('Hello bob (suffix)');
        });
        it('is not invoked in production mode', () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (globalThis as any).__DEV__ = false;
            const postProcessor = jest.fn((_code, _ctx, message) => `${message}!!`);
            const { ErrorClass } = createCodedErrorClass<TestCode, TestContext>({
                messagePostProcessor: postProcessor,
                messages: {
                    [CODE_WITHOUT_CONTEXT]: 'ignored',
                    [CODE_WITH_CONTEXT]: 'ignored',
                    [CODE_WITH_ESCAPED_DOLLAR]: 'ignored',
                },
                name: 'TestError',
            });
            const err = new ErrorClass(CODE_WITHOUT_CONTEXT);
            expect(postProcessor).not.toHaveBeenCalled();
            expect(err.message).toBe(`TestError #${CODE_WITHOUT_CONTEXT}`);
        });
    });

    describe('production mode messaging', () => {
        beforeEach(() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (globalThis as any).__DEV__ = false;
        });
        // Top-level afterEach restores __DEV__ to its pre-test value.

        it('emits a bare name + code string when no decode command is configured', () => {
            const { ErrorClass } = makeBundle();
            const err = new ErrorClass(CODE_WITHOUT_CONTEXT);
            expect(err.message).toBe(`TestError #${CODE_WITHOUT_CONTEXT}`);
        });
        it('emits a decode hint when a decode command is configured', () => {
            const { ErrorClass } = createCodedErrorClass<TestCode, TestContext>({
                messages: {
                    [CODE_WITHOUT_CONTEXT]: 'ignored',
                    [CODE_WITH_CONTEXT]: 'ignored',
                    [CODE_WITH_ESCAPED_DOLLAR]: 'ignored',
                },
                name: 'TestError',
                prodDecodeCommand: 'npx @test/errors decode --',
            });
            const err = new ErrorClass(CODE_WITHOUT_CONTEXT);
            expect(err.message).toBe(
                `TestError #${CODE_WITHOUT_CONTEXT}; Decode this error by running \`npx @test/errors decode -- ${CODE_WITHOUT_CONTEXT}\``,
            );
        });
        it('uses `prodMessagePrefix` in place of `name` when provided', () => {
            const { ErrorClass } = createCodedErrorClass<TestCode, TestContext>({
                messages: {
                    [CODE_WITHOUT_CONTEXT]: 'ignored',
                    [CODE_WITH_CONTEXT]: 'ignored',
                    [CODE_WITH_ESCAPED_DOLLAR]: 'ignored',
                },
                name: 'TestError',
                prodDecodeCommand: 'npx @test/errors decode --',
                prodMessagePrefix: 'Test error',
            });
            const err = new ErrorClass(CODE_WITHOUT_CONTEXT);
            expect(err.name).toBe('TestError');
            expect(err.message).toBe(
                `Test error #${CODE_WITHOUT_CONTEXT}; Decode this error by running \`npx @test/errors decode -- ${CODE_WITHOUT_CONTEXT}\``,
            );
        });
        it('appends an encoded context when present', () => {
            const { ErrorClass } = createCodedErrorClass<TestCode, TestContext>({
                messages: {
                    [CODE_WITHOUT_CONTEXT]: 'ignored',
                    [CODE_WITH_CONTEXT]: 'ignored',
                    [CODE_WITH_ESCAPED_DOLLAR]: 'ignored',
                },
                name: 'TestError',
                prodDecodeCommand: 'npx @test/errors decode --',
            });
            const err = new ErrorClass(CODE_WITH_CONTEXT, { count: 1, name: 'x' });
            expect(err.message).toMatch(
                new RegExp(
                    `^TestError #${CODE_WITH_CONTEXT}; Decode this error by running \`npx @test/errors decode -- ${CODE_WITH_CONTEXT} '[^']+'\`$`,
                ),
            );
        });
    });
});
