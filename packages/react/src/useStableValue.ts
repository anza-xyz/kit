import { useState } from 'react';

function isEqual(a: unknown, b: unknown): boolean {
    if (Object.is(a, b)) return true;
    if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
    if (ArrayBuffer.isView(a) || ArrayBuffer.isView(b)) {
        if (!(a instanceof Uint8Array) || !(b instanceof Uint8Array) || a.length !== b.length) return false;
        return a.every((byte, index) => byte === b[index]);
    }
    if (Array.isArray(a) || Array.isArray(b)) {
        if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
        return a.every((item, index) => isEqual(item, b[index]));
    }
    const aRecord = a as Record<string, unknown>;
    const bRecord = b as Record<string, unknown>;
    const aKeys = Object.keys(aRecord);
    if (aKeys.length !== Object.keys(bRecord).length) return false;
    return aKeys.every(key => Object.hasOwn(bRecord, key) && isEqual(aRecord[key], bRecord[key]));
}

/**
 * Returns the previously seen value whenever the incoming value is structurally equal to it, so a
 * fresh object or array literal keeps a stable identity across renders.
 *
 * The reactive hooks key their stores off argument identity, so an inline `{ mint, owner }` seed
 * object or `[addressA, addressB]` array would otherwise rebuild the store on every render — and
 * each rebuild refires the request, whose resulting state update renders again, so the caller
 * never converges.
 *
 * Implemented with the state-adjustment-during-render pattern rather than a ref, so the hook stays
 * render-pure: the render that first sees a structurally new value returns it directly and
 * schedules the re-render that makes it the stored value.
 *
 * @typeParam T - The value to hold stable. Compared structurally across plain objects, arrays and
 *   `Uint8Array`s; every other type is compared with `Object.is`.
 */
export function useStableValue<T>(value: T): T {
    const [stored, setStored] = useState(value);
    if (!isEqual(stored, value)) {
        setStored(value);
        return value;
    }
    return stored;
}
