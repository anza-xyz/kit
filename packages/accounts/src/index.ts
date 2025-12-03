/**
 * This package contains types and helper methods for representing, fetching and decoding Solana
 * accounts. It can be used standalone, but it is also exported as part of Kit
 * [`@solana/kit`](https://github.com/anza-xyz/kit/tree/main/packages/kit).
 *
 * It provides a unified definition of a Solana account regardless of how it was retrieved and can
 * represent both encoded and decoded accounts. It also introduces the concept of a
 * {@link MaybeAccount} which represents a fetched account that may or may not exist on-chain whilst
 * keeping track of its address in both cases.
 *
 * Helper functions are provided for fetching, parsing and decoding accounts as well as asserting
 * that an account exists.
 *
 * @packageDocumentation
 * @example
 * ```ts
 * // Fetch.
 * const myAddress = address('1234..5678');
 * const myAccount = await fetchEncodedAccount(rpc, myAddress);
 * myAccount satisfies MaybeEncodedAccount<'1234..5678'>;
 *
 * // Assert.
 * assertAccountExists(myAccount);
 * myAccount satisfies EncodedAccount<'1234..5678'>;
 *
 * // Decode.
 * type MyAccountData = { name: string; age: number };
 * const myDecoder: Decoder<MyAccountData> = getStructDecoder([
 *     ['name', addDecoderSizePrefix(getUtf8Decoder(), getU32Decoder())],
 *     ['age', getU32Decoder()],
 * ]);
 * const myDecodedAccount = decodeAccount(myAccount, myDecoder);
 * myDecodedAccount satisfies Account<MyAccountData, '1234..5678'>;
 * ```
 */
export * from './account';
export * from './decode-account';
export * from './fetch-account';
export * from './maybe-account';
export * from './parse-account';
