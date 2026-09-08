import { Address } from '@solana/addresses';
import { Decoder, ReadonlyUint8Array } from '@solana/codecs-core';

import { Account, EncodedAccount } from '../account';
import { assertAccountDecoded, assertAccountsDecoded, decodeAccount } from '../decode-account';
import { MaybeAccount, MaybeEncodedAccount } from '../maybe-account';

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

type MockData = { foo: 42 };
type OtherMockData = { bar: 24 };
type MockDataDecoder = Decoder<MockData>;

{
    // It decodes an EncodedAccount into an Account.
    const account = decodeAccount({} as EncodedAccount<'1111'>, {} as MockDataDecoder);
    account satisfies Account<MockData, '1111'>;
}

{
    // It decodes an MaybeEncodedAccount into a MaybeAccount.
    const account = decodeAccount({} as MaybeEncodedAccount<'1111'>, {} as MockDataDecoder);
    account satisfies MaybeAccount<MockData, '1111'>;
    // @ts-expect-error The account should not be of type Account as it may not exist.
    account satisfies Account<MockData, '1111'>;
}

{
    // It narrows an account with data MockData | Uint8Array to MockData
    const account = {} as unknown as Account<MockData | Uint8Array, '1111'>;
    assertAccountDecoded(account);
    account satisfies Account<MockData, '1111'>;
    account.data satisfies MockData;
}

{
    // It narrows a list of accounts with data MockData | Uint8Array to MockData
    const accounts = [
        {} as unknown as Account<MockData | ReadonlyUint8Array, '1111'>,
        {} as unknown as Account<MockData | ReadonlyUint8Array, '2222'>,
        {} as unknown as Account<MockData | ReadonlyUint8Array, '3333'>,
    ];
    assertAccountsDecoded(accounts);
    accounts satisfies Account<MockData, Address>[];
    for (const a of accounts) {
        a.data satisfies MockData;
    }
}

{
    // It narrows a homogeneous array without requiring a tuple annotation.
    const accounts = [] as Account<MockData | ReadonlyUint8Array, Address>[];
    assertAccountsDecoded(accounts);
    accounts satisfies Account<MockData, Address>[];
}

// [DESCRIBE] assertAccountsDecoded per-element types
{
    // It preserves a distinct address on each tuple element after narrowing.
    {
        const accounts: [
            Account<MockData | ReadonlyUint8Array, '1111'>,
            Account<MockData | ReadonlyUint8Array, '2222'>,
            Account<MockData | ReadonlyUint8Array, '3333'>,
        ] = [
            {} as Account<MockData | ReadonlyUint8Array, '1111'>,
            {} as Account<MockData | ReadonlyUint8Array, '2222'>,
            {} as Account<MockData | ReadonlyUint8Array, '3333'>,
        ];
        assertAccountsDecoded(accounts);
        true satisfies Equal<
            typeof accounts,
            [Account<MockData, '1111'>, Account<MockData, '2222'>, Account<MockData, '3333'>]
        >;
        // @ts-expect-error The first account must not be typed with the second address.
        true satisfies Equal<
            typeof accounts,
            [Account<MockData, '2222'>, Account<MockData, '2222'>, Account<MockData, '3333'>]
        >;
    }

    // It preserves a distinct data type on each tuple element after narrowing.
    {
        const accounts: [
            Account<MockData | ReadonlyUint8Array, '1111'>,
            Account<OtherMockData | ReadonlyUint8Array, '2222'>,
        ] = [
            {} as Account<MockData | ReadonlyUint8Array, '1111'>,
            {} as Account<OtherMockData | ReadonlyUint8Array, '2222'>,
        ];
        assertAccountsDecoded(accounts);
        true satisfies Equal<typeof accounts, [Account<MockData, '1111'>, Account<OtherMockData, '2222'>]>;
        accounts[0].data satisfies MockData;
        accounts[1].data satisfies OtherMockData;
        // @ts-expect-error The first account must not be typed with the second data type.
        accounts[0].data satisfies OtherMockData;
    }

    // It preserves per-element addresses on a MaybeAccount tuple.
    {
        const accounts: [
            MaybeAccount<MockData | ReadonlyUint8Array, '1111'>,
            MaybeAccount<OtherMockData | ReadonlyUint8Array, '2222'>,
        ] = [
            {} as MaybeAccount<MockData | ReadonlyUint8Array, '1111'>,
            {} as MaybeAccount<OtherMockData | ReadonlyUint8Array, '2222'>,
        ];
        assertAccountsDecoded(accounts);
        true satisfies Equal<typeof accounts, [MaybeAccount<MockData, '1111'>, MaybeAccount<OtherMockData, '2222'>]>;
    }
}
