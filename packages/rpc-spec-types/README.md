[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]
<br />
[![code-style-prettier][code-style-prettier-image]][code-style-prettier-url]

[code-style-prettier-image]: https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square
[code-style-prettier-url]: https://github.com/prettier/prettier
[npm-downloads-image]: https://img.shields.io/npm/dm/@solana/rpc-spec-types?style=flat
[npm-image]: https://img.shields.io/npm/v/@solana/rpc-spec-types?style=flat
[npm-url]: https://www.npmjs.com/package/@solana/rpc-spec-types

# @solana/rpc-spec-types

This package contains core types that can be used on both RPC and RPC Subscriptions specifications. It can be used standalone, but it is also exported as part of Kit [`@solana/kit`](https://github.com/anza-xyz/kit/tree/main/packages/kit).

## Types

### `RpcRequest`

An object that describes the elements of a RPC or RPC Subscriptions request. It consists of the following properties:

- `methodName`: The name of the RPC method or subscription requested.
- `params`: The parameters to be passed to the RPC server.

### `RpcRequestTransformer`

A function that accepts a `RpcRequest` and returns another `RpcRequest`. This allows the `RpcApi` to transform the request before it is sent to the RPC server.

### `RpcResponse`

A type that represents the response from a RPC server. This could be any sort of data which is why `RpcResponse` defaults to `unknown`. You may use a type parameter to specify the shape of the response — e.g. `RpcResponse<{ result: number }>`.

### `RpcResponseTransformer`

A function that accepts a `RpcResponse` and returns another `RpcResponse`. This allows the `RpcApi` to transform the response before it is returned to the caller.
