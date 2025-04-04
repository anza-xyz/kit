[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]
<br />
[![code-style-prettier][code-style-prettier-image]][code-style-prettier-url]

[code-style-prettier-image]: https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square
[code-style-prettier-url]: https://github.com/prettier/prettier
[npm-downloads-image]: https://img.shields.io/npm/dm/@solana/functional?style=flat
[npm-image]: https://img.shields.io/npm/v/@solana/functional?style=flat
[npm-url]: https://www.npmjs.com/package/@solana/functional

# @solana/functional

This package contains generalized functional helpers and functional helpers specific to Solana application components. It can be used standalone, but it is also exported as part of Kit [`@solana/kit`](https://github.com/anza-xyz/kit/tree/main/packages/kit).

## Functions

### `pipe()`

A pipeline is a solution that allows you to perform successive transforms of a value using functions. This is useful when building up a transaction message.

Until the [pipeline operator](https://github.com/tc39/proposal-pipeline-operator) becomes part of JavaScript you can use this utility to create pipelines.

```ts
const add = (a, b) => a + b;
const add10 = x => add(x, 10);
const add100 = x => add(x, 100);
const sum = pipe(1, add10, add100);
sum === 111; // true
```

```ts
const transferTransactionMessage = pipe(
    // The result of the first expression...
    createTransactionMessage({ version: 0 }),
    // ...gets passed as the sole argument to the next function in the pipeline.
    tx => setTransactionMessageFeePayer(myAddress, tx),
    // The return value of that function gets passed to the next...
    tx => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
    // ...and so on.
    tx => appendTransactionMessageInstruction(getTransferSolInstruction({ source, destination, amount }), tx),
);
```
