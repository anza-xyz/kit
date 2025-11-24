import { AccountLookupMeta, AccountMeta, Instruction } from '@solana/instructions';

import { NonSignerInstruction } from '../transaction-message-with-signers';

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
