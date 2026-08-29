# @solana/transaction-introspection

## 8.2.0

### Patch Changes

- Updated dependencies []:
    - @solana/addresses@8.2.0
    - @solana/codecs-core@8.2.0
    - @solana/codecs-strings@8.2.0
    - @solana/errors@8.2.0
    - @solana/instructions@8.2.0
    - @solana/rpc-types@8.2.0
    - @solana/transaction-messages@8.2.0
    - @solana/transactions@8.2.0

## 8.1.0

### Patch Changes

- Updated dependencies [[`be30e32`](https://github.com/anza-xyz/kit/commit/be30e328304ed055817572fb67712d79454ca12e), [`6852054`](https://github.com/anza-xyz/kit/commit/68520546649225b6594fe1137ff54ab6609c6d06), [`7d56e29`](https://github.com/anza-xyz/kit/commit/7d56e29bcd5f38fb53300e03e039d4d329a9e04f)]:
    - @solana/codecs-core@8.1.0
    - @solana/codecs-strings@8.1.0
    - @solana/transaction-messages@8.1.0
    - @solana/errors@8.1.0
    - @solana/addresses@8.1.0
    - @solana/instructions@8.1.0
    - @solana/rpc-types@8.1.0
    - @solana/transactions@8.1.0

## 8.0.0

### Patch Changes

- Updated dependencies [[`5d526f7`](https://github.com/anza-xyz/kit/commit/5d526f713789068a93e265da70a9bfafb14b6036), [`34568a9`](https://github.com/anza-xyz/kit/commit/34568a9f70933017284f2203c6aa7d024fe492e6), [`ca01807`](https://github.com/anza-xyz/kit/commit/ca018075c9d33764f9d7760af0147fb83786e9a8), [`94adb60`](https://github.com/anza-xyz/kit/commit/94adb60d0c67dc06f67b27bd11d77ed66302c9cb), [`1b30374`](https://github.com/anza-xyz/kit/commit/1b303745dac8ba87e84dfb8d120ba8642ac66e4b), [`cb09af6`](https://github.com/anza-xyz/kit/commit/cb09af68d23207d3b75974d2f971dacb7f72c0cb)]:
    - @solana/transactions@8.0.0
    - @solana/transaction-messages@8.0.0
    - @solana/rpc-types@8.0.0
    - @solana/codecs-core@8.0.0
    - @solana/errors@8.0.0
    - @solana/addresses@8.0.0
    - @solana/codecs-strings@8.0.0
    - @solana/instructions@8.0.0

## 7.1.1

### Patch Changes

- Updated dependencies [[`1d074ed`](https://github.com/anza-xyz/kit/commit/1d074ed874c9ad8ba03d3498be212956695db34e)]:
    - @solana/codecs-strings@7.1.1
    - @solana/addresses@7.1.1
    - @solana/rpc-types@7.1.1
    - @solana/transaction-messages@7.1.1
    - @solana/transactions@7.1.1
    - @solana/instructions@7.1.1
    - @solana/codecs-core@7.1.1
    - @solana/errors@7.1.1

## 7.1.0

### Minor Changes

- [#1814](https://github.com/anza-xyz/kit/pull/1814) [`c45d5e0`](https://github.com/anza-xyz/kit/commit/c45d5e0e1deef45bde74f4fdfc2a9322c6079201) Thanks [@mcintyre94](https://github.com/mcintyre94)! - `decodeTransactionFromRpcResponse` now accepts confirmed transactions from any RPC method that returns them, not just `getTransaction`. It reads only the shared `transaction` / `meta` / `version` envelope, so `getTransactionsForAddress` results (map over its `data` array) and `getBlock` results (map over its `transactions` array, with `transactionDetails: 'full'`) decode identically, including legacy transactions fetched without `maxSupportedTransactionVersion`. The `'json'` overload now types its omitted `transaction` as `never` rather than an optional `Transaction`, reflecting that the JSON path never yields re-encodable wire bytes.

### Patch Changes

- Updated dependencies [[`7022c26`](https://github.com/anza-xyz/kit/commit/7022c262ba75bdd243c148c4f0759c2546159b6f), [`327760c`](https://github.com/anza-xyz/kit/commit/327760c101bf4bebd8602581ad4894aa6ff9c731), [`14a3e5b`](https://github.com/anza-xyz/kit/commit/14a3e5b600e6a034749616fb25f762aed01a7a43)]:
    - @solana/errors@7.1.0
    - @solana/transaction-messages@7.1.0
    - @solana/addresses@7.1.0
    - @solana/codecs-core@7.1.0
    - @solana/codecs-strings@7.1.0
    - @solana/instructions@7.1.0
    - @solana/rpc-types@7.1.0
    - @solana/transactions@7.1.0

## 7.0.0

### Minor Changes

- [#1611](https://github.com/anza-xyz/kit/pull/1611) [`772b82c`](https://github.com/anza-xyz/kit/commit/772b82c4f18c418100560a5010b17e6b40dd7ab3) Thanks [@amilz](https://github.com/amilz)! - Add `@solana/transaction-introspection`, a new package that bridges a `getTransaction` response and the auto-generated `@solana-program/*` `parseXInstruction` clients. Decodes the transaction (`encoding: 'base64'`, `'base58'`, or `'json'`), resolves account indices against static + ALT-loaded addresses, normalizes inner instructions from `meta.innerInstructions`, and exposes `walkInstructions` to enumerate every instruction in display order — each outer instruction followed by its inner instructions — with a `trace` recording its location. Each returned instruction is a `ResolvedInstruction & { trace }` directly usable with `isInstructionForProgram` from `@solana/instructions` and with the auto-generated `identifyXInstruction` / `parseXInstruction` helpers. Supports `legacy`, `v0`, and `v1` compiled transaction messages. Re-exported from `@solana/kit`.

    ```ts
    import { createSolanaRpc, signature } from '@solana/kit';
    import { isInstructionForProgram } from '@solana/instructions';
    import { decodeTransactionFromRpcResponse, walkInstructions } from '@solana/transaction-introspection';
    import { identifyTokenInstruction, TOKEN_PROGRAM_ADDRESS, TokenInstruction } from '@solana-program/token';

    const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
    const rpcTx = await rpc
        .getTransaction(signature(txid), {
            commitment: 'confirmed',
            encoding: 'base64',
            maxSupportedTransactionVersion: 0,
        })
        .send();
    if (!rpcTx) throw new Error(`Transaction ${txid} not found`);

    const { compiledMessage, loadedAddresses } = decodeTransactionFromRpcResponse(rpcTx);

    for (const ix of walkInstructions({ compiledMessage, loadedAddresses, meta: rpcTx.meta })) {
        if (!isInstructionForProgram(ix, TOKEN_PROGRAM_ADDRESS)) continue;
        if (identifyTokenInstruction(ix) === TokenInstruction.SyncNative) {
            console.log('SyncNative found at', ix.trace);
        }
    }
    ```

    `@solana/rpc-api` now exports the non-null `getTransaction` response shapes as named types (`GetTransactionApiResponseBase58`, `GetTransactionApiResponseBase64`, `GetTransactionApiResponseJson`, `GetTransactionApiResponseJsonParsed`), which `decodeTransactionFromRpcResponse` accepts as inputs. `@solana/errors` gains `SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_INSTRUCTION_ACCOUNT_INDEX_OUT_OF_RANGE` plus a new `TRANSACTION_INTROSPECTION` domain (`SOLANA_ERROR__TRANSACTION_INTROSPECTION__CANNOT_DECODE_JSON_PARSED_TRANSACTION`, `SOLANA_ERROR__TRANSACTION_INTROSPECTION__UNRECOGNIZED_GET_TRANSACTION_RESPONSE`).

### Patch Changes

- Updated dependencies [[`3014977`](https://github.com/anza-xyz/kit/commit/30149771475d45b6cfff1c4aacd16c8f7256e256), [`772b82c`](https://github.com/anza-xyz/kit/commit/772b82c4f18c418100560a5010b17e6b40dd7ab3), [`e193711`](https://github.com/anza-xyz/kit/commit/e1937110a3eb300e184b10732f82ccfefe9c2a3f), [`069d56d`](https://github.com/anza-xyz/kit/commit/069d56d69226f755412b282c22818cbc90f2db4f), [`8d3bbf1`](https://github.com/anza-xyz/kit/commit/8d3bbf1b471aa153e1d51a995981224778fa2937), [`cab6d7e`](https://github.com/anza-xyz/kit/commit/cab6d7ed7bc870ba030c961c131a2cd8c49b6eb4)]:
    - @solana/errors@7.0.0
    - @solana/rpc-api@7.0.0
    - @solana/addresses@7.0.0
    - @solana/codecs-core@7.0.0
    - @solana/codecs-strings@7.0.0
    - @solana/instructions@7.0.0
    - @solana/transaction-messages@7.0.0
    - @solana/transactions@7.0.0
