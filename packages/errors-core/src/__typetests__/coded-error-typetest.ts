import { CodedError, createCodedErrorClass } from '../coded-error';

const CODE_WITH_CONTEXT = 1001 as const;
const CODE_WITHOUT_CONTEXT = 1002 as const;

type TestCode = typeof CODE_WITH_CONTEXT | typeof CODE_WITHOUT_CONTEXT;
type TestContext = {
    [CODE_WITHOUT_CONTEXT]: undefined;
    [CODE_WITH_CONTEXT]: { count: number; name: string };
};

const {
    ErrorClass: TestError,
    isError: isTestError,
    getHumanReadableMessage,
} = createCodedErrorClass<TestCode, TestContext>({
    messages: {
        [CODE_WITHOUT_CONTEXT]: 'no context',
        [CODE_WITH_CONTEXT]: 'hello $name ($count)',
    },
    name: 'TestError',
});

// Constructor arity: codes without context accept zero or one (ErrorOptions) arg.
new TestError(CODE_WITHOUT_CONTEXT);
new TestError(CODE_WITHOUT_CONTEXT, { cause: new Error('x') });

// Constructor arity: codes WITH context require the context arg.
new TestError(CODE_WITH_CONTEXT, { count: 1, name: 'a' });
// @ts-expect-error Missing required context.
new TestError(CODE_WITH_CONTEXT);
// @ts-expect-error Wrong context shape.
new TestError(CODE_WITH_CONTEXT, { wrong: true });
// @ts-expect-error Missing required `name`.
new TestError(CODE_WITH_CONTEXT, { count: 1 });

// `context.__code` narrows to the specific code on an instance.
{
    const err = new TestError(CODE_WITH_CONTEXT, { count: 1, name: 'a' });
    err.context.__code satisfies typeof CODE_WITH_CONTEXT;
    // @ts-expect-error Wrong code.
    err.context.__code satisfies typeof CODE_WITHOUT_CONTEXT;
    err.context.name satisfies string;
    err.context.count satisfies number;
    // @ts-expect-error Context is frozen at runtime, so exposed properties are readonly.
    err.context.name = 'b';
    // @ts-expect-error The error code tag is readonly.
    err.context.__code = CODE_WITHOUT_CONTEXT;
    // @ts-expect-error No such property on this code's context.
    void err.context.nope;
}

// `isTestError` code-less overload narrows to the union form.
{
    const e: unknown = null;
    if (isTestError(e)) {
        e.context.__code satisfies TestCode;
    }
}

// `isTestError` code-specific overload narrows context to that code's shape.
{
    const e: unknown = null;
    if (isTestError(e, CODE_WITH_CONTEXT)) {
        e.context.name satisfies string;
        e.context.count satisfies number;
        // @ts-expect-error Context is frozen at runtime, so narrowed properties are readonly.
        e.context.name = 'b';
        // @ts-expect-error Not a property of CODE_WITH_CONTEXT's context.
        void e.context.other;
    }
    if (isTestError(e, CODE_WITHOUT_CONTEXT)) {
        e.context.__code satisfies typeof CODE_WITHOUT_CONTEXT;
    }
}

// `getHumanReadableMessage` arity: mirrors constructor requirements.
getHumanReadableMessage(CODE_WITHOUT_CONTEXT);
getHumanReadableMessage(CODE_WITH_CONTEXT, { count: 1, name: 'a' });
// @ts-expect-error Missing required context.
getHumanReadableMessage(CODE_WITH_CONTEXT);
// @ts-expect-error Wrong context shape.
getHumanReadableMessage(CODE_WITH_CONTEXT, { wrong: true });

// The exported `CodedError` type can be used to write Kit-style class-generic aliases.
type TestErrorAlias<C extends TestCode = TestCode> = CodedError<TestCode, TestContext, C>;
{
    const e = new TestError(CODE_WITH_CONTEXT, { count: 1, name: 'a' });
    e satisfies TestErrorAlias<typeof CODE_WITH_CONTEXT>;
    e satisfies TestErrorAlias;
}
