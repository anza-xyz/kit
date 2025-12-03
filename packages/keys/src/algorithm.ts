export const ED25519_ALGORITHM_IDENTIFIER =
    // Resist the temptation to convert this to a simple string; As of version 133.0.3, Firefox
    // requires the object form of `AlgorithmIdentifier` and will throw a `DOMException` otherwise.
    Object.freeze({ name: 'Ed25519' });
