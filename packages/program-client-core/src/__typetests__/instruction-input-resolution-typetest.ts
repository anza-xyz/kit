import type { Address, HasAddress, ProgramDerivedAddress } from '@solana/addresses';
import {
    type AccountMeta,
    type AccountNonSignerMeta,
    AccountRole,
    type Instruction,
    type InstructionWithAccounts,
    type ReadonlyAccount,
    type ReadonlySignerAccount,
    type WritableAccount,
    type WritableSignerAccount,
} from '@solana/instructions';
import type { AccountSignerMeta, TransactionSigner } from '@solana/signers';

import {
    getAccountMetaFactory,
    getAddressFromResolvedInstructionAccount,
    getNonNullResolvedInstructionInput,
    getResolvedInstructionAccountAsProgramDerivedAddress,
    getResolvedInstructionAccountAsTransactionSigner,
    InstructionAccountInput,
    InstructionAccountInputAddress,
    InstructionSignerInput,
    ResolvedInstructionAccount,
    ResolvedInstructionAccountMeta,
} from '../index';

const mockAddress = null as unknown as Address<'1111'>;
const mockPda = null as unknown as ProgramDerivedAddress<'2222'>;
const mockSigner = null as unknown as TransactionSigner<'3333'>;
const mockAddressWrapper = null as unknown as HasAddress<'4444'>;
const mockNonSignerMeta = null as unknown as AccountNonSignerMeta<'5555'>;
const mockSignerMeta = null as unknown as AccountSignerMeta<'6666'>;

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

// [DESCRIBE] getNonNullResolvedInstructionInput
{
    // It returns the value with its original type.
    {
        getNonNullResolvedInstructionInput('test', mockAddress) satisfies Address<'1111'>;
    }

    // It accepts null or undefined as input (runtime will throw an error).
    {
        getNonNullResolvedInstructionInput<string>('test', null) satisfies string;
        getNonNullResolvedInstructionInput<string>('test', undefined) satisfies string;
    }
}

// [DESCRIBE] getAddressFromResolvedInstructionAccount
{
    // It extracts an address from an Address value.
    {
        getAddressFromResolvedInstructionAccount('test', mockAddress) satisfies Address<'1111'>;
    }

    // It extracts an address from a ProgramDerivedAddress value.
    {
        getAddressFromResolvedInstructionAccount('test', mockPda) satisfies Address<'2222'>;
    }

    // It extracts an address from a TransactionSigner value.
    {
        getAddressFromResolvedInstructionAccount('test', mockSigner) satisfies Address<'3333'>;
    }

    // It extracts an address from any object exposing an address property.
    {
        getAddressFromResolvedInstructionAccount('test', mockAddressWrapper) satisfies Address<'4444'>;
    }

    // It extracts an address from an account meta.
    {
        getAddressFromResolvedInstructionAccount('test', mockNonSignerMeta) satisfies Address<'5555'>;
        getAddressFromResolvedInstructionAccount('test', mockSignerMeta) satisfies Address<'6666'>;
    }

    // It accepts null or undefined as input (runtime will throw an error).
    {
        getAddressFromResolvedInstructionAccount('test', null) satisfies Address;
        getAddressFromResolvedInstructionAccount('test', undefined) satisfies Address;
    }
}

// [DESCRIBE] getResolvedInstructionAccountAsProgramDerivedAddress
{
    // It returns a ProgramDerivedAddress.
    {
        getResolvedInstructionAccountAsProgramDerivedAddress('test', mockPda) satisfies ProgramDerivedAddress<'2222'>;
    }

    // It accepts null or undefined as input (runtime will throw an error).
    {
        getResolvedInstructionAccountAsProgramDerivedAddress('test', null) satisfies ProgramDerivedAddress;
        getResolvedInstructionAccountAsProgramDerivedAddress('test', undefined) satisfies ProgramDerivedAddress;
    }
}

// [DESCRIBE] getResolvedInstructionAccountAsTransactionSigner
{
    // It returns a TransactionSigner.
    {
        getResolvedInstructionAccountAsTransactionSigner('test', mockSigner) satisfies TransactionSigner<'3333'>;
    }

    // It extracts the TransactionSigner from an AccountSignerMeta.
    {
        getResolvedInstructionAccountAsTransactionSigner('test', mockSignerMeta) satisfies TransactionSigner<'6666'>;
    }

    // It accepts null or undefined as input (runtime will throw an error).
    {
        getResolvedInstructionAccountAsTransactionSigner('test', null) satisfies TransactionSigner;
        getResolvedInstructionAccountAsTransactionSigner('test', undefined) satisfies TransactionSigner;
    }
}

// [DESCRIBE] InstructionAccountInput
{
    // It accepts an Address.
    {
        mockAddress satisfies InstructionAccountInput;
        mockAddress satisfies InstructionAccountInput<'1111'>;
    }

    // It accepts any object exposing an address property, including a TransactionSigner.
    {
        mockAddressWrapper satisfies InstructionAccountInput<'4444'>;
        mockSigner satisfies InstructionAccountInput<'3333'>;
    }

    // It accepts a ProgramDerivedAddress.
    {
        mockPda satisfies InstructionAccountInput<'2222'>;
    }

    // It accepts an AccountNonSignerMeta.
    {
        mockNonSignerMeta satisfies InstructionAccountInput<'5555'>;
    }

    // It cannot reject signer metas structurally, since HasAddress absorbs any
    // address-bearing object (the runtime honours their explicit role instead).
    {
        mockSignerMeta satisfies InstructionAccountInput<'6666'>;
    }
}

// [DESCRIBE] InstructionSignerInput
{
    // It accepts a TransactionSigner.
    {
        mockSigner satisfies InstructionSignerInput;
        mockSigner satisfies InstructionSignerInput<'3333'>;
    }

    // It accepts an AccountSignerMeta.
    {
        mockSignerMeta satisfies InstructionSignerInput<'6666'>;
    }

    // It rejects plain addresses and address-bearing objects.
    {
        // @ts-expect-error Addresses are not signer inputs.
        mockAddress satisfies InstructionSignerInput<'1111'>;
        // @ts-expect-error Address-bearing objects without signing functions are not signer inputs.
        mockAddressWrapper satisfies InstructionSignerInput<'4444'>;
    }
}

// [DESCRIBE] ResolvedInstructionAccount
{
    // It defaults to allowing any account or signer input, or null.
    {
        const account: ResolvedInstructionAccount = { isWritable: true, value: mockAddress };
        account satisfies { isWritable: boolean; value: InstructionAccountInput | InstructionSignerInput | null };
    }

    // It accepts address-bearing objects and account metas as values.
    {
        ({ isWritable: true, value: mockAddressWrapper }) satisfies ResolvedInstructionAccount;
        ({ isWritable: true, value: mockNonSignerMeta }) satisfies ResolvedInstructionAccount;
        ({ isWritable: true, value: mockSignerMeta }) satisfies ResolvedInstructionAccount;
    }

    // It accepts an optional isSigner flag.
    {
        ({ isSigner: false, isWritable: true, value: mockAddress }) satisfies ResolvedInstructionAccount;
        ({ isSigner: 'either', isWritable: true, value: mockSigner }) satisfies ResolvedInstructionAccount;
        ({ isSigner: true, isWritable: true, value: mockSigner }) satisfies ResolvedInstructionAccount;
    }

    // It can be narrowed to a specific value type.
    {
        const account: ResolvedInstructionAccount<'1111', Address<'1111'>> = { isWritable: false, value: mockAddress };
        account satisfies { isWritable: boolean; value: Address<'1111'> };
    }
}

// [DESCRIBE] getAccountMetaFactory
{
    // It returns a factory that produces AccountMeta or AccountSignerMeta.
    {
        const toAccountMeta = getAccountMetaFactory(mockAddress, 'programId');
        const meta = toAccountMeta('test', { isWritable: true, value: mockAddress });
        meta satisfies AccountMeta | AccountSignerMeta | undefined;
    }
}

// [DESCRIBE] ResolvedInstructionAccountMeta
{
    // The following mimics the shape of a generated instruction builder having a required
    // signer account (`payer`), an optional signer account (`owner`, i.e. `isSigner: 'either'`)
    // and a non-signer account (`mint`), in order to assert the meta types inferred at
    // realistic call sites.
    type MockInput = {
        mint: InstructionAccountInput<'7777'>;
        owner: InstructionAccountInput<'9999'> | InstructionSignerInput<'9999'>;
        payer: InstructionSignerInput<'8888'>;
    };
    const getMockInstruction = null as unknown as <TInput extends MockInput>(
        input: TInput,
    ) => {
        mint: ResolvedInstructionAccountMeta<TInput['mint'], '7777'>;
        owner: ResolvedInstructionAccountMeta<
            TInput['owner'],
            '9999',
            AccountSignerMeta<'9999'> & ReadonlySignerAccount<'9999'>
        >;
        payer: ResolvedInstructionAccountMeta<
            TInput['payer'],
            '8888',
            AccountSignerMeta<'8888'> & WritableSignerAccount<'8888'>
        >;
    };
    const address7 = null as unknown as Address<'7777'>;
    const signer7 = null as unknown as TransactionSigner<'7777'>;
    const nonSignerMeta7 = null as unknown as AccountNonSignerMeta<'7777'>;
    const address9 = null as unknown as Address<'9999'>;
    const wrapper9 = null as unknown as HasAddress<'9999'>;
    const pda9 = null as unknown as ProgramDerivedAddress<'9999'>;
    const signer9 = null as unknown as TransactionSigner<'9999'>;
    const nonSignerMeta9 = null as unknown as AccountNonSignerMeta<'9999'>;
    const signerMeta9 = null as unknown as AccountSignerMeta<'9999'>;
    const signer8 = null as unknown as TransactionSigner<'8888'>;
    const signerMeta8 = null as unknown as AccountSignerMeta<'8888'>;

    // It resolves plain addresses to the address type parameter and signers to the provided signer meta.
    {
        const result = getMockInstruction({ mint: address7, owner: address9, payer: signer8 });
        true satisfies Equal<typeof result.mint, '7777'>;
        true satisfies Equal<typeof result.owner, '9999'>;
        true satisfies Equal<typeof result.payer, AccountSignerMeta<'8888'> & WritableSignerAccount<'8888'>>;
        void result;
    }

    // It resolves address-bearing objects and PDAs to the address type parameter.
    {
        const result = getMockInstruction({ mint: address7, owner: wrapper9, payer: signer8 });
        true satisfies Equal<typeof result.owner, '9999'>;
        const pdaResult = getMockInstruction({ mint: address7, owner: pda9, payer: signer8 });
        true satisfies Equal<typeof pdaResult.owner, '9999'>;
        void result;
        void pdaResult;
    }

    // It treats signers provided for non-signer accounts as plain address carriers.
    {
        const result = getMockInstruction({ mint: signer7, owner: address9, payer: signer8 });
        true satisfies Equal<typeof result.mint, '7777'>;
        void result;
    }

    // It resolves signers provided for optional signer accounts to the provided signer meta.
    {
        const result = getMockInstruction({ mint: address7, owner: signer9, payer: signer8 });
        true satisfies Equal<typeof result.owner, AccountSignerMeta<'9999'> & ReadonlySignerAccount<'9999'>>;
        void result;
    }

    // It preserves the role type of explicit role overrides — using AccountSignerMeta when
    // a signer is attached — widening to AccountMeta only when the role is not statically known.
    {
        const result = getMockInstruction({ mint: nonSignerMeta7, owner: nonSignerMeta9, payer: signerMeta8 });
        true satisfies Equal<
            typeof result.mint,
            AccountMeta<'7777'> & { readonly role: AccountRole.READONLY | AccountRole.WRITABLE }
        >;
        true satisfies Equal<
            typeof result.owner,
            AccountMeta<'9999'> & { readonly role: AccountRole.READONLY | AccountRole.WRITABLE }
        >;
        true satisfies Equal<
            typeof result.payer,
            AccountSignerMeta<'8888'> & {
                readonly role: AccountRole.READONLY_SIGNER | AccountRole.WRITABLE_SIGNER;
            }
        >;
        const signerMetaResult = getMockInstruction({ mint: address7, owner: signerMeta9, payer: signer8 });
        true satisfies Equal<
            typeof signerMetaResult.owner,
            AccountSignerMeta<'9999'> & {
                readonly role: AccountRole.READONLY_SIGNER | AccountRole.WRITABLE_SIGNER;
            }
        >;
        void result;
        void signerMetaResult;
    }

    // It resolves inline role overrides with literal roles to the precise role-narrowed metas.
    {
        const result = getMockInstruction({
            mint: { address: address7, role: AccountRole.READONLY },
            owner: { address: address9, role: AccountRole.WRITABLE },
            payer: { address: signer8.address, role: AccountRole.READONLY_SIGNER, signer: signer8 },
        });
        true satisfies Equal<typeof result.mint, ReadonlyAccount<'7777'>>;
        true satisfies Equal<typeof result.owner, WritableAccount<'9999'>>;
        true satisfies Equal<
            typeof result.payer,
            AccountSignerMeta<'8888'> & { readonly role: AccountRole.READONLY_SIGNER }
        >;
        void result;
    }

    // It deterministically falls back to the address type parameter when given a declared
    // input union instead of a narrowed input type (i.e. it does not distribute).
    {
        true satisfies Equal<
            ResolvedInstructionAccountMeta<
                InstructionAccountInput<'9999'> | InstructionSignerInput<'9999'>,
                '9999',
                AccountSignerMeta<'9999'> & ReadonlySignerAccount<'9999'>
            >,
            '9999'
        >;
    }

    // It defaults the signer meta type parameter to the address type parameter.
    {
        true satisfies Equal<ResolvedInstructionAccountMeta<TransactionSigner<'7777'>, '7777'>, '7777'>;
    }
}

// [DESCRIBE] ResolvedInstructionAccountMeta (generated instruction integration)
{
    // The following replicates the full type machinery of a generated program client — the
    // instruction type mapping address strings to IDL-declared metas, the input type, and
    // the instruction builder — in order to assert the final `accounts` tuple end-to-end at
    // realistic call sites. It is the executable specification of the signature shape the
    // Codama JS renderer must emit in order to use `ResolvedInstructionAccountMeta`.
    type MockInstruction<
        TAccountPayer extends AccountMeta<string> | string = string,
        TAccountOwner extends AccountMeta<string> | string = string,
        TAccountMint extends AccountMeta<string> | string = string,
        TAccountRent extends AccountMeta<string> | string = string,
    > = Instruction<'9998'> &
        InstructionWithAccounts<
            [
                TAccountPayer extends string
                    ? AccountSignerMeta<TAccountPayer> & WritableSignerAccount<TAccountPayer>
                    : TAccountPayer,
                TAccountOwner extends string ? ReadonlyAccount<TAccountOwner> : TAccountOwner,
                TAccountMint extends string ? WritableAccount<TAccountMint> : TAccountMint,
                TAccountRent extends string ? ReadonlyAccount<TAccountRent> : TAccountRent,
            ]
        >;
    type MockInput<
        TAccountPayer extends string = string,
        TAccountOwner extends string = string,
        TAccountMint extends string = string,
        TAccountRent extends string = string,
    > = {
        mint: InstructionAccountInput<TAccountMint>;
        owner: InstructionAccountInput<TAccountOwner> | InstructionSignerInput<TAccountOwner>;
        payer: InstructionSignerInput<TAccountPayer>;
        rent?: InstructionAccountInput<TAccountRent> | null;
    };
    // IMPORTANT: the parameter must intersect the concrete input type with `TInput`
    // (`MockInput<...> & TInput`). Referencing the address type parameters only in
    // `TInput`'s constraint makes their inference fall back to `string` — see the
    // canary test at the end of this describe block. Additionally, `TInput` must default
    // to the concrete input type so that call sites providing explicit type arguments
    // keep working — see the dedicated test below.
    const getMockInstructionBuilder = null as unknown as <
        TAccountPayer extends string,
        TAccountOwner extends string,
        TAccountMint extends string,
        TAccountRent extends string,
        TInput extends MockInput<TAccountPayer, TAccountOwner, TAccountMint, TAccountRent> = MockInput<
            TAccountPayer,
            TAccountOwner,
            TAccountMint,
            TAccountRent
        >,
    >(
        input: MockInput<TAccountPayer, TAccountOwner, TAccountMint, TAccountRent> & TInput,
    ) => MockInstruction<
        ResolvedInstructionAccountMeta<
            TInput['payer'],
            TAccountPayer,
            AccountSignerMeta<TAccountPayer> & WritableSignerAccount<TAccountPayer>
        >,
        ResolvedInstructionAccountMeta<
            TInput['owner'],
            TAccountOwner,
            AccountSignerMeta<TAccountOwner> & ReadonlySignerAccount<TAccountOwner>
        >,
        ResolvedInstructionAccountMeta<TInput['mint'], TAccountMint>,
        ResolvedInstructionAccountMeta<TInput['rent'], TAccountRent>
    >;
    const address5 = null as unknown as Address<'5555'>;
    const address7 = null as unknown as Address<'7777'>;
    const signer7 = null as unknown as TransactionSigner<'7777'>;
    const nonSignerMeta7 = null as unknown as AccountNonSignerMeta<'7777'>;
    const address9 = null as unknown as Address<'9999'>;
    const wrapper9 = null as unknown as HasAddress<'9999'>;
    const pda9 = null as unknown as ProgramDerivedAddress<'9999'>;
    const signer9 = null as unknown as TransactionSigner<'9999'>;
    const signerMeta9 = null as unknown as AccountSignerMeta<'9999'>;
    const signer8 = null as unknown as TransactionSigner<'8888'>;
    const signerMeta8 = null as unknown as AccountSignerMeta<'8888'>;

    // It resolves plain values to the IDL-declared metas, with inferred address brands.
    {
        const result = getMockInstructionBuilder({ mint: address7, owner: address9, payer: signer8 });
        true satisfies Equal<(typeof result)['accounts'][0], AccountSignerMeta<'8888'> & WritableSignerAccount<'8888'>>;
        true satisfies Equal<(typeof result)['accounts'][1], ReadonlyAccount<'9999'>>;
        true satisfies Equal<(typeof result)['accounts'][2], WritableAccount<'7777'>>;
        void result;
    }

    // It resolves address-bearing objects and PDAs to the IDL-declared metas.
    {
        const result = getMockInstructionBuilder({ mint: address7, owner: wrapper9, payer: signer8 });
        true satisfies Equal<(typeof result)['accounts'][1], ReadonlyAccount<'9999'>>;
        const pdaResult = getMockInstructionBuilder({ mint: address7, owner: pda9, payer: signer8 });
        true satisfies Equal<(typeof pdaResult)['accounts'][1], ReadonlyAccount<'9999'>>;
        void result;
        void pdaResult;
    }

    // It upgrades optional signer accounts when a signer is provided, and treats signers
    // provided for non-signer accounts as plain address carriers.
    {
        const result = getMockInstructionBuilder({ mint: signer7, owner: signer9, payer: signer8 });
        true satisfies Equal<(typeof result)['accounts'][1], AccountSignerMeta<'9999'> & ReadonlySignerAccount<'9999'>>;
        true satisfies Equal<(typeof result)['accounts'][2], WritableAccount<'7777'>>;
        void result;
    }

    // It preserves the role types of explicit role overrides in the final accounts tuple.
    {
        const result = getMockInstructionBuilder({ mint: nonSignerMeta7, owner: signerMeta9, payer: signerMeta8 });
        true satisfies Equal<
            (typeof result)['accounts'][0],
            AccountSignerMeta<'8888'> & { readonly role: AccountRole.READONLY_SIGNER | AccountRole.WRITABLE_SIGNER }
        >;
        true satisfies Equal<
            (typeof result)['accounts'][1],
            AccountSignerMeta<'9999'> & { readonly role: AccountRole.READONLY_SIGNER | AccountRole.WRITABLE_SIGNER }
        >;
        true satisfies Equal<
            (typeof result)['accounts'][2],
            AccountMeta<'7777'> & { readonly role: AccountRole.READONLY | AccountRole.WRITABLE }
        >;
        void result;
    }

    // It resolves inline role overrides with literal roles to the precise role-narrowed metas.
    {
        const result = getMockInstructionBuilder({
            mint: { address: address7, role: AccountRole.READONLY },
            owner: { address: address9, role: AccountRole.WRITABLE },
            payer: signer8,
        });
        true satisfies Equal<(typeof result)['accounts'][1], WritableAccount<'9999'>>;
        true satisfies Equal<(typeof result)['accounts'][2], ReadonlyAccount<'7777'>>;
        void result;
    }

    // It resolves optional accounts to the IDL-declared meta with an unbranded address,
    // whether they are omitted or explicitly set to null.
    {
        const omittedResult = getMockInstructionBuilder({ mint: address7, owner: address9, payer: signer8 });
        true satisfies Equal<(typeof omittedResult)['accounts'][3], ReadonlyAccount<string>>;
        const nullResult = getMockInstructionBuilder({ mint: address7, owner: address9, payer: signer8, rent: null });
        true satisfies Equal<(typeof nullResult)['accounts'][3], ReadonlyAccount<string>>;
        const providedResult = getMockInstructionBuilder({
            mint: address7,
            owner: address9,
            payer: signer8,
            rent: address5,
        });
        true satisfies Equal<(typeof providedResult)['accounts'][3], ReadonlyAccount<'5555'>>;
        void omittedResult;
        void nullResult;
        void providedResult;
    }

    // It still rejects invalid inputs.
    {
        // @ts-expect-error Numbers are not valid account inputs.
        void getMockInstructionBuilder({ mint: 123, owner: address9, payer: signer8 });
        // @ts-expect-error Plain addresses are not valid signer inputs.
        void getMockInstructionBuilder({ mint: address7, owner: address9, payer: address7 });
    }

    // It keeps call sites with explicit type arguments working: `TInput` defaults to the
    // declared input union, so the helper falls back to the branded address strings, which
    // the instruction type then maps to the IDL-declared metas.
    {
        const result = getMockInstructionBuilder<'8888', '9999', '7777', string>({
            mint: address7,
            owner: signer9,
            payer: signer8,
        });
        true satisfies Equal<(typeof result)['accounts'][0], AccountSignerMeta<'8888'> & WritableSignerAccount<'8888'>>;
        true satisfies Equal<(typeof result)['accounts'][1], ReadonlyAccount<'9999'>>;
        true satisfies Equal<(typeof result)['accounts'][2], WritableAccount<'7777'>>;
        void result;
    }

    // ALTERNATIVE PATTERN: instruction builders may instead capture the caller's input in
    // a single `TInput` type parameter and recover each account's address type parameter
    // using `InstructionAccountInputAddress`. This block asserts the same matrix for that
    // signature shape.
    const getSingleGenericBuilder = null as unknown as <TInput extends MockInput>(
        input: TInput,
    ) => MockInstruction<
        ResolvedInstructionAccountMeta<
            TInput['payer'],
            InstructionAccountInputAddress<TInput['payer']>,
            AccountSignerMeta<InstructionAccountInputAddress<TInput['payer']>> &
                WritableSignerAccount<InstructionAccountInputAddress<TInput['payer']>>
        >,
        ResolvedInstructionAccountMeta<
            TInput['owner'],
            InstructionAccountInputAddress<TInput['owner']>,
            AccountSignerMeta<InstructionAccountInputAddress<TInput['owner']>> &
                ReadonlySignerAccount<InstructionAccountInputAddress<TInput['owner']>>
        >,
        ResolvedInstructionAccountMeta<TInput['mint'], InstructionAccountInputAddress<TInput['mint']>>,
        ResolvedInstructionAccountMeta<TInput['rent'], InstructionAccountInputAddress<TInput['rent']>>
    >;

    // It resolves plain values to the IDL-declared metas, with extracted address brands.
    {
        const result = getSingleGenericBuilder({ mint: address7, owner: address9, payer: signer8 });
        true satisfies Equal<(typeof result)['accounts'][0], AccountSignerMeta<'8888'> & WritableSignerAccount<'8888'>>;
        true satisfies Equal<(typeof result)['accounts'][1], ReadonlyAccount<'9999'>>;
        true satisfies Equal<(typeof result)['accounts'][2], WritableAccount<'7777'>>;
        void result;
    }

    // It handles wrappers, PDAs, signer upgrades, address carriers and role overrides.
    {
        const result = getSingleGenericBuilder({ mint: signer7, owner: signer9, payer: signer8 });
        true satisfies Equal<(typeof result)['accounts'][1], AccountSignerMeta<'9999'> & ReadonlySignerAccount<'9999'>>;
        true satisfies Equal<(typeof result)['accounts'][2], WritableAccount<'7777'>>;
        const wrapperResult = getSingleGenericBuilder({ mint: address7, owner: wrapper9, payer: signer8 });
        true satisfies Equal<(typeof wrapperResult)['accounts'][1], ReadonlyAccount<'9999'>>;
        const pdaResult = getSingleGenericBuilder({ mint: address7, owner: pda9, payer: signer8 });
        true satisfies Equal<(typeof pdaResult)['accounts'][1], ReadonlyAccount<'9999'>>;
        const overrideResult = getSingleGenericBuilder({
            mint: nonSignerMeta7,
            owner: signerMeta9,
            payer: signerMeta8,
        });
        true satisfies Equal<
            (typeof overrideResult)['accounts'][0],
            AccountSignerMeta<'8888'> & { readonly role: AccountRole.READONLY_SIGNER | AccountRole.WRITABLE_SIGNER }
        >;
        true satisfies Equal<
            (typeof overrideResult)['accounts'][1],
            AccountSignerMeta<'9999'> & { readonly role: AccountRole.READONLY_SIGNER | AccountRole.WRITABLE_SIGNER }
        >;
        true satisfies Equal<
            (typeof overrideResult)['accounts'][2],
            AccountMeta<'7777'> & { readonly role: AccountRole.READONLY | AccountRole.WRITABLE }
        >;
        void result;
        void wrapperResult;
        void pdaResult;
        void overrideResult;
    }

    // It resolves inline role overrides with literal roles to the precise role-narrowed metas.
    {
        const result = getSingleGenericBuilder({
            mint: { address: address7, role: AccountRole.READONLY },
            owner: address9,
            payer: signer8,
        });
        true satisfies Equal<(typeof result)['accounts'][2], ReadonlyAccount<'7777'>>;
        void result;
    }

    // It resolves optional accounts to the IDL-declared meta with an unbranded address,
    // whether they are omitted or explicitly set to null.
    {
        const omittedResult = getSingleGenericBuilder({ mint: address7, owner: address9, payer: signer8 });
        true satisfies Equal<(typeof omittedResult)['accounts'][3], ReadonlyAccount<string>>;
        const nullResult = getSingleGenericBuilder({ mint: address7, owner: address9, payer: signer8, rent: null });
        true satisfies Equal<(typeof nullResult)['accounts'][3], ReadonlyAccount<string>>;
        const providedResult = getSingleGenericBuilder({
            mint: address7,
            owner: address9,
            payer: signer8,
            rent: address5,
        });
        true satisfies Equal<(typeof providedResult)['accounts'][3], ReadonlyAccount<'5555'>>;
        void omittedResult;
        void nullResult;
        void providedResult;
    }

    // CANARY: referencing the address type parameters only in `TInput`'s constraint does
    // NOT infer them — they fall back to `string`. This asserts the *broken* behaviour on
    // purpose: if a future TypeScript version starts inferring through constraints, this
    // test will fail, signalling that the renderer's intersection parameter pattern above
    // could be simplified.
    {
        const getConstraintOnlyBuilder = null as unknown as <
            TAccountMint extends string,
            TInput extends Pick<MockInput<string, string, TAccountMint>, 'mint'>,
        >(
            input: TInput,
        ) => ResolvedInstructionAccountMeta<TInput['mint'], TAccountMint>;
        const result = getConstraintOnlyBuilder({ mint: address7 });
        true satisfies Equal<typeof result, string>;
        void result;
    }
}

// [DESCRIBE] InstructionAccountInputAddress
{
    // Note: the checks below go through intermediate type aliases because the `Equal`
    // helper compares unevaluated conditional types structurally when used inline.

    // It extracts the address type parameter from every kind of instruction account input.
    {
        type FromAddress = InstructionAccountInputAddress<Address<'9999'>>;
        type FromWrapper = InstructionAccountInputAddress<HasAddress<'9999'>>;
        type FromSigner = InstructionAccountInputAddress<TransactionSigner<'9999'>>;
        type FromPda = InstructionAccountInputAddress<ProgramDerivedAddress<'9999'>>;
        type FromNonSignerMeta = InstructionAccountInputAddress<AccountNonSignerMeta<'9999'>>;
        type FromSignerMeta = InstructionAccountInputAddress<AccountSignerMeta<'9999'>>;
        true satisfies Equal<FromAddress, '9999'>;
        true satisfies Equal<FromWrapper, '9999'>;
        true satisfies Equal<FromSigner, '9999'>;
        true satisfies Equal<FromPda, '9999'>;
        true satisfies Equal<FromNonSignerMeta, '9999'>;
        true satisfies Equal<FromSignerMeta, '9999'>;
    }

    // It distributes over unions, preserving a shared address brand.
    {
        type FromUnion = InstructionAccountInputAddress<
            InstructionAccountInput<'9999'> | InstructionSignerInput<'9999'>
        >;
        true satisfies Equal<FromUnion, '9999'>;
    }

    // It resolves to string when the input carries no brand.
    {
        type FromUnbrandedAddress = InstructionAccountInputAddress<Address>;
        type FromUnbrandedSigner = InstructionAccountInputAddress<TransactionSigner>;
        true satisfies Equal<FromUnbrandedAddress, string>;
        true satisfies Equal<FromUnbrandedSigner, string>;
    }
}
