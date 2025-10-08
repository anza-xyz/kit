# @solana/instruction-plans

## 4.0.0

### Patch Changes

- Updated dependencies [[`5408f52`](https://github.com/anza-xyz/kit/commit/5408f524ae22293cb7b497310440019be5a98c55), [`cb11699`](https://github.com/anza-xyz/kit/commit/cb11699d77536e5901c62d32e43c671b044e4aa1), [`9fa8465`](https://github.com/anza-xyz/kit/commit/9fa8465bf0f264f5a9181c805a0d85cb1ecc2768), [`af01f27`](https://github.com/anza-xyz/kit/commit/af01f2770e4b3a94f3ef3360677b27aa08175c1b), [`22f18d0`](https://github.com/anza-xyz/kit/commit/22f18d0ce8950b26eaa897b146bfe8c1a025b3bb), [`c87cada`](https://github.com/anza-xyz/kit/commit/c87cada3ddf0a8c5fa27ed7122b901b17392c2df), [`54d8445`](https://github.com/anza-xyz/kit/commit/54d8445bbef207b6d84da0ea91a1c091251ee013)]:
    - @solana/transactions@4.0.0
    - @solana/errors@4.0.0
    - @solana/transaction-messages@4.0.0
    - @solana/instructions@4.0.0
    - @solana/promises@4.0.0

## 3.0.0

### Minor Changes

- [#543](https://github.com/anza-xyz/kit/pull/543) [`358df82`](https://github.com/anza-xyz/kit/commit/358df829770c4164fde50e57be04fe0782ddd4b5) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add new `TransactionPlanResult` type with helpers. This type describes the execution results of transaction plans with the same structural hierarchy — capturing the execution status of each transaction message whether executed in parallel, sequentially, or as a single transaction.

- [#546](https://github.com/anza-xyz/kit/pull/546) [`12d06d1`](https://github.com/anza-xyz/kit/commit/12d06d11d6a5fcf6ce06e9f9698175720666de39) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add a `TransactionPlanner` function type that defines how `InstructionPlans` gets planned and turned into `TransactionPlans`.

- [#664](https://github.com/anza-xyz/kit/pull/664) [`9feba85`](https://github.com/anza-xyz/kit/commit/9feba8557b64dd3199cd88af2c17b7ccd5d18fec) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add `createTransactionPlanExecutor` implementation for the `TransactionPlanExecutor` type.

- [#648](https://github.com/anza-xyz/kit/pull/648) [`01f159a`](https://github.com/anza-xyz/kit/commit/01f159a436d7a29479aa1a1877c9b4c77da1170f) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add `createTransactionPlanner` implementation for the `TransactionPlanner` type.

- [#547](https://github.com/anza-xyz/kit/pull/547) [`24967d1`](https://github.com/anza-xyz/kit/commit/24967d166e9a7035bab2cdababbaae4b46d0deaa) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add a `TransactionPlanExecutor` function type that defines how `TransactionPlans` get executed and turned into `TransactionPlanResults`.

- [#533](https://github.com/anza-xyz/kit/pull/533) [`7d48ccd`](https://github.com/anza-xyz/kit/commit/7d48ccd47f08de8d7e9105567d3766ee6ff1e64f) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add a new `@solana/instruction-plans` package offering a new `InstructionPlan` type that aims to describe a set of instructions with constraints on how they should be executed — e.g. sequentially, in parallel, divisible, etc.

- [#542](https://github.com/anza-xyz/kit/pull/542) [`f79d05a`](https://github.com/anza-xyz/kit/commit/f79d05a92387522ef05816d1d20b75e050da42f3) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add new `TransactionPlan` type with helpers. This type defines a set of transaction messages with constraints on how they should be executed — e.g. sequentially, in parallel, divisible, etc.

### Patch Changes

- [#727](https://github.com/anza-xyz/kit/pull/727) [`018479f`](https://github.com/anza-xyz/kit/commit/018479f56dc7f487b9a9ec444184cea7f13d9f3a) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Export more types and functions from the `@solana/instruction-plans` package.

- [#742](https://github.com/anza-xyz/kit/pull/742) [`c6e8568`](https://github.com/anza-xyz/kit/commit/c6e8568214c1647b42e259f464f7e5f220627525) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Fix the `onTransactionMessageUpdated` signature of the `createTransactionPlanner` helper by removing the unnecessary `TTransactionMessage` type parameter.

- [#741](https://github.com/anza-xyz/kit/pull/741) [`a4310a5`](https://github.com/anza-xyz/kit/commit/a4310a571268c03e8d31b64ab450c922079de9c3) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Fix the `executeTransactionMessage` signature of the `createTransactionPlanExecutor` helper by removing the unnecessary `TTransactionMessage` type parameter.

- Updated dependencies [[`771f8ae`](https://github.com/anza-xyz/kit/commit/771f8aef1f8c096450c6e4ac05b8611150201485), [`771f8ae`](https://github.com/anza-xyz/kit/commit/771f8aef1f8c096450c6e4ac05b8611150201485), [`6a183bf`](https://github.com/anza-xyz/kit/commit/6a183bf9e9d672e2d42f3aecc589a9e54d01cb1a), [`760fb83`](https://github.com/anza-xyz/kit/commit/760fb8319f6b53fa1baf05f9aa1246cb6c2caceb), [`23d2fa1`](https://github.com/anza-xyz/kit/commit/23d2fa14cbd5197473eca94a1ac6c5abf221b052), [`771f8ae`](https://github.com/anza-xyz/kit/commit/771f8aef1f8c096450c6e4ac05b8611150201485), [`a894d53`](https://github.com/anza-xyz/kit/commit/a894d53192d50b5d2217ada2cb715d71ef4f8f02), [`9feba85`](https://github.com/anza-xyz/kit/commit/9feba8557b64dd3199cd88af2c17b7ccd5d18fec), [`00d66fb`](https://github.com/anza-xyz/kit/commit/00d66fbec15288bb531f7459b6baa48aead1cdc6), [`733605d`](https://github.com/anza-xyz/kit/commit/733605df84ce5f5ffea1e83eea8df74e08789642), [`01f159a`](https://github.com/anza-xyz/kit/commit/01f159a436d7a29479aa1a1877c9b4c77da1170f), [`0bd053b`](https://github.com/anza-xyz/kit/commit/0bd053bfa40b095d37bea7b7cd695259ba5a9cdc), [`55d6b04`](https://github.com/anza-xyz/kit/commit/55d6b040764f5e32de9c94d1844529855233d845), [`a74ea02`](https://github.com/anza-xyz/kit/commit/a74ea0267bf589fba50bb2ebe72dc4f73da9adcf)]:
    - @solana/transaction-messages@3.0.0
    - @solana/instructions@3.0.0
    - @solana/errors@3.0.0
    - @solana/transactions@3.0.0
    - @solana/promises@3.0.0
