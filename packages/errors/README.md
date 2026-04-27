[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]
<br />
[![code-style-prettier][code-style-prettier-image]][code-style-prettier-url]

[code-style-prettier-image]: https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square
[code-style-prettier-url]: https://github.com/prettier/prettier
[npm-downloads-image]: https://img.shields.io/npm/dm/@solana/errors?style=flat
[npm-image]: https://img.shields.io/npm/v/@solana/errors?style=flat
[npm-url]: https://www.npmjs.com/package/@solana/errors

# @solana/errors

This package brings together every error message across all Solana JavaScript modules.

## Reading error messages

### In development mode

When your bundler sets the constant `__DEV__` to `true`, every error message will be included in the bundle. As such, you will be able to read them in plain language wherever they appear.

> [!WARNING]
> The size of your JavaScript bundle will increase significantly with the inclusion of every error message in development mode. Be sure to build your bundle with `__DEV__` set to `false` when you go to production.

### In production mode

When your bundler sets the constant `__DEV__` to `false`, error messages will be stripped from the bundle to save space. Only the error code will appear when an error is encountered. Follow the instructions in the error message to convert the error code back to the human-readable error message.

For instance, to recover the error text for the error with code `123`:

```shell
npx @solana/errors decode -- 123
```

## Adding a new error

1. Add a new exported error code constant to `src/codes.ts`.
2. Add that new constant to the `SolanaErrorCode` union in `src/codes.ts`.
3. If you would like the new error to encapsulate context about the error itself (eg. the public keys for which a transaction is missing signatures) define the shape of that context in `src/context.ts`.
4. Add the error's message to `src/messages.ts`. Any context values that you defined above will be interpolated into the message wherever you write `$key`, where `key` is the index of a value in the context (eg. ``'Missing a signature for account `$address`'``).
5. Publish a new version of `@solana/errors`.
6. Bump the version of `@solana/errors` in the package from which the error is thrown.

## Removing an error message

- Don't remove errors.
- Don't change the meaning of an error message.
- Don't change or reorder error codes.
- Don't change or remove members of an error's context.

When an older client throws an error, we want to make sure that they can always decode the error. If you make any of the changes above, old clients will, by definition, not have received your changes. This could make the errors that they throw impossible to decode going forward.

## Catching errors

When you catch a `SolanaError` and assert its error code using `isSolanaError()`, TypeScript will refine the error's context to the type associated with that error code. You can use that context to render useful error messages, or to make context-aware decisions that help your application to recover from the error.

```ts
import {
    SOLANA_ERROR__TRANSACTION__MISSING_SIGNATURE,
    SOLANA_ERROR__TRANSACTION__FEE_PAYER_SIGNATURE_MISSING,
    isSolanaError,
} from '@solana/errors';
import { assertIsFullySignedTransaction, getSignatureFromTransaction } from '@solana/transactions';

try {
    const transactionSignature = getSignatureFromTransaction(tx);
    assertIsFullySignedTransaction(tx);
    /* ... */
} catch (e) {
    if (isSolanaError(e, SOLANA_ERROR__TRANSACTION__SIGNATURES_MISSING)) {
        displayError(
            "We can't send this transaction without signatures for these addresses:\n- %s",
            // The type of the `context` object is now refined to contain `addresses`.
            e.context.addresses.join('\n- '),
        );
        return;
    } else if (isSolanaError(e, SOLANA_ERROR__TRANSACTION__FEE_PAYER_SIGNATURE_MISSING)) {
        if (!tx.feePayer) {
            displayError('Choose a fee payer for this transaction before sending it');
        } else {
            displayError('The fee payer still needs to sign for this transaction');
        }
        return;
    }
    throw e;
}
```

## Building your own coded error class

Downstream tools built on Kit (e.g. paymasters, wallets, programs) often want the same ergonomics as `SolanaError` — a strongly-typed class, a code-narrowing guard, dev/prod message branching — but without adding their own error codes to this package. Use `createCodedErrorClass` to mint a new error system owned by your package.

```ts
import { createCodedErrorClass } from '@solana/errors';

export const KORA_ERROR__ACCOUNT_NOT_FOUND = -32050 as const;
export const KORA_ERROR__RATE_LIMIT_EXCEEDED = -32030 as const;

type KoraErrorCode = typeof KORA_ERROR__ACCOUNT_NOT_FOUND | typeof KORA_ERROR__RATE_LIMIT_EXCEEDED;
type KoraErrorContext = {
    [KORA_ERROR__ACCOUNT_NOT_FOUND]: { address: string };
    [KORA_ERROR__RATE_LIMIT_EXCEEDED]: undefined;
};

export const { ErrorClass: KoraError, isError: isKoraError } = createCodedErrorClass<KoraErrorCode, KoraErrorContext>({
    messages: {
        [KORA_ERROR__ACCOUNT_NOT_FOUND]: 'Account $address not found',
        [KORA_ERROR__RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded',
    },
    name: 'KoraError',
});

try {
    /* ... */
} catch (e) {
    if (isKoraError(e, KORA_ERROR__ACCOUNT_NOT_FOUND)) {
        // `e.context.address` is typed as `string`.
        displayError(`Missing account ${e.context.address}`);
    }
}
```

The factory takes over exactly the plumbing that you would otherwise duplicate — context freezing, `cause` extraction, `$variable` interpolation, a dev/prod message switch — while leaving your error codes, messages, and context shapes in your own package. Pass `prodDecodeCommand` (e.g. `'npx @your-pkg/errors decode --'`) if you ship a CLI for decoding error codes in production bundles.

The factory never reads the `messages` map when `__DEV__` is `false`. If you ship a bundler-targeted build where `__DEV__` is statically replaced with `false`, a downstream bundler can DCE the templates. If you want to guarantee the templates drop out of your own production bundles, gate the reference at the call site — e.g. `messages: __DEV__ ? MyMessages : ({} as typeof MyMessages)` — so the templates module is unreachable under a static `__DEV__ === false` replacement.

If you want consumers to be able to write `MyError<typeof SOME_CODE>` as a type the same way they can with `SolanaError`, re-export a generic alias alongside the class:

```ts
import type { CodedError } from '@solana/errors';

export type KoraError<C extends KoraErrorCode = KoraErrorCode> = CodedError<KoraErrorCode, KoraErrorContext, C>;
```

The alias narrows `KoraError['context']` to the context shape for `C`, matching the narrowing you get from `isKoraError(e, code)`.
