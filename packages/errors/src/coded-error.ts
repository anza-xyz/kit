import { encodeContextObject } from './context';
import { formatMessageTemplate } from './message-formatter';

/**
 * A map of error code → context object shape. Use `undefined` for codes that carry no context.
 *
 * @example
 * ```ts
 * type KoraErrorContext = {
 *     [KORA_ERROR__ACCOUNT_NOT_FOUND]: { address: string };
 *     [KORA_ERROR__RATE_LIMIT_EXCEEDED]: undefined;
 * };
 * ```
 */
export type CodedErrorContextMap<TCode extends number> = {
    [P in TCode]: object | undefined;
};

/**
 * The shape of an instance produced by a class created with {@link createCodedErrorClass}.
 *
 * @typeParam TCode       Union of all numeric error codes the class can throw.
 * @typeParam TContextMap Mapping from error code to its context shape.
 * @typeParam C           The specific error code this instance carries (narrowed by the guard).
 */
type CodedErrorCodedContext<TCode extends number, TContextMap extends CodedErrorContextMap<TCode>> = {
    [P in TCode]: Readonly<{ __code: P }> &
        (TContextMap[P] extends undefined ? object : Readonly<NonNullable<TContextMap[P]>>);
};

export interface CodedError<
    TCode extends number,
    TContextMap extends CodedErrorContextMap<TCode>,
    C extends TCode = TCode,
> extends Error {
    readonly cause?: unknown;
    readonly context: CodedErrorCodedContext<TCode, TContextMap>[C];
    readonly name: string;
}

/**
 * Definition accepted by {@link createCodedErrorClass}.
 */
export interface CodedErrorDefinition<TCode extends number> {
    /**
     * Optional hook called on the fully-interpolated message before it is used. Use this to
     * append a context-derived suffix (for example, {@link SolanaError} appends
     * `" (instruction #N)"` to messages in the instruction-error range when the context carries
     * an `index` key). Only invoked when `__DEV__ === true`.
     */
    messagePostProcessor?: <C extends TCode>(code: C, context: object, message: string) => string;
    /**
     * Human-readable message templates. Use `$variable` tokens to interpolate values from an
     * error's context; escape a literal `$` with `\\$`. May be supplied as either:
     *
     * - A `Readonly<Record<TCode, string>>` keyed by code (gives exhaustiveness checking
     *   against the {@link TCode} union).
     * - A `(code: TCode) => string` function. Prefer this form to let bundlers tree-shake your
     *   templates out of production builds — write the body as
     *   `(code) => (__DEV__ ? MyMessages[code] : '')` so the reference to `MyMessages` lives
     *   inside a `__DEV__`-gated branch and can be eliminated under a static
     *   `__DEV__ === false` replacement.
     *
     * Either form is only consulted when `__DEV__ === true`. In production the factory emits
     * the short-form message described by {@link CodedErrorDefinition.prodDecodeCommand} and
     * never invokes this lookup.
     */
    messages: Readonly<Record<TCode, string>> | ((code: TCode) => string);
    /**
     * The class name (and the value written to `error.name`). Downstream guards identify
     * instances by matching this exact string, so pick something unique (e.g. `'KoraError'`,
     * `'CodamaError'`).
     *
     * Note: `__code` is reserved on the context object — the factory writes it itself and
     * frees you from having to declare it in your context shapes. Don't include `__code` in
     * a context value passed to the constructor; it will be overwritten.
     */
    name: string;
    /**
     * Optional shell command that recovers a human-readable message from an error code in
     * production builds. If supplied, production error messages take the form:
     *
     *     "{prefix} #{code}; Decode this error by running `{prodDecodeCommand} {code}`"
     *
     * and, when the error carries a non-empty context, an encoded-context segment is appended
     * before the closing backtick:
     *
     *     "{prefix} #{code}; Decode this error by running `{prodDecodeCommand} {code} '{encodedContext}'`"
     *
     * where `{prefix}` is {@link CodedErrorDefinition.prodMessagePrefix} (falling back to
     * {@link CodedErrorDefinition.name}). If this field is omitted, production messages are
     * simply `"{prefix} #{code}"`.
     *
     * @example
     * ```ts
     * prodDecodeCommand: 'npx @kora/errors decode --'
     * ```
     */
    prodDecodeCommand?: string;
    /**
     * Optional override for the leading token of production-mode error messages. Useful when a
     * downstream consumer wants a different prefix from the class `name` — e.g. {@link SolanaError}
     * uses `name: 'SolanaError'` (for `error.name` / `instanceof` identification) but emits
     * `"Solana error #N; ..."` as the prod message for wire-format compatibility with older
     * decoders. Defaults to {@link CodedErrorDefinition.name}.
     */
    prodMessagePrefix?: string;
}

type ConstructorArgsFor<
    TCode extends number,
    TContextMap extends CodedErrorContextMap<TCode>,
    C extends TCode,
> = TContextMap[C] extends undefined
    ? [code: C, errorOptions?: ErrorOptions | undefined]
    : [code: C, contextAndErrorOptions: TContextMap[C] & (ErrorOptions | undefined)];

type FormatterArgsFor<
    TCode extends number,
    TContextMap extends CodedErrorContextMap<TCode>,
    C extends TCode,
> = TContextMap[C] extends undefined ? [code: C] : [code: C, context: TContextMap[C]];

/**
 * The constructor produced by {@link createCodedErrorClass}. Instantiate with a code and, if the
 * code's context shape is non-`undefined`, the matching context object. A `cause` property on
 * that object is extracted and forwarded as {@link ErrorOptions.cause}.
 */
export interface CodedErrorConstructor<TCode extends number, TContextMap extends CodedErrorContextMap<TCode>> {
    /**
     * The configured constructor name.
     */
    readonly name: string;
    new <C extends TCode>(...args: ConstructorArgsFor<TCode, TContextMap, C>): CodedError<TCode, TContextMap, C>;
}

/**
 * A code-narrowing type guard returned by {@link createCodedErrorClass}. When the `code` argument
 * is supplied and the input is an error produced by the factory, TypeScript refines the error's
 * `context` property to the shape associated with that code.
 */
export interface CodedErrorGuard<TCode extends number, TContextMap extends CodedErrorContextMap<TCode>> {
    <C extends TCode>(e: unknown, code: C): e is CodedError<TCode, TContextMap, C>;
    (e: unknown): e is CodedError<TCode, TContextMap>;
}

/**
 * The value returned by {@link createCodedErrorClass} — a tuple-style object containing the new
 * error class, a matching type guard, and a standalone message formatter.
 */
export interface CodedErrorClassBundle<TCode extends number, TContextMap extends CodedErrorContextMap<TCode>> {
    /**
     * The constructor for the new error class. See {@link CodedErrorConstructor}.
     */
    ErrorClass: CodedErrorConstructor<TCode, TContextMap>;
    /**
     * Formats the human-readable message for a code/context pair without constructing an error.
     * Handy for logging, or for custom `cause` chains where you want the message string alone.
     */
    getHumanReadableMessage: <C extends TCode>(...args: FormatterArgsFor<TCode, TContextMap, C>) => string;
    /**
     * A code-narrowing type guard. See {@link CodedErrorGuard}.
     */
    isError: CodedErrorGuard<TCode, TContextMap>;
}

/**
 * Creates a coded error system — an error class, matching type guard, and message formatter —
 * modeled after {@link SolanaError}.
 *
 * Use this when building tooling around Kit (paymasters, wallets, program clients, etc.) that
 * needs its own strongly-typed, numerically-coded errors, but where introducing every domain's
 * codes into `@solana/errors` would balloon its scope. Codes, messages, and context shapes stay
 * in the downstream package; this helper owns only the mechanical plumbing.
 *
 * @typeParam TCode       Union of all numeric error codes the class can throw.
 * @typeParam TContextMap Mapping from error code to its context shape (`undefined` for codes
 *                        that carry no context).
 *
 * @example
 * ```ts
 * import { createCodedErrorClass } from '@solana/errors';
 *
 * export const KORA_ERROR__ACCOUNT_NOT_FOUND = -32050 as const;
 * export const KORA_ERROR__RATE_LIMIT_EXCEEDED = -32030 as const;
 *
 * type KoraErrorCode = typeof KORA_ERROR__ACCOUNT_NOT_FOUND | typeof KORA_ERROR__RATE_LIMIT_EXCEEDED;
 * type KoraErrorContext = {
 *     [KORA_ERROR__ACCOUNT_NOT_FOUND]: { address: string };
 *     [KORA_ERROR__RATE_LIMIT_EXCEEDED]: undefined;
 * };
 *
 * export const { ErrorClass: KoraError, isError: isKoraError } = createCodedErrorClass<
 *     KoraErrorCode,
 *     KoraErrorContext
 * >({
 *     messages: {
 *         [KORA_ERROR__ACCOUNT_NOT_FOUND]: 'Account $address not found',
 *         [KORA_ERROR__RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded',
 *     },
 *     name: 'KoraError',
 * });
 *
 * try {
 *     // ...
 * } catch (e) {
 *     if (isKoraError(e, KORA_ERROR__ACCOUNT_NOT_FOUND)) {
 *         // `e.context.address` is now typed as `string`.
 *         console.error(`Missing account ${e.context.address}`);
 *     }
 * }
 * ```
 *
 * @see {@link SolanaError} — the reference implementation this factory mirrors.
 */
export function createCodedErrorClass<TCode extends number, TContextMap extends CodedErrorContextMap<TCode>>(
    definition: CodedErrorDefinition<TCode>,
): CodedErrorClassBundle<TCode, TContextMap> {
    const { messagePostProcessor, messages, name, prodDecodeCommand, prodMessagePrefix } = definition;
    const prefix = prodMessagePrefix ?? name;
    const lookupTemplate = typeof messages === 'function' ? messages : (code: TCode) => messages[code];

    function getHumanReadableMessage<C extends TCode>(...args: FormatterArgsFor<TCode, TContextMap, C>): string {
        const [code, context] = args;
        const ctx = context ?? {};
        if (__DEV__) {
            const rendered = formatMessageTemplate(lookupTemplate(code), ctx);
            return messagePostProcessor ? messagePostProcessor(code, ctx, rendered) : rendered;
        }
        return `${prefix} #${code}`;
    }

    function getMessage<C extends TCode>(code: C, context: Record<string, unknown>): string {
        if (__DEV__) {
            const rendered = formatMessageTemplate(lookupTemplate(code), context);
            return messagePostProcessor ? messagePostProcessor(code, context, rendered) : rendered;
        }
        let message = `${prefix} #${code}`;
        if (prodDecodeCommand !== undefined) {
            message += `; Decode this error by running \`${prodDecodeCommand} ${code}`;
            if (Object.keys(context).length) {
                /**
                 * DANGER: Be sure that the shell command is escaped in such a way that makes it
                 *         impossible for someone to craft malicious context values that would
                 *         result in an exploit against anyone who blindly copy/pastes it into
                 *         their terminal.
                 */
                message += ` '${encodeContextObject(context)}'`;
            }
            message += '`';
        }
        return message;
    }

    class CodedErrorImpl extends Error {
        readonly context: Readonly<Record<string, unknown> & { __code: TCode }>;
        constructor(code: TCode, contextAndErrorOptions?: ErrorOptions & Record<string, unknown>) {
            let context: Record<string, unknown> | undefined;
            let errorOptions: ErrorOptions | undefined;
            if (contextAndErrorOptions) {
                Object.entries(Object.getOwnPropertyDescriptors(contextAndErrorOptions)).forEach(
                    ([propName, descriptor]) => {
                        if (propName === 'cause') {
                            errorOptions = { cause: descriptor.value };
                        } else {
                            if (context === undefined) {
                                context = { __code: code };
                            }
                            Object.defineProperty(context, propName, descriptor);
                        }
                    },
                );
            }
            const message = getMessage(code, context ?? {});
            super(message, errorOptions);
            this.context = Object.freeze(context === undefined ? { __code: code } : context) as Readonly<
                Record<string, unknown> & { __code: TCode }
            >;
            // This is necessary so that the guard can identify instances without having to import
            // the class for use in an `instanceof` check.
            this.name = name;
        }
    }
    Object.defineProperty(CodedErrorImpl, 'name', { value: name });

    const isError = ((e: unknown, code?: TCode) => {
        if (!(e instanceof Error) || e.name !== name) {
            return false;
        }
        // A foreign error could share `name` (duplicate install, manual reassignment). Require a
        // numeric `context.__code` so we don't narrow onto an unrelated object.
        const { context } = e as { context?: unknown };
        if (typeof context !== 'object' || context === null || !('__code' in context)) {
            return false;
        }
        const candidateCode = (context as { __code: unknown }).__code;
        if (typeof candidateCode !== 'number') {
            return false;
        }
        if (code === undefined) {
            return true;
        }
        return candidateCode === code;
    }) as CodedErrorGuard<TCode, TContextMap>;

    return {
        ErrorClass: CodedErrorImpl as unknown as CodedErrorConstructor<TCode, TContextMap>,
        getHumanReadableMessage,
        isError,
    };
}
