/**
 * This package contains types and helpers for fetching and decoding Solana sysvars.
 * It can be used standalone, but it is also exported as part of Kit
 * [`@solana/kit`](https://github.com/anza-xyz/kit/tree/main/packages/kit).
 *
 * More information about the available sysvars on Solana can be found in the docs at
 * https://docs.solanalabs.com/runtime/sysvars.
 *
 * All currently available sysvars can be retrieved and/or decoded using this library.
 *
 * - `Clock`
 * - `EpochRewards`
 * - `EpochSchedule`
 * - `Fees`
 * - `LastRestartSlot`
 * - `RecentBlockhashes`
 * - `Rent`
 * - `SlotHashes`
 * - `SlotHistory`
 * - `StakeHistory`
 *
 * The `Instructions` sysvar is also supported but does not exist on-chain, therefore has no
 * corresponding module or codec.
 *
 * @example Fetch and decode a sysvar account.
 * ```ts
 * const clock: SysvarClock = await fetchSysvarClock(rpc);
 * ```
 *
 * @example Fetch and decode a sysvar account manually.
 * ```ts
 * // Fetch.
 * const clock = await fetchEncodedSysvarAccount(rpc, SYSVAR_CLOCK_ADDRESS);
 * clock satisfies MaybeEncodedAccount<'SysvarC1ock11111111111111111111111111111111'>;
 *
 * // Assert.
 * assertAccountExists(clock);
 * clock satisfies EncodedAccount<'SysvarC1ock11111111111111111111111111111111'>;
 *
 * // Decode.
 * const decodedClock = decodeAccount(clock, getSysvarClockDecoder());
 * decodedClock satisfies Account<SysvarClock, 'SysvarC1ock11111111111111111111111111111111'>;
 * ```
 *
 * @example Fetch a JSON-parsed sysvar account.
 * ```ts
 * const maybeJsonParsedClock = await fetchJsonParsedSysvarAccount(rpc, SYSVAR_CLOCK_ADDRESS);
 * maybeJsonParsedClock satisfies
 *     | MaybeAccount<JsonParsedSysvarAccount, 'SysvarC1ock11111111111111111111111111111111'>
 *     | MaybeEncodedAccount<'SysvarC1ock11111111111111111111111111111111'>;
 * ```
 *
 * @packageDocumentation
 */
export * from './clock';
export * from './epoch-rewards';
export * from './epoch-schedule';
export * from './last-restart-slot';
export * from './recent-blockhashes';
export * from './rent';
export * from './slot-hashes';
export * from './slot-history';
export * from './stake-history';
export * from './sysvar';
