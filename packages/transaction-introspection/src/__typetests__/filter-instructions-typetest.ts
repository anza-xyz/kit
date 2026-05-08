import type { Address } from '@solana/addresses';

import { filterInstructionsForProgram, walkInstructions } from '../walk-instructions';

const TOKEN = '11111111111111111111111111111111' as Address<'11111111111111111111111111111111'>;

void (() => {
    const stream = walkInstructions({
        compiledMessage: null as never,
    });

    {
        // Narrowing: yielded `instruction.programAddress` is `Address<'11111111111111111111111111111111'>`,
        // not the broader `Address<string>` from `walkInstructions` directly.
        for (const { instruction } of filterInstructionsForProgram(stream, TOKEN)) {
            instruction.programAddress satisfies Address<'11111111111111111111111111111111'>;
            // @ts-expect-error — must not widen back to a different program address.
            instruction.programAddress satisfies Address<'OtherProgram111111111111111111111111111111'>;
        }
    }

    {
        // Without the filter, `programAddress` is `Address<string>` and is NOT assignable to
        // a specific program address brand without a runtime check.
        for (const { instruction } of stream) {
            instruction.programAddress satisfies Address<string>;
            // @ts-expect-error — `Address<string>` should not narrow to a specific program.
            instruction.programAddress satisfies Address<'11111111111111111111111111111111'>;
        }
    }
});
