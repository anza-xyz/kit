/**
 * This package contains helpers for inspecting confirmed Solana transactions
 * and walking their outer and inner instructions in a form that the
 * auto-generated `@solana-program/*` clients can `identify` and `parse`
 * directly.
 *
 * @packageDocumentation
 */
export { type DecodedRpcTransaction, decodeTransactionFromRpcResponse } from './decode-rpc-transaction';
export { getAllAddressesFromCompiledTransactionMessage, type LoadedAddresses } from './get-all-addresses';
export { getInnerInstructionsFromMeta, type MetaWithInnerInstructions } from './get-inner-instructions';
export {
    getAccountMetasFromCompiledTransactionMessage,
    getInstructionsFromCompiledTransactionMessage,
    type ResolvedInstruction,
} from './get-instructions';
export type { InstructionTrace, TracedInstruction } from './types';
export { walkInstructions } from './walk-instructions';
