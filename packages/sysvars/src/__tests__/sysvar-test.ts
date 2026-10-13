import type { GetAccountInfoApi } from '@solana/rpc-api';
import type { JsonParsedSysvarAccount } from '@solana/rpc-parsed-types';
import type { Rpc } from '@solana/rpc-spec';

import {
    fetchEncodedSysvarAccount,
    fetchJsonParsedSysvarAccount,
    SYSVAR_CLOCK_ADDRESS,
    SYSVAR_EPOCH_REWARDS_ADDRESS,
    SYSVAR_EPOCH_SCHEDULE_ADDRESS,
    SYSVAR_LAST_RESTART_SLOT_ADDRESS,
    SYSVAR_RECENT_BLOCKHASHES_ADDRESS,
    SYSVAR_RENT_ADDRESS,
    SYSVAR_SLOT_HASHES_ADDRESS,
    SYSVAR_SLOT_HISTORY_ADDRESS,
    SYSVAR_STAKE_HISTORY_ADDRESS,
} from '../sysvar';
import { createLocalhostSolanaRpc } from './__setup__';

describe('sysvar account', () => {
    let rpc: Rpc<GetAccountInfoApi>;
    beforeEach(() => {
        rpc = createLocalhostSolanaRpc();
    });
    const assertValidEncodedSysvarAccount = async (address: Parameters<typeof fetchEncodedSysvarAccount>[1]) => {
        const account = await fetchEncodedSysvarAccount(rpc, address);
        expect(account.address).toEqual(address);
        expect(account.exists).toBe(true);
        expect(account).toMatchObject({
            data: expect.any(Uint8Array),
        });
    };
    const assertValidJsonParsedSysvarAccount = async (
        address: Parameters<typeof fetchEncodedSysvarAccount>[1],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: any,
    ) => {
        const account = await fetchJsonParsedSysvarAccount(rpc, address);
        expect(account.address).toEqual(address);
        expect(account.exists).toBe(true);
        expect(account).toMatchObject(data);
    };
    describe('clock', () => {
        it('fetch encoded', async () => {
            expect.assertions(3);
            await assertValidEncodedSysvarAccount(SYSVAR_CLOCK_ADDRESS);
        });
        it('fetch JSON-parsed', async () => {
            expect.assertions(3);
            await assertValidJsonParsedSysvarAccount(SYSVAR_CLOCK_ADDRESS, {
                data: {
                    epoch: expect.any(BigInt),
                    epochStartTimestamp: expect.any(BigInt),
                    leaderScheduleEpoch: expect.any(BigInt),
                    slot: expect.any(BigInt),
                    unixTimestamp: expect.any(BigInt),
                },
            });
        });
    });
    describe('epoch rewards', () => {
        it('fetch encoded', async () => {
            expect.assertions(3);
            await assertValidEncodedSysvarAccount(SYSVAR_EPOCH_REWARDS_ADDRESS);
        });
        it('fetch JSON-parsed', async () => {
            expect.assertions(3);
            // Keying the expectation off the parsed type means that a key missing from (or extra to) the type
            // fails to compile, while `toEqual` fails if the RPC node returns a different set of keys.
            const expectedData: Record<
                keyof Extract<JsonParsedSysvarAccount, { type: 'epochRewards' }>['info'],
                unknown
            > = {
                active: expect.any(Boolean),
                distributedRewards: expect.any(String), // JsonParsed converts to string
                distributionStartingBlockHeight: expect.any(BigInt),
                numPartitions: expect.any(BigInt),
                parentBlockhash: expect.any(String),
                totalPoints: expect.any(String), // JsonParsed converts to string
                totalRewards: expect.any(String), // JsonParsed converts to string
            };
            const account = await fetchJsonParsedSysvarAccount(rpc, SYSVAR_EPOCH_REWARDS_ADDRESS);
            expect(account.address).toEqual(SYSVAR_EPOCH_REWARDS_ADDRESS);
            expect(account.exists).toBe(true);
            expect(account).toEqual(
                expect.objectContaining({
                    data: { ...expectedData, parsedAccountMeta: { program: 'sysvar', type: 'epochRewards' } },
                }),
            );
        });
    });
    describe('epoch schedule', () => {
        it('fetch encoded', async () => {
            expect.assertions(3);
            await assertValidEncodedSysvarAccount(SYSVAR_EPOCH_SCHEDULE_ADDRESS);
        });
        it('fetch JSON-parsed', async () => {
            expect.assertions(3);
            await assertValidJsonParsedSysvarAccount(SYSVAR_EPOCH_SCHEDULE_ADDRESS, {
                data: {
                    firstNormalEpoch: expect.any(BigInt),
                    firstNormalSlot: expect.any(BigInt),
                    leaderScheduleSlotOffset: expect.any(BigInt),
                    slotsPerEpoch: expect.any(BigInt),
                    warmup: expect.any(Boolean),
                },
            });
        });
    });
    // `Instructions` does not exist on-chain.
    describe('last restart slot', () => {
        it('fetch encoded', async () => {
            expect.assertions(3);
            await assertValidEncodedSysvarAccount(SYSVAR_LAST_RESTART_SLOT_ADDRESS);
        });
        it('fetch JSON-parsed', async () => {
            expect.assertions(3);
            await assertValidJsonParsedSysvarAccount(SYSVAR_LAST_RESTART_SLOT_ADDRESS, {
                data: {
                    lastRestartSlot: expect.any(BigInt),
                },
            });
        });
    });
    describe('recent blockhashes', () => {
        it('fetch encoded', async () => {
            expect.assertions(3);
            await assertValidEncodedSysvarAccount(SYSVAR_RECENT_BLOCKHASHES_ADDRESS);
        });
        it('fetch JSON-parsed', async () => {
            expect.assertions(3);
            await assertValidJsonParsedSysvarAccount(SYSVAR_RECENT_BLOCKHASHES_ADDRESS, {
                data: expect.arrayContaining([
                    {
                        blockhash: expect.any(String),
                        feeCalculator: {
                            lamportsPerSignature: expect.any(String), // JsonParsed converts to string
                        },
                    },
                ]),
            });
        });
    });
    describe('rent', () => {
        it('fetch encoded', async () => {
            expect.assertions(3);
            await assertValidEncodedSysvarAccount(SYSVAR_RENT_ADDRESS);
        });
        it('fetch JSON-parsed', async () => {
            expect.assertions(3);
            await assertValidJsonParsedSysvarAccount(SYSVAR_RENT_ADDRESS, {
                data: {
                    lamportsPerByte: expect.any(String), // JsonParsed converts to string
                },
            });
        });
    });
    describe('slot hashes', () => {
        it('fetch encoded', async () => {
            expect.assertions(3);
            await assertValidEncodedSysvarAccount(SYSVAR_SLOT_HASHES_ADDRESS);
        });
        it('fetch JSON-parsed', async () => {
            expect.assertions(3);
            await assertValidJsonParsedSysvarAccount(SYSVAR_SLOT_HASHES_ADDRESS, {
                data: expect.arrayContaining([
                    {
                        hash: expect.any(String),
                        slot: expect.any(BigInt),
                    },
                ]),
            });
        });
    });
    describe('slot history', () => {
        it('fetch encoded', async () => {
            expect.assertions(3);
            await assertValidEncodedSysvarAccount(SYSVAR_SLOT_HISTORY_ADDRESS);
        });
        it('fetch JSON-parsed', async () => {
            expect.assertions(3);
            await assertValidJsonParsedSysvarAccount(SYSVAR_SLOT_HISTORY_ADDRESS, {
                data: {
                    bits: expect.any(String), // JsonParsed converts to string
                    nextSlot: expect.any(BigInt),
                },
            });
        });
    });
    describe('stake history', () => {
        it('fetch encoded', async () => {
            expect.assertions(3);
            await assertValidEncodedSysvarAccount(SYSVAR_STAKE_HISTORY_ADDRESS);
        });
        it('fetch JSON-parsed', async () => {
            expect.assertions(3);
            await assertValidJsonParsedSysvarAccount(SYSVAR_STAKE_HISTORY_ADDRESS, {
                data: expect.any(Array), // Not always populated on test validator
            });
        });
    });
});
