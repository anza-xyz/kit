import type { Address } from '@solana/addresses';
import { getBase58Decoder } from '@solana/codecs-strings';
import {
    SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_INSTRUCTION_PROGRAM_ADDRESS_NOT_FOUND,
    SolanaError,
} from '@solana/errors';
import { type AccountMeta, AccountRole } from '@solana/instructions';
import type { Base58EncodedBytes } from '@solana/rpc-types';

import { getInnerInstructionsFromMeta } from '../get-inner-instructions';

const base58 = getBase58Decoder();

function asB58(bytes: Uint8Array): Base58EncodedBytes {
    return base58.decode(bytes) as Base58EncodedBytes;
}

describe('getInnerInstructionsFromMeta', () => {
    const accountMetas: AccountMeta[] = [
        { address: 'fee-payer' as Address, role: AccountRole.WRITABLE_SIGNER },
        { address: 'program' as Address, role: AccountRole.READONLY },
        { address: 'data-account' as Address, role: AccountRole.WRITABLE },
    ];

    it('returns nothing when meta has no inner instructions', () => {
        expect(getInnerInstructionsFromMeta({}, accountMetas)).toStrictEqual([]);
        expect(getInnerInstructionsFromMeta({ innerInstructions: null }, accountMetas)).toStrictEqual([]);
    });

    it('decodes base58 data and resolves indices into AccountMetas', () => {
        const out = getInnerInstructionsFromMeta(
            {
                innerInstructions: [
                    {
                        index: 0,
                        instructions: [
                            {
                                accounts: [0, 2],
                                data: asB58(new Uint8Array([9, 8, 7])),
                                programIdIndex: 1,
                                stackHeight: 2,
                            },
                        ],
                    },
                ],
            },
            accountMetas,
        );

        expect(out).toHaveLength(1);
        expect(out[0].trace).toStrictEqual({ innerIndex: 0, kind: 'inner', outerIndex: 0, stackHeight: 2 });
        expect(out[0].programAddress).toBe('program');
        expect(out[0].accounts).toStrictEqual([
            { address: 'fee-payer', role: AccountRole.WRITABLE_SIGNER },
            { address: 'data-account', role: AccountRole.WRITABLE },
        ]);
        expect(Array.from(out[0].data)).toStrictEqual([9, 8, 7]);
    });

    it('throws when an inner programIdIndex is out of range', () => {
        const dataB58 = asB58(new Uint8Array([1]));
        expect(() =>
            getInnerInstructionsFromMeta(
                {
                    innerInstructions: [
                        {
                            index: 0,
                            instructions: [{ accounts: [], data: dataB58, programIdIndex: 99 }],
                        },
                    ],
                },
                accountMetas,
            ),
        ).toThrow(
            new SolanaError(SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_INSTRUCTION_PROGRAM_ADDRESS_NOT_FOUND, {
                index: 99,
            }),
        );
    });

    it('throws when an inner account index is out of range', () => {
        const dataB58 = asB58(new Uint8Array([1]));
        expect(() =>
            getInnerInstructionsFromMeta(
                {
                    innerInstructions: [
                        {
                            index: 0,
                            instructions: [{ accounts: [42], data: dataB58, programIdIndex: 1 }],
                        },
                    ],
                },
                accountMetas,
            ),
        ).toThrow(
            new SolanaError(SOLANA_ERROR__TRANSACTION__FAILED_TO_DECOMPILE_INSTRUCTION_PROGRAM_ADDRESS_NOT_FOUND, {
                index: 42,
            }),
        );
    });

    it('omits stackHeight from the trace when the RPC did not report one', () => {
        const [traced] = getInnerInstructionsFromMeta(
            {
                innerInstructions: [
                    {
                        index: 3,
                        instructions: [{ accounts: [], data: asB58(new Uint8Array([1])), programIdIndex: 1 }],
                    },
                ],
            },
            accountMetas,
        );
        expect(traced.trace).toStrictEqual({ innerIndex: 0, kind: 'inner', outerIndex: 3 });
    });
});
