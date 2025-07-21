import { padBytes } from '../bytes';
import { ReadonlyUint8Array } from '../readonly-uint8array';

// [DESCRIBE] padBytes.
{
    // It returns `ReadonlyUint8Array` given a readonly input
    {
        const readonlyArray = null as unknown as ReadonlyUint8Array;
        padBytes(readonlyArray, 42) satisfies ReadonlyUint8Array;
    }
    // It returns `Uint8Array` given a writable input
    {
        const array = null as unknown as Uint8Array;
        padBytes(array, 42) satisfies Uint8Array;
    }
    // It downcasts readonly inputs to a basic `ReadonlyUint8Array`
    {
        const fancyReadonlyArray = null as unknown as ReadonlyUint8Array & { glitter: true };
        // @ts-expect-error Should have the more specific type stripped out.
        padBytes(fancyReadonlyArray, 42) satisfies { glitter: true };
    }
    // It downcasts writable inputs to a basic `Uint8Array`
    {
        const fancyArray = null as unknown as Uint8Array & { glitter: true };
        // @ts-expect-error Should have the more specific type stripped out.
        padBytes(fancyArray, 42) satisfies { glitter: true };
    }
}
