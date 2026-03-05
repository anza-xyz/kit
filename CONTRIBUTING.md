Kit is developed in public and we encourage and appreciate contributions.

## Getting Started

1. Install dependencies: `pnpm install`
2. The first time you build Kit, you will need to install the Agave test validator, which is used for some tests. `pnpm test:setup`
3. Start a test validator before running tests. `./scripts/start-shared-test-validator.sh`
4. Build + test all packages: `pnpm build`

## Development Environment

Kit is developed as a monorepo using [pnpm](https://pnpm.io/) and [turborepo](https://turborepo.com/).

Often your changes will only apply to a single package. You can run tests for a single package and watch for changes:

```shell
cd packages/accounts
pnpm turbo compile:js compile:typedefs
pnpm dev
```

## A Note on AI-Generated Code

We are supportive of using AI tools to _assist_ your development process (e.g., for boilerplate, optimization suggestions, or debugging).

However, we do not accept "vibe-coded" or purely AI-generated contributions. You must be able to explain, test, and take full ownership of every line of code you submit.

A good rule of thumb is not to use AI to write the PR description. This tends to be less clear and harder to review.

**Pull requests containing code that the author clearly does not understand will be rejected.** You are the developer, not the prompt engineer. All code must be intentional and understood.

## Kit Package Dependencies

`@solana/kit` re-exports ~20 workspace packages. Here are the main ones to remember:

```
@solana/kit
├── @solana/accounts - Account fetching and decoding
├── @solana/codecs - Composable encoding/decoding for binary data
├── @solana/functional - Functional programming utilities
├── @solana/instruction-plans - Multi-instruction transaction planning
├── @solana/instructions - Transaction instruction types and helpers
├── @solana/keys - Key generation and Ed25519 signature handling
├── @solana/offchain-messages - Offchain message encoding/decoding
├── @solana/plugin-core - Modular client plugin system
├── @solana/plugin-interfaces - Plugin capability interfaces
├── @solana/program-client-core - Program client building utilities
├── @solana/programs - Custom program error identification
├── @solana/rpc - RPC client creation and communication
├── @solana/rpc-subscriptions - WebSocket subscription utilities
├── @solana/signers - Abstractions for signing messages and transactions
├── @solana/sysvars - Solana sysvar retrieval and decoding
├── @solana/transaction-confirmation - Transaction confirmation strategies
├── @solana/transaction-messages - Building transaction messages
└── @solana/transactions - Compiling, signing, and serializing transactions
```

### Account & Identity Stack

These packages handle accounts, addresses, and cryptographic signing:

**Addresses** (`@solana/addresses`) - Base58-encoded account addresses and Program Derived Addresses (PDAs):

- `Address<T>` type with base58 encoding/decoding (`getAddressCodec`)
- `ProgramDerivedAddress` for PDAs with bump seeds
- `isAddress`, `assertIsAddress`, `address()` for validation and creation
- Curve validation (`isOffCurveAddress`, `assertIsOffCurveAddress`)

**Accounts** (`@solana/accounts`) - Account data handling and fetching:

- `Account<TData, TAddress>` type for decoded accounts, `EncodedAccount` for raw bytes
- `MaybeAccount` type for accounts that may or may not exist
- `fetchAccount`, `fetchAccounts` for RPC fetching with automatic decoding
- `decodeAccount`, `parseBase64RpcAccount`, `parseJsonRpcAccount` for manual parsing
- `assertAccountExists`, `assertAccountsExist` for runtime validation
- RPC API types: `GetAccountInfoApi`, `GetMultipleAccountsApi`

**Keys** (`@solana/keys`) - Key material and signature handling:

- `Signature` (base58 string) and `SignatureBytes` (Uint8Array) types
- `isSignature`, `assertIsSignature`, `signature()` for validation
- `isSignatureBytes`, `assertIsSignatureBytes`, `signatureBytes()` for byte validation
- Ed25519 algorithm identifier constant

**Signers** (`@solana/signers`) - Abstraction layer over signing messages and transactions:

- Signer types: `TransactionSigner`, `MessageSigner`, `KeyPairSigner`, `NoopSigner`
- Partial signers: `MessagePartialSigner`, `TransactionPartialSigner`
- Modifying signers: `MessageModifyingSigner`, `TransactionModifyingSigner`
- Sending signers: `TransactionSendingSigner` (for wallets that submit transactions)
- Type guards: `isTransactionSigner`, `isKeyPairSigner`, `isNoopSigner`, `isMessagePartialSigner`, etc.
- `setTransactionMessageFeePayerSigner` for setting fee payer
- `addSignersToInstruction`, `addSignersToTransactionMessage` for adding signers
- `deduplicateSigners` for removing duplicate signers
- `createSignableMessage` for offchain message signing

### Codecs

```
@solana/codecs
├── @solana/codecs-core
├── @solana/codecs-data-structures
├── @solana/codecs-numbers
├── @solana/codecs-strings
└── @solana/options
```

Umbrella package for all codecs-related functionality only meant for end-users. Contributors should not import from this package. Composable encoding/decoding for binary data. The `Codec<T>` interface provides `encode` and `decode` methods:

**Core Types:** `Codec`, `Encoder`, `Decoder`, `CodecError`, `addCodecSizePrefix`, `fixCodecSize`, `transformCodec`

**Number Codecs:** `getU8Codec`, `getU16Codec`, `getU32Codec`, `getU64Codec`, `getI8Codec`, `getI16Codec`, `getI32Codec`, `getI64Codec`, `getShortU16Codec`, `getF32Codec`, `getF64Codec`, `getBigIntCodec`

**String Codecs:** `getUtf8Codec`, `getBase64Codec`, `getBase58Codec`, `getBase16Codec`, `getBase10Codec`

**Data Structure Codecs:** `getStructCodec`, `getArrayCodec`, `getMapCodec`, `getSetCodec`, `getTupleCodec`, `getEnumCodec`, `getUnionCodec`, `getBooleanCodec`, `getBytesCodec`, `getNullableCodec`

**Option Type:** `getOptionCodec`, `Some`, `None`, `isOption`, `isSome`, `isNone`, `unwrapOption`, `unwrapOptionRecursively`

### Instructions

Types and helpers for creating transaction instructions with account roles:

**Account Types:** `AccountMeta`, `ReadonlyAccount`, `WritableAccount`, `ReadonlySignerAccount`, `WritableSignerAccount`, `AccountLookupMeta`

**Instruction Types:** `Instruction`, `InstructionWithAccounts`, `InstructionWithData`, `isInstructionForProgram`, `isInstructionWithAccounts`, `isInstructionWithData`

**Account Roles:** `AccountRole` enum (READONLY, WRITABLE, READONLY_SIGNER, WRITABLE_SIGNER), `downgradeRoleToNonSigner`, `downgradeRoleToReadonly`, `upgradeRoleToSigner`, `upgradeRoleToWritable`, `isSignerRole`, `isWritableRole`, `mergeRoles`

### Instruction Plans

Plan and execute multiple instructions as single or multiple transactions:

**Instruction Plan Types:** `InstructionPlan` (union of Single/Sequential/Parallel/MessagePacker), `SingleInstructionPlan`, `SequentialInstructionPlan`, `ParallelInstructionPlan`, `MessagePackerInstructionPlan`

**Transaction Plan Types:** `TransactionPlan` (union of Single/Sequential/Parallel), `SingleTransactionPlan`, `SequentialTransactionPlan`, `ParallelTransactionPlan`, `NonDivisibleSequentialTransactionPlan`

**Plan Creation:** `singleInstructionPlan`, `sequentialInstructionPlan`, `parallelInstructionPlan`, `nonDivisibleSequentialInstructionPlan`, `singleTransactionPlan`, `sequentialTransactionPlan`, `parallelTransactionPlan`, `nonDivisibleSequentialTransactionPlan`

**Plan Execution:** `createTransactionPlanner`, `createTransactionPlanExecutor`, `TransactionPlanner`, `TransactionPlanExecutor`, `TransactionPlanResult` (success/failed/canceled variants)

**Utilities:** `isInstructionPlan`, `isSingleInstructionPlan`, `isSequentialInstructionPlan`, `isParallelInstructionPlan`, `flattenInstructionPlan`, `findInstructionPlan`, `transformInstructionPlan`, `parseInstructionPlanInput`

### Offchain Messages

Utilities for encoding/decoding offchain messages per the SRFC-3 specification:

**Message Types:** `OffchainMessage`, `OffchainMessageV0`, `OffchainMessageV1`, `OffchainMessageEnvelope`, `OffchainMessageBytes`

**Content Types:** `OffchainMessageContent` (union), `OffchainMessageContentFormat` enum (RestrictedAscii, Utf8), content validation functions (`isOffchainMessageContentUtf8Of1232BytesMax`, etc.)

**Message Components:**

- `OffchainMessagePreambleV0`, `OffchainMessagePreambleV1` - Message preambles with required signatories
- `OffchainMessageApplicationDomain` - Domain separation for application-specific messages
- `OffchainMessageVersion` (0 | 1) - Version identifier

**Encoding/Decoding:** `getOffchainMessageCodec`, `getOffchainMessageV0Codec`, `getOffchainMessageV1Codec`, `getOffchainMessageEnvelopeCodec`, `compileOffchainMessageEnvelope`

**Signing:** `OffchainMessageSignatory`, `OffchainMessageWithRequiredSignatories`, `FullySignedOffchainMessageEnvelope`, `signOffchainMessageEnvelope`, `partiallySignOffchainMessageEnvelope`, `verifyOffchainMessageEnvelope`

**Type Guards:** `isFullySignedOffchainMessageEnvelope`, `assertIsFullySignedOffchainMessageEnvelope`

### Plugin System

The plugin system provides extensible architecture for Kit clients:

**Core Plugin Types:** `ClientPlugin`, `Client<TSelf>`, `AsyncClient<TSelf>`, `createEmptyClient`

**Capability Interfaces:**

- `ClientWithRpc<TRpcMethods>` - RPC method access
- `ClientWithRpcSubscriptions<TRpcSubscriptionsMethods>` - WebSocket subscription access
- `ClientWithTransactionPlanning` - Transaction planning capabilities
- `ClientWithTransactionSending` - Transaction sending capabilities
- `ClientWithPayer` - Default payer signer
- `ClientWithAirdrop` - Airdrop functionality

### Programs

Handle custom program errors and identify program-specific failures:

**Error Identification:** `isProgramError` - Check if a transaction failure is a specific program error by code

**Program Client Building:** `InstructionWithByteDelta` - Track byte size changes in instructions

```
@solana/programs (program error identification)
└── @solana/addresses
```

### Program Client Core

Utilities for building generated program clients (used by Codama JS renderer):

**Instruction Input Resolution:**

- `getNonNullResolvedInstructionInput` - Extract non-null instruction input values
- `getAddressFromResolvedInstructionAccount` - Get address from resolved account
- `getResolvedInstructionAccountAsProgramDerivedAddress` - Get account as PDA
- `getResolvedInstructionAccountAsTransactionSigner` - Get account as transaction signer
- `ResolvedInstructionAccount` - Type for resolved account metadata
- `getAccountMetaFactory` - Factory for creating AccountMeta

**Self-Contained Functions:**

- `addSelfFetchFunctions` - Add fetch methods to decoded accounts for self-fetching
- `SelfFetchFunctions` - Type for fetch function capabilities
- `addSelfPlanAndSendFunctions` - Add planning and sending methods
- `SelfPlanAndSendFunctions` - Type for plan-and-send capabilities

### Functional Utilities

The `pipe()` function enables functional composition for building transaction messages:

```ts
import { pipe } from '@solana/functional';
import {
    appendTransactionMessageInstruction,
    createTransactionMessage,
    setTransactionMessageFeePayer,
    setTransactionMessageLifetimeUsingBlockhash,
} from '@solana/transaction-messages';

const transferTransactionMessage = pipe(
    createTransactionMessage({ version: 0 }),
    m => setTransactionMessageFeePayer(myAddress, m),
    m => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
    m => appendTransactionMessageInstruction(getTransferSolInstruction({ source, destination, amount }), m),
);
```

### RPC Stack

The RPC packages form a layered architecture for communicating with Solana nodes.

#### HTTP RPC Client

The `@solana/rpc` package provides an HTTP client for making JSON RPC requests:

**Client Creation:** `createSolanaRpc`, `createSolanaRpcFromTransport`, `createDefaultRpcTransport`

**Cluster Types:** `RpcDevnet`, `RpcTestnet`, `RpcMainnet`, `RpcTransportDevnet`, `RpcTransportTestnet`, `RpcTransportMainnet`

**Request Features:** `getRpcTransportWithRequestCoalescing` (deduplication), request batching support

**Configuration:** `DEFAULT_RPC_CONFIG`

The `@solana/rpc-api` package defines all Solana RPC methods:

**Core RPC Methods:** Account methods (`getAccountInfo`, `getBalance`), Block methods (`getBlock`, `getBlockHeight`), Transaction methods (`getTransaction`, `sendTransaction`), Slot methods (`getSlot`, `getBlockTime`)

**Program Methods:** `getProgramAccounts`, `getMultipleAccounts`

**Validator Methods:** `getVoteAccounts`, `getEpochInfo`

**Utility Methods:** `getHealth`, `getVersion`, `getIdentity`

```
@solana/rpc-api (API methods)
├── @solana/addresses
├── @solana/keys
├── @solana/rpc-parsed-types
├── @solana/rpc-spec
├── @solana/rpc-transformers
├── @solana/transaction-messages
└── @solana/transactions
```

```
@solana/rpc (HTTP client)
├── @solana/fast-stable-stringify
├── @solana/functional
├── @solana/rpc-api
├── @solana/rpc-spec
├── @solana/rpc-spec-types
├── @solana/rpc-transformers
└── @solana/rpc-transport-http
```

#### WebSocket Subscriptions

The `@solana/rpc-subscriptions` package enables real-time notifications via WebSocket:

**Client Creation:** `createSolanaRpcSubscriptions`, `createSolanaRpcSubscriptions_UNSTABLE`, `createSolanaRpcSubscriptionsFromTransport`, `createDefaultRpcSubscriptionsTransport`, `createRpcSubscriptionsTransportFromChannelCreator`

**Channel Management:** `createDefaultSolanaRpcSubscriptionsChannelCreator`, `createDefaultRpcSubscriptionsChannelCreator`, `getRpcSubscriptionsChannelWithJSONSerialization`, `getRpcSubscriptionsChannelWithBigIntJSONSerialization`, `getRpcSubscriptionsTransportWithSubscriptionCoalescing`, `getRpcSubscriptionsChannelWithAutoping`, `getChannelPoolingChannelCreator`

**Cluster Types:** `RpcSubscriptionsDevnet`, `RpcSubscriptionsTestnet`, `RpcSubscriptionsMainnet`, `RpcSubscriptionsChannelDevnet`, `RpcSubscriptionsChannelTestnet`, `RpcSubscriptionsChannelMainnet`

**Configuration:** `DEFAULT_RPC_SUBSCRIPTIONS_CONFIG`

```
@solana/rpc-subscriptions (WebSocket subscriptions)
├── @solana/fast-stable-stringify
├── @solana/functional
├── @solana/promises
├── @solana/rpc-spec-types
├── @solana/rpc-subscriptions-api
├── @solana/rpc-subscriptions-channel-websocket
├── @solana/rpc-subscriptions-spec
├── @solana/rpc-transformers
└── @solana/subscribable
```

### Sysvars

Sysvars are special accounts that hold network state. The package includes the following sysvars:

**Available Sysvars:**

- `Clock` (`SYSVAR_CLOCK_ADDRESS`) - Current cluster time, slot, and epoch
- `EpochRewards` (`SYSVAR_EPOCH_REWARDS_ADDRESS`) - Rewards distributed in current epoch
- `EpochSchedule` (`SYSVAR_EPOCH_SCHEDULE_ADDRESS`) - Epoch timing configuration
- `Instructions` (`SYSVAR_INSTRUCTIONS_ADDRESS`) - Current transaction's instruction data
- `LastRestartSlot` (`SYSVAR_LAST_RESTART_SLOT_ADDRESS`) - Last restart slot
- `RecentBlockhashes` (`SYSVAR_RECENT_BLOCKHASHES_ADDRESS`) - Recent block hashes for transaction lifetime
- `Rent` (`SYSVAR_RENT_ADDRESS`) - Rent exemption calculation parameters
- `SlotHashes` (`SYSVAR_SLOT_HASHES_ADDRESS`) - Recent slot hashes
- `SlotHistory` (`SYSVAR_SLOT_HISTORY_ADDRESS`) - Historical slot data
- `StakeHistory` (`SYSVAR_STAKE_HISTORY_ADDRESS`) - Historical stake activation/deactivation

**Fetching Methods:** Each sysvar has a `fetchSysvar{Type}` function and `getSysvar{Type}Codec` for encoding/decoding

**Generic Helpers:**

- `fetchEncodedSysvarAccount` - Fetch any sysvar as an encoded account
- `fetchJsonParsedSysvarAccount` - Fetch any sysvar as a JSON-parsed account

```
@solana/sysvars
├── @solana/accounts
├── @solana/codecs-core
├── @solana/codecs-data-structures
├── @solana/codecs-numbers
├── @solana/errors
└── @solana/rpc-types
```

### Transaction Stack

The transaction packages form a layered stack for building, signing, and confirming transactions:

**Transaction Messages** (`@solana/transaction-messages`) - Building transaction messages:

- Message creation: `createTransactionMessage` (supports legacy, v0, v1 versions)
- Fee payer: `setTransactionMessageFeePayer`, `setTransactionMessageFeePayerSigner`
- Lifetime: `setTransactionMessageLifetimeUsingBlockhash`, `setTransactionMessageLifetimeUsingDurableNonce`
- Instructions: `appendTransactionMessageInstruction`, `removeFeePayerSignerFromTransactionMessage`
- Address lookup tables: `compressTransactionMessageUsingAddressLookupTables`
- Decompilation: `decompileTransactionMessage`
- Size checking: `transactionMessageSize`, `isTransactionMessageWithinSizeLimit`
- Types: `TransactionMessage`, `LegacyTransactionMessage`, `V0TransactionMessage`, `TransactionVersion`

**Transactions** (`@solana/transactions`) - Compiling, signing, and serializing:

- Compilation: `compileTransaction` (compiles TransactionMessage to Transaction)
- Signing: `signTransaction`, `partiallySignTransaction`, `getSignatureFromTransaction`
- Validation: `isFullySignedTransaction`, `assertIsFullySignedTransaction`, `isSendableTransaction`, `isTransactionWithinSizeLimit`
- Serialization: `getBase64EncodedWireTransaction`
- Lifetime: `getTransactionLifetimeConstraintFromCompiledTransactionMessage`
- Types: `Transaction`, `FullySignedTransaction`, `SendableTransaction`, `Base64EncodedWireTransaction`

**Transaction Confirmation** (`@solana/transaction-confirmation`) - Confirmation strategies:

- Waiting: `waitForRecentTransactionConfirmation`, `waitForDurableNonceTransactionConfirmation`, `waitForRecentTransactionConfirmationUntilTimeout`
- Strategy factories: `createRecentSignatureConfirmationPromiseFactory`, `createBlockHeightExceedencePromiseFactory`, `createNonceInvalidationPromiseFactory`
- Timeout: `getTimeoutPromise`
- Strategy racing: `raceStrategies`
- Types: `TransactionWithLastValidBlockHeight`

### Helper Packages

The following packages are foundational utilities depended on by multiple main packages:

- `@solana/errors` - Unified error system with codes and messages (used by nearly all packages)
- `@solana/assertions` - Runtime assertion helpers (used by addresses, keys)
- `@solana/nominal-types` - Branded/nominal type primitives (used by addresses, keys)
