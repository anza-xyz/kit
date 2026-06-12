import type { Address } from '@solana/addresses';
import type { ReadonlyUint8Array } from '@solana/codecs-core';
import {
    type AccountMeta,
    isInstructionForProgram,
    isInstructionWithAccounts,
    isInstructionWithData,
} from '@solana/instructions';

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

    {
        // `accounts` and `data` are optional until narrowed; the narrows keep
        // `trace` accessible, as the auto-generated `parseXInstruction`
        // helpers (which require both) rely on.
        for (const ix of instructions) {
            // @ts-expect-error — `data` is optional until narrowed.
            ix.data satisfies ReadonlyUint8Array;
            // @ts-expect-error — `accounts` is optional until narrowed.
            ix.accounts satisfies readonly AccountMeta[];
            if (isInstructionWithData(ix) && isInstructionWithAccounts<readonly AccountMeta[]>(ix)) {
                ix.data satisfies ReadonlyUint8Array;
                ix.accounts satisfies readonly AccountMeta[];
                ix.trace.kind satisfies 'inner' | 'outer';
            }
        }
    }
});
