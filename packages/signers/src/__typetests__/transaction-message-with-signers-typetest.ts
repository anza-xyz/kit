import { AccountLookupMeta, AccountMeta, Instruction } from '@solana/instructions';

import { AccountSignerMeta } from '../account-signer-meta';
import { InstructionWithSigners, NonSignerInstruction } from '../transaction-message-with-signers';
import { TransactionSigner } from '../transaction-signer';

// [DESCRIBE] NonSignerInstruction
{
    // It allows an instruction that does not have any signer account metas.
    {
        const instruction = null as unknown as Instruction<string, AccountMeta[]>;
        instruction satisfies NonSignerInstruction;
    }

    // It allows an instruction with lookup metas that are not signers.
    {
        const instruction = null as unknown as Instruction<string, (AccountLookupMeta | AccountMeta)[]>;
        instruction satisfies NonSignerInstruction;
    }

    // It fails if the instruction has any signer account metas.
    {
        const instruction = null as unknown as Instruction<
            string,
            (AccountMeta | (AccountMeta & { signer: unknown }))[]
        >;
        // @ts-expect-error Instruction has a signer account meta.
        instruction satisfies NonSignerInstruction;
    }
}

// [DESCRIBE] InstructionWithSigners
{
    // It allows an instruction with signer account metas.
    {
        const instruction = null as unknown as Instruction<string, AccountSignerMeta[]>;
        instruction satisfies InstructionWithSigners;
    }

    // It allows an instruction with no signer account metas.
    {
        const instruction = null as unknown as Instruction<string, AccountMeta[]>;
        instruction satisfies InstructionWithSigners;
    }

    // It allows an instruction with a mix of signer and non-signer account metas.
    {
        const instruction = null as unknown as Instruction<string, (AccountMeta | AccountSignerMeta)[]>;
        instruction satisfies InstructionWithSigners;
    }

    // It fails for a signer type that does not match the account meta signer.
    {
        type CustomSigner = TransactionSigner & { customProperty: true };
        const instruction = null as unknown as Instruction<string, AccountSignerMeta[]>;
        // @ts-expect-error Signer type does not match account meta signer type.
        instruction satisfies InstructionWithSigners<CustomSigner>;
    }
}
