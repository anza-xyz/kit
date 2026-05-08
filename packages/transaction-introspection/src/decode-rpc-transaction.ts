import type { Address } from '@solana/addresses';
import { getBase58Encoder, getBase64Encoder } from '@solana/codecs-strings';
import { SOLANA_ERROR__TRANSACTION__MALFORMED_MESSAGE_BYTES, SolanaError } from '@solana/errors';
import type {
    GetTransactionApiResponseBase58,
    GetTransactionApiResponseBase64,
    GetTransactionApiResponseJson,
} from '@solana/rpc-api';
import type {
    CompiledTransactionMessage,
    CompiledTransactionMessageWithLifetime,
    LegacyCompiledTransactionMessage,
    V0CompiledTransactionMessage,
} from '@solana/transaction-messages';
import { getCompiledTransactionMessageDecoder } from '@solana/transaction-messages';
import type { SignaturesMap, Transaction, TransactionMessageBytes } from '@solana/transactions';
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
export type Base64GetTransactionResponse<TMaxSupportedTransactionVersion extends 0 | void = 0 | void> =
    GetTransactionApiResponseBase64<TMaxSupportedTransactionVersion>;

/**
 * The shape of a non-null `getTransaction` response when called with
 * `encoding: 'base58'`. Re-exported from `@solana/rpc-api` for convenience
 * — one of the input types accepted by {@link decodeTransactionFromRpcResponse}.
 */
export type Base58GetTransactionResponse<TMaxSupportedTransactionVersion extends 0 | void = 0 | void> =
    GetTransactionApiResponseBase58<TMaxSupportedTransactionVersion>;

/**
 * The shape of a non-null `getTransaction` response when called with
 * `encoding: 'json'` (the default). Re-exported from `@solana/rpc-api` for
 * convenience — one of the input types accepted by
 * {@link decodeTransactionFromRpcResponse}.
 */
export type JsonGetTransactionResponse<TMaxSupportedTransactionVersion extends 0 | void = 0 | void> =
    GetTransactionApiResponseJson<TMaxSupportedTransactionVersion>;

type AnyGetTransactionResponse =
    | Base58GetTransactionResponse
    | Base64GetTransactionResponse
    | JsonGetTransactionResponse;

/**
 * The result of decoding a `getTransaction` response: the wire-format
 * {@link Transaction}, the {@link CompiledTransactionMessage} parsed from
 * its `messageBytes`, and the loaded ALT addresses pulled from `meta` (if
 * any).
 *
 * For `encoding: 'json'` responses, `transaction.messageBytes` is empty
 * (the server already decompiled the message; there are no wire bytes to
 * carry) and `transaction.signatures` is reconstructed by mapping each
 * JSON signature slot to the corresponding signer address. If you need a
 * re-encodable {@link Transaction}, fetch the response with
 * `encoding: 'base64'`.
 *
 * @example
 * ```ts
 * const { compiledMessage, loadedAddresses, transaction } =
 *     decodeTransactionFromRpcResponse(rpcResponse);
 * ```
 */
export type DecodedRpcTransaction = Readonly<{
    compiledMessage: CompiledTransactionMessage;
    loadedAddresses: LoadedAddresses;
    transaction: Transaction;
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
    compiledMessage: CompiledTransactionMessage;
    transaction: Transaction;
} {
    const transaction = getTransactionDecoder().decode(wireBytes);
    const compiledMessage = getCompiledTransactionMessageDecoder().decode(transaction.messageBytes);
    return { compiledMessage, transaction };
}

function decodeFromBase64<TMaxSupportedTransactionVersion extends 0 | void>(
    rpcTx: Base64GetTransactionResponse<TMaxSupportedTransactionVersion>,
): DecodedRpcTransaction {
    const [b64] = rpcTx.transaction;
    const { compiledMessage, transaction } = decodeFromWire(getBase64Encoder().encode(b64) as Uint8Array);
    return { compiledMessage, loadedAddresses: getLoadedAddresses(rpcTx.meta), transaction };
}

function decodeFromBase58<TMaxSupportedTransactionVersion extends 0 | void>(
    rpcTx: Base58GetTransactionResponse<TMaxSupportedTransactionVersion>,
): DecodedRpcTransaction {
    const [b58] = rpcTx.transaction;
    const { compiledMessage, transaction } = decodeFromWire(getBase58Encoder().encode(b58) as Uint8Array);
    return { compiledMessage, loadedAddresses: getLoadedAddresses(rpcTx.meta), transaction };
}

function decodeFromJson<TMaxSupportedTransactionVersion extends 0 | void>(
    rpcTx: JsonGetTransactionResponse<TMaxSupportedTransactionVersion>,
): DecodedRpcTransaction {
    const base58 = getBase58Encoder();
    const { message, signatures } = rpcTx.transaction;
    const staticAccounts: Address[] = [...message.accountKeys];

    const compiledInstructions = message.instructions.map(ix => ({
        ...(ix.accounts.length ? { accountIndices: [...ix.accounts] } : null),
        ...(ix.data ? { data: base58.encode(ix.data) } : null),
        programAddressIndex: ix.programIdIndex,
    }));

    const header = {
        numReadonlyNonSignerAccounts: message.header.numReadonlyUnsignedAccounts,
        numReadonlySignerAccounts: message.header.numReadonlySignedAccounts,
        numSignerAccounts: message.header.numRequiredSignatures,
    };

    // The envelope only carries `version` when `maxSupportedTransactionVersion`
    // was set on the request; otherwise the response is necessarily legacy.
    const version: 'legacy' | 0 = 'version' in rpcTx ? (rpcTx.version as 0) : 'legacy';

    // Mirror the wire-decoder path, which produces a message intersected with
    // `CompiledTransactionMessageWithLifetime`. The recent-blockhash lives in
    // `lifetimeToken` so consumers see the same field on both encodings.
    const compiledMessage: CompiledTransactionMessage & CompiledTransactionMessageWithLifetime =
        version === 0
            ? ({
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
              } satisfies CompiledTransactionMessageWithLifetime & V0CompiledTransactionMessage)
            : ({
                  header,
                  instructions: compiledInstructions,
                  lifetimeToken: message.recentBlockhash,
                  staticAccounts,
                  version: 'legacy',
              } satisfies CompiledTransactionMessageWithLifetime & LegacyCompiledTransactionMessage);

    // The wire `Transaction.signatures` is keyed by signer address; the JSON
    // response gives us a parallel array indexed by signer slot. Signers
    // always begin at index 0 in `staticAccounts`. Any signature slot beyond
    // `numRequiredSignatures` is a malformed response and is ignored.
    const signaturesMap: SignaturesMap = {};
    const numSigners = Math.min(header.numSignerAccounts, signatures.length, staticAccounts.length);
    for (let i = 0; i < numSigners; i++) {
        const signer = staticAccounts[i];
        signaturesMap[signer] = base58.encode(signatures[i]) as unknown as SignaturesMap[Address];
    }

    const transaction: Transaction = {
        messageBytes: new Uint8Array(0) as unknown as TransactionMessageBytes,
        signatures: signaturesMap,
    };

    return { compiledMessage, loadedAddresses: getLoadedAddresses(rpcTx.meta), transaction };
}

function isBase64Response(rpcTx: AnyGetTransactionResponse): rpcTx is Base64GetTransactionResponse {
    const t = rpcTx.transaction;
    return Array.isArray(t) && t[1] === 'base64';
}

function isBase58Response(rpcTx: AnyGetTransactionResponse): rpcTx is Base58GetTransactionResponse {
    const t = rpcTx.transaction;
    return Array.isArray(t) && t[1] === 'base58';
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
    const t = rpcTx.transaction;
    if (typeof t !== 'object' || t === null || Array.isArray(t) || !('message' in t)) return false;
    const message = (t as { message?: { instructions?: readonly unknown[] } }).message;
    if (!message || !Array.isArray(message.instructions)) return false;
    // No instructions: either `json` or `jsonParsed` could produce this shape, but
    // there's nothing to decode incorrectly either way — accept it as `json`.
    if (message.instructions.length === 0) return true;
    const first = message.instructions[0] as Record<string, unknown>;
    return typeof first.programIdIndex === 'number' && Array.isArray(first.accounts);
}

/**
 * Decodes a `getTransaction` response (any of `encoding: 'base64'`,
 * `'base58'`, or `'json'`) into a kit {@link Transaction} and
 * {@link CompiledTransactionMessage}.
 *
 * `'jsonParsed'` is **not** supported — its instructions arrive
 * pre-parsed by the server and lack raw bytes, so they cannot be
 * round-tripped through the auto-generated `parseXInstruction` clients.
 * Passing a `'jsonParsed'` response throws
 * {@link SOLANA_ERROR__TRANSACTION__MALFORMED_MESSAGE_BYTES}.
 *
 * Use this together with {@link getInstructionsFromCompiledTransactionMessage}
 * (or {@link walkInstructions}) to inspect a confirmed transaction's
 * instructions in a form the auto-generated `@solana-program/*` clients
 * can `parse` directly.
 *
 * Prefer `encoding: 'base64'` when bandwidth allows — it is the most
 * compact and the wire bytes round-trip cleanly through the kit codecs.
 * `encoding: 'json'` is also accepted, but the resulting `transaction`
 * carries an empty `messageBytes` (the server already decompiled the
 * wire format) and is therefore not re-encodable.
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
export function decodeTransactionFromRpcResponse<TMaxSupportedTransactionVersion extends 0 | void = 0 | void>(
    rpcTx: Base64GetTransactionResponse<TMaxSupportedTransactionVersion>,
): DecodedRpcTransaction;
export function decodeTransactionFromRpcResponse<TMaxSupportedTransactionVersion extends 0 | void = 0 | void>(
    rpcTx: Base58GetTransactionResponse<TMaxSupportedTransactionVersion>,
): DecodedRpcTransaction;
export function decodeTransactionFromRpcResponse<TMaxSupportedTransactionVersion extends 0 | void = 0 | void>(
    rpcTx: JsonGetTransactionResponse<TMaxSupportedTransactionVersion>,
): DecodedRpcTransaction;
export function decodeTransactionFromRpcResponse<TMaxSupportedTransactionVersion extends 0 | void = 0 | void>(
    rpcTx:
        | Base58GetTransactionResponse<TMaxSupportedTransactionVersion>
        | Base64GetTransactionResponse<TMaxSupportedTransactionVersion>
        | JsonGetTransactionResponse<TMaxSupportedTransactionVersion>,
): DecodedRpcTransaction {
    const tx = rpcTx as AnyGetTransactionResponse;
    if (isBase64Response(tx)) return decodeFromBase64(tx);
    if (isBase58Response(tx)) return decodeFromBase58(tx);
    if (isJsonResponse(tx)) return decodeFromJson(tx);
    throw new SolanaError(SOLANA_ERROR__TRANSACTION__MALFORMED_MESSAGE_BYTES, {
        messageBytes: new Uint8Array(0),
    });
}
