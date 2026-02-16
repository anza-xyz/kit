# @solana/instruction-plans

## 6.1.0

### Minor Changes

- [#1334](https://github.com/anza-xyz/kit/pull/1334) [`1f6cd4b`](https://github.com/anza-xyz/kit/commit/1f6cd4bc7f41e865ff81ecd819dd9f728c27af77) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add `parseInstructionOrTransactionPlanInput` helper that converts flexible inputs (instruction plan input or transaction plan input) into an `InstructionPlan` or `TransactionPlan`

- [#1332](https://github.com/anza-xyz/kit/pull/1332) [`50010b5`](https://github.com/anza-xyz/kit/commit/50010b5b791ff0e6d8636ded3af33158f2380e4e) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add `parseInstructionPlanInput` helper that converts flexible inputs (single instruction, instruction plan, or array) into an `InstructionPlan`

- [#1333](https://github.com/anza-xyz/kit/pull/1333) [`33234f5`](https://github.com/anza-xyz/kit/commit/33234f50760e34a21072304e6aaf1a31b7a410f1) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add `parseTransactionPlanInput` helper that converts flexible inputs (single transaction message, transaction plan, or array) into an `TransactionPlan`

### Patch Changes

- Updated dependencies [[`3f711e1`](https://github.com/anza-xyz/kit/commit/3f711e16bc38657d5d1ff71cf98e73897ff19ea5), [`215027c`](https://github.com/anza-xyz/kit/commit/215027c49845bd5cbd86d3da396f0c3895283d75)]:
    - @solana/errors@6.1.0
    - @solana/transaction-messages@6.1.0
    - @solana/transactions@6.1.0
    - @solana/instructions@6.1.0
    - @solana/keys@6.1.0
    - @solana/promises@6.1.0

## 6.0.1

### Patch Changes

- Updated dependencies [[`2d3296f`](https://github.com/anza-xyz/kit/commit/2d3296f1ea03184455197d0284be73ada999b492), [`a8a57ce`](https://github.com/anza-xyz/kit/commit/a8a57cebc47caa24f6d105c346427baa244fa462)]:
    - @solana/transaction-messages@6.0.1
    - @solana/transactions@6.0.1
    - @solana/errors@6.0.1
    - @solana/instructions@6.0.1
    - @solana/keys@6.0.1
    - @solana/promises@6.0.1

## 6.0.0

### Major Changes

- [#1302](https://github.com/anza-xyz/kit/pull/1302) [`5f12df2`](https://github.com/anza-xyz/kit/commit/5f12df20b6f4b4b3536cc76c69b90fb8dc22455d) Thanks [@lorisleiva](https://github.com/lorisleiva)! - The `executeTransactionMessage` callback in `createTransactionPlanExecutor` now receives a mutable context object as its first argument. This context can be incrementally populated during execution (e.g. with the latest transaction message, the compiled transaction, or custom properties) and is preserved in the resulting `SingleTransactionPlanResult` regardless of the outcome. If an error is thrown at any point in the callback, any attributes already saved to the context will still be available in the `FailedSingleTransactionPlanResult`, which is useful for debugging failures or building recovery plans.

    The callback must now return either a `Signature` or a full `Transaction` object directly, instead of wrapping the result in an object.

    **BREAKING CHANGES**

    **`executeTransactionMessage` callback signature changed.** The callback now receives `(context, message, config)` instead of `(message, config)` and returns `Signature | Transaction` instead of `{ transaction: Transaction } | { signature: Signature }`.

    ```diff
      const executor = createTransactionPlanExecutor({
    -   executeTransactionMessage: async (message, { abortSignal }) => {
    +   executeTransactionMessage: async (context, message, { abortSignal }) => {
          const transaction = await signTransactionMessageWithSigners(message);
    +     context.transaction = transaction;
          await sendAndConfirmTransaction(transaction, { commitment: 'confirmed' });
    -     return { transaction };
    +     return transaction;
        }
      });
    ```

    **Custom context is now set via mutation instead of being returned.** Previously, custom context was returned as part of the result object. Now, it must be set directly on the mutable context argument.

    ```diff
      const executor = createTransactionPlanExecutor({
    -   executeTransactionMessage: async (message) => {
    -     const transaction = await signAndSend(message);
    -     return { transaction, context: { custom: 'value' } };
    +   executeTransactionMessage: async (context, message) => {
    +     context.custom = 'value';
    +     const transaction = await signAndSend(message);
    +     return transaction;
        }
      });
    ```

- [#1293](https://github.com/anza-xyz/kit/pull/1293) [`5c810ac`](https://github.com/anza-xyz/kit/commit/5c810ac20414a893b94045f0e89f01a8ca79ba8a) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Reshape the successful `SingleTransactionPlanResult` factory functions. The `successfulSingleTransactionPlanResult` helper now accepts a context object (which must include a `signature` property) instead of a separate `signature` argument. A new `successfulSingleTransactionPlanResultFromTransaction` helper is introduced for the common case of creating a successful result from a full `Transaction` object.

    **BREAKING CHANGES**

    **`successfulSingleTransactionPlanResult` renamed to `successfulSingleTransactionPlanResultFromTransaction`.** If you were creating a successful result from a `Transaction`, update the function name.

    ```diff
    - successfulSingleTransactionPlanResult(message, transaction)
    + successfulSingleTransactionPlanResultFromTransaction(message, transaction)
    ```

    **`successfulSingleTransactionPlanResultFromSignature` renamed to `successfulSingleTransactionPlanResult` with a new signature.** The `signature` is no longer a separate argument — it must be included in the `context` object.

    ```diff
    - successfulSingleTransactionPlanResultFromSignature(message, signature)
    + successfulSingleTransactionPlanResult(message, { signature })
    ```

    ```diff
    - successfulSingleTransactionPlanResultFromSignature(message, signature, context)
    + successfulSingleTransactionPlanResult(message, { ...context, signature })
    ```

- [#1309](https://github.com/anza-xyz/kit/pull/1309) [`bd3d5f1`](https://github.com/anza-xyz/kit/commit/bd3d5f11eac57d1930a747af9ae02cde07d13aa1) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add a new `planType` property to all `InstructionPlan`, `TransactionPlan`, and `TransactionPlanResult` types to distinguish them from each other at runtime. This property is a string literal with the value `'instructionPlan'`, `'transactionPlan'`, or `'transactionPlanResult'` respectively. It also adds new type guard functions that make use of that new property: `isInstructionPlan`, `isTransactionPlan`, and `isTransactionPlanResult`.

    **BREAKING CHANGES**

    **`InstructionPlan`, `TransactionPlan`, and `TransactionPlanResult` type guards updated.** All factories have been updated to add the new `planType` property but any custom instantiation of these types must be updated to include it as well.

    ```diff
      const myInstructionPlan: InstructionPlan = {
        kind: 'parallel',
        plans: [/* ... */],
    +   planType: 'instructionPlan',
      };

      const myTransactionPlan: TransactionPlan = {
        kind: 'parallel',
        plans: [/* ... */],
    +   planType: 'transactionPlan',
      };

      const myTransactionPlanResult: TransactionPlanResult = {
        kind: 'parallel',
        plans: [/* ... */],
    +   planType: 'transactionPlanResult',
      };
    ```

- [#1311](https://github.com/anza-xyz/kit/pull/1311) [`91cdb71`](https://github.com/anza-xyz/kit/commit/91cdb7129daaf0fa0a6d78d16a571e6f2a3feded) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Remove deprecated function `getAllSingleTransactionPlans`

    **BREAKING CHANGES**

    **`getAllSingleTransactionPlans` removed.** Use `flattenTransactionPlan` instead.

    ```diff
    - const singlePlans = getAllSingleTransactionPlans(transactionPlan);
    + const singlePlans = flattenTransactionPlan(transactionPlan);
    ```

- [#1276](https://github.com/anza-xyz/kit/pull/1276) [`2fbad6a`](https://github.com/anza-xyz/kit/commit/2fbad6ab60789e4207f6c4c95c4c2ac514aafab5) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Reshape `SingleTransactionPlanResult` from a single object type with a `status` discriminated union into three distinct types: `SuccessfulSingleTransactionPlanResult`, `FailedSingleTransactionPlanResult`, and `CanceledSingleTransactionPlanResult`. This flattens the result structure so that `status` is now a string literal (`'successful'`, `'failed'`, or `'canceled'`) and properties like `context`, `error`, and `plannedMessage` live at the top level of each variant.

    Other changes include:
    - Rename the `message` property to `plannedMessage` on all single transaction plan result types. This makes it clearer that this original planned message from the `TransactionPlan`, not the final message that was sent to the network.
    - Move the `context` object from inside the `status` field to the top level of each result variant. All variants now carry a `context` — not just successful ones.
    - Expand `context` attribute to optionally include `message`, `signature`, and `transaction` properties. These properties are meant to hold the actual `TransactionMessage`, `Signature`, and `Transaction` used when the transaction was sent to the network — which may differ from the originally `plannedMessage`.
    - Remove the now-unused `TransactionPlanResultStatus` type.
    - `failedSingleTransactionPlanResult` and `canceledSingleTransactionPlanResult` now accept an optional `context` parameter too.

    **BREAKING CHANGES**

    **Accessing the status kind.** Replace `result.status.kind` with `result.status`.

    ```diff
    - if (result.status.kind === 'successful') { /* ... */ }
    + if (result.status === 'successful') { /* ... */ }
    ```

    **Accessing the signature.** The signature has moved from `result.status.signature` to `result.context.signature`.

    ```diff
    - const sig = result.status.signature;
    + const sig = result.context.signature;
    ```

    **Accessing the transaction.** The transaction has moved from `result.status.transaction` to `result.context.transaction`.

    ```diff
    - const tx = result.status.transaction;
    + const tx = result.context.transaction;
    ```

    **Accessing the error.** The error has moved from `result.status.error` to `result.error`.

    ```diff
    - const err = result.status.error;
    + const err = result.error;
    ```

    **Accessing the context.** The context has moved from `result.status.context` to `result.context`.

    ```diff
    - const ctx = result.status.context;
    + const ctx = result.context;
    ```

    **Accessing the message.** The `message` property has been renamed to `plannedMessage`.

    ```diff
    - const msg = result.message;
    + const msg = result.plannedMessage;
    ```

    **`TransactionPlanResultStatus` removed.** Code that references this type must be updated to use the individual result variant types (`SuccessfulSingleTransactionPlanResult`, `FailedSingleTransactionPlanResult`, `CanceledSingleTransactionPlanResult`) or the `SingleTransactionPlanResult` union directly.

### Minor Changes

- [#1275](https://github.com/anza-xyz/kit/pull/1275) [`f8ef83e`](https://github.com/anza-xyz/kit/commit/f8ef83ee7491db8aa7331a0628045ee9072196a4) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add missing `TContext`, `TTransactionMessage` and/or `TSingle` type parameters to `TransactionPlanResult` types and helper functions to better preserve type information through narrowing operations.

### Patch Changes

- Updated dependencies [[`f80b6de`](https://github.com/anza-xyz/kit/commit/f80b6de0649ed2df3aa64fdd01215322bb8cc926), [`b82df4c`](https://github.com/anza-xyz/kit/commit/b82df4c98a9f157c030f62735f4427ba095bee6a), [`986a09c`](https://github.com/anza-xyz/kit/commit/986a09c56c38c2a91752972ec258fe790f8620db)]:
    - @solana/transaction-messages@6.0.0
    - @solana/transactions@6.0.0
    - @solana/errors@6.0.0
    - @solana/instructions@6.0.0
    - @solana/keys@6.0.0
    - @solana/promises@6.0.0

## 5.5.1

### Patch Changes

- [#1264](https://github.com/anza-xyz/kit/pull/1264) [`d957526`](https://github.com/anza-xyz/kit/commit/d9575263c3e563c6951cd35bbc6e65e70a0e6a10) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Exports missing helpers in errors and instruction-plans

- Updated dependencies [[`d957526`](https://github.com/anza-xyz/kit/commit/d9575263c3e563c6951cd35bbc6e65e70a0e6a10)]:
    - @solana/errors@5.5.1
    - @solana/instructions@5.5.1
    - @solana/keys@5.5.1
    - @solana/transaction-messages@5.5.1
    - @solana/transactions@5.5.1
    - @solana/promises@5.5.1

## 5.5.0

### Minor Changes

- [#1245](https://github.com/anza-xyz/kit/pull/1245) [`f731129`](https://github.com/anza-xyz/kit/commit/f731129939bac8b2574ecbbcd6afe0a0a6b00e5f) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Add `flattenInstructionPlan` and `flattenTransactionPlan` functions, that can be used to remove the sequential/parallel structure from these plans. Deprecate `getAllSingleTransactionPlans` which is superseded by `flattenTransactionPlan`.

- [#1233](https://github.com/anza-xyz/kit/pull/1233) [`b174ed5`](https://github.com/anza-xyz/kit/commit/b174ed531c15d34e354657d3945e4ea5b38932bc) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add `everyInstructionPlan`, `everyTransactionPlan` and `everyTransactionPlanResult` functions that can be used to ensure a given predicate holds for all nodes inside their respective plan structures.

- [#1247](https://github.com/anza-xyz/kit/pull/1247) [`ea97d43`](https://github.com/anza-xyz/kit/commit/ea97d43f588c6b5bf3d4bd96464f3c927967ae28) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Add a new function `appendTransactionMessageInstructionPlan` that can be used to add the instructions from an instruction plan to a transaction message

- [#1253](https://github.com/anza-xyz/kit/pull/1253) [`b4f5897`](https://github.com/anza-xyz/kit/commit/b4f5897cab50a92f50b6b390ae76d743173c26dd) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add `isX` and `assertIsX` type guard helpers for instruction plans, transaction plans, and transaction plan results

- [#1243](https://github.com/anza-xyz/kit/pull/1243) [`60e8c45`](https://github.com/anza-xyz/kit/commit/60e8c456356d52fb93637a6323cac9d9b2fc6816) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add `transformInstructionPlan`, `transformTransactionPlan` and `transformTransactionPlanResult` helpers for bottom-up transformation of instruction plan trees.

- [#1235](https://github.com/anza-xyz/kit/pull/1235) [`a47e441`](https://github.com/anza-xyz/kit/commit/a47e44109e90ddb03193d4e1e207f9e68118679d) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add `passthroughFailedTransactionPlanExecution` helper function that wraps a transaction plan execution promise to return a `TransactionPlanResult` even on execution failure. This allows handling execution results in a unified way without try/catch.

- [#1254](https://github.com/anza-xyz/kit/pull/1254) [`ba3f186`](https://github.com/anza-xyz/kit/commit/ba3f1861a9cb53b4c0e7c6d1b92791d8983e001b) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add `SuccessfulTransactionPlanResult` type with `isSuccessfulTransactionPlanResult` and `assertIsSuccessfulTransactionPlanResult` type guards

- [#1236](https://github.com/anza-xyz/kit/pull/1236) [`1cc0a31`](https://github.com/anza-xyz/kit/commit/1cc0a3163cf884a715aef5ba336adfd980dabfa6) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Add `getFirstFailedSingleTransactionPlanResult`, which you can use to get the first failed transaction plan result from a transaction plan result, or throw if none failed

- [#1232](https://github.com/anza-xyz/kit/pull/1232) [`589d761`](https://github.com/anza-xyz/kit/commit/589d761483a8feaf46b4cda7a97ec7abd5e7ab90) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Add `findInstructionPlan`, `findTransactionPlan` and `findTransactionPlanResult` functions that can be used to find the plan matching a given predicate

### Patch Changes

- [#1256](https://github.com/anza-xyz/kit/pull/1256) [`cccea6f`](https://github.com/anza-xyz/kit/commit/cccea6fc266e71bb2f1b4b843c3a815e3032f208) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Fix a bug where a message packer that requires multiple iterations is not correctly added when forced to fit in a single transaction, even if it can fit

- Updated dependencies [[`b4f5897`](https://github.com/anza-xyz/kit/commit/b4f5897cab50a92f50b6b390ae76d743173c26dd), [`08c9062`](https://github.com/anza-xyz/kit/commit/08c906299409e82a5941e1044fc6d47d633df784), [`ba3f186`](https://github.com/anza-xyz/kit/commit/ba3f1861a9cb53b4c0e7c6d1b92791d8983e001b), [`1cc0a31`](https://github.com/anza-xyz/kit/commit/1cc0a3163cf884a715aef5ba336adfd980dabfa6), [`6af7c15`](https://github.com/anza-xyz/kit/commit/6af7c156a9cd196d0d5ecb374fe696ec659756bf)]:
    - @solana/errors@5.5.0
    - @solana/instructions@5.5.0
    - @solana/keys@5.5.0
    - @solana/transaction-messages@5.5.0
    - @solana/transactions@5.5.0
    - @solana/promises@5.5.0

## 5.4.0

### Patch Changes

- [#1187](https://github.com/anza-xyz/kit/pull/1187) [`f5f89eb`](https://github.com/anza-xyz/kit/commit/f5f89eb8e769d5b6056b2f686d51a7ef4a0d1d09) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Make Typescript peer dependency optional + reduce required version to ^5

- Updated dependencies [[`f5f89eb`](https://github.com/anza-xyz/kit/commit/f5f89eb8e769d5b6056b2f686d51a7ef4a0d1d09), [`189de37`](https://github.com/anza-xyz/kit/commit/189de37f76bcb273986d750fd6ed6541f711103b)]:
    - @solana/transaction-messages@5.4.0
    - @solana/instructions@5.4.0
    - @solana/transactions@5.4.0
    - @solana/promises@5.4.0
    - @solana/errors@5.4.0
    - @solana/keys@5.4.0

## 5.3.0

### Patch Changes

- Updated dependencies []:
    - @solana/errors@5.3.0
    - @solana/instructions@5.3.0
    - @solana/keys@5.3.0
    - @solana/promises@5.3.0
    - @solana/transaction-messages@5.3.0
    - @solana/transactions@5.3.0

## 5.2.0

### Minor Changes

- [#1139](https://github.com/anza-xyz/kit/pull/1139) [`6dbaf66`](https://github.com/anza-xyz/kit/commit/6dbaf66015198bd912ec0800c1db1fd63b68e7a2) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Return more precise types from transaction message functions

    Deprecate `BaseTransactionMessage` in favour of `TransactionMessage`

### Patch Changes

- [#1155](https://github.com/anza-xyz/kit/pull/1155) [`b80b092`](https://github.com/anza-xyz/kit/commit/b80b09239762262116cb70b43271ad98a2f716b5) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Throw early when the default transaction plan executor encounters a non-divisible transaction plan.

- Updated dependencies [[`b80b092`](https://github.com/anza-xyz/kit/commit/b80b09239762262116cb70b43271ad98a2f716b5), [`109c78e`](https://github.com/anza-xyz/kit/commit/109c78e8972857323558ca913706a95cdb70c549), [`6dbaf66`](https://github.com/anza-xyz/kit/commit/6dbaf66015198bd912ec0800c1db1fd63b68e7a2)]:
    - @solana/errors@5.2.0
    - @solana/keys@5.2.0
    - @solana/transaction-messages@5.2.0
    - @solana/transactions@5.2.0
    - @solana/instructions@5.2.0
    - @solana/promises@5.2.0

## 5.1.0

### Minor Changes

- [#1044](https://github.com/anza-xyz/kit/pull/1044) [`e64a9b2`](https://github.com/anza-xyz/kit/commit/e64a9b263f7752bd470144d19562eff8819bd799) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Add a function to summarize a `TransactionPlanResult`

- [#1035](https://github.com/anza-xyz/kit/pull/1035) [`2bd0bc2`](https://github.com/anza-xyz/kit/commit/2bd0bc2b8d45eedca661ddf056341deba159a6b1) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Add a function to flatten a transaction plan result

- [#1056](https://github.com/anza-xyz/kit/pull/1056) [`a0c394b`](https://github.com/anza-xyz/kit/commit/a0c394b2f5fcaf543382ca30f052830ca91759e3) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Accept any `Error` object in failed `SingleTransactionPlanResult`

- [#1043](https://github.com/anza-xyz/kit/pull/1043) [`5c1f9e5`](https://github.com/anza-xyz/kit/commit/5c1f9e5d61ae55851aaa44e7a5ab83ff09ffee28) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Make Transaction optional in successful transaction plan result + add signature

### Patch Changes

- Updated dependencies [[`becf5f6`](https://github.com/anza-xyz/kit/commit/becf5f63f1b97d43109b2488c7cd0806ce6329f4), [`32214f5`](https://github.com/anza-xyz/kit/commit/32214f57cfb79fb2566e773acec71635bac641df), [`32b13a8`](https://github.com/anza-xyz/kit/commit/32b13a8973fe0645af1f87f0068c289730b4062c), [`2f7bda8`](https://github.com/anza-xyz/kit/commit/2f7bda81ca8248797957bdf693e812abc90b1951), [`81a0eec`](https://github.com/anza-xyz/kit/commit/81a0eec57d196d4ce6b86897640dcab85c5deafd)]:
    - @solana/errors@5.1.0
    - @solana/transactions@5.1.0
    - @solana/transaction-messages@5.1.0
    - @solana/instructions@5.1.0
    - @solana/keys@5.1.0
    - @solana/promises@5.1.0

## 5.0.0

### Patch Changes

- Updated dependencies [[`0fed638`](https://github.com/anza-xyz/kit/commit/0fed6389886639a48b44a09e129ac1b264c44389)]:
    - @solana/errors@5.0.0
    - @solana/transaction-messages@5.0.0
    - @solana/transactions@5.0.0
    - @solana/instructions@5.0.0
    - @solana/promises@5.0.0

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
