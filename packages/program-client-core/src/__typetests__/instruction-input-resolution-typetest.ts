import type { Address, ProgramDerivedAddress } from '@solana/addresses';
import type { AccountMeta } from '@solana/instructions';
import type { AccountSignerMeta, TransactionSigner } from '@solana/signers';

import {
    getAccountMetaFactory,
    getAddressFromResolvedInstructionAccount,
    getNonNullResolvedInstructionInput,
    getResolvedInstructionAccountAsProgramDerivedAddress,
    getResolvedInstructionAccountAsTransactionSigner,
    ResolvedInstructionAccount,
} from '../index';

const mockAddress = null as unknown as Address<'1111'>;
const mockPda = null as unknown as ProgramDerivedAddress<'2222'>;
const mockSigner = null as unknown as TransactionSigner<'3333'>;

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

    // It accepts null or undefined as input (runtime will throw an error).
    {
        getResolvedInstructionAccountAsTransactionSigner('test', null) satisfies TransactionSigner;
        getResolvedInstructionAccountAsTransactionSigner('test', undefined) satisfies TransactionSigner;
    }
}

// [DESCRIBE] ResolvedInstructionAccount
{
    // It defaults to allowing Address, ProgramDerivedAddress, TransactionSigner, or null.
    {
        const account: ResolvedInstructionAccount = { isWritable: true, value: mockAddress };
        account satisfies { isWritable: boolean; value: Address | ProgramDerivedAddress | TransactionSigner | null };
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
