[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]
<br />
[![code-style-prettier][code-style-prettier-image]][code-style-prettier-url]

[code-style-prettier-image]: https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square
[code-style-prettier-url]: https://github.com/prettier/prettier
[npm-downloads-image]: https://img.shields.io/npm/dm/@solana/promises?style=flat
[npm-image]: https://img.shields.io/npm/v/@solana/promises?style=flat
[npm-url]: https://www.npmjs.com/package/@solana/promises

# @solana/promises

This package contains helpers for using JavaScript promises.

## Functions

### `getAbortablePromise(promise, abortSignal?)`

Returns a new promise that will reject if the abort signal fires before the original promise settles. Resolves or rejects with the value of the original promise otherwise.

```ts
const result = await getAbortablePromise(
    // Resolves or rejects when `fetch` settles.
    fetch('https://example.com/json').then(r => r.json()),
    // ...unless it takes longer than 5 seconds, after which the `AbortSignal` is triggered.
    AbortSignal.timeout(5000),
);
```

### `isAbortError(err)`

Returns `true` if `err` is an `Error` whose `name` is `'AbortError'`. Use this to distinguish abort rejections from other failures without having to `instanceof`-check every platform-specific error class.

```ts
try {
    await getAbortablePromise(doWork(), signal);
} catch (e) {
    if (isAbortError(e)) {
        // The operation was aborted; don't surface as an error.
        return;
    }
    throw e;
}
```

### `safeRace(...promises)`

An implementation of `Promise.race` that causes all of the losing promises to settle. This allows them to be released and garbage collected, preventing memory leaks.

Read more here: https://github.com/nodejs/node/issues/17469
