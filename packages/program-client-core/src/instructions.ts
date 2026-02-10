/**
 * An instruction that tracks how many bytes it adds or removes from on-chain accounts.
 *
 * The `byteDelta` indicates the net change in account storage size. A positive value
 * means bytes are being allocated, while a negative value means bytes are being freed.
 * This is useful for calculating how much balance a storage payer must have for a
 * transaction to succeed.
 */
export type InstructionWithByteDelta = {
    byteDelta: number;
};
