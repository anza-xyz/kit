/**
 * Recursively freezes a value to avoid accidental mutation of initial state snapshots.
 *
 * @param value - Value to freeze in place.
 * @returns The same value with all nested objects frozen.
 */
export function deepFreeze<T>(value: T): T {
    if (typeof value !== 'object' || value === null) {
        return value;
    }
    for (const key of Reflect.ownKeys(value)) {
        const property = Reflect.get(value as Record<PropertyKey, unknown>, key);
        deepFreeze(property);
    }
    return Object.freeze(value);
}

/**
 * Returns the current timestamp in milliseconds.
 *
 * @returns Millisecond timestamp provided by {@link Date.now}.
 */
export function now(): number {
    return Date.now();
}

/**
 * Converts optional errors to a serializable string for logging.
 *
 * @param error - Arbitrary error value to format.
 * @returns String representation of the provided error.
 */
export function toErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === 'string') {
        return error;
    }
    try {
        return JSON.stringify(error);
    } catch {
        return String(error);
    }
}

/**
 * Formats an error for logging purposes.
 *
 * @param error - Arbitrary error value.
 * @returns Object containing error details.
 */
export function formatError(error: unknown): Record<string, unknown> {
    if (error instanceof Error) {
        return {
            message: error.message,
            name: error.name,
            stack: error.stack,
        };
    }
    return {
        error: String(error),
    };
}
