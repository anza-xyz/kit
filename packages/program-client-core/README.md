[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]
<br />
[![code-style-prettier][code-style-prettier-image]][code-style-prettier-url]

[code-style-prettier-image]: https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square
[code-style-prettier-url]: https://github.com/prettier/prettier
[npm-downloads-image]: https://img.shields.io/npm/dm/@solana/program-client-core?style=flat
[npm-image]: https://img.shields.io/npm/v/@solana/program-client-core?style=flat
[npm-url]: https://www.npmjs.com/package/@solana/program-client-core

# @solana/program-client-core

This package contains types and utilities for building Solana program clients. It is mainly used by the [JavaScript Codama renderer](https://github.com/codama-idl/renderers-js) to generate Kit-compatible program clients. It can be used standalone, but it is also exported as part of Kit [`@solana/kit`](https://github.com/anza-xyz/kit/tree/main/packages/kit) under the `@solana/kit/program-client-core` subpath.

You will rarely need to import from this package yourself. However, it defines what the instruction builders of generated program clients accept as inputs and how these inputs are resolved into account metas, which is useful to know when using such clients.

## Instruction inputs

The instruction builders of generated program clients accept an input object containing the accounts and arguments of the instruction. The types below describe what may be provided for each account, depending on whether the program's IDL declares it as a signer.

### `InstructionAccountInput`

This type represents the accepted inputs for a non-signer instruction account. Namely, one of the following:

- An `Address` — the most common case.
- Any object exposing an `address` property — see `HasAddress` in `@solana/addresses`. This lets third-party wrappers around addresses be passed directly, as long as they expose a Kit `Address` under an `address` property. Note that `TransactionSigner` objects satisfy this shape too, in which case they merely act as address carriers for non-signer accounts.
- A `ProgramDerivedAddress` — i.e. an `[address, bump]` tuple.
- An `AccountNonSignerMeta` from `@solana/instructions` — i.e. `{ address, role }` — to explicitly override the role derived from the program's IDL, e.g. to mark an account as writable when the IDL declares it as readonly.

```ts
import { AccountRole } from '@solana/instructions';

// Given a generated instruction builder whose `mint` account is a non-signer account.
getMintToInstruction({ mint: mintAddress /* ... */ }); // An address.
getMintToInstruction({ mint: addressWrapper /* ... */ }); // A third-party wrapper exposing an `address` property.
getMintToInstruction({ mint: mintPda /* ... */ }); // A program derived address.
getMintToInstruction({ mint: { address: mintAddress, role: AccountRole.READONLY } /* ... */ }); // A role override.
```

### `InstructionSignerInput`

This type represents the accepted inputs for a signer instruction account. Namely, one of the following:

- A `TransactionSigner` — the most common case.
- An `AccountSignerMeta` from `@solana/signers` — i.e. `{ address, role, signer }` — to explicitly override the role derived from the program's IDL, e.g. to mark a signer account as writable when the IDL declares it as readonly.

If the account's signature is provided by other means — e.g. when the transaction is signed by a multisig or by a wallet that adds the signature later — use `createNoopSigner()` from `@solana/signers` to satisfy the requirement.

```ts
import { createNoopSigner } from '@solana/signers';

// Given a generated instruction builder whose `authority` account is a signer account.
getMintToInstruction({ authority: authoritySigner /* ... */ }); // A transaction signer.
getMintToInstruction({ authority: createNoopSigner(authorityAddress) /* ... */ }); // A signature provided by other means.
```

Accounts that may or may not be signers — e.g. an authority that can either be a signer or a multisig account — accept both `InstructionAccountInput` and `InstructionSignerInput`. Providing a `TransactionSigner` for such an account marks it as a signer.

### Resolution rules

The account metas of the resulting instruction are determined from the provided inputs as follows, in order of precedence:

| Provided input                                                                  | Resulting account meta                                                                                               |
| ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| An account meta — i.e. carrying an explicit `role`                              | The provided role is used as-is, regardless of the flags declared by the IDL. Any attached `signer` is preserved.    |
| A `TransactionSigner`, for an account the IDL declares as a signer or as either | The IDL's writable flag is upgraded to the corresponding signer role and the signer is attached to the account meta. |
| A `TransactionSigner`, for an account the IDL declares as a non-signer          | The signer merely carries its address. The IDL's writable flag decides between the readonly and writable roles.      |
| Any other address-carrying value                                                | The IDL's writable flag decides between the readonly and writable roles.                                             |

These rules are reflected in the types of the instructions returned by generated builders: for instance, providing `{ address, role: AccountRole.READONLY }` for an account results in a `ReadonlyAccount` meta, whilst providing a `TransactionSigner` for an account that may or may not be a signer results in a signer meta.

A couple of failure cases are worth knowing about:

- Providing a value that cannot sign — e.g. a plain `Address` — for an account the IDL declares as a signer throws a `SolanaError` with code `SOLANA_ERROR__PROGRAM_CLIENTS__RESOLVED_INSTRUCTION_INPUT_MUST_BE_SIGNER`. Use `createNoopSigner()` as described above if the signature is provided by other means.
- Some instructions have an argument that defaults to the bump seed of one of their accounts — e.g. a `bump` argument defaulting to the bump seed of a `metadata` PDA. Since a plain address does not carry a bump seed, providing anything other than a `ProgramDerivedAddress` for such an account throws a `SolanaError` with code `SOLANA_ERROR__PROGRAM_CLIENTS__UNEXPECTED_RESOLVED_INSTRUCTION_INPUT_TYPE`, unless the dependent argument is provided explicitly.

## Types

### `ResolvedInstructionAccount`

This type represents an account input during instruction building, capturing the provided value alongside the signer and writable flags declared by the program's IDL. The value can be any `InstructionAccountInput`, any `InstructionSignerInput`, or `null` for optional accounts that were not provided.

The optional `isSigner` flag describes whether the IDL requires the account to sign the transaction, with `'either'` meaning that the account may or may not be a signer. Omitting the flag is equivalent to setting it to `'either'`.

```ts
const resolvedMint: ResolvedInstructionAccount = { value: mintAddress, isSigner: false, isWritable: true };
```

### `ResolvedInstructionAccountMeta`

This type helper computes the account meta type produced by an instruction account based on the input provided for it, mirroring the [resolution rules](#resolution-rules) applied at runtime by `getAccountMetaFactory()`. Generated instruction builders use it to accurately type the accounts of the instructions they return.

It takes the type of the provided input, the address type parameter of the account and, optionally, the meta type to produce when a `TransactionSigner` is provided. The latter defaults to the address type parameter, so leaving it out — as generated builders do for non-signer accounts — makes signers act as plain address carriers. When the input carries no static information — e.g. when the builder's type parameters fall back to their constraints — it deterministically resolves to the address type parameter, which generated instruction types map to the account meta declared by the program's IDL.

```ts
// Given a mint account that is not a signer.
type MintMeta<TInput extends InstructionAccountInput> = ResolvedInstructionAccountMeta<
    TInput,
    InstructionAccountInputAddress<TInput>
>;

// Given an authority account that may or may not be a signer.
type AuthorityMeta<TInput extends InstructionAccountInput | InstructionSignerInput> = ResolvedInstructionAccountMeta<
    TInput,
    InstructionAccountInputAddress<TInput>,
    ReadonlySignerAccount<InstructionAccountInputAddress<TInput>> &
        AccountSignerMeta<InstructionAccountInputAddress<TInput>>
>;
```

### `InstructionAccountInputAddress`

This type helper extracts the address type parameter from an instruction account input — e.g. `'1234'` from an `Address<'1234'>`, a `TransactionSigner<'1234'>`, a `ProgramDerivedAddress<'1234'>` or an account meta of that address. Inputs carrying no address brand resolve to `string`. Generated instruction builders use it to recover the address type parameter of an account from the input provided for it.

```ts
type A = InstructionAccountInputAddress<Address<'1234'>>; // '1234'
type B = InstructionAccountInputAddress<TransactionSigner<'1234'>>; // '1234'
type C = InstructionAccountInputAddress<Address>; // string
```

### `InstructionWithByteDelta`

This type represents an instruction that tracks how many bytes it adds to or removes from on-chain accounts via a `byteDelta` property. A positive value means bytes are being allocated, whilst a negative value means bytes are being freed. This is useful for calculating how much balance a storage payer must have for a transaction to succeed.

### `SelfFetchFunctions`

This type describes the `fetch`, `fetchMaybe`, `fetchAll` and `fetchAllMaybe` methods added to account codecs by `addSelfFetchFunctions()`, allowing accounts to be fetched and decoded in one step.

### `SelfPlanAndSendFunctions`

This type describes the `planTransaction`, `planTransactions`, `sendTransaction` and `sendTransactions` methods added to instructions and instruction plans by `addSelfPlanAndSendFunctions()`, allowing them to be planned and sent directly.

## Functions

### `getAccountMetaFactory()`

This function creates a helper that converts `ResolvedInstructionAccount` objects into `AccountMeta` or `AccountSignerMeta` objects following the [resolution rules](#resolution-rules) above. It takes the program address and the strategy to apply to optional accounts that were not provided: `'programId'` replaces them with the program address as a readonly account, whilst `'omitted'` excludes them from the instruction entirely — in which case the helper returns `undefined` for them.

```ts
const getAccountMeta = getAccountMetaFactory(programAddress, 'programId');
const mintMeta = getAccountMeta('mint', { value: mintAddress, isSigner: false, isWritable: true });
```

### `getNonNullResolvedInstructionInput()`

This function ensures a resolved instruction input is neither `null` nor `undefined` and returns it. It throws a `SolanaError` with code `SOLANA_ERROR__PROGRAM_CLIENTS__RESOLVED_INSTRUCTION_INPUT_MUST_BE_NON_NULL` otherwise, using the provided input name in the error message.

```ts
const authority = getNonNullResolvedInstructionInput('authority', maybeAuthority);
```

### `getAddressFromResolvedInstructionAccount()`

This function extracts the address from the value of a resolved instruction account, whether it is an `Address`, a `ProgramDerivedAddress` or any object exposing an `address` property — such as a `TransactionSigner`, an account meta or a third-party address wrapper. It throws a `SolanaError` with code `SOLANA_ERROR__PROGRAM_CLIENTS__RESOLVED_INSTRUCTION_INPUT_MUST_BE_NON_NULL` if the value is `null` or `undefined`.

```ts
const mintAddress = getAddressFromResolvedInstructionAccount('mint', resolvedMint.value);
```

### `getResolvedInstructionAccountAsProgramDerivedAddress()`

This function ensures the value of a resolved instruction account is a `ProgramDerivedAddress` and returns it. Generated instruction builders use it when another input defaults to the bump seed of the account. It throws a `SolanaError` with code `SOLANA_ERROR__PROGRAM_CLIENTS__UNEXPECTED_RESOLVED_INSTRUCTION_INPUT_TYPE` otherwise.

```ts
const [metadataAddress, metadataBump] = getResolvedInstructionAccountAsProgramDerivedAddress(
    'metadata',
    resolvedMetadata.value,
);
```

### `getResolvedInstructionAccountAsTransactionSigner()`

This function ensures the value of a resolved instruction account is a `TransactionSigner` — or an `AccountSignerMeta` carrying one — and returns the signer. It throws a `SolanaError` with code `SOLANA_ERROR__PROGRAM_CLIENTS__UNEXPECTED_RESOLVED_INSTRUCTION_INPUT_TYPE` otherwise.

```ts
const authoritySigner = getResolvedInstructionAccountAsTransactionSigner('authority', resolvedAuthority.value);
```

### `addSelfFetchFunctions()`

This function augments an account codec with the `SelfFetchFunctions` methods, using the provided client's RPC to fetch accounts. Generated program clients use it to expose account codecs that can fetch and decode accounts in one step.

```ts
const mintCodec = addSelfFetchFunctions(client, getMintCodec());

const mint = await mintCodec.fetch(mintAddress); // Throws if the account does not exist.
const maybeMint = await mintCodec.fetchMaybe(mintAddress); // Returns a `MaybeAccount` instead.
const mints = await mintCodec.fetchAll([mintAddressA, mintAddressB]);
```

### `addSelfPlanAndSendFunctions()`

This function augments an instruction, an instruction plan or a promise resolving to either with the `SelfPlanAndSendFunctions` methods, using the provided client's transaction planning and sending capabilities. Generated program clients use it to expose instruction builders whose result can be sent directly.

```ts
const instruction = addSelfPlanAndSendFunctions(
    client,
    getTransferInstruction({ source, destination, authority, amount }),
);

await instruction.sendTransaction();
```
