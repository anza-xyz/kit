import { Address } from '@solana/addresses';
import { ReadonlyUint8Array } from '@solana/codecs-core';

import { AccountLookupMeta, AccountMeta } from '../accounts';
import {
    assertIsInstructionForProgram,
    assertIsInstructionWithAccounts,
    assertIsInstructionWithData,
    Instruction,
    InstructionWithAccounts,
    InstructionWithData,
    isInstructionForProgram,
    isInstructionWithAccounts,
    isInstructionWithData,
} from '../instruction';

// narrowing using if checks
{
    const instruction = {} as unknown as Instruction;

    // @ts-expect-error instruction might not have accounts
    instruction satisfies InstructionWithAccounts<readonly (AccountLookupMeta | AccountMeta)[]>;

    // @ts-expect-error instruction might not have data
    instruction satisfies InstructionWithData<ReadonlyUint8Array>;

    if (isInstructionWithAccounts(instruction) && isInstructionWithData(instruction)) {
        instruction satisfies Instruction &
            InstructionWithAccounts<readonly (AccountLookupMeta | AccountMeta)[]> &
            InstructionWithData<ReadonlyUint8Array>;
    }
}

// narrowing using assertions
{
    const instruction = {} as unknown as Instruction;

    // @ts-expect-error instruction might not have accounts
    instruction satisfies InstructionWithAccounts<readonly (AccountLookupMeta | AccountMeta)[]>;

    // @ts-expect-error instruction might not have data
    instruction satisfies InstructionWithData<ReadonlyUint8Array>;

    assertIsInstructionWithAccounts(instruction);
    instruction satisfies Instruction & InstructionWithAccounts<readonly (AccountLookupMeta | AccountMeta)[]>;

    assertIsInstructionWithData(instruction);
    instruction satisfies Instruction &
        InstructionWithAccounts<readonly (AccountLookupMeta | AccountMeta)[]> &
        InstructionWithData<ReadonlyUint8Array>;
}

// narrowing by program address
{
    const instruction = {} as unknown as Instruction;
    const myAddress = '1111' as Address<'1111'>;
    type MyAddress = typeof myAddress;

    // @ts-expect-error instruction might not have the right address
    instruction satisfies Instruction<MyAddress>;

    if (isInstructionForProgram(instruction, myAddress)) {
        instruction satisfies Instruction<MyAddress>;
        instruction satisfies Instruction<'1111'>;
    }

    assertIsInstructionForProgram(instruction, myAddress);
    instruction satisfies Instruction<MyAddress>;
    instruction satisfies Instruction<'1111'>;
}
