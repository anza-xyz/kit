import type { ResolvedInstruction } from './get-instructions';

/**
 * The location of an instruction within a transaction.
 *
 * - `kind: 'outer'` — a top-level instruction in the transaction message.
 *   `index` is its position in `compiled.instructions`.
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
 * An instruction together with its location within a transaction.
 *
 * @example
 * ```ts
 * for (const { instruction, trace }: TracedInstruction of walkInstructions(args)) {
 *     console.log(trace.kind, instruction.programAddress);
 * }
 * ```
 */
export type TracedInstruction = Readonly<{
    instruction: ResolvedInstruction;
    trace: InstructionTrace;
}>;
