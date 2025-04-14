import { Address } from '@solana/addresses';
import { ReadonlyUint8Array } from '@solana/codecs-core';
import { SignatureBytes } from '@solana/keys';

export type TransactionMessageBytes = ReadonlyUint8Array & { readonly __brand: unique symbol };
export type TransactionMessageBytesBase64 = string & { readonly __serializedMessageBytesBase64: unique symbol };

type OrderedMap<K extends string, V> = Record<K, V>;
export type SignaturesMap = OrderedMap<Address, SignatureBytes | null>;

export type Transaction = Readonly<{
    /** The bytes of a compiled transaction message, encoded in wire format */
    messageBytes: TransactionMessageBytes;
    /**
     * A map between the addresses of a transaction message's signers, and the 64-byte Ed25519
     * signature of the transaction's `messageBytes` by the private key associated with each.
     */
    signatures: SignaturesMap;
}>;
