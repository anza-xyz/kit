import { address } from '@solana/addresses';
import { InstructionPlan } from '@solana/instruction-plans';
import { AccountRole, Instruction } from '@solana/instructions';

import { AccountSignerMeta, getSignersFromInstructionPlan } from '../account-signer-meta';
import { KeyPairSigner } from '../keypair-signer';
import { TransactionSigner } from '../transaction-signer';

{
    // [AccountSignerMeta]: It adds a transaction signer to a valid account meta.
    ({
        address: address('1'),
        role: AccountRole.READONLY_SIGNER,
        signer: {} as TransactionSigner,
    }) satisfies AccountSignerMeta;
}

{
    // [AccountSignerMeta]: It fails if the signer is not a transaction signer.
    ({
        address: address('1'),
        role: AccountRole.READONLY_SIGNER,
        // @ts-expect-error Signer is not a transaction signer.
        signer: {} as MessageSigner,
    }) satisfies AccountSignerMeta;
}

{
    // [AccountSignerMeta]: It fails if the account meta is not a signer.
    ({
        address: address('1'),
        // @ts-expect-error Role is not a signer role.
        role: AccountRole.READONLY,
        signer: {} as TransactionSigner,
    }) satisfies AccountSignerMeta;
}

// [DESCRIBE] getSignersFromInstructionPlan
{
    // It returns readonly TransactionSigners by default.
    {
        const plan = null as unknown as InstructionPlan;
        const signers = getSignersFromInstructionPlan(plan);
        signers satisfies readonly TransactionSigner[];
        // @ts-expect-error The returned array is readonly.
        signers satisfies TransactionSigner[];
        // @ts-expect-error The signers are not narrowed by default.
        signers satisfies readonly KeyPairSigner[];
    }

    // It narrows the returned signers to the provided TSigner type.
    {
        const plan = null as unknown as InstructionPlan;
        const signers = getSignersFromInstructionPlan<KeyPairSigner>(plan);
        signers satisfies readonly KeyPairSigner[];
    }

    // It only accepts instruction plans.
    {
        const instruction = null as unknown as Instruction;
        // @ts-expect-error Instructions must be wrapped in an instruction plan.
        getSignersFromInstructionPlan(instruction);
    }
}
