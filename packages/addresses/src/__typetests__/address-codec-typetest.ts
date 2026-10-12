import type { Decoder, Encoder } from '@solana/codecs-core';

import { Address, getAddressCodec, getAddressDecoder, getAddressEncoder, HasAddress } from '../address';

/**
 * Strict type-equality helper used by typetests below. Resolves to `true` only
 * if `A` and `B` are mutually assignable AND share the same modifier set (`?`,
 * `readonly`); otherwise resolves to `false`.
 *
 * This is stricter than `satisfies` for two reasons:
 *
 * 1. **Bidirectionality.** `A satisfies B` only checks that `A` is assignable
 *    to `B`. A test using `satisfies` passes if the actual type has extra
 *    members beyond what we asserted — which would silently mask a regression
 *    that re-introduced a nested `Omit<...>` wrapper, since `Omit<X, K> & A`
 *    is still structurally assignable to a flat literal.
 * 2. **Modifier strictness.** `A satisfies B` tolerates losing `?` (required
 *    is assignable to optional) and losing `readonly` (readonly is assignable
 *    to mutable). `Equal` distinguishes `{ x: T }` from `{ x?: T }` and from
 *    `{ readonly x: T }` because the inferred-position generic comparison
 *    uses identity rather than assignability for the type parameters.
 *
 * Use `Equal` when the exact shape (including modifiers) matters. Use
 * `satisfies` when one-way assignability is the actual requirement (e.g.
 * "this value is usable where `Disposable & X` is expected").
 */
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

/** Extracts the type accepted by the `encode` function of an encoder or codec. */
type EncodeInput<T extends { encode: (value: never) => unknown }> = Parameters<T['encode']>[0];

const mockAddress = null as unknown as Address<'1111'>;

// [DESCRIBE] getAddressEncoder
{
    // It accepts exactly addresses and address-bearing objects as input.
    {
        true satisfies Equal<EncodeInput<ReturnType<typeof getAddressEncoder>>, Address | HasAddress>;
    }

    // It encodes plain addresses.
    {
        getAddressEncoder().encode(mockAddress);
    }

    // It encodes address-bearing objects.
    {
        getAddressEncoder().encode({ address: mockAddress });
    }

    // It encodes address-bearing objects exposing other properties, such as signers.
    {
        const signer = { address: mockAddress, signTransactions: () => Promise.resolve([]) };
        getAddressEncoder().encode(signer);
    }

    // It encodes address-bearing class instances.
    {
        class AddressWrapper implements HasAddress {
            constructor(readonly address: Address) {}
        }
        getAddressEncoder().encode(new AddressWrapper(mockAddress));
    }

    // It does not accept unbranded strings.
    {
        // @ts-expect-error Unbranded strings are not addresses.
        getAddressEncoder().encode('1111');
    }

    // It does not accept objects exposing an unbranded string address.
    {
        // @ts-expect-error Unbranded strings are not addresses.
        getAddressEncoder().encode({ address: '1111' });
    }

    // It remains usable wherever an address encoder is expected.
    {
        getAddressEncoder() satisfies Encoder<Address>;
    }
}

// [DESCRIBE] getAddressDecoder
{
    // It decodes exactly addresses.
    {
        true satisfies Equal<ReturnType<ReturnType<typeof getAddressDecoder>['decode']>, Address>;
    }
}

// [DESCRIBE] getAddressCodec
{
    // It accepts exactly addresses and address-bearing objects as input.
    {
        true satisfies Equal<EncodeInput<ReturnType<typeof getAddressCodec>>, Address | HasAddress>;
    }

    // It decodes exactly addresses.
    {
        true satisfies Equal<ReturnType<ReturnType<typeof getAddressCodec>['decode']>, Address>;
    }

    // It encodes address-bearing objects.
    {
        getAddressCodec().encode({ address: mockAddress });
    }

    // It remains usable wherever an address encoder or decoder is expected.
    {
        getAddressCodec() satisfies Encoder<Address>;
        getAddressCodec() satisfies Decoder<Address>;
    }
}
