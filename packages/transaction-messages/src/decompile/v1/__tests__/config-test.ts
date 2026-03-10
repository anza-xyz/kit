import { SOLANA_ERROR__TRANSACTION__INVALID_CONFIG_VALUE_KIND, SolanaError } from '@solana/errors';

import { CompiledTransactionConfigValue } from '../../../compile/v1/config';
import { decompileTransactionConfig } from '../config';

describe('decompileTransactionConfig', () => {
    const U64_MAX = 2n ** 64n - 1n;
    const U32_MAX = 2 ** 32 - 1;

    describe('individual config values', () => {
        it('decompiles priority fee lamports only', () => {
            const configMask = 0b11;
            const configValues: CompiledTransactionConfigValue[] = [{ kind: 'u64', value: 5_000n }];

            const config = decompileTransactionConfig(configMask, configValues);
            expect(config).toStrictEqual({
                priorityFeeLamports: 5_000n,
            });
        });

        it('decompiles compute unit limit only', () => {
            const configMask = 0b100;
            const configValues: CompiledTransactionConfigValue[] = [{ kind: 'u32', value: 300_000 }];

            const config = decompileTransactionConfig(configMask, configValues);
            expect(config).toStrictEqual({
                computeUnitLimit: 300000,
            });
        });

        it('decompiles loaded accounts data size limit only', () => {
            const configMask = 0b1000;
            const configValues: CompiledTransactionConfigValue[] = [{ kind: 'u32', value: 64_000 }];

            const config = decompileTransactionConfig(configMask, configValues);
            expect(config).toStrictEqual({
                loadedAccountsDataSizeLimit: 64000,
            });
        });

        it('decompiles heap size only', () => {
            const configMask = 0b10000;
            const configValues: CompiledTransactionConfigValue[] = [{ kind: 'u32', value: 256_000 }];

            const config = decompileTransactionConfig(configMask, configValues);
            expect(config).toStrictEqual({
                heapSize: 256000,
            });
        });
    });

    describe('multiple config values', () => {
        it('decompiles priority fee and compute unit limit', () => {
            const configMask = 0b111;
            const configValues: CompiledTransactionConfigValue[] = [
                { kind: 'u64', value: 5_000n },
                { kind: 'u32', value: 300_000 },
            ];

            const config = decompileTransactionConfig(configMask, configValues);
            expect(config).toStrictEqual({
                computeUnitLimit: 300000,
                priorityFeeLamports: 5_000n,
            });
        });

        it('decompiles all u32 values without priority fee', () => {
            const configMask = 0b11100;
            const configValues: CompiledTransactionConfigValue[] = [
                { kind: 'u32', value: 300_000 },
                { kind: 'u32', value: 64_000 },
                { kind: 'u32', value: 256_000 },
            ];

            const config = decompileTransactionConfig(configMask, configValues);
            expect(config).toStrictEqual({
                computeUnitLimit: 300000,
                heapSize: 256000,
                loadedAccountsDataSizeLimit: 64000,
            });
        });

        it('decompiles non-contiguous config values', () => {
            const configMask = 0b10011;
            const configValues: CompiledTransactionConfigValue[] = [
                { kind: 'u64', value: 5_000n },
                { kind: 'u32', value: 256_000 },
            ];

            const config = decompileTransactionConfig(configMask, configValues);
            expect(config).toStrictEqual({
                heapSize: 256000,
                priorityFeeLamports: 5_000n,
            });
        });
    });

    describe('all config values', () => {
        it('decompiles all config values', () => {
            const configMask = 0b11111;
            const configValues: CompiledTransactionConfigValue[] = [
                { kind: 'u64', value: 10_000n },
                { kind: 'u32', value: 400_000 },
                { kind: 'u32', value: 80_000 },
                { kind: 'u32', value: 512_000 },
            ];

            const config = decompileTransactionConfig(configMask, configValues);
            expect(config).toStrictEqual({
                computeUnitLimit: 400_000,
                heapSize: 512_000,
                loadedAccountsDataSizeLimit: 80_000,
                priorityFeeLamports: 10_000n,
            });
        });
    });

    describe('empty config', () => {
        it('returns empty config object when mask is 0', () => {
            const configMask = 0;
            const configValues: CompiledTransactionConfigValue[] = [];

            const config = decompileTransactionConfig(configMask, configValues);
            expect(config).toStrictEqual({});
        });
    });

    describe('boundary values', () => {
        it('handles maximum u64 priority fee', () => {
            const configMask = 0b11;
            const configValues: CompiledTransactionConfigValue[] = [{ kind: 'u64', value: U64_MAX }];

            const config = decompileTransactionConfig(configMask, configValues);
            expect(config).toStrictEqual({
                priorityFeeLamports: U64_MAX,
            });
        });

        it('handles maximum u32 compute unit limit', () => {
            const configMask = 0b100;
            const configValues: CompiledTransactionConfigValue[] = [{ kind: 'u32', value: U32_MAX }];

            const config = decompileTransactionConfig(configMask, configValues);
            expect(config).toStrictEqual({
                computeUnitLimit: U32_MAX,
            });
        });

        it('handles zero values', () => {
            const configMask = 0b11111;
            const configValues: CompiledTransactionConfigValue[] = [
                { kind: 'u64', value: 0n },
                { kind: 'u32', value: 0 },
                { kind: 'u32', value: 0 },
                { kind: 'u32', value: 0 },
            ];

            const config = decompileTransactionConfig(configMask, configValues);
            expect(config).toStrictEqual({
                computeUnitLimit: 0,
                heapSize: 0,
                loadedAccountsDataSizeLimit: 0,
                priorityFeeLamports: 0n,
            });
        });
    });

    describe('type mismatch errors', () => {
        it('throws when priority fee has u32 instead of u64', () => {
            const configMask = 0b11;
            const configValues: CompiledTransactionConfigValue[] = [{ kind: 'u32', value: 5_000 }];

            expect(() => decompileTransactionConfig(configMask, configValues)).toThrow(
                new SolanaError(SOLANA_ERROR__TRANSACTION__INVALID_CONFIG_VALUE_KIND, {
                    actualKind: 'u32',
                    configName: 'priorityFeeLamports',
                    expectedKind: 'u64',
                }),
            );
        });

        it('throws when compute unit limit has u64 instead of u32', () => {
            const configMask = 0b100;
            const configValues: CompiledTransactionConfigValue[] = [{ kind: 'u64', value: 300_000n }];

            expect(() => decompileTransactionConfig(configMask, configValues)).toThrow(
                new SolanaError(SOLANA_ERROR__TRANSACTION__INVALID_CONFIG_VALUE_KIND, {
                    actualKind: 'u64',
                    configName: 'computeUnitLimit',
                    expectedKind: 'u32',
                }),
            );
        });

        it('throws when loaded accounts data size limit has u64 instead of u32', () => {
            const configMask = 0b1000;
            const configValues: CompiledTransactionConfigValue[] = [{ kind: 'u64', value: 64_000n }];

            expect(() => decompileTransactionConfig(configMask, configValues)).toThrow(
                new SolanaError(SOLANA_ERROR__TRANSACTION__INVALID_CONFIG_VALUE_KIND, {
                    actualKind: 'u64',
                    configName: 'loadedAccountsDataSizeLimit',
                    expectedKind: 'u32',
                }),
            );
        });

        it('throws when heap size has u64 instead of u32', () => {
            const configMask = 0b10000;
            const configValues: CompiledTransactionConfigValue[] = [{ kind: 'u64', value: 256_000n }];

            expect(() => decompileTransactionConfig(configMask, configValues)).toThrow(
                new SolanaError(SOLANA_ERROR__TRANSACTION__INVALID_CONFIG_VALUE_KIND, {
                    actualKind: 'u64',
                    configName: 'heapSize',
                    expectedKind: 'u32',
                }),
            );
        });

        it('throws on first type mismatch when multiple values present', () => {
            const configMask = 0b111;
            const configValues: CompiledTransactionConfigValue[] = [
                { kind: 'u32', value: 5_000 },
                { kind: 'u32', value: 300_000 },
            ];

            expect(() => decompileTransactionConfig(configMask, configValues)).toThrow(
                new SolanaError(SOLANA_ERROR__TRANSACTION__INVALID_CONFIG_VALUE_KIND, {
                    actualKind: 'u32',
                    configName: 'priorityFeeLamports',
                    expectedKind: 'u64',
                }),
            );
        });
    });
});
