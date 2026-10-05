/**
 * Decodes the base64-encoded context segment emitted by {@link encodeContextObject}.
 *
 * Use this when implementing a `decode` CLI for a downstream coded-error system: the production
 * message produced by a {@link createCodedErrorClass}-generated error embeds an encoded context
 * blob that round-trips through these two helpers.
 */
export function decodeEncodedContext(encodedContext: string): object {
    const decodedUrlString = __NODEJS__ ? Buffer.from(encodedContext, 'base64').toString('utf8') : atob(encodedContext);
    return Object.fromEntries(new URLSearchParams(decodedUrlString).entries());
}

function encodeValue(value: unknown): string {
    if (Array.isArray(value)) {
        const commaSeparatedValues = value.map(encodeValue).join('%2C%20' /* ", " */);
        return '%5B' /* "[" */ + commaSeparatedValues + /* "]" */ '%5D';
    } else if (typeof value === 'bigint') {
        return `${value}n`;
    } else {
        return encodeURIComponent(
            String(
                value != null && Object.getPrototypeOf(value) === null
                    ? // Plain objects with no prototype don't have a `toString` method.
                      // Convert them before stringifying them.
                      { ...(value as object) }
                    : value,
            ),
        );
    }
}

function encodeObjectContextEntry([key, value]: [string, unknown]): `${typeof key}=${string}` {
    return `${key}=${encodeValue(value)}`;
}

/**
 * Serializes an error's context into a compact, base64url-friendly string for inclusion in a
 * production error message. The pair {@link encodeContextObject} / {@link decodeEncodedContext}
 * round-trip values through `URLSearchParams`, so this is lossy for non-string types — the
 * decoder reconstructs everything as strings.
 */
export function encodeContextObject(context: object): string {
    const searchParamsString = Object.entries(context).map(encodeObjectContextEntry).join('&');
    return __NODEJS__ ? Buffer.from(searchParamsString, 'utf8').toString('base64') : btoa(searchParamsString);
}
