import { getBase58Decoder } from '@solana/codecs-strings';
import { SOLANA_ERROR__KEYS__INVALID_BASE58_IN_GRIND_REGEX, SolanaError } from '@solana/errors';

import { grindKeyPair, grindKeyPairs } from '../grind-keypair';
import { generateKeyPair } from '../key-pair';

// Partial mock of the key-pair module so we can spy on `generateKeyPair` in
// forwarding tests. By default, the real implementation is used.
jest.mock('../key-pair', () => ({
    ...jest.requireActual('../key-pair'),
    generateKeyPair: jest.fn(),
}));

const actualGenerateKeyPair = jest.requireActual<typeof import('../key-pair')>('../key-pair').generateKeyPair;

async function getAddressFromKeyPair(keyPair: CryptoKeyPair): Promise<string> {
    const bytes = new Uint8Array(await crypto.subtle.exportKey('raw', keyPair.publicKey));
    return getBase58Decoder().decode(bytes);
}

// Some tests in this file exercise the real `generateKeyPair` implementation,
// which uses WebCrypto under the hood and cannot be seeded. As a result, the
// addresses produced are genuinely random. To keep these tests fast and
// deterministic (i.e. non-flaky), any test that does NOT mock
// `generateKeyPair` must use an extremely permissive matcher — typically a
// single-character regex prefix like `/^1/` or a trivial `() => true`
// predicate — so that the grind loop converges within one batch. Do not
// tighten these matchers: if you need to assert more specific behaviour,
// mock `generateKeyPair` the same way the forwarding tests below do.
describe('grind-keypair', () => {
    beforeEach(() => {
        // Reset to the real implementation between tests; individual tests can
        // override with a custom implementation when needed.
        jest.mocked(generateKeyPair).mockImplementation(actualGenerateKeyPair);
    });

    describe('grindKeyPair', () => {
        it('returns a key pair whose address matches the provided regex', async () => {
            expect.assertions(1);
            const keyPair = await grindKeyPair({ matches: /^1/ });
            const address = await getAddressFromKeyPair(keyPair);
            expect(address).toMatch(/^1/);
        });

        it('returns a key pair whose address satisfies the provided predicate', async () => {
            expect.assertions(1);
            const keyPair = await grindKeyPair({ matches: address => address.startsWith('1') });
            const address = await getAddressFromKeyPair(keyPair);
            expect(address).toMatch(/^1/);
        });

        it('forwards `extractable: true` to `generateKeyPair`', async () => {
            expect.assertions(1);
            await grindKeyPair({ extractable: true, matches: () => true });
            expect(jest.mocked(generateKeyPair)).toHaveBeenCalledWith(true);
        });

        it('forwards `extractable: false` to `generateKeyPair` by default', async () => {
            expect.assertions(1);
            await grindKeyPair({ matches: () => true });
            expect(jest.mocked(generateKeyPair)).toHaveBeenCalledWith(false);
        });

        it('throws when the regex contains a non-base58 character', async () => {
            expect.assertions(1);
            await expect(grindKeyPair({ matches: /^foo0/ })).rejects.toThrow(
                new SolanaError(SOLANA_ERROR__KEYS__INVALID_BASE58_IN_GRIND_REGEX, {
                    character: '0',
                    source: '^foo0',
                }),
            );
        });

        it('throws immediately when the `AbortSignal` is already aborted', async () => {
            expect.assertions(2);
            const abortController = new AbortController();
            abortController.abort(new Error('Already aborted'));
            await expect(grindKeyPair({ abortSignal: abortController.signal, matches: () => true })).rejects.toThrow(
                'Already aborted',
            );
            expect(jest.mocked(generateKeyPair)).not.toHaveBeenCalled();
        });
    });

    describe('grindKeyPairs', () => {
        it('returns the requested number of key pairs whose addresses all match', async () => {
            expect.assertions(2);
            const keyPairs = await grindKeyPairs({ amount: 3, matches: /^1/ });
            expect(keyPairs).toHaveLength(3);
            const addresses = await Promise.all(keyPairs.map(getAddressFromKeyPair));
            expect(addresses.every(address => /^1/.test(address))).toBe(true);
        });

        it('returns an empty array when `amount` is `0`', async () => {
            expect.assertions(2);
            const keyPairs = await grindKeyPairs({ amount: 0, matches: () => true });
            expect(keyPairs).toEqual([]);
            expect(jest.mocked(generateKeyPair)).not.toHaveBeenCalled();
        });

        it('returns an empty array when `amount` is negative', async () => {
            expect.assertions(2);
            const keyPairs = await grindKeyPairs({ amount: -5, matches: () => true });
            expect(keyPairs).toEqual([]);
            expect(jest.mocked(generateKeyPair)).not.toHaveBeenCalled();
        });

        it('generates key pairs in batches of `concurrency`', async () => {
            expect.assertions(1);
            // With a permissive matcher and `amount: 1`, exactly one full
            // batch of `concurrency` key pairs is generated before the loop
            // exits.
            await grindKeyPairs({ amount: 1, concurrency: 8, matches: () => true });
            expect(jest.mocked(generateKeyPair)).toHaveBeenCalledTimes(8);
        });

        it('defaults to a concurrency of 32', async () => {
            expect.assertions(1);
            await grindKeyPairs({ amount: 1, matches: () => true });
            expect(jest.mocked(generateKeyPair)).toHaveBeenCalledTimes(32);
        });

        it('throws when the regex contains a non-base58 character', async () => {
            expect.assertions(1);
            await expect(grindKeyPairs({ amount: 3, matches: /^foo0/ })).rejects.toThrow(
                new SolanaError(SOLANA_ERROR__KEYS__INVALID_BASE58_IN_GRIND_REGEX, {
                    character: '0',
                    source: '^foo0',
                }),
            );
        });

        it('still validates the regex when `amount` is `0`', async () => {
            expect.assertions(1);
            await expect(grindKeyPairs({ amount: 0, matches: /^foo0/ })).rejects.toThrow(
                new SolanaError(SOLANA_ERROR__KEYS__INVALID_BASE58_IN_GRIND_REGEX, {
                    character: '0',
                    source: '^foo0',
                }),
            );
        });

        it('rejects immediately when the `AbortSignal` fires during a batch', async () => {
            expect.assertions(1);
            const abortController = new AbortController();
            // Mock `generateKeyPair` so the first call aborts the controller
            // and returns a never-resolving promise, and all subsequent
            // calls also hang. This simulates a batch that is cancelled
            // while its key generations are still in flight. The returned
            // promise from `grindKeyPairs` must reject immediately without
            // waiting for those in-flight generations to settle.
            jest.mocked(generateKeyPair)
                .mockImplementationOnce(() => {
                    abortController.abort(new Error('Mid-batch'));
                    return new Promise<never>(() => {});
                })
                .mockImplementation(() => new Promise<never>(() => {}));

            await expect(
                grindKeyPairs({
                    abortSignal: abortController.signal,
                    amount: 1,
                    matches: () => true,
                }),
            ).rejects.toThrow('Mid-batch');
        });
    });

    describe('grindKeyPairs regex validation', () => {
        // These tests exercise the static regex validation logic. They use
        // `amount: 0` so that no key pairs are actually generated after a
        // successful validation — the goal is to check that validation passes
        // or throws as expected.
        //
        // The base58 alphabet excludes `0`, `O`, `I`, and lowercase `l`, so
        // any prefix or suffix containing those characters should be rejected
        // unless the `i` flag or a character class context allows it.

        it.each([
            { regex: /^foo/ },
            { regex: /bar$/ },
            { regex: /^foo.*bar$/ },
            { regex: /^foo/i },
            { regex: /[0-9]/ }, // char class is stripped
            { regex: /(?:foo0)/ }, // group is stripped
            { regex: /foo{10}/ }, // quantifier is stripped
            { regex: /\0/ }, // escape is stripped
            { regex: /^[abc0]foo/ }, // class is stripped, foo is base58
            { regex: /^(?:foo0|bar0)/ }, // group is stripped
            { regex: /^FOO/i }, // upper/lower smartness: `O`'s lowercase `o` is base58
        ])('accepts the regex $regex', async ({ regex }) => {
            expect.assertions(1);
            await expect(grindKeyPairs({ amount: 0, matches: regex })).resolves.toEqual([]);
        });

        it.each([
            { character: '0', regex: /^foo0/ },
            { character: 'O', regex: /^fooO/ },
            { character: 'I', regex: /^fooI/ },
            { character: 'l', regex: /^fool/ },
            { character: '0', regex: /0bar$/ },
            { character: 'O', regex: /^FOO/ },
        ])('rejects the regex $regex', async ({ character, regex }) => {
            expect.assertions(1);
            await expect(grindKeyPairs({ amount: 0, matches: regex })).rejects.toThrow(
                new SolanaError(SOLANA_ERROR__KEYS__INVALID_BASE58_IN_GRIND_REGEX, {
                    character,
                    source: regex.source,
                }),
            );
        });

        it('does not validate function matchers', async () => {
            expect.assertions(1);
            // A function matcher that would be rejected if it were a regex.
            const matches = (address: string) => address.includes('0');
            // amount: 0 short-circuits, so the matcher is never called.
            await expect(grindKeyPairs({ amount: 0, matches })).resolves.toEqual([]);
        });
    });
});
