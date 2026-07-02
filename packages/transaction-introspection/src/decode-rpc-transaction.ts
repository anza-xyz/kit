import type { Address } from '@solana/addresses';
import { getBase58Encoder, getBase64Encoder } from '@solana/codecs-strings';
import {
    SOLANA_ERROR__TRANSACTION__VERSION_NUMBER_NOT_SUPPORTED,
    SOLANA_ERROR__TRANSACTION_INTROSPECTION__CANNOT_DECODE_JSON_PARSED_TRANSACTION,
    SOLANA_ERROR__TRANSACTION_INTROSPECTION__UNRECOGNIZED_GET_TRANSACTION_RESPONSE,
    SolanaError,
} from '@solana/errors';
import type {
    Base58EncodedBytes,
    Base58EncodedDataResponse,
    Base64EncodedDataResponse,
    Blockhash,
} from '@solana/rpc-types';
import type {
    CompiledTransactionMessage,
    CompiledTransactionMessageWithLifetime,
    LegacyCompiledTransactionMessage,
    TransactionVersion,
    V0CompiledTransactionMessage,
    V1CompiledTransactionMessage,
} from '@solana/transaction-messages';
import { getCompiledTransactionMessageDecoder } from '@solana/transaction-messages';
import type { Transaction } from '@solana/transactions';
import { getTransactionDecoder } from '@solana/transactions';

import type { LoadedAddresses } from './loaded-addresses';

/**
 * The subset of a wire-format transaction response (`encoding: 'base58'` or
 * `'base64'`) that {@link decodeTransactionFromRpcResponse} reads: the
 * base-encoded wire-transaction tuple, plus the optional `meta` (carrying
 * `loadedAddresses`) and `version`.
 *
 * Only these fields are modeled — not the full RPC response envelope — so any
 * response carrying a compatible wire-transaction tuple satisfies it
 * structurally, regardless of which method produced it (`getTransaction`,
 * `getTransactionsForAddress`, or a future one).
 */
type DecodableWireTransactionResponse = Readonly<{
    meta?: unknown;
    transaction: Base58EncodedDataResponse | Base64EncodedDataResponse;
    version?: TransactionVersion;
}>;

/**
 * The subset of an `encoding: 'json'` transaction response that
 * {@link decodeTransactionFromRpcResponse} reads. Only the message fields the
 * decoder actually consumes are modeled, so any response carrying a compatible
 * `transaction.message` satisfies it structurally, regardless of which method
 * produced it.
 */
type DecodableJsonTransactionResponse = Readonly<{
    meta?: unknown;
    transaction: Readonly<{
        message: Readonly<{
            accountKeys: readonly Address[];
            // Nullable to match the RPC types
            addressTableLookups?:
                | readonly Readonly<{
                      accountKey: Address;
                      readonlyIndexes: readonly number[];
                      writableIndexes: readonly number[];
                  }>[]
                | null;
            header: Readonly<{
                numReadonlySignedAccounts: number;
                numReadonlyUnsignedAccounts: number;
                numRequiredSignatures: number;
            }>;
            instructions: readonly Readonly<{
                accounts: readonly number[];
                data: Base58EncodedBytes;
                programIdIndex: number;
            }>[];
            recentBlockhash: Blockhash;
        }>;
    }>;
    version?: TransactionVersion;
}>;

/**
 * Any confirmed-transaction RPC response that
 * {@link decodeTransactionFromRpcResponse} can decode, regardless of which
 * method produced it. The wire and JSON members are disjoint on the shape of
 * `transaction` (a base-encoded tuple vs. a structured message), which is what
 * lets the overloads resolve the correct return type per encoding.
 */
type DecodableTransactionResponse = DecodableJsonTransactionResponse | DecodableWireTransactionResponse;

/**
 * The result of decoding a confirmed-transaction RPC response: the
 * {@link CompiledTransactionMessage} (always with a `lifetimeToken` carrying
 * the recent blockhash), the loaded ALT addresses pulled from `meta` (if
 * any), and — for `'base64'` and `'base58'` responses — the wire-format
 * {@link Transaction}.
 *
 * `transaction` is omitted for `encoding: 'json'` responses: the server
 * has already decompiled the wire format, so there are no message bytes
 * to round-trip. If you need a re-encodable {@link Transaction}, fetch
 * the response with `encoding: 'base64'`.
 *
 * @example
 * ```ts
 * const { compiledMessage, loadedAddresses, transaction } =
 *     decodeTransactionFromRpcResponse(rpcResponse);
 * ```
 */
export type DecodedRpcTransaction = Readonly<{
    compiledMessage: CompiledTransactionMessage & CompiledTransactionMessageWithLifetime;
    loadedAddresses: LoadedAddresses;
    transaction?: Transaction;
}>;

const EMPTY_LOADED_ADDRESSES: LoadedAddresses = { readonly: [], writable: [] };

/**
 * Pulls `loadedAddresses` off a response `meta` field if present, regardless of
 * which encoding produced it. The conditional types in the RPC API mean some
 * `meta` shapes statically lack the field (legacy responses fetched without
 * `maxSupportedTransactionVersion`); we still need a uniform runtime extraction.
 */
function getLoadedAddresses(meta: unknown): LoadedAddresses {
    const loaded = (meta as { loadedAddresses?: LoadedAddresses } | null | undefined)?.loadedAddresses;
    return loaded ?? EMPTY_LOADED_ADDRESSES;
}

function decodeFromWire(wireBytes: Uint8Array): {
    compiledMessage: CompiledTransactionMessage & CompiledTransactionMessageWithLifetime;
    transaction: Transaction;
} {
    const transaction = getTransactionDecoder().decode(wireBytes);
    const compiledMessage = getCompiledTransactionMessageDecoder().decode(transaction.messageBytes);
    return { compiledMessage, transaction };
}

function decodeFromBase64(rpcTx: DecodableWireTransactionResponse): DecodedRpcTransaction {
    const [b64] = rpcTx.transaction;
    const { compiledMessage, transaction } = decodeFromWire(getBase64Encoder().encode(b64) as Uint8Array);
    return { compiledMessage, loadedAddresses: getLoadedAddresses(rpcTx.meta), transaction };
}

function decodeFromBase58(rpcTx: DecodableWireTransactionResponse): DecodedRpcTransaction {
    const [b58] = rpcTx.transaction;
    const { compiledMessage, transaction } = decodeFromWire(getBase58Encoder().encode(b58) as Uint8Array);
    return { compiledMessage, loadedAddresses: getLoadedAddresses(rpcTx.meta), transaction };
}

function decodeFromJson(rpcTx: DecodableJsonTransactionResponse): DecodedRpcTransaction {
    const base58 = getBase58Encoder();
    const { message } = rpcTx.transaction;
    const staticAccounts: Address[] = [...message.accountKeys];

    // The wire decoder omits `accountIndices` and `data` when they are
    // empty; do the same here so a JSON-derived message has the same shape
    // as a wire-derived one. Only the legacy/v0 shapes use this form — the
    // v1 branch builds instruction headers and payloads instead.
    const getCompiledInstructions = () =>
        message.instructions.map(ix => ({
            ...(ix.accounts.length ? { accountIndices: [...ix.accounts] } : null),
            ...(ix.data.length ? { data: base58.encode(ix.data) } : null),
            programAddressIndex: ix.programIdIndex,
        }));

    const header = {
        numReadonlyNonSignerAccounts: message.header.numReadonlyUnsignedAccounts,
        numReadonlySignerAccounts: message.header.numReadonlySignedAccounts,
        numSignerAccounts: message.header.numRequiredSignatures,
    };

    // The envelope only carries `version` when `maxSupportedTransactionVersion`
    // was set on the request; otherwise the response is necessarily legacy.
    // `??` (not `||`) so a legitimate `0` (v0) is not treated as absent.
    const version: TransactionVersion = rpcTx.version ?? 'legacy';

    // For transactions whose lifetime is specified by a durable nonce,
    // `message.recentBlockhash` is the nonce value, not a blockhash (see
    // `GetTransactionApi`). Either way it is the message's lifetime token,
    // so it maps onto `lifetimeToken` below — the same field the
    // wire-decoder path produces — and consumers see the same shape on
    // both encodings.
    let compiledMessage: CompiledTransactionMessage & CompiledTransactionMessageWithLifetime;
    switch (version) {
        case 'legacy':
            compiledMessage = {
                header,
                instructions: getCompiledInstructions(),
                lifetimeToken: message.recentBlockhash,
                staticAccounts,
                version: 'legacy',
            } satisfies CompiledTransactionMessageWithLifetime & LegacyCompiledTransactionMessage;
            break;
        case 0: {
            // The wire decoder omits `addressTableLookups` when the message
            // has none; match that here for shape parity.
            const addressTableLookups = message.addressTableLookups
                ? message.addressTableLookups.map(l => ({
                      lookupTableAddress: l.accountKey,
                      readonlyIndexes: l.readonlyIndexes,
                      writableIndexes: l.writableIndexes,
                  }))
                : [];
            compiledMessage = {
                ...(addressTableLookups.length ? { addressTableLookups } : null),
                header,
                instructions: getCompiledInstructions(),
                lifetimeToken: message.recentBlockhash,
                staticAccounts,
                version: 0,
            } satisfies CompiledTransactionMessageWithLifetime & V0CompiledTransactionMessage;
            break;
        }
        case 1: {
            const instructionData = message.instructions.map(ix => base58.encode(ix.data));
            compiledMessage = {
                // The `'json'` encoding does not carry the v1 transaction
                // config, so the synthesized message always reports an
                // empty one.
                configMask: 0,
                configValues: [],
                header,
                instructionHeaders: message.instructions.map((ix, i) => ({
                    numInstructionAccounts: ix.accounts.length,
                    numInstructionDataBytes: instructionData[i].byteLength,
                    programAccountIndex: ix.programIdIndex,
                })),
                instructionPayloads: message.instructions.map((ix, i) => ({
                    instructionAccountIndices: [...ix.accounts],
                    instructionData: instructionData[i],
                })),
                lifetimeToken: message.recentBlockhash,
                numInstructions: message.instructions.length,
                numStaticAccounts: staticAccounts.length,
                staticAccounts,
                version: 1,
            } satisfies CompiledTransactionMessageWithLifetime & V1CompiledTransactionMessage;
            break;
        }
        default: {
            // Compile-time exhaustiveness: a new `TransactionVersion`
            // member will fail to typecheck here, forcing this switch to
            // handle it explicitly.
            const _exhaustiveCheck: never = version;
            throw new SolanaError(SOLANA_ERROR__TRANSACTION__VERSION_NUMBER_NOT_SUPPORTED, {
                unsupportedVersion: _exhaustiveCheck as number,
            });
        }
    }

    return { compiledMessage, loadedAddresses: getLoadedAddresses(rpcTx.meta) };
}

function isBase64Response(rpcTx: DecodableTransactionResponse): rpcTx is DecodableWireTransactionResponse {
    const t = rpcTx.transaction;
    return Array.isArray(t) && t[1] === 'base64';
}

function isBase58Response(rpcTx: DecodableTransactionResponse): rpcTx is DecodableWireTransactionResponse {
    const t = rpcTx.transaction;
    return Array.isArray(t) && t[1] === 'base58';
}

function getJsonShapedMessage(rpcTx: DecodableTransactionResponse): Record<string, unknown> | undefined {
    const t = rpcTx.transaction;
    if (typeof t !== 'object' || t === null || Array.isArray(t) || !('message' in t)) return undefined;
    const message = (t as { message?: { instructions?: readonly unknown[] } }).message;
    if (!message || typeof message !== 'object' || !Array.isArray(message.instructions)) return undefined;
    return message as Record<string, unknown>;
}

/**
 * Detects an `encoding: 'json'` response specifically: its message carries
 * the compiled-message `header` (signer/readonly counts). A `jsonParsed`
 * message has no `header` — the server has already resolved the roles onto
 * each of its `accountKeys` — so checking for it distinguishes the two
 * encodings regardless of how many instructions the transaction has.
 */
function isJsonResponse(rpcTx: DecodableTransactionResponse): rpcTx is DecodableJsonTransactionResponse {
    const message = getJsonShapedMessage(rpcTx);
    return message != null && typeof message.header === 'object' && message.header !== null;
}

/**
 * Detects an `encoding: 'jsonParsed'` response: structurally a JSON message
 * but without the compiled-message `header` that the `'json'` encoding
 * carries. Its instructions arrive pre-parsed (with a `programId` address
 * rather than a `programIdIndex`) and are not round-trippable through the
 * kit codecs, so these responses are rejected.
 */
function isJsonParsedResponse(rpcTx: DecodableTransactionResponse): boolean {
    const message = getJsonShapedMessage(rpcTx);
    return message != null && !('header' in message);
}

/**
 * Decodes a confirmed-transaction RPC response (any of `encoding: 'base64'`,
 * `'base58'`, or `'json'`) into a {@link CompiledTransactionMessage} plus,
 * for `'base64'` and `'base58'`, a re-encodable {@link Transaction}. The
 * JSON path does not produce a `Transaction`: the server has already
 * decompiled the wire format, so there are no message bytes to carry.
 *
 * Because it reads only the `transaction` / `meta` / `version` envelope —
 * not a method-specific response shape — it accepts results from any method
 * that returns confirmed transactions in these encodings: `getTransaction`,
 * `getTransactionsForAddress`, and `getBlock` (the latter two with
 * `transactionDetails: 'full'`). The array-returning methods just need a map:
 *
 * ```ts
 * const { data } = await rpc.getTransactionsForAddress(address, {
 *     encoding: 'base64',
 *     maxSupportedTransactionVersion: 0,
 *     transactionDetails: 'full',
 * }).send();
 * const decoded = data.map(tx => decodeTransactionFromRpcResponse(tx));
 *
 * const block = await rpc.getBlock(slot, {
 *     encoding: 'base64',
 *     maxSupportedTransactionVersion: 0,
 *     transactionDetails: 'full',
 * }).send();
 * const decodedBlockTxs = block?.transactions.map(tx => decodeTransactionFromRpcResponse(tx)) ?? [];
 * ```
 *
 * `'jsonParsed'` is **not** supported — its instructions arrive
 * pre-parsed by the server and lack raw bytes, so they cannot be
 * round-tripped through the auto-generated `parseXInstruction` clients.
 * Passing a `'jsonParsed'` response throws
 * {@link SOLANA_ERROR__TRANSACTION_INTROSPECTION__CANNOT_DECODE_JSON_PARSED_TRANSACTION};
 * any other unrecognized input throws
 * {@link SOLANA_ERROR__TRANSACTION_INTROSPECTION__UNRECOGNIZED_GET_TRANSACTION_RESPONSE}.
 *
 * A response carrying a transaction version this package cannot decode
 * throws {@link SOLANA_ERROR__TRANSACTION__VERSION_NUMBER_NOT_SUPPORTED} —
 * raised by the JSON path for an unrecognized `version`, and by the wire
 * decoders for malformed binary input.
 *
 * Use this together with {@link getInstructionsFromCompiledTransactionMessage}
 * (or {@link walkInstructions}) to inspect a confirmed transaction's
 * instructions in a form the auto-generated `@solana-program/*` clients
 * can `parse` directly.
 *
 * Prefer `encoding: 'base64'` when bandwidth allows — it is the most
 * compact, the wire bytes round-trip cleanly through the kit codecs, and
 * the return type statically guarantees a re-encodable `transaction`.
 *
 * @example
 * ```ts
 * const rpcResponse = await rpc.getTransaction(signature(txid), {
 *     commitment: 'confirmed',
 *     encoding: 'base64',
 *     maxSupportedTransactionVersion: 0,
 * }).send();
 * if (!rpcResponse) throw new Error('not found');
 *
 * const { compiledMessage, loadedAddresses } = decodeTransactionFromRpcResponse(rpcResponse);
 * const instructions = getInstructionsFromCompiledTransactionMessage(compiledMessage, loadedAddresses);
 * ```
 */
export function decodeTransactionFromRpcResponse(
    rpcTx: DecodableWireTransactionResponse,
): DecodedRpcTransaction & { transaction: Transaction };
export function decodeTransactionFromRpcResponse(
    rpcTx: DecodableJsonTransactionResponse,
): DecodedRpcTransaction & { transaction?: never };
export function decodeTransactionFromRpcResponse(rpcTx: DecodableTransactionResponse): DecodedRpcTransaction {
    if (isBase64Response(rpcTx)) return decodeFromBase64(rpcTx);
    if (isBase58Response(rpcTx)) return decodeFromBase58(rpcTx);
    if (isJsonResponse(rpcTx)) return decodeFromJson(rpcTx);
    if (isJsonParsedResponse(rpcTx)) {
        throw new SolanaError(SOLANA_ERROR__TRANSACTION_INTROSPECTION__CANNOT_DECODE_JSON_PARSED_TRANSACTION);
    }
    throw new SolanaError(SOLANA_ERROR__TRANSACTION_INTROSPECTION__UNRECOGNIZED_GET_TRANSACTION_RESPONSE);
}
