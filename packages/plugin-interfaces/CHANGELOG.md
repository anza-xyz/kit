# @solana/plugin-interfaces

## 6.9.0

### Minor Changes

- [#1551](https://github.com/anza-xyz/kit/pull/1551) [`d24f908`](https://github.com/anza-xyz/kit/commit/d24f908a4fbbddddd9e8bacc57485de6d8e022b4) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Add `ClientWithSubscribeToPayer` and `ClientWithSubscribeToIdentity` interfaces. These are a framework-agnostic convention for plugins that mutate `client.payer` / `client.identity` reactively — they install a sibling `subscribeToPayer` / `subscribeToIdentity` function so consumers can observe changes without naming the specific plugin that provides them.

### Patch Changes

- Updated dependencies []:
    - @solana/instruction-plans@6.9.0
    - @solana/keys@6.9.0
    - @solana/rpc-subscriptions-spec@6.9.0
    - @solana/addresses@6.9.0
    - @solana/rpc-spec@6.9.0
    - @solana/rpc-types@6.9.0
    - @solana/signers@6.9.0

## 6.8.0

### Minor Changes

- [#1530](https://github.com/anza-xyz/kit/pull/1530) [`f8d6131`](https://github.com/anza-xyz/kit/commit/f8d61310a0ca7dfeb86f7e7d3f5975b8a140370a) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add `ClientWithIdentity` interface for clients that provide a default identity signer. Whereas `ClientWithPayer` describes the signer responsible for paying transaction fees and storage costs, `ClientWithIdentity` describes the signer whose assets the application is acting upon — such as the authority over accounts, tokens, or other on-chain assets owned by the current user. In many apps the payer and identity refer to the same signer, but they can differ when a service pays fees on behalf of a user.

### Patch Changes

- [#1532](https://github.com/anza-xyz/kit/pull/1532) [`667a0f0`](https://github.com/anza-xyz/kit/commit/667a0f059f5432244ab2cf8a23a22f53c7a36b4b) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Update the TypeScript peer dependency from `^5.0.0` to `>=5.0.0` to allow TypeScript 6 and above.

- Updated dependencies [[`d79f8d1`](https://github.com/anza-xyz/kit/commit/d79f8d115065557194db9604f3a0bfef7d37a2b6), [`667a0f0`](https://github.com/anza-xyz/kit/commit/667a0f059f5432244ab2cf8a23a22f53c7a36b4b), [`fdfcb6c`](https://github.com/anza-xyz/kit/commit/fdfcb6cbf439eb55e07ad7d59372347bd816d6d3), [`f53ce07`](https://github.com/anza-xyz/kit/commit/f53ce0796c782e79490e1cf11a55e28fb62b8c8f), [`43bc570`](https://github.com/anza-xyz/kit/commit/43bc570a5b51a9fda75abc1f0f818728ca3cd439)]:
    - @solana/signers@6.8.0
    - @solana/keys@6.8.0
    - @solana/addresses@6.8.0
    - @solana/instruction-plans@6.8.0
    - @solana/rpc-spec@6.8.0
    - @solana/rpc-subscriptions-spec@6.8.0
    - @solana/rpc-types@6.8.0

## 6.7.0

### Patch Changes

- Updated dependencies []:
    - @solana/addresses@6.7.0
    - @solana/instruction-plans@6.7.0
    - @solana/keys@6.7.0
    - @solana/rpc-spec@6.7.0
    - @solana/rpc-subscriptions-spec@6.7.0
    - @solana/rpc-types@6.7.0
    - @solana/signers@6.7.0

## 6.6.0

### Patch Changes

- Updated dependencies [[`742ffca`](https://github.com/anza-xyz/kit/commit/742ffcaf5304f702334e1f0b2a14cf208ae0ee5f), [`0fa54a4`](https://github.com/anza-xyz/kit/commit/0fa54a469937db3989f42afc4248882736f719f5), [`f055201`](https://github.com/anza-xyz/kit/commit/f055201c2dd3a4a69b9894d66b622ae81c13b8cd)]:
    - @solana/instruction-plans@6.6.0
    - @solana/signers@6.6.0
    - @solana/addresses@6.6.0
    - @solana/keys@6.6.0
    - @solana/rpc-spec@6.6.0
    - @solana/rpc-subscriptions-spec@6.6.0
    - @solana/rpc-types@6.6.0

## 6.5.0

### Minor Changes

- [#1486](https://github.com/anza-xyz/kit/pull/1486) [`10cb920`](https://github.com/anza-xyz/kit/commit/10cb92045bba4710a6c6157a3963d9e3a61f755e) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add `ClientWithGetMinimumBalance` plugin interface for computing the minimum balance required for an account. Implementations can use any strategy (e.g., RPC call, cached value) to provide this value through a uniform API.

### Patch Changes

- Updated dependencies [[`9e05736`](https://github.com/anza-xyz/kit/commit/9e057365a1a4e350f8a0ccc233b262e09b0134fa)]:
    - @solana/signers@6.5.0
    - @solana/addresses@6.5.0
    - @solana/instruction-plans@6.5.0
    - @solana/keys@6.5.0
    - @solana/rpc-spec@6.5.0
    - @solana/rpc-subscriptions-spec@6.5.0
    - @solana/rpc-types@6.5.0

## 6.4.0

### Patch Changes

- Updated dependencies [[`896412d`](https://github.com/anza-xyz/kit/commit/896412da20ced2b81f9f529e9b5feef16b7e790f)]:
    - @solana/instruction-plans@6.4.0
    - @solana/addresses@6.4.0
    - @solana/keys@6.4.0
    - @solana/rpc-types@6.4.0
    - @solana/signers@6.4.0
    - @solana/rpc-spec@6.4.0
    - @solana/rpc-subscriptions-spec@6.4.0

## 6.3.1

### Patch Changes

- Updated dependencies [[`a557a62`](https://github.com/anza-xyz/kit/commit/a557a62e0f42d2d526f0b8fbdd0a9fcc08ac9ef7)]:
    - @solana/instruction-plans@6.3.1
    - @solana/addresses@6.3.1
    - @solana/keys@6.3.1
    - @solana/rpc-spec@6.3.1
    - @solana/rpc-subscriptions-spec@6.3.1
    - @solana/rpc-types@6.3.1
    - @solana/signers@6.3.1

## 6.3.0

### Patch Changes

- Updated dependencies [[`f47d5cf`](https://github.com/anza-xyz/kit/commit/f47d5cf30512bbae3233f0ddccae45462af7f309)]:
    - @solana/instruction-plans@6.3.0
    - @solana/addresses@6.3.0
    - @solana/keys@6.3.0
    - @solana/rpc-spec@6.3.0
    - @solana/rpc-subscriptions-spec@6.3.0
    - @solana/rpc-types@6.3.0
    - @solana/signers@6.3.0

## 6.2.0

### Patch Changes

- Updated dependencies [[`98a8869`](https://github.com/anza-xyz/kit/commit/98a8869d5a728a65b7a525d87ed481616112503c), [`79db829`](https://github.com/anza-xyz/kit/commit/79db8292b2064145f615576589d8ecbf32196dc1), [`49c1195`](https://github.com/anza-xyz/kit/commit/49c1195637a8d550b864918e96d9f9681f658bfe)]:
    - @solana/instruction-plans@6.2.0
    - @solana/addresses@6.2.0
    - @solana/keys@6.2.0
    - @solana/rpc-spec@6.2.0
    - @solana/rpc-subscriptions-spec@6.2.0
    - @solana/rpc-types@6.2.0
    - @solana/signers@6.2.0

## 6.1.0

### Minor Changes

- [#1339](https://github.com/anza-xyz/kit/pull/1339) [`ee558a1`](https://github.com/anza-xyz/kit/commit/ee558a1ea8a95295db0e7b0751b32ac9d6342911) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add `@solana/plugin-interfaces` package with TypeScript interfaces for building pluggable Solana clients. Includes `ClientWithPayer`, `ClientWithAirdrop`, `ClientWithRpc`, `ClientWithRpcSubscriptions`, `ClientWithTransactionPlanning`, and `ClientWithTransactionSending` interfaces.

### Patch Changes

- Updated dependencies [[`1f6cd4b`](https://github.com/anza-xyz/kit/commit/1f6cd4bc7f41e865ff81ecd819dd9f728c27af77), [`50010b5`](https://github.com/anza-xyz/kit/commit/50010b5b791ff0e6d8636ded3af33158f2380e4e), [`33234f5`](https://github.com/anza-xyz/kit/commit/33234f50760e34a21072304e6aaf1a31b7a410f1)]:
    - @solana/instruction-plans@6.1.0
    - @solana/addresses@6.1.0
    - @solana/keys@6.1.0
    - @solana/rpc-spec@6.1.0
    - @solana/rpc-subscriptions-spec@6.1.0
    - @solana/rpc-types@6.1.0
    - @solana/signers@6.1.0
