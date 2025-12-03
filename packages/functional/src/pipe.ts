/**
 * A pipeline is a solution that allows you to perform successive transforms of a value using functions. This is useful when building up a transaction message.
 *
 * Until the [pipeline operator](https://github.com/tc39/proposal-pipeline-operator) becomes part of JavaScript you can use this utility to create pipelines.
 *
 * Following common implementations of pipe functions that use TypeScript, this function supports a maximum arity of 10 for type safety.
 *
 * Note you can use nested pipes to extend this limitation, like so:
 * ```ts
 * const myValue = pipe(
 *      pipe(
 *          1,
 *          (x) => x + 1,
 *          (x) => x * 2,
 *          (x) => x - 1,
 *      ),
 *      (y) => y / 3,
 *      (y) => y + 1,
 * );
 * ```
 *
 * @see https://github.com/ramda/ramda/blob/master/source/pipe.js
 * @see https://github.com/darky/rocket-pipes/blob/master/index.ts
 *
 * @example Basic
 * ```ts
 * const add = (a, b) => a + b;
 * const add10 = x => add(x, 10);
 * const add100 = x => add(x, 100);
 * const sum = pipe(1, add10, add100);
 * sum === 111; // true
 * ```
 *
 * @example Building a Solana transaction message
 * ```ts
 * const transferTransactionMessage = pipe(
 *     // The result of the first expression...
 *     createTransactionMessage({ version: 0 }),
 *     // ...gets passed as the sole argument to the next function in the pipeline.
 *     tx => setTransactionMessageFeePayer(myAddress, tx),
 *     // The return value of that function gets passed to the next...
 *     tx => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
 *     // ...and so on.
 *     tx => appendTransactionMessageInstruction(createTransferInstruction(myAddress, toAddress, amountInLamports), tx),
 * );
 * ```
 *
 * @returns The initial value
 */
export function pipe<TInitial>(
    /** The initial value */
    init: TInitial,
): TInitial;
/**
 * @returns The return value of the final transform function
 */
export function pipe<TInitial, R1>(
    /** The initial value */
    init: TInitial,
    /** The function with which to transform the initial value */
    init_r1: (init: TInitial) => R1,
): R1;
/**
 * @returns The return value of the final transform function
 */
export function pipe<TInitial, R1, R2>(
    /** The initial value */
    init: TInitial,
    /** The function with which to transform the initial value */
    init_r1: (init: TInitial) => R1,
    /** The function with which to transform the return value of the prior function */
    r1_r2: (r1: R1) => R2,
): R2;
/**
 * @returns The return value of the final transform function
 */
export function pipe<TInitial, R1, R2, R3>(
    /** The initial value */
    init: TInitial,
    /** The function with which to transform the initial value */
    init_r1: (init: TInitial) => R1,
    /** The function with which to transform the return value of the prior function */
    r1_r2: (r1: R1) => R2,
    /** The function with which to transform the return value of the prior function */
    r2_r3: (r2: R2) => R3,
): R3;
/**
 * @returns The return value of the final transform function
 */
export function pipe<TInitial, R1, R2, R3, R4>(
    /** The initial value */
    init: TInitial,
    /** The function with which to transform the initial value */
    init_r1: (init: TInitial) => R1,
    /** The function with which to transform the return value of the prior function */
    r1_r2: (r1: R1) => R2,
    /** The function with which to transform the return value of the prior function */
    r2_r3: (r2: R2) => R3,
    /** The function with which to transform the return value of the prior function */
    r3_r4: (r3: R3) => R4,
): R4;
/**
 * @returns The return value of the final transform function
 */
export function pipe<TInitial, R1, R2, R3, R4, R5>(
    /** The initial value */
    init: TInitial,
    /** The function with which to transform the initial value */
    init_r1: (init: TInitial) => R1,
    /** The function with which to transform the return value of the prior function */
    r1_r2: (r1: R1) => R2,
    /** The function with which to transform the return value of the prior function */
    r2_r3: (r2: R2) => R3,
    /** The function with which to transform the return value of the prior function */
    r3_r4: (r3: R3) => R4,
    /** The function with which to transform the return value of the prior function */
    r4_r5: (r4: R4) => R5,
): R5;
/**
 * @returns The return value of the final transform function
 */
export function pipe<TInitial, R1, R2, R3, R4, R5, R6>(
    /** The initial value */
    init: TInitial,
    /** The function with which to transform the initial value */
    init_r1: (init: TInitial) => R1,
    /** The function with which to transform the return value of the prior function */
    r1_r2: (r1: R1) => R2,
    /** The function with which to transform the return value of the prior function */
    r2_r3: (r2: R2) => R3,
    /** The function with which to transform the return value of the prior function */
    r3_r4: (r3: R3) => R4,
    /** The function with which to transform the return value of the prior function */
    r4_r5: (r4: R4) => R5,
    /** The function with which to transform the return value of the prior function */
    r5_r6: (r5: R5) => R6,
): R6;
/**
 * @returns The return value of the final transform function
 */
export function pipe<TInitial, R1, R2, R3, R4, R5, R6, R7>(
    /** The initial value */
    init: TInitial,
    /** The function with which to transform the initial value */
    init_r1: (init: TInitial) => R1,
    /** The function with which to transform the return value of the prior function */
    r1_r2: (r1: R1) => R2,
    /** The function with which to transform the return value of the prior function */
    r2_r3: (r2: R2) => R3,
    /** The function with which to transform the return value of the prior function */
    r3_r4: (r3: R3) => R4,
    /** The function with which to transform the return value of the prior function */
    r4_r5: (r4: R4) => R5,
    /** The function with which to transform the return value of the prior function */
    r5_r6: (r5: R5) => R6,
    /** The function with which to transform the return value of the prior function */
    r6_r7: (r6: R6) => R7,
): R7;
/**
 * @returns The return value of the final transform function
 */
export function pipe<TInitial, R1, R2, R3, R4, R5, R6, R7, R8>(
    /** The initial value */
    init: TInitial,
    /** The function with which to transform the initial value */
    init_r1: (init: TInitial) => R1,
    /** The function with which to transform the return value of the prior function */
    r1_r2: (r1: R1) => R2,
    /** The function with which to transform the return value of the prior function */
    r2_r3: (r2: R2) => R3,
    /** The function with which to transform the return value of the prior function */
    r3_r4: (r3: R3) => R4,
    /** The function with which to transform the return value of the prior function */
    r4_r5: (r4: R4) => R5,
    /** The function with which to transform the return value of the prior function */
    r5_r6: (r5: R5) => R6,
    /** The function with which to transform the return value of the prior function */
    r6_r7: (r6: R6) => R7,
    /** The function with which to transform the return value of the prior function */
    r7_r8: (r7: R7) => R8,
): R8;
/**
 * @returns The return value of the final transform function
 */
export function pipe<TInitial, R1, R2, R3, R4, R5, R6, R7, R8, R9>(
    /** The initial value */
    init: TInitial,
    /** The function with which to transform the initial value */
    init_r1: (init: TInitial) => R1,
    /** The function with which to transform the return value of the prior function */
    r1_r2: (r1: R1) => R2,
    /** The function with which to transform the return value of the prior function */
    r2_r3: (r2: R2) => R3,
    /** The function with which to transform the return value of the prior function */
    r3_r4: (r3: R3) => R4,
    /** The function with which to transform the return value of the prior function */
    r4_r5: (r4: R4) => R5,
    /** The function with which to transform the return value of the prior function */
    r5_r6: (r5: R5) => R6,
    /** The function with which to transform the return value of the prior function */
    r6_r7: (r6: R6) => R7,
    /** The function with which to transform the return value of the prior function */
    r7_r8: (r7: R7) => R8,
    /** The function with which to transform the return value of the prior function */
    r8_r9: (r8: R8) => R9,
): R9;
/**
 * @returns The return value of the final transform function
 */
export function pipe<TInitial, R1, R2, R3, R4, R5, R6, R7, R8, R9, R10>(
    /** The initial value */
    init: TInitial,
    /** The function with which to transform the initial value */
    init_r1: (init: TInitial) => R1,
    /** The function with which to transform the return value of the prior function */
    r1_r2: (r1: R1) => R2,
    /** The function with which to transform the return value of the prior function */
    r2_r3: (r2: R2) => R3,
    /** The function with which to transform the return value of the prior function */
    r3_r4: (r3: R3) => R4,
    /** The function with which to transform the return value of the prior function */
    r4_r5: (r4: R4) => R5,
    /** The function with which to transform the return value of the prior function */
    r5_r6: (r5: R5) => R6,
    /** The function with which to transform the return value of the prior function */
    r6_r7: (r6: R6) => R7,
    /** The function with which to transform the return value of the prior function */
    r7_r8: (r7: R7) => R8,
    /** The function with which to transform the return value of the prior function */
    r8_r9: (r8: R8) => R9,
    /** The function with which to transform the return value of the prior function */
    r9_r10: (r9: R9) => R10,
): R10;
export function pipe<TInitial>(init: TInitial, ...fns: CallableFunction[]) {
    return fns.reduce((acc, fn) => fn(acc), init);
}
