import type { Address } from '@solana/addresses';
import { getBase58Decoder, getBase64Decoder, getBase64Encoder } from '@solana/codecs-strings';
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
import { getCompiledTransactionMessageEncoder } from '@solana/transaction-messages';
import { getTransactionEncoder } from '@solana/transactions';

import { decodeTransactionFromRpcResponse } from '../decode-rpc-transaction';

describe('decodeTransactionFromRpcResponse', () => {
    function buildBase64Tx() {
        const compiled = {
            header: {
                numReadonlyNonSignerAccounts: 0,
                numReadonlySignerAccounts: 0,
                numSignerAccounts: 1,
            },
            instructions: [],
            lifetimeToken: '11111111111111111111111111111111',
            staticAccounts: ['11111111111111111111111111111112' as Address],
            version: 'legacy',
        } as Parameters<ReturnType<typeof getCompiledTransactionMessageEncoder>['encode']>[0];
        const messageBytes = getCompiledTransactionMessageEncoder().encode(compiled);
        const transactionBytes = getTransactionEncoder().encode({
            messageBytes: messageBytes as Parameters<
                ReturnType<typeof getTransactionEncoder>['encode']
            >[0]['messageBytes'],
            signatures: { ['11111111111111111111111111111112' as Address]: null },
        });
        return getBase64Decoder().decode(transactionBytes);
    }

    it('decodes a valid base64 response into a Transaction + CompiledTransactionMessage', () => {
        const b64 = buildBase64Tx();
        const rpcTx = {
            meta: { loadedAddresses: { readonly: ['ro' as Address], writable: ['w' as Address] } },
            transaction: [b64, 'base64'],
        } as unknown as GetTransactionApiResponseBase64<0>;
        const result = decodeTransactionFromRpcResponse(rpcTx);

        expect(result.compiledMessage.version).toBe('legacy');
        expect(result.compiledMessage.staticAccounts).toStrictEqual(['11111111111111111111111111111112']);
        expect(result.transaction.signatures).toBeDefined();
        expect(result.loadedAddresses).toStrictEqual({ readonly: ['ro'], writable: ['w'] });
        // The wire-decoder path sets `lifetimeToken` from the encoded message.
        expect(result.compiledMessage.lifetimeToken).toBe('11111111111111111111111111111111');
    });

    it('returns empty loaded addresses when meta is null', () => {
        const b64 = buildBase64Tx();
        const rpcTx = { meta: null, transaction: [b64, 'base64'] } as unknown as GetTransactionApiResponseBase64<0>;
        const result = decodeTransactionFromRpcResponse(rpcTx);
        expect(result.loadedAddresses).toStrictEqual({ readonly: [], writable: [] });
    });

    it('returns empty loaded addresses for a legacy response (meta has no `loadedAddresses` key)', () => {
        const b64 = buildBase64Tx();
        // No `maxSupportedTransactionVersion` was passed, so meta lacks `loadedAddresses`.
        const rpcTx = {
            meta: { fee: 5000n },
            transaction: [b64, 'base64'],
        } as unknown as GetTransactionApiResponseBase64;
        const result = decodeTransactionFromRpcResponse(rpcTx);
        expect(result.loadedAddresses).toStrictEqual({ readonly: [], writable: [] });
    });

    it('decodes a valid base58 response into a Transaction + CompiledTransactionMessage', () => {
        const b64 = buildBase64Tx();
        const wireBytes = getBase64Encoder().encode(b64) as Uint8Array;
        const b58 = getBase58Decoder().decode(wireBytes);
        const rpcTx = {
            meta: null,
            transaction: [b58, 'base58'],
        } as unknown as GetTransactionApiResponseBase58<0>;
        const result = decodeTransactionFromRpcResponse(rpcTx);

        expect(result.compiledMessage.version).toBe('legacy');
        expect(result.compiledMessage.staticAccounts).toStrictEqual(['11111111111111111111111111111112']);
    });

    it('decodes a JSON (legacy) response into a synthesized CompiledTransactionMessage', () => {
        const innerData = '3Bxs411Dtc7pkFQj'; // arbitrary base58
        const rpcTx = {
            meta: null,
            transaction: {
                message: {
                    accountKeys: ['fee-payer' as Address, 'program' as Address],
                    header: {
                        numReadonlySignedAccounts: 0,
                        numReadonlyUnsignedAccounts: 1,
                        numRequiredSignatures: 1,
                    },
                    instructions: [{ accounts: [0], data: innerData, programIdIndex: 1 }],
                    recentBlockhash: '11111111111111111111111111111111',
                },
                signatures: [],
            },
        } as unknown as GetTransactionApiResponseJson;
        const result = decodeTransactionFromRpcResponse(rpcTx);

        expect(result.compiledMessage.version).toBe('legacy');
        expect(result.compiledMessage.staticAccounts).toStrictEqual(['fee-payer', 'program']);
        const legacy = result.compiledMessage as Extract<typeof result.compiledMessage, { version: 'legacy' }>;
        expect(legacy.instructions).toHaveLength(1);
        const ix = legacy.instructions[0];
        expect(ix.programAddressIndex).toBe(1);
        expect(ix.accountIndices).toStrictEqual([0]);
        expect(ix.data).toBeInstanceOf(Uint8Array);
        // `transaction` is omitted for JSON responses (no re-encodable wire bytes).
        expect(result.transaction).toBeUndefined();
        // `lifetimeToken` parity with the base64/base58 paths.
        expect(result.compiledMessage.lifetimeToken).toBe('11111111111111111111111111111111');
    });

    it('decodes a JSON (v0) response with addressTableLookups + loadedAddresses', () => {
        const rpcTx = {
            meta: { loadedAddresses: { readonly: ['alt-ro' as Address], writable: ['alt-w' as Address] } },
            transaction: {
                message: {
                    accountKeys: ['fee-payer' as Address, 'program' as Address],
                    addressTableLookups: [{ accountKey: 'lut' as Address, readonlyIndexes: [3], writableIndexes: [2] }],
                    header: {
                        numReadonlySignedAccounts: 0,
                        numReadonlyUnsignedAccounts: 1,
                        numRequiredSignatures: 1,
                    },
                    instructions: [{ accounts: [], data: '', programIdIndex: 1 }],
                    recentBlockhash: '11111111111111111111111111111111',
                },
                signatures: [],
            },
            version: 0,
        } as unknown as GetTransactionApiResponseJson<0>;
        const result = decodeTransactionFromRpcResponse(rpcTx);

        expect(result.compiledMessage.version).toBe(0);
        expect(result.loadedAddresses).toStrictEqual({ readonly: ['alt-ro'], writable: ['alt-w'] });
        const v0 = result.compiledMessage as Extract<typeof result.compiledMessage, { version: 0 }>;
        expect(v0.addressTableLookups).toStrictEqual([
            { lookupTableAddress: 'lut', readonlyIndexes: [3], writableIndexes: [2] },
        ]);
    });

    it('decodes a JSON (v1) response into a synthesized V1CompiledTransactionMessage', () => {
        const innerData = '3Bxs411Dtc7pkFQj'; // arbitrary base58
        const rpcTx = {
            meta: null,
            transaction: {
                message: {
                    accountKeys: ['fee-payer' as Address, 'program' as Address],
                    header: {
                        numReadonlySignedAccounts: 0,
                        numReadonlyUnsignedAccounts: 1,
                        numRequiredSignatures: 1,
                    },
                    instructions: [{ accounts: [0], data: innerData, programIdIndex: 1 }],
                    recentBlockhash: '11111111111111111111111111111111',
                },
                signatures: [],
            },
            version: 1,
        } as unknown as GetTransactionApiResponseJson<1>;
        const result = decodeTransactionFromRpcResponse(rpcTx);

        expect(result.compiledMessage.version).toBe(1);
        const v1 = result.compiledMessage as Extract<typeof result.compiledMessage, { version: 1 }>;
        expect(v1.staticAccounts).toStrictEqual(['fee-payer', 'program']);
        expect(v1.numStaticAccounts).toBe(2);
        expect(v1.numInstructions).toBe(1);
        expect(v1.instructionHeaders).toHaveLength(1);
        expect(v1.instructionHeaders[0].programAccountIndex).toBe(1);
        expect(v1.instructionHeaders[0].numInstructionAccounts).toBe(1);
        expect(v1.instructionPayloads[0].instructionAccountIndices).toStrictEqual([0]);
        expect(v1.instructionHeaders[0].numInstructionDataBytes).toBe(
            v1.instructionPayloads[0].instructionData.byteLength,
        );
        expect(result.compiledMessage.lifetimeToken).toBe('11111111111111111111111111111111');
        expect(result.transaction).toBeUndefined();
    });

    it('throws SOLANA_ERROR__TRANSACTION__VERSION_NUMBER_NOT_SUPPORTED for an unknown JSON transaction version', () => {
        const rpcTx = {
            meta: null,
            transaction: {
                message: {
                    accountKeys: ['fee-payer' as Address, 'program' as Address],
                    header: {
                        numReadonlySignedAccounts: 0,
                        numReadonlyUnsignedAccounts: 1,
                        numRequiredSignatures: 1,
                    },
                    instructions: [{ accounts: [0], data: '3Bxs411Dtc7pkFQj', programIdIndex: 1 }],
                    recentBlockhash: '11111111111111111111111111111111',
                },
                signatures: [],
            },
            version: 99,
        } as unknown as GetTransactionApiResponseJson;
        expect(() => decodeTransactionFromRpcResponse(rpcTx)).toThrow(
            new SolanaError(SOLANA_ERROR__TRANSACTION__VERSION_NUMBER_NOT_SUPPORTED, { unsupportedVersion: 99 }),
        );
    });

    it('throws SOLANA_ERROR__TRANSACTION_INTROSPECTION__UNRECOGNIZED_GET_TRANSACTION_RESPONSE for an unrecognized response shape', () => {
        const rpcTx = { meta: null, transaction: 'totally bogus' } as unknown as GetTransactionApiResponseBase64;
        expect(() => decodeTransactionFromRpcResponse(rpcTx)).toThrow(
            new SolanaError(SOLANA_ERROR__TRANSACTION_INTROSPECTION__UNRECOGNIZED_GET_TRANSACTION_RESPONSE),
        );
    });

    it('rejects a `jsonParsed` response with `parsed` instructions', () => {
        // jsonParsed wraps each instruction in a `{ parsed, program, programId }` shape rather
        // than the indexed shape `decodeFromJson` expects. Without an explicit shape check this
        // would silently emit a corrupt CompiledTransactionMessage.
        const rpcTx = {
            meta: null,
            transaction: {
                message: {
                    accountKeys: [
                        { pubkey: 'fee-payer' as Address, signer: true, source: 'transaction', writable: true },
                    ],
                    instructions: [
                        {
                            parsed: { info: {}, type: 'transfer' },
                            program: 'system',
                            programId: '11111111111111111111111111111111' as Address,
                        },
                    ],
                    recentBlockhash: '11111111111111111111111111111111',
                },
                signatures: [],
            },
        } as unknown as GetTransactionApiResponseJson;
        expect(() => decodeTransactionFromRpcResponse(rpcTx)).toThrow(
            new SolanaError(SOLANA_ERROR__TRANSACTION_INTROSPECTION__CANNOT_DECODE_JSON_PARSED_TRANSACTION),
        );
    });

    it('rejects a `jsonParsed` response with `partiallyDecoded` instructions', () => {
        // Partially-decoded jsonParsed instructions lack programIdIndex/accounts:number[] too.
        const rpcTx = {
            meta: null,
            transaction: {
                message: {
                    accountKeys: [
                        { pubkey: 'fee-payer' as Address, signer: true, source: 'transaction', writable: true },
                    ],
                    instructions: [
                        {
                            accounts: ['some-address' as Address],
                            data: 'base58data',
                            programId: '11111111111111111111111111111111' as Address,
                        },
                    ],
                    recentBlockhash: '11111111111111111111111111111111',
                },
                signatures: [],
            },
        } as unknown as GetTransactionApiResponseJson;
        expect(() => decodeTransactionFromRpcResponse(rpcTx)).toThrow(
            new SolanaError(SOLANA_ERROR__TRANSACTION_INTROSPECTION__CANNOT_DECODE_JSON_PARSED_TRANSACTION),
        );
    });
});
