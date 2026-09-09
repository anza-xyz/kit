import '@solana/test-matchers/toBeFrozenObject';

import { Address } from '@solana/addresses';
import { SOLANA_ERROR__TRANSACTION__LOADED_ACCOUNTS_DATA_SIZE_LIMIT_OUT_OF_RANGE, SolanaError } from '@solana/errors';
import { Blockhash } from '@solana/rpc-types';

import { getCompiledTransactionMessageCodec } from '../codecs/message';
import { compileTransactionMessage } from '../compile/message';
import {
    COMPUTE_BUDGET_PROGRAM_ADDRESS,
    getLoadedAccountsDataSizeLimitFromInstructionData,
    getSetLoadedAccountsDataSizeLimitInstruction,
} from '../compute-budget-instruction';
import { decompileTransactionMessage } from '../decompile/message';
import {
    getTransactionMessageLoadedAccountsDataSizeLimit,
    setTransactionMessageLoadedAccountsDataSizeLimit,
} from '../loaded-accounts-data-size-limit';
import { TransactionMessage } from '../transaction-message';

const COMPUTE_UNIT_LIMIT_A = 200_000;

const HEAP_SIZE_A = 30_000;

const LOADED_ACCOUNTS_DATA_SIZE_LIMIT_A = 60_000;
const LOADED_ACCOUNTS_DATA_SIZE_LIMIT_B = 100_000;

describe('setTransactionMessageLoadedAccountsDataSizeLimit', () => {
    describe('given a v1 transaction', () => {
        const baseTx: TransactionMessage & { version: 1 } = { instructions: [], version: 1 };

        it('sets the loaded accounts data size limit on the transaction', () => {
            const txWithLimit = setTransactionMessageLoadedAccountsDataSizeLimit(
                LOADED_ACCOUNTS_DATA_SIZE_LIMIT_A,
                baseTx,
            );
            expect(txWithLimit).toHaveProperty('config', {
                loadedAccountsDataSizeLimit: LOADED_ACCOUNTS_DATA_SIZE_LIMIT_A,
            });
        });

        it('freezes the transaction object', () => {
            const txWithLimit = setTransactionMessageLoadedAccountsDataSizeLimit(
                LOADED_ACCOUNTS_DATA_SIZE_LIMIT_A,
                baseTx,
            );
            expect(txWithLimit).toBeFrozenObject();
        });

        it('freezes the config object', () => {
            const txWithLimit = setTransactionMessageLoadedAccountsDataSizeLimit(
                LOADED_ACCOUNTS_DATA_SIZE_LIMIT_A,
                baseTx,
            );
            expect(txWithLimit.config).toBeFrozenObject();
        });

        describe('given a transaction with an existing config', () => {
            const txWithConfig = {
                ...baseTx,
                config: {
                    computeUnitLimit: COMPUTE_UNIT_LIMIT_A,
                    heapSize: HEAP_SIZE_A,
                },
            };

            it('sets the loaded accounts data size limit while preserving other config properties', () => {
                const txWithLimit = setTransactionMessageLoadedAccountsDataSizeLimit(
                    LOADED_ACCOUNTS_DATA_SIZE_LIMIT_A,
                    txWithConfig,
                );
                expect(txWithLimit.config).toMatchObject({
                    computeUnitLimit: COMPUTE_UNIT_LIMIT_A,
                    heapSize: HEAP_SIZE_A,
                    loadedAccountsDataSizeLimit: LOADED_ACCOUNTS_DATA_SIZE_LIMIT_A,
                });
            });

            it('returns the same reference when setting the same loaded accounts data size limit', () => {
                const txWithLimitA = setTransactionMessageLoadedAccountsDataSizeLimit(
                    LOADED_ACCOUNTS_DATA_SIZE_LIMIT_A,
                    baseTx,
                );
                const txWithSameLimit = setTransactionMessageLoadedAccountsDataSizeLimit(
                    LOADED_ACCOUNTS_DATA_SIZE_LIMIT_A,
                    txWithLimitA,
                );
                expect(txWithLimitA).toBe(txWithSameLimit);
            });

            it('returns a new reference when setting a different loaded accounts data size limit', () => {
                const txWithLimitA = setTransactionMessageLoadedAccountsDataSizeLimit(
                    LOADED_ACCOUNTS_DATA_SIZE_LIMIT_A,
                    baseTx,
                );
                const txWithLimitB = setTransactionMessageLoadedAccountsDataSizeLimit(
                    LOADED_ACCOUNTS_DATA_SIZE_LIMIT_B,
                    txWithLimitA,
                );
                expect(txWithLimitA).not.toBe(txWithLimitB);
                expect(txWithLimitB.config).toHaveProperty(
                    'loadedAccountsDataSizeLimit',
                    LOADED_ACCOUNTS_DATA_SIZE_LIMIT_B,
                );
            });
        });

        describe('empty config normalization', () => {
            it('removes config when setting to undefined as only property', () => {
                const txWithLimit = setTransactionMessageLoadedAccountsDataSizeLimit(
                    LOADED_ACCOUNTS_DATA_SIZE_LIMIT_A,
                    baseTx,
                );
                const txWithoutConfig = setTransactionMessageLoadedAccountsDataSizeLimit(undefined, txWithLimit);
                expect(txWithoutConfig).not.toHaveProperty('config');
            });

            it('preserves config when setting to undefined with other properties present', () => {
                const txWithConfig = {
                    ...baseTx,
                    config: {
                        computeUnitLimit: COMPUTE_UNIT_LIMIT_A,
                        loadedAccountsDataSizeLimit: LOADED_ACCOUNTS_DATA_SIZE_LIMIT_A,
                    },
                };
                const txWithoutLimit = setTransactionMessageLoadedAccountsDataSizeLimit(undefined, txWithConfig);
                expect(txWithoutLimit).toHaveProperty('config', {
                    computeUnitLimit: COMPUTE_UNIT_LIMIT_A,
                    loadedAccountsDataSizeLimit: undefined,
                });
            });
        });
    });

    describe.each([{ version: 'legacy' as const }, { version: 0 as const }])(
        'given a $version transaction',
        ({ version }) => {
            const baseTx: TransactionMessage = { instructions: [], version };

            it('appends a SetLoadedAccountsDataSizeLimit instruction', () => {
                const result = setTransactionMessageLoadedAccountsDataSizeLimit(
                    LOADED_ACCOUNTS_DATA_SIZE_LIMIT_A,
                    baseTx,
                );
                expect(result.instructions).toHaveLength(1);
                expect(result.instructions[0].programAddress).toBe(COMPUTE_BUDGET_PROGRAM_ADDRESS);
                expect(
                    getLoadedAccountsDataSizeLimitFromInstructionData(result.instructions[0].data as Uint8Array),
                ).toBe(LOADED_ACCOUNTS_DATA_SIZE_LIMIT_A);
            });

            it('freezes the transaction object', () => {
                const result = setTransactionMessageLoadedAccountsDataSizeLimit(
                    LOADED_ACCOUNTS_DATA_SIZE_LIMIT_A,
                    baseTx,
                );
                expect(result).toBeFrozenObject();
            });

            it('freezes the instructions array', () => {
                const result = setTransactionMessageLoadedAccountsDataSizeLimit(
                    LOADED_ACCOUNTS_DATA_SIZE_LIMIT_A,
                    baseTx,
                );
                expect(result.instructions).toBeFrozenObject();
            });

            it('appends the instruction after existing instructions', () => {
                const existingIx = { programAddress: '11111111111111111111111111111111' as Address };
                const txWithIx: TransactionMessage = { instructions: [existingIx], version };
                const result = setTransactionMessageLoadedAccountsDataSizeLimit(
                    LOADED_ACCOUNTS_DATA_SIZE_LIMIT_A,
                    txWithIx,
                );
                expect(result.instructions).toHaveLength(2);
                expect(result.instructions[0]).toBe(existingIx);
                expect(result.instructions[1].programAddress).toBe(COMPUTE_BUDGET_PROGRAM_ADDRESS);
            });

            describe('given a transaction with an existing SetLoadedAccountsDataSizeLimit instruction', () => {
                const existingIx = Object.freeze(
                    getSetLoadedAccountsDataSizeLimitInstruction(LOADED_ACCOUNTS_DATA_SIZE_LIMIT_A),
                );
                const otherIx = Object.freeze({ programAddress: '11111111111111111111111111111111' as Address });
                const txWithExisting = { instructions: [otherIx, existingIx] as const, version };

                it('replaces the existing instruction in-place when setting a different value', () => {
                    const result = setTransactionMessageLoadedAccountsDataSizeLimit(
                        LOADED_ACCOUNTS_DATA_SIZE_LIMIT_B,
                        txWithExisting,
                    );
                    expect(result.instructions).toHaveLength(2);
                    expect(result.instructions[0]).toBe(otherIx);
                    expect(getLoadedAccountsDataSizeLimitFromInstructionData(result.instructions[1].data)).toBe(
                        LOADED_ACCOUNTS_DATA_SIZE_LIMIT_B,
                    );
                });

                it('returns the same reference when setting the same value', () => {
                    const result = setTransactionMessageLoadedAccountsDataSizeLimit(
                        LOADED_ACCOUNTS_DATA_SIZE_LIMIT_A,
                        txWithExisting,
                    );
                    expect(result).toBe(txWithExisting);
                });

                it('returns a new reference when setting a different value', () => {
                    const result = setTransactionMessageLoadedAccountsDataSizeLimit(
                        LOADED_ACCOUNTS_DATA_SIZE_LIMIT_B,
                        txWithExisting,
                    );
                    expect(result).not.toBe(txWithExisting);
                });
            });

            describe('setting to undefined', () => {
                it('returns the same reference when no instruction exists', () => {
                    const result = setTransactionMessageLoadedAccountsDataSizeLimit(undefined, baseTx);
                    expect(result).toBe(baseTx);
                });

                it('removes the instruction when one exists', () => {
                    const txWithIx = setTransactionMessageLoadedAccountsDataSizeLimit(
                        LOADED_ACCOUNTS_DATA_SIZE_LIMIT_A,
                        baseTx,
                    );
                    const result = setTransactionMessageLoadedAccountsDataSizeLimit(undefined, txWithIx);
                    expect(result.instructions).toHaveLength(0);
                });

                it('preserves other instructions when removing', () => {
                    const otherIx = { programAddress: '11111111111111111111111111111111' as Address };
                    const limitIx = getSetLoadedAccountsDataSizeLimitInstruction(LOADED_ACCOUNTS_DATA_SIZE_LIMIT_A);
                    const txWithIxs: TransactionMessage = {
                        instructions: [limitIx, otherIx],
                        version,
                    };
                    const result = setTransactionMessageLoadedAccountsDataSizeLimit(undefined, txWithIxs);
                    expect(result.instructions).toHaveLength(1);
                    expect(result.instructions[0]).toBe(otherIx);
                });
            });
        },
    );
});

describe('getTransactionMessageLoadedAccountsDataSizeLimit', () => {
    describe('given a v1 transaction', () => {
        it('returns undefined without config', () => {
            const tx: TransactionMessage = { instructions: [], version: 1 };
            expect(getTransactionMessageLoadedAccountsDataSizeLimit(tx)).toBeUndefined();
        });

        it('returns the value from config', () => {
            const tx: TransactionMessage & { version: 1 } = {
                config: { loadedAccountsDataSizeLimit: LOADED_ACCOUNTS_DATA_SIZE_LIMIT_A },
                instructions: [],
                version: 1,
            };
            expect(getTransactionMessageLoadedAccountsDataSizeLimit(tx)).toBe(LOADED_ACCOUNTS_DATA_SIZE_LIMIT_A);
        });
    });

    describe.each([{ version: 'legacy' as const }, { version: 0 as const }])(
        'given a $version transaction',
        ({ version }) => {
            it('returns undefined without instruction', () => {
                const tx: TransactionMessage = { instructions: [], version };
                expect(getTransactionMessageLoadedAccountsDataSizeLimit(tx)).toBeUndefined();
            });

            it('returns the value from instruction', () => {
                const tx: TransactionMessage = {
                    instructions: [getSetLoadedAccountsDataSizeLimitInstruction(LOADED_ACCOUNTS_DATA_SIZE_LIMIT_A)],
                    version,
                };
                expect(getTransactionMessageLoadedAccountsDataSizeLimit(tx)).toBe(LOADED_ACCOUNTS_DATA_SIZE_LIMIT_A);
            });
        },
    );
});

describe('setTransactionMessageLoadedAccountsDataSizeLimit validation', () => {
    const MIN_LOADED_ACCOUNTS_DATA_SIZE_LIMIT = 1;
    const MAX_LOADED_ACCOUNTS_DATA_SIZE_LIMIT = 64 * 1024 * 1024;

    function expectOutOfRange(loadedAccountsDataSizeLimit: number) {
        return new SolanaError(SOLANA_ERROR__TRANSACTION__LOADED_ACCOUNTS_DATA_SIZE_LIMIT_OUT_OF_RANGE, {
            loadedAccountsDataSizeLimit,
            maxLoadedAccountsDataSizeLimit: MAX_LOADED_ACCOUNTS_DATA_SIZE_LIMIT,
            minLoadedAccountsDataSizeLimit: MIN_LOADED_ACCOUNTS_DATA_SIZE_LIMIT,
        });
    }

    describe.each([{ version: 'legacy' as const }, { version: 0 as const }, { version: 1 as const }])(
        'given a $version transaction',
        ({ version }) => {
            const baseTx = { instructions: [], version } as TransactionMessage;

            it('throws when the limit is zero', () => {
                expect(() => setTransactionMessageLoadedAccountsDataSizeLimit(0, baseTx)).toThrow(expectOutOfRange(0));
            });

            it('throws when the limit is negative', () => {
                expect(() => setTransactionMessageLoadedAccountsDataSizeLimit(-1, baseTx)).toThrow(
                    expectOutOfRange(-1),
                );
            });

            it('throws when the limit is above the maximum', () => {
                const limit = MAX_LOADED_ACCOUNTS_DATA_SIZE_LIMIT + 1;
                expect(() => setTransactionMessageLoadedAccountsDataSizeLimit(limit, baseTx)).toThrow(
                    expectOutOfRange(limit),
                );
            });

            it.each([NaN, Infinity, -Infinity, 60_000.5])(
                'throws when the limit is %p',
                (loadedAccountsDataSizeLimit: number) => {
                    expect(() =>
                        setTransactionMessageLoadedAccountsDataSizeLimit(loadedAccountsDataSizeLimit, baseTx),
                    ).toThrow(expectOutOfRange(loadedAccountsDataSizeLimit));
                },
            );

            it('accepts the minimum limit', () => {
                expect(() =>
                    setTransactionMessageLoadedAccountsDataSizeLimit(MIN_LOADED_ACCOUNTS_DATA_SIZE_LIMIT, baseTx),
                ).not.toThrow();
            });

            it('accepts the maximum limit', () => {
                expect(() =>
                    setTransactionMessageLoadedAccountsDataSizeLimit(MAX_LOADED_ACCOUNTS_DATA_SIZE_LIMIT, baseTx),
                ).not.toThrow();
            });

            it('does not throw when clearing the limit', () => {
                expect(() => setTransactionMessageLoadedAccountsDataSizeLimit(undefined, baseTx)).not.toThrow();
            });
        },
    );
});

describe('loaded accounts data size limit wire round trip', () => {
    const MIN_LOADED_ACCOUNTS_DATA_SIZE_LIMIT = 1;
    const MAX_LOADED_ACCOUNTS_DATA_SIZE_LIMIT = 64 * 1024 * 1024;

    function v1MessageWithLimit(loadedAccountsDataSizeLimit: number) {
        const message = {
            feePayer: { address: '7EqQdEULxWcraVx3mXKFjc84LhCkMGZCkRuDpvcMwJeK' as Address },
            instructions: [],
            lifetimeConstraint: {
                blockhash: 'GNtuHnNyW68wviopST3ki37Afv7LPphxfSwiHAkX5Q9H' as Blockhash,
                lastValidBlockHeight: 100n,
            },
            version: 1 as const,
        } as unknown as TransactionMessage;
        return setTransactionMessageLoadedAccountsDataSizeLimit(loadedAccountsDataSizeLimit, message);
    }

    function encodeV1MessageWithLimit(loadedAccountsDataSizeLimit: number) {
        return getCompiledTransactionMessageCodec().encode(
            compileTransactionMessage(v1MessageWithLimit(loadedAccountsDataSizeLimit) as never),
        );
    }

    // Every limit the setter accepts has to survive the wire format unchanged. This is what ties
    // the validated range to what a version 1 transaction can actually carry.
    it.each([
        MIN_LOADED_ACCOUNTS_DATA_SIZE_LIMIT,
        60_000,
        MAX_LOADED_ACCOUNTS_DATA_SIZE_LIMIT - 1,
        MAX_LOADED_ACCOUNTS_DATA_SIZE_LIMIT,
    ])('preserves a limit of %p through compile, encode, decode and decompile', (limit: number) => {
        const codec = getCompiledTransactionMessageCodec();
        const decompiled = decompileTransactionMessage(codec.decode(encodeV1MessageWithLimit(limit)) as never);
        expect(getTransactionMessageLoadedAccountsDataSizeLimit(decompiled)).toBe(limit);
    });

    // The provisory limit reserves space for an estimate that replaces it later, so the size of an
    // encoded message must not depend on which accepted limit it carries.
    it('encodes to the same number of bytes across the whole accepted range', () => {
        const sizes = [MIN_LOADED_ACCOUNTS_DATA_SIZE_LIMIT, 60_000, MAX_LOADED_ACCOUNTS_DATA_SIZE_LIMIT].map(
            limit => encodeV1MessageWithLimit(limit).length,
        );
        expect(new Set(sizes).size).toBe(1);
    });

    // `undefined` clears the limit; every other non-number must fail rather than reach the encoder.
    it.each([null, '60000', 60_000n, true])('rejects %p rather than encoding it', (limit: unknown) => {
        const baseTx = { instructions: [], version: 1 } as TransactionMessage;
        expect(() => setTransactionMessageLoadedAccountsDataSizeLimit(limit as number, baseTx)).toThrow(
            new SolanaError(SOLANA_ERROR__TRANSACTION__LOADED_ACCOUNTS_DATA_SIZE_LIMIT_OUT_OF_RANGE, {
                loadedAccountsDataSizeLimit: limit as number,
                maxLoadedAccountsDataSizeLimit: MAX_LOADED_ACCOUNTS_DATA_SIZE_LIMIT,
                minLoadedAccountsDataSizeLimit: MIN_LOADED_ACCOUNTS_DATA_SIZE_LIMIT,
            }),
        );
    });
});
