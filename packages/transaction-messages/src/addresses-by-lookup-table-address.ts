import { Address } from '@solana/addresses';

/**
 * Represents a mapping of lookup table addresses to the addresses of the accounts that are stored
 * in them.
 */
export type AddressesByLookupTableAddress = { [lookupTableAddress: Address]: Address[] };
