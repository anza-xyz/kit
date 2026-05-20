import type { Address } from '@solana/addresses';
import { isInstructionForProgram } from '@solana/instructions';

import type { TracedInstruction } from '../types';
import { walkInstructions } from '../walk-instructions';

const PROGRAM = 'MyProgram1111111111111111111111111111111111' as Address<'MyProgram1111111111111111111111111111111111'>;

void (() => {
    const instructions: TracedInstruction[] = walkInstructions({
        compiledMessage: null as never,
    });

    {
        // `isInstructionForProgram` narrows the iteration variable's
        // `programAddress` while keeping the `trace` property accessible.
        for (const ix of instructions) {
            if (isInstructionForProgram(ix, PROGRAM)) {
                ix.programAddress satisfies Address<'MyProgram1111111111111111111111111111111111'>;
                ix.trace.kind satisfies 'inner' | 'outer';
                // @ts-expect-error — must not widen back to a different program address.
                ix.programAddress satisfies Address<'OtherProgram111111111111111111111111111111'>;
            }
        }
    }

    {
        // Without the predicate, `programAddress` is `Address<string>`.
        for (const ix of instructions) {
            ix.programAddress satisfies Address<string>;
            // @ts-expect-error — `Address<string>` should not narrow to a specific program.
            ix.programAddress satisfies Address<'MyProgram1111111111111111111111111111111111'>;
        }
    }
});
