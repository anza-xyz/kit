import type { Address } from '@solana/addresses';
import { getBase58Decoder } from '@solana/codecs-strings';
import { isInstructionForProgram } from '@solana/instructions';
import type { Base58EncodedBytes } from '@solana/rpc-types';
import type { CompiledTransactionMessage } from '@solana/transaction-messages';

import { decodeTransactionFromRpcResponse, type JsonGetTransactionResponse } from '../decode-rpc-transaction';
import { walkInstructions } from '../walk-instructions';

const base58 = getBase58Decoder();
const asB58 = (bytes: Uint8Array): Base58EncodedBytes => base58.decode(bytes) as Base58EncodedBytes;

const compiled = {
    header: {
        numReadonlyNonSignerAccounts: 1,
        numReadonlySignerAccounts: 0,
        numSignerAccounts: 1,
    },
    instructions: [
        { accountIndices: [0], data: new Uint8Array([1]), programAddressIndex: 1 },
        { accountIndices: [0], data: new Uint8Array([2]), programAddressIndex: 2 },
    ],
    staticAccounts: ['fee-payer' as Address, 'program-a' as Address, 'program-b' as Address],
    version: 'legacy',
} as CompiledTransactionMessage;

describe('walkInstructions', () => {
    it('returns outer instructions in order with `outer` traces', () => {
        const out = walkInstructions({ compiledMessage: compiled });
        expect(out).toHaveLength(2);
        expect(out[0].trace).toStrictEqual({ index: 0, kind: 'outer' });
        expect(out[0].programAddress).toBe('program-a');
        expect(out[1].trace).toStrictEqual({ index: 1, kind: 'outer' });
        expect(out[1].programAddress).toBe('program-b');
    });

    it('appends inner instructions from meta with `inner` traces', () => {
        const innerData = asB58(new Uint8Array([42]));
        const out = walkInstructions({
            compiledMessage: compiled,
            meta: {
                innerInstructions: [
                    {
                        index: 1,
                        instructions: [{ accounts: [0], data: innerData, programIdIndex: 1, stackHeight: 2 }],
                    },
                ],
            },
        });
        expect(out).toHaveLength(3);
        expect(out[2].trace).toStrictEqual({ innerIndex: 0, kind: 'inner', outerIndex: 1, stackHeight: 2 });
        expect(out[2].programAddress).toBe('program-a');
    });

    it('returned items are usable directly with isInstructionForProgram', () => {
        const PROGRAM_B = 'program-b' as Address<'program-b'>;
        const filtered = walkInstructions({ compiledMessage: compiled }).filter(ix =>
            isInstructionForProgram(ix, PROGRAM_B),
        );
        expect(filtered).toHaveLength(1);
        expect(filtered[0].programAddress).toBe(PROGRAM_B);
    });
});

describe('walkInstructions over a JSON-decoded transaction', () => {
    it('returns outer + inner instructions from a JSON `getTransaction` response', () => {
        const innerData = asB58(new Uint8Array([42]));
        const rpcTx = {
            meta: {
                innerInstructions: [
                    {
                        index: 0,
                        instructions: [{ accounts: [0], data: innerData, programIdIndex: 1, stackHeight: 2 }],
                    },
                ],
            },
            transaction: {
                message: {
                    accountKeys: ['fee-payer' as Address, 'program-a' as Address],
                    header: {
                        numReadonlySignedAccounts: 0,
                        numReadonlyUnsignedAccounts: 1,
                        numRequiredSignatures: 1,
                    },
                    instructions: [{ accounts: [0], data: asB58(new Uint8Array([7])), programIdIndex: 1 }],
                    recentBlockhash: '11111111111111111111111111111111',
                },
                signatures: [],
            },
        } as unknown as JsonGetTransactionResponse;

        const { compiledMessage, loadedAddresses } = decodeTransactionFromRpcResponse(rpcTx);
        const traced = walkInstructions({ compiledMessage, loadedAddresses, meta: rpcTx.meta });
        expect(traced).toHaveLength(2);
        expect(traced[0].trace).toStrictEqual({ index: 0, kind: 'outer' });
        expect(traced[0].programAddress).toBe('program-a');
        expect(Array.from(traced[0].data)).toStrictEqual([7]);
        expect(traced[1].trace).toStrictEqual({ innerIndex: 0, kind: 'inner', outerIndex: 0, stackHeight: 2 });
    });
});

describe('walkInstructions over a v1 transaction', () => {
    const v1Compiled = {
        configMask: 0,
        configValues: [],
        header: {
            numReadonlyNonSignerAccounts: 1,
            numReadonlySignerAccounts: 0,
            numSignerAccounts: 1,
        },
        instructionHeaders: [
            { numInstructionAccounts: 1, numInstructionDataBytes: 1, programAccountIndex: 1 },
            { numInstructionAccounts: 1, numInstructionDataBytes: 1, programAccountIndex: 2 },
        ],
        instructionPayloads: [
            { instructionAccountIndices: [0], instructionData: new Uint8Array([1]) },
            { instructionAccountIndices: [0], instructionData: new Uint8Array([2]) },
        ],
        numInstructions: 2,
        numStaticAccounts: 3,
        staticAccounts: ['fee-payer' as Address, 'program-a' as Address, 'program-b' as Address],
        version: 1,
    } as unknown as CompiledTransactionMessage;

    it('returns v1 outer instructions in order', () => {
        const out = walkInstructions({ compiledMessage: v1Compiled });
        expect(out).toHaveLength(2);
        expect(out[0].trace).toStrictEqual({ index: 0, kind: 'outer' });
        expect(out[0].programAddress).toBe('program-a');
        expect(Array.from(out[0].data)).toStrictEqual([1]);
        expect(out[1].trace).toStrictEqual({ index: 1, kind: 'outer' });
        expect(out[1].programAddress).toBe('program-b');
    });

    it('walks v1 inner instructions alongside outer', () => {
        const innerData = asB58(new Uint8Array([42]));
        const out = walkInstructions({
            compiledMessage: v1Compiled,
            meta: {
                innerInstructions: [
                    {
                        index: 0,
                        instructions: [{ accounts: [0], data: innerData, programIdIndex: 2, stackHeight: 2 }],
                    },
                ],
            },
        });
        expect(out).toHaveLength(3);
        expect(out[2].trace).toStrictEqual({ innerIndex: 0, kind: 'inner', outerIndex: 0, stackHeight: 2 });
        expect(out[2].programAddress).toBe('program-b');
    });
});

describe('walkInstructions over an ALT-loaded v0 transaction', () => {
    const v0Compiled = {
        header: {
            numReadonlyNonSignerAccounts: 0,
            numReadonlySignerAccounts: 0,
            numSignerAccounts: 1,
        },
        instructions: [{ accountIndices: [0, 3], data: new Uint8Array([7]), programAddressIndex: 2 }],
        staticAccounts: ['fee-payer' as Address, 'static-readonly' as Address],
        version: 0,
    } as CompiledTransactionMessage;

    it('resolves indices spanning static + ALT writable + ALT readonly', () => {
        const innerData = asB58(new Uint8Array([8]));
        const traced = walkInstructions({
            compiledMessage: v0Compiled,
            loadedAddresses: { readonly: ['alt-readonly' as Address], writable: ['alt-writable' as Address] },
            meta: {
                innerInstructions: [
                    {
                        index: 0,
                        instructions: [{ accounts: [0, 2], data: innerData, programIdIndex: 3, stackHeight: 2 }],
                    },
                ],
            },
        });

        expect(traced).toHaveLength(2);
        expect(traced[0].trace).toStrictEqual({ index: 0, kind: 'outer' });
        expect(traced[0].programAddress).toBe('alt-writable');
        expect(traced[0].accounts.map(a => a.address)).toStrictEqual(['fee-payer', 'alt-readonly']);
        expect(traced[1].trace).toStrictEqual({ innerIndex: 0, kind: 'inner', outerIndex: 0, stackHeight: 2 });
        expect(traced[1].programAddress).toBe('alt-readonly');
        expect(traced[1].accounts.map(a => a.address)).toStrictEqual(['fee-payer', 'alt-writable']);
    });
});
