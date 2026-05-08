/**
 * This package contains helpers for inspecting confirmed Solana transactions
 * and walking their outer and inner instructions in a form that the
 * auto-generated `@solana-program/*` clients can `identify` and `parse`
 * directly.
 *
 * @packageDocumentation
 */
export * from './decode-rpc-transaction';
export * from './get-all-addresses';
export * from './get-inner-instructions';
export * from './get-instructions';
export * from './types';
export * from './walk-instructions';
