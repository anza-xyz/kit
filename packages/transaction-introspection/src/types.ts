import type { ResolvedInstruction } from './get-instructions';

/**
 * The location of an instruction within a transaction.
 *
 * - `kind: 'outer'` — a top-level instruction in the transaction message.
 *   `index` is its position in the compiled message's instructions.
 * - `kind: 'inner'` — an instruction emitted via cross-program invocation.
 *   `outerIndex` is the index of the outer instruction that triggered the
 *   CPI chain; `innerIndex` is the position within that outer instruction's
 *   inner-instruction group.
 *
 * @example
 * ```ts
 * function describe(trace: InstructionTrace): string {
 *     return trace.kind === 'outer'
 *         ? `outer[${trace.index}]`
 *         : `inner[outer=${trace.outerIndex}, idx=${trace.innerIndex}]`;
 * }
 * ```
 */
export type InstructionTrace =
    | Readonly<{
          index: number;
          kind: 'outer';
      }>
    | Readonly<{
          innerIndex: number;
          kind: 'inner';
          outerIndex: number;
          /**
           * The CPI depth at which this instruction was invoked, when
           * reported by the RPC. `1` is the outer-instruction depth, `2`
           * is the first nested CPI, and so on.
           */
          stackHeight?: number;
      }>;

/**
 * A {@link ResolvedInstruction} carrying its location in the transaction
 * as a `trace` property.
 *
 * Because a `TracedInstruction` is itself a {@link ResolvedInstruction},
 * it can be passed directly to the auto-generated `@solana-program/*`
 * `identifyXInstruction` / `parseXInstruction` helpers, and to
 * `isInstructionForProgram` from `@solana/instructions`.
 *
 * @example
 * ```ts
 * import { isInstructionForProgram } from '@solana/instructions';
 * import { TOKEN_PROGRAM_ADDRESS, identifyTokenInstruction } from '@solana-program/token';
 *
 * for (const ix of walkInstructions({ compiledMessage, meta, loadedAddresses })) {
 *     if (isInstructionForProgram(ix, TOKEN_PROGRAM_ADDRESS)) {
 *         // `ix.programAddress` is narrowed to TOKEN_PROGRAM_ADDRESS.
 *         identifyTokenInstruction(ix);
 *         console.log(ix.trace.kind);
 *     }
 * }
 * ```
 */
export type TracedInstruction<TProgramAddress extends string = string> = Readonly<{ trace: InstructionTrace }> &
    ResolvedInstruction<TProgramAddress>;
