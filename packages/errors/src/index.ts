/**
 * This package brings together every error message across all Solana JavaScript modules.
 *
 * # Reading error messages
 *
 * ## In development mode
 *
 * When your bundler sets the constant `__DEV__` to `true`, every error message will be included in
 * the bundle. As such, you will be able to read them in plain language wherever they appear.
 *
 * > [!WARNING]
 * > The size of your JavaScript bundle will increase significantly with the inclusion of every
 * > error message in development mode. Be sure to build your bundle with `__DEV__` set to `false`
 * > when you go to production.
 *
 * ## In production mode
 *
 * When your bundler sets the constant `__DEV__` to `false`, error messages will be stripped from
 * the bundle to save space. Only the error code will appear when an error is encountered. Follow
 * the instructions in the error message to convert the error code back to the human-readable error
 * message.
 *
 * For instance, to recover the error text for the error with code `123`:
 *
 * ```package-install
 * npx @solana/errors decode -- 123
 * ```
 *
 * > [!IMPORTANT]
 * > The string representation of a {@link SolanaError} should not be shown to users. Developers
 * > should use {@link isSolanaError} to distinguish the type of a thrown error, then show a custom,
 * > localized error message appropriate for their application's audience. Custom error messages
 * > should use the error's {@link SolanaError#context | `context`} if it would help the reader
 * > understand what happened and/or what to do next.
 *
 * # Adding a new error
 *
 * 1. Add a new exported error code constant to `src/codes.ts`.
 * 2. Add that new constant to the {@link SolanaErrorCode} union in `src/codes.ts`.
 * 3. If you would like the new error to encapsulate context about the error itself (eg. the public
 *    keys for which a transaction is missing signatures) define the shape of that context in
 *    `src/context.ts`.
 * 4. Add the error's message to `src/messages.ts`. Any context values that you defined above will
 *    be interpolated into the message wherever you write `$key`, where `key` is the index of a
 *    value in the context (eg. ``'Missing a signature for account `$address`'``).
 * 5. Publish a new version of `@solana/errors`.
 * 6. Bump the version of `@solana/errors` in the package from which the error is thrown.
 *
 * # Removing an error message
 *
 * -   Don't remove errors.
 * -   Don't change the meaning of an error message.
 * -   Don't change or reorder error codes.
 * -   Don't change or remove members of an error's context.
 *
 * When an older client throws an error, we want to make sure that they can always decode the error.
 * If you make any of the changes above, old clients will, by definition, not have received your
 * changes. This could make the errors that they throw impossible to decode going forward.
 *
 * # Catching errors
 *
 * See {@link isSolanaError} for an example of how to handle a caught {@link SolanaError}.
 *
 * @packageDocumentation
 */
export * from './codes';
export * from './error';
export * from './instruction-error';
export * from './json-rpc-error';
export * from './simulation-errors';
export * from './stack-trace';
export * from './transaction-error';
