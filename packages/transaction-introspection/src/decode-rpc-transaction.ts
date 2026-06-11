import type { Address } from '@solana/addresses';
import { getBase58Encoder, getBase64Encoder } from '@solana/codecs-strings';
import {
    SOLANA_ERROR__TRANSACTION__VERSION_NUMBER_NOT_SUPPORTED,
    SOLANA_ERROR__TRANSACTION_INTROSPECTION__CANNOT_DECODE_JSON_PARSED_TRANSACTION,
    SOLANA_ERROR__TRANSACTION_INTROSPECTION__UNRECOGNIZED_GET_TRANSACTION_RESPONSE,
    SolanaError,
} from '@solana/errors';
import type {
    GetTransactionApiResponseBase58,
    GetTransactionApiResponseBase64,
    GetTransactionApiResponseJson,
} from '@solana/rpc-api';
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

import type { LoadedAddresses } from './get-all-addresses';

/**
 * The shape of a non-null `getTransaction` response when called with
 * `encoding: 'base64'`. Re-exported from `@solana/rpc-api` for convenience
 * — one of the input types accepted by {@link decodeTransactionFromRpcResponse}.
 *
 * @example
 * ```ts
 * const rpcResponse: Base64GetTransactionResponse<0> = await rpc
 *     .getTransaction(sig, { encoding: 'base64', maxSupportedTransactionVersion: 0 })
 *     .send();
 * ```
 */
export type Base64GetTransactionResponse<
    TMaxSupportedTransactionVersion extends TransactionVersion | void = TransactionVersion | void,
> = GetTransactionApiResponseBase64<TMaxSupportedTransactionVersion>;

/**
 * The shape of a non-null `getTransaction` response when called with
 * `encoding: 'base58'`. Re-exported from `@solana/rpc-api` for convenience
 * — one of the input types accepted by {@link decodeTransactionFromRpcResponse}.
 */
export type Base58GetTransactionResponse<
    TMaxSupportedTransactionVersion extends TransactionVersion | void = TransactionVersion | void,
> = GetTransactionApiResponseBase58<TMaxSupportedTransactionVersion>;

/**
 * The shape of a non-null `getTransaction` response when called with
 * `encoding: 'json'` (the default). Re-exported from `@solana/rpc-api` for
 * convenience — one of the input types accepted by
 * {@link decodeTransactionFromRpcResponse}.
 */
export type JsonGetTransactionResponse<
    TMaxSupportedTransactionVersion extends TransactionVersion | void = TransactionVersion | void,
> = GetTransactionApiResponseJson<TMaxSupportedTransactionVersion>;

type AnyGetTransactionResponse =
    | Base58GetTransactionResponse
    | Base64GetTransactionResponse
    | JsonGetTransactionResponse;

/**
 * The result of decoding a `getTransaction` response: the
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
 * Pulls `loadedAddresses` off a `getTransaction` `meta` field if present,
 * regardless of which encoding overload produced it. The conditional types
 * in `@solana/rpc-api` mean some `meta` shapes statically lack the field
 * (legacy responses fetched without `maxSupportedTransactionVersion`); we
 * still need a uniform runtime extraction.
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

function decodeFromBase64<TMaxSupportedTransactionVersion extends TransactionVersion | void>(
    rpcTx: Base64GetTransactionResponse<TMaxSupportedTransactionVersion>,
): DecodedRpcTransaction {
    const [b64] = rpcTx.transaction;
    const { compiledMessage, transaction } = decodeFromWire(getBase64Encoder().encode(b64) as Uint8Array);
    return { compiledMessage, loadedAddresses: getLoadedAddresses(rpcTx.meta), transaction };
}

function decodeFromBase58<TMaxSupportedTransactionVersion extends TransactionVersion | void>(
    rpcTx: Base58GetTransactionResponse<TMaxSupportedTransactionVersion>,
): DecodedRpcTransaction {
    const [b58] = rpcTx.transaction;
    const { compiledMessage, transaction } = decodeFromWire(getBase58Encoder().encode(b58) as Uint8Array);
    return { compiledMessage, loadedAddresses: getLoadedAddresses(rpcTx.meta), transaction };
}

function decodeFromJson<TMaxSupportedTransactionVersion extends TransactionVersion | void>(
    rpcTx: JsonGetTransactionResponse<TMaxSupportedTransactionVersion>,
): DecodedRpcTransaction {
    const base58 = getBase58Encoder();
    const { message } = rpcTx.transaction;
    const staticAccounts: Address[] = [...message.accountKeys];

    // The wire decoder omits `accountIndices` and `data` when they are
    // empty; do the same here so a JSON-derived message has the same shape
    // as a wire-derived one.
    const compiledInstructions = message.instructions.map(ix => ({
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
    const version: TransactionVersion = 'version' in rpcTx ? rpcTx.version : 'legacy';

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
                instructions: compiledInstructions,
                lifetimeToken: message.recentBlockhash,
                staticAccounts,
                version: 'legacy',
            } satisfies CompiledTransactionMessageWithLifetime & LegacyCompiledTransactionMessage;
            break;
        case 0:
            compiledMessage = {
                addressTableLookups:
                    'addressTableLookups' in message
                        ? message.addressTableLookups.map(l => ({
                              lookupTableAddress: l.accountKey,
                              readonlyIndexes: l.readonlyIndexes,
                              writableIndexes: l.writableIndexes,
                          }))
                        : [],
                header,
                instructions: compiledInstructions,
                lifetimeToken: message.recentBlockhash,
                staticAccounts,
                version: 0,
            } satisfies CompiledTransactionMessageWithLifetime & V0CompiledTransactionMessage;
            break;
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

function isBase64Response(rpcTx: AnyGetTransactionResponse): rpcTx is Base64GetTransactionResponse {
    const t = rpcTx.transaction;
    return Array.isArray(t) && t[1] === 'base64';
}

function isBase58Response(rpcTx: AnyGetTransactionResponse): rpcTx is Base58GetTransactionResponse {
    const t = rpcTx.transaction;
    return Array.isArray(t) && t[1] === 'base58';
}

function getJsonMessageInstructions(rpcTx: AnyGetTransactionResponse): readonly unknown[] | undefined {
    const t = rpcTx.transaction;
    if (typeof t !== 'object' || t === null || Array.isArray(t) || !('message' in t)) return undefined;
    const message = (t as { message?: { instructions?: readonly unknown[] } }).message;
    if (!message || !Array.isArray(message.instructions)) return undefined;
    return message.instructions;
}

/**
 * Detects an `encoding: 'json'` response specifically — i.e. one whose
 * instructions carry numeric account indices and a `programIdIndex`. A
 * `jsonParsed` response also has a `transaction.message.instructions`
 * shape but its instructions carry `programId` (an `Address`, not an
 * index) and either a `parsed` blob or `accounts: Address[]` with
 * `programId`. Those are not round-trippable through the kit codecs and
 * are rejected.
 */
function isJsonResponse(rpcTx: AnyGetTransactionResponse): rpcTx is JsonGetTransactionResponse {
    const instructions = getJsonMessageInstructions(rpcTx);
    if (!instructions) return false;
    // No instructions: either `json` or `jsonParsed` could produce this shape, but
    // there's nothing to decode incorrectly either way — accept it as `json`.
    if (instructions.length === 0) return true;
    const first = instructions[0] as Record<string, unknown>;
    return typeof first.programIdIndex === 'number' && Array.isArray(first.accounts);
}

/**
 * Detects an `encoding: 'jsonParsed'` response: its instructions carry a
 * `programId` address rather than the `programIdIndex` that the `'json'`
 * encoding uses.
 */
function isJsonParsedResponse(rpcTx: AnyGetTransactionResponse): boolean {
    const instructions = getJsonMessageInstructions(rpcTx);
    if (!instructions || instructions.length === 0) return false;
    const first = instructions[0] as Record<string, unknown>;
    return typeof first.programId === 'string' && !('programIdIndex' in first);
}

/**
 * Decodes a `getTransaction` response (any of `encoding: 'base64'`,
 * `'base58'`, or `'json'`) into a {@link CompiledTransactionMessage} plus,
 * for `'base64'` and `'base58'`, a re-encodable {@link Transaction}. The
 * JSON path does not produce a `Transaction`: the server has already
 * decompiled the wire format, so there are no message bytes to carry.
 *
 * `'jsonParsed'` is **not** supported — its instructions arrive
 * pre-parsed by the server and lack raw bytes, so they cannot be
 * round-tripped through the auto-generated `parseXInstruction` clients.
 * Passing a `'jsonParsed'` response throws
 * {@link SOLANA_ERROR__TRANSACTION_INTROSPECTION__CANNOT_DECODE_JSON_PARSED_TRANSACTION};
 * any other unrecognized input throws
 * {@link SOLANA_ERROR__TRANSACTION_INTROSPECTION__UNRECOGNIZED_GET_TRANSACTION_RESPONSE}.
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
export function decodeTransactionFromRpcResponse<
    TMaxSupportedTransactionVersion extends TransactionVersion | void = TransactionVersion | void,
>(
    rpcTx: Base64GetTransactionResponse<TMaxSupportedTransactionVersion>,
): DecodedRpcTransaction & { transaction: Transaction };
export function decodeTransactionFromRpcResponse<
    TMaxSupportedTransactionVersion extends TransactionVersion | void = TransactionVersion | void,
>(
    rpcTx: Base58GetTransactionResponse<TMaxSupportedTransactionVersion>,
): DecodedRpcTransaction & { transaction: Transaction };
export function decodeTransactionFromRpcResponse<
    TMaxSupportedTransactionVersion extends TransactionVersion | void = TransactionVersion | void,
>(rpcTx: JsonGetTransactionResponse<TMaxSupportedTransactionVersion>): DecodedRpcTransaction;
export function decodeTransactionFromRpcResponse<
    TMaxSupportedTransactionVersion extends TransactionVersion | void = TransactionVersion | void,
>(
    rpcTx:
        | Base58GetTransactionResponse<TMaxSupportedTransactionVersion>
        | Base64GetTransactionResponse<TMaxSupportedTransactionVersion>
        | JsonGetTransactionResponse<TMaxSupportedTransactionVersion>,
): DecodedRpcTransaction {
    const tx = rpcTx as AnyGetTransactionResponse;
    if (isBase64Response(tx)) return decodeFromBase64(tx);
    if (isBase58Response(tx)) return decodeFromBase58(tx);
    if (isJsonResponse(tx)) return decodeFromJson(tx);
    if (isJsonParsedResponse(tx)) {
        throw new SolanaError(SOLANA_ERROR__TRANSACTION_INTROSPECTION__CANNOT_DECODE_JSON_PARSED_TRANSACTION);
    }
    throw new SolanaError(SOLANA_ERROR__TRANSACTION_INTROSPECTION__UNRECOGNIZED_GET_TRANSACTION_RESPONSE);
}
