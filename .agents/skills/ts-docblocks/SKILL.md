---
name: ts-docblocks
description: Add missing JSDoc docblocks to exported symbols in TypeScript projects. Use when writing new exports or when code is missing documentation.
argument-hint: "[path] [--all]"
---

# Add Missing Docblocks

Scan the specified path (or entire repository if no path given) and add missing docblocks to all exported functions, classes, interfaces, types, and constants.

## Key Rules

- All exported functions, types, interfaces, and constants MUST have JSDoc docblocks.
- Start with `/**`, use `*` prefix for each line, end with `*/` — each on its own line.
- Begin with a clear one-to-two line summary. Add a blank line before tags.
- Include `@param`, `@typeParam`, `@return`, `@throws`, and at least one `@example` when helpful.
- Use `{@link ...}` to reference related items. Add `@see` tags at the end for related APIs.
- Do NOT modify real code outside of docblocks. Do NOT modify existing docblocks.

## Guidelines

### Style

Use JSDoc format with the following conventions:

- Start with `/**` on its own line.
- Use `*` prefix for each line.
- End with `*/` on its own line.
- Keep descriptions concise but complete.
- Start your sentences with a capital letter and end with a period.
- Limit your usage of em dashes but, when you do use them, use spaces on both sides.
- Begin with a clear one or two line summary (no `@summary` tag needed).
- Add a blank line after the summary if adding more details.
- Include `@param` tags for all parameters.
- Include `@typeParam` tags for all type parameters. Use `@typeParam`, not `@template`.
- Include `@return` tag briefly describing the return value.
- Add `@throws` for functions that may throw errors and list these errors.
- Include at least one `@example` section whenever usage examples would be helpful. If the file is a TypeScript file, use TypeScript syntax in examples. Try to make the examples realistic but concise and pleasant to read. They must illustrate the concepts clearly at first glance. When more than one example is preferred, use multiple `@example` tags and keep the first one as simple as possible to illustrate the basic usage. Never use `any` type in examples. Display the `import` statements required for the example to work when imports from multiple libraries are required. It is acceptable to use placeholder variable names like `myUser` or even `/* ... */` for parts that are not relevant to the example. When multiple example sections are provided, add a brief description before each code block to quickly explain what the example illustrates.
- In the rare case where more advanced documentation is also needed for the item, use the `@remarks` tag to add this extra information after any example sections. These remarks can include longer explanations and even additional code blocks if necessary.
- When an item is deprecated, include a `@deprecated` tag with a brief explanation and, if applicable, suggest an alternative.
- Use `{@link ...}` tags to reference other items in the codebase when relevant.
- Add `@see` tags at the very end when applicable to point to other related items or documentation. Use `@see {@link ...}` format when linking to other code items.

### Examples

````ts
/**
 * Creates a retry wrapper around an async function.
 *
 * Retries the given function up to `maxRetries` times with exponential
 * backoff between attempts.
 *
 * @param fn - The async function to retry.
 * @param maxRetries - Maximum number of retry attempts.
 * @param baseDelay - Base delay in milliseconds between retries.
 * @return A wrapped version of `fn` that retries on failure.
 * @throws Throws the last error if all retry attempts are exhausted.
 *
 * @example
 * ```ts
 * const fetchWithRetry = withRetry(fetchData, 3, 1000);
 * const data = await fetchWithRetry('/api/users');
 * ```
 *
 * @example
 * Custom retry configuration for flaky network calls.
 * ```ts
 * const resilientFetch = withRetry(
 *   () => fetch('https://api.example.com/data'),
 *   5,
 *   500,
 * );
 * ```
 */
export function withRetry<T>(
    fn: (...args: unknown[]) => Promise<T>,
    maxRetries: number,
    baseDelay: number,
): (...args: unknown[]) => Promise<T>;
````

````ts
/**
 * Fixes a `Uint8Array` to the specified length.
 *
 * If the array is longer than the specified length, it is truncated.
 * If the array is shorter than the specified length, it is padded with zeroes.
 *
 * @param bytes - The byte array to truncate or pad.
 * @param length - The desired length of the byte array.
 * @return The byte array truncated or padded to the desired length.
 *
 * @example
 * Truncates the byte array to the desired length.
 * ```ts
 * const bytes = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
 * const fixedBytes = fixBytes(bytes, 2);
 * //    ^ [0x01, 0x02]
 * ```
 *
 * @example
 * Adds zeroes to the end of the byte array to reach the desired length.
 * ```ts
 * const bytes = new Uint8Array([0x01, 0x02]);
 * const fixedBytes = fixBytes(bytes, 4);
 * //    ^ [0x01, 0x02, 0x00, 0x00]
 * ```
 */
export const fixBytes = (
    bytes: ReadonlyUint8Array | Uint8Array,
    length: number,
): ReadonlyUint8Array | Uint8Array;
````

````ts
/**
 * A tree structure representing a set of instructions with execution constraints.
 *
 * Supports parallel execution, sequential execution, and combinations of both
 * through recursive composition of plan nodes.
 *
 * @example
 * ```ts
 * const plan: InstructionPlan = parallelPlan([
 *     sequentialPlan([instructionA, instructionB]),
 *     instructionC,
 *     instructionD,
 * ]);
 * ```
 *
 * @see {@link SingleInstructionPlan}
 * @see {@link ParallelInstructionPlan}
 * @see {@link SequentialInstructionPlan}
 */
export type InstructionPlan =
    | ParallelInstructionPlan
    | SequentialInstructionPlan
    | SingleInstructionPlan;
````

## Command Process

When invoked as a command, follow these steps:

### Arguments

- `[path]` (optional): Narrow the scan to a specific path (e.g. `src/utils` or `packages/my-lib/src`).
- `[--all]` (optional): Also scan non-exported items.

### Steps

1. If a path argument is provided, scan only that path; otherwise scan the entire repository.
2. Look for TypeScript/JavaScript files (`.ts`, `.tsx`, `.js`, `.jsx`).
3. Identify exported items without docblocks:
    - `export function`
    - `export class`
    - `export interface`
    - `export type`
    - `export const` (for constants and arrow functions)
4. If `--all` is passed, also identify non-exported items.
5. For each item missing a docblock:
    - Analyze the code to understand its purpose (this may span multiple files).
    - Examine parameters, return types, and behavior.
    - Generate an appropriate docblock following the style guide.
6. Present all changes clearly, grouped by file. Apply all changes without requiring further approval.
