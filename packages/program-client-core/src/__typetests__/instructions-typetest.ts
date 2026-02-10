import type { InstructionWithByteDelta } from '../index';

// [DESCRIBE] InstructionWithByteDelta
{
    // It contains a byteDelta property.
    {
        ({ byteDelta: 100 }) satisfies InstructionWithByteDelta;
    }

    // It accepts negative byte deltas.
    {
        ({ byteDelta: -50 }) satisfies InstructionWithByteDelta;
    }
}
