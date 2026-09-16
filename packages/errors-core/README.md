[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]
<br />
[![code-style-prettier][code-style-prettier-image]][code-style-prettier-url]

[code-style-prettier-image]: https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square
[code-style-prettier-url]: https://github.com/prettier/prettier
[npm-downloads-image]: https://img.shields.io/npm/dm/@solana/errors-core?style=flat
[npm-image]: https://img.shields.io/npm/v/@solana/errors-core?style=flat
[npm-url]: https://www.npmjs.com/package/@solana/errors-core

# @solana/errors-core

Primitives for building strongly-typed, numerically-coded JavaScript error classes — the factory machinery that powers [`SolanaError`](https://www.solanakit.com/api/classes/_solana_errors.SolanaError.html), exposed as a standalone package so that downstream tools (paymasters, wallets, program clients, etc.) can build their own coded error systems without growing the [`@solana/errors`](../errors/) catalog.

If you are throwing or catching errors from Kit itself, you want [`@solana/errors`](../errors/), not this package.

## Installation

```package-install
@solana/errors-core
```

## Usage

Define your codes, the context shape associated with each code, and the human-readable templates. `createCodedErrorClass` returns a constructor, a code-narrowing type guard, and a standalone message formatter.

```ts
import { createCodedErrorClass } from '@solana/errors-core';

export const KORA_ERROR__ACCOUNT_NOT_FOUND = -32050 as const;
export const KORA_ERROR__RATE_LIMIT_EXCEEDED = -32030 as const;

export type KoraErrorCode = typeof KORA_ERROR__ACCOUNT_NOT_FOUND | typeof KORA_ERROR__RATE_LIMIT_EXCEEDED;

export type KoraErrorContext = {
    [KORA_ERROR__ACCOUNT_NOT_FOUND]: { address: string };
    [KORA_ERROR__RATE_LIMIT_EXCEEDED]: undefined;
};

export const { ErrorClass: KoraError, isError: isKoraError } = createCodedErrorClass<KoraErrorCode, KoraErrorContext>({
    messages: {
        [KORA_ERROR__ACCOUNT_NOT_FOUND]: 'Account $address not found',
        [KORA_ERROR__RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded',
    },
    name: 'KoraError',
    prodDecodeCommand: 'npx @kora/errors decode --',
});
```

Throw and narrow:

```ts
try {
    /* ... */
} catch (e) {
    if (isKoraError(e, KORA_ERROR__ACCOUNT_NOT_FOUND)) {
        // `e.context.address` is now typed as `string`.
        displayError(`Missing account ${e.context.address}`);
    }
}
```

### Message templates

Templates use `$variable` tokens to interpolate values from an error's context. Tokens with no matching context key are rendered literally; escape a literal `$` with `\\$`.

You can supply `messages` as either:

- A `Readonly<Record<TCode, string>>` keyed by code (gives exhaustiveness checking against your code union), or
- A `(code: TCode) => string` function. Prefer this form to let bundlers tree-shake your templates out of production builds — write the body as `(code) => (__DEV__ ? MyMessages[code] : '')` so the reference to `MyMessages` lives inside a `__DEV__`-gated branch and can be eliminated under a static `__DEV__ === false` replacement.

The factory only consults `messages` when `__DEV__ === true`. In production it emits the short-form decode hint described below.

### Production mode

When your bundler sets `__DEV__` to `false`, error messages are stripped from the bundle. The factory emits a short-form message of the form:

```
KoraError #-32050; Decode this error by running `npx @kora/errors decode -- -32050 'BASE64_CONTEXT'`
```

…where `BASE64_CONTEXT` is produced by [`encodeContextObject`](./src/context.ts). The pair `encodeContextObject` / `decodeEncodedContext` round-trip the context through `URLSearchParams`, so it is lossy for non-string types: the decoder receives string values back.

If you don't configure a `prodDecodeCommand`, the production message is just `KoraError #-32050`. Either way, **you should pair this package with a small `decode` CLI in your error package** so consumers can recover the human-readable message from a code/context pair shipped by a production build.

A minimal decoder is just a few lines:

```ts
#!/usr/bin/env node
// bin/decode.ts
import { decodeEncodedContext } from '@solana/errors-core';
import { getKoraErrorMessage } from '../src';

const [, , rawCode, encodedContext] = process.argv;
const code = Number.parseInt(rawCode, 10);
const context = encodedContext ? decodeEncodedContext(encodedContext) : undefined;
console.log(getKoraErrorMessage(code, context));
```

…where `getKoraErrorMessage` is the `getHumanReadableMessage` returned by your `createCodedErrorClass` call. Wire it up in your package's `package.json`:

```json
{
    "bin": {
        "@kora/errors": "./bin/decode.js"
    }
}
```

…and the `prodDecodeCommand: 'npx @kora/errors decode --'` you configured will invoke it. See [`@solana/errors`'s `cli.ts`](../errors/src/cli.ts) for a fuller reference (argument validation, colored output, `commander`-based parsing).

## Rules for publishing coded errors

Coded errors are part of your public, wire-format-stable surface area. Once you've published a code, treat it like a database migration:

- **Don't remove an error.** Old clients still throw it.
- **Don't change the meaning of an error message.** It will become misleading.
- **Don't change or reorder error codes.** Decoders look codes up by number.
- **Don't change or remove members of an error's context.** Old throws will still ship the old shape.

When an older client throws an error, you want to make sure it can always be decoded. If you make any of the changes above, old clients won't have received your changes — and the errors they throw will become impossible to decode going forward.

The accepted way to evolve the system is to **add** new codes / context fields, never to mutate existing ones.

## API

- `createCodedErrorClass(definition)` — returns `{ ErrorClass, isError, getHumanReadableMessage }`.
- `formatMessageTemplate(template, context)` — render a single `$variable` template; the lower-level primitive used by the factory.
- `encodeContextObject(context)` / `decodeEncodedContext(encoded)` — the round-trip used to embed context in production messages. Use `decodeEncodedContext` in your `decode` CLI.

See the [generated API reference](https://www.solanakit.com/api) for the full type signatures.
