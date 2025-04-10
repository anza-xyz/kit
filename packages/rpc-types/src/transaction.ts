import type { Address } from '@solana/addresses';

import type { Blockhash } from './blockhash';
import type { Base58EncodedBytes, Base58EncodedDataResponse, Base64EncodedDataResponse } from './encoded-bytes';
import type { Lamports } from './lamports';
import type { TokenBalance } from './token-balance';
import type { TransactionError } from './transaction-error';
import type { SignedLamports } from './typed-numbers';

type TransactionVersion = 'legacy' | 0;

type AddressTableLookup = Readonly<{
    /** Address of the address lookup table account. */
    accountKey: Address;
    /** Indices of accounts in a lookup table to load as read-only. */
    readableIndexes: readonly number[];
    /** Indices of accounts in a lookup table to load as writable. */
    writableIndexes: readonly number[];
}>;

type InstructionWithStackHeight = Readonly<{
    /**
     * A number indicating the height at which this instruction was called with respect to the
     * bottom of the call stack denoted by `1` or `null`.
     *
     * For instance, an instruction explicitly declared in the transaction message will have a `1`
     * or `null` height, the first instruction that it calls using a cross-program invocation (CPI)
     * will have a height of 2, an instruction called by that instruction using a CPI will have a
     * depth of 3, and so on.
     */
    stackHeight: number; // FIXME(https://github.com/anza-xyz/agave/issues/5732) Should be `1` instead of `null` at base of stack
}>;

type InstructionWithData = Readonly<{
    /** The input to the invoked program */
    data: Base58EncodedBytes;
}>;

type ParsedTransactionInstruction = Partial<InstructionWithStackHeight> &
    Readonly<{
        /** The output of the program's instruction parser */
        parsed: {
            /** The instruction, as interpreted the program's instruction parser. */
            info?: object;
            /**
             * A label that indicates the type of the instruction, as determined by the program's
             * instruction parser.
             */
            type: string;
        };
        /** The name of the program. */
        program: string;
        /** The address of the program */
        programId: Address;
    }>;

type PartiallyDecodedTransactionInstruction = InstructionWithData &
    Partial<InstructionWithStackHeight> &
    Readonly<{
        /** An ordered list of addresses belonging to the accounts loaded by this instruction */
        accounts: readonly Address[];
        /** The address of the program to invoke */
        programId: Address;
    }>;

type ReturnData = {
    /** A tuple whose first element is the bytes of the return data as a base64-encoded string. */
    data: Base64EncodedDataResponse;
    /** The address of the program that generated the return data */
    programId: Address;
};

type TransactionInstruction = InstructionWithData &
    Partial<InstructionWithStackHeight> &
    Readonly<{
        /**
         * An ordered list of indices that indicate which accounts in the transaction message's
         * accounts list are loaded by this instruction.
         */
        accounts: readonly number[];
        /**
         * The index of the address in the transaction message's accounts list associated with the
         * program to invoke.
         */
        programIdIndex: number;
    }>;

type TransactionMessageBase = Readonly<{
    header: {
        /**
         * The number of read-only accounts in the static accounts list that must sign this
         * transaction.
         *
         * Subtracting this number from `numRequiredSignatures` yields the index of the first
         * read-only signer account in the static accounts list.
         */
        numReadonlySignedAccounts: number;
        /**
         * The number of accounts in the static accounts list that are neither writable nor signers.
         *
         * Adding this number to `numRequiredSignatures` yields the index of the first read-only
         * non-signer account in the static accounts list.
         */
        numReadonlyUnsignedAccounts: number;
        /**
         * The number of accounts in the static accounts list that must sign this transaction.
         *
         * Subtracting `numReadonlySignedAccounts` from this number yields the number of writable
         * signer accounts in the static accounts list. Writable signer accounts always begin at
         * index zero in the static accounts list.
         *
         * This number itself is the index of the first non-signer account in the static accounts
         * list.
         */
        numRequiredSignatures: number;
    };
    /**
     * For transactions whose lifetime is specified by a recent blockhash, this is that blockhash,
     * and for transactions whose lifetime is specified by a durable nonce, this is the nonce value.
     */
    recentBlockhash: Blockhash;
}>;

type TransactionParsedAccountBase = Readonly<{
    /** The address of the account */
    pubkey: Address;
    /** Whether this account is required to sign the transaction that it's a part of */
    signer: boolean;
    /** Whether this account must be loaded with a write-lock */
    writable: boolean;
}>;

type TransactionParsedAccountLegacy = Readonly<{
    /** Indicates that the account was statically declared in the transaction message */
    source: 'transaction';
}> &
    TransactionParsedAccountBase;

type TransactionParsedAccountVersioned = Readonly<{
    /**
     * Indicates whether the account was statically declared in the transaction message or loaded
     * from an address lookup table.
     */
    source: 'lookupTable' | 'transaction';
}> &
    TransactionParsedAccountBase;

// Types for `accounts` transactionDetails

// Only a partial version of the `TransactionMetaBase` type for when
// `transactionDetails: 'accounts'` is provided.
type TransactionForAccountsMetaBase = Readonly<{
    /** Error if transaction failed, `null` if transaction succeeded. */
    err: TransactionError | null;
    /** The fee this transaction was charged, in {@link Lamports} */
    fee: Lamports;
    /** Account balances after the transaction was processed */
    postBalances: readonly Lamports[];
    /**
     * List of token balances from after the transaction was processed or omitted if token balance
     * recording was not yet enabled during this transaction
     */
    postTokenBalances?: readonly TokenBalance[];
    /** Account balances from before the transaction was processed */
    preBalances: readonly Lamports[];
    /**
     * List of token balances from before the transaction was processed or omitted if token balance
     * recording was not yet enabled during this transaction
     */
    preTokenBalances?: readonly TokenBalance[];
    /** @deprecated */
    status: TransactionStatus;
}>;

type TransactionWithSignatures = Readonly<{
    /**
     * An ordered list of signatures belonging to the accounts required to sign this transaction.
     *
     * Each signature is an Ed25519 signature of the transaction message using the private key
     * associated with the account required to sign the transaction.
     */
    signatures: readonly Base58EncodedBytes[];
}>;

// Accounts

export type TransactionForAccounts<TMaxSupportedTransactionVersion extends TransactionVersion | void> =
    TMaxSupportedTransactionVersion extends void
        ? Readonly<{
              /** Transaction partial meta */
              meta: TransactionForAccountsMetaBase | null;
              /** Partial transactions */
              transaction: Readonly<{
                  /** Parsed accounts */
                  accountKeys: readonly TransactionParsedAccountLegacy[];
              }> &
                  TransactionWithSignatures;
          }>
        : Readonly<{
              /** Transaction partial meta */
              meta: TransactionForAccountsMetaBase | null;
              /** Partial transactions */
              transaction: Readonly<{
                  /** Parsed accounts */
                  accountKeys: readonly TransactionParsedAccountVersioned[];
              }> &
                  TransactionWithSignatures;
              /** The transaction version */
              version: TransactionVersion;
          }>;

// Types for `full` transactionDetails

type TransactionForFullMetaBase = Readonly<{
    /** Number of compute units consumed by the transaction */
    computeUnitsConsumed?: bigint;
    /** String log messages or `null` if log message recording was not enabled during this transaction */
    logMessages: readonly string[] | null;
    /** The most-recent return data generated by an instruction in the transaction */
    returnData?: ReturnData;
    /** Transaction-level rewards */
    rewards: readonly Reward[] | null;
}> &
    TransactionForAccountsMetaBase;

export type TransactionForFullMetaInnerInstructionsUnparsed = Readonly<{
    /** A list of instructions called by programs via cross-program invocation (CPI) */
    innerInstructions: readonly Readonly<{
        /** The index of the instruction in the transaction */
        index: number;
        /** The instructions */
        instructions: readonly TransactionInstruction[];
    }>[];
}>;

export type TransactionForFullMetaInnerInstructionsParsed = Readonly<{
    /** A list of instructions called by programs via cross-program invocation (CPI) */
    innerInstructions: readonly Readonly<{
        /** The index of the instruction in the transaction */
        index: number;
        /** The instructions */
        instructions: readonly (ParsedTransactionInstruction | PartiallyDecodedTransactionInstruction)[];
    }>[];
}>;

// According to the RPC docs: "Transaction addresses loaded from address lookup tables.
// Undefined if maxSupportedTransactionVersion is not set in request params, or if jsonParsed
// encoding is set in request params."
type TransactionForFullMetaLoadedAddresses = Readonly<{
    /** Addresses loaded from lookup tables */
    loadedAddresses: {
        /** Ordered list of base-58 encoded addresses for read-only accounts */
        readonly: readonly Address[];
        /** Ordered list of base-58 encoded addresses for writable accounts */
        writable: readonly Address[];
    };
}>;

type TransactionForFullTransactionAddressTableLookups = Readonly<{
    message: {
        /** A list of address tables and the accounts that this transaction loads from them */
        addressTableLookups?: readonly AddressTableLookup[] | null;
    };
}>;

// Base58

export type TransactionForFullBase58<TMaxSupportedTransactionVersion extends TransactionVersion | void> =
    TMaxSupportedTransactionVersion extends void
        ? Readonly<{
              /** Transaction meta */
              meta: (TransactionForFullMetaBase & TransactionForFullMetaInnerInstructionsUnparsed) | null;
              /** Partial transactions */
              transaction: Base58EncodedDataResponse;
          }>
        : Readonly<{
              /** Transaction meta */
              meta:
                  | (TransactionForFullMetaBase &
                        TransactionForFullMetaInnerInstructionsUnparsed &
                        TransactionForFullMetaLoadedAddresses)
                  | null;
              /** Partial transactions */
              transaction: Base58EncodedDataResponse;
              /** The transaction version */
              version: TransactionVersion;
          }>;

// Base64

export type TransactionForFullBase64<TMaxSupportedTransactionVersion extends TransactionVersion | void> =
    TMaxSupportedTransactionVersion extends void
        ? Readonly<{
              /** Transaction meta */
              meta: (TransactionForFullMetaBase & TransactionForFullMetaInnerInstructionsUnparsed) | null;
              /** Partial transactions */
              transaction: Base64EncodedDataResponse;
          }>
        : Readonly<{
              /** Transaction meta */
              meta:
                  | (TransactionForFullMetaBase &
                        TransactionForFullMetaInnerInstructionsUnparsed &
                        TransactionForFullMetaLoadedAddresses)
                  | null;
              /** Partial transactions */
              transaction: Base64EncodedDataResponse;
              /** The transaction version */
              version: TransactionVersion;
          }>;

// JsonParsed

type TransactionForFullTransactionJsonParsedBase = Readonly<{
    message: Readonly<{
        instructions: readonly (ParsedTransactionInstruction | PartiallyDecodedTransactionInstruction)[];
    }> &
        TransactionMessageBase;
}> &
    TransactionWithSignatures;

export type TransactionForFullJsonParsed<TMaxSupportedTransactionVersion extends TransactionVersion | void> =
    TMaxSupportedTransactionVersion extends void
        ? Readonly<{
              meta: (TransactionForFullMetaBase & TransactionForFullMetaInnerInstructionsParsed) | null;
              transaction: TransactionForFullTransactionJsonParsedBase & {
                  message: Readonly<{
                      /** Parsed accounts */
                      accountKeys: readonly TransactionParsedAccountLegacy[];
                  }>;
              };
          }>
        : Readonly<{
              meta:
                  | (TransactionForFullMetaBase &
                        TransactionForFullMetaInnerInstructionsParsed &
                        TransactionForFullMetaLoadedAddresses)
                  | null;
              transaction: TransactionForFullTransactionJsonParsedBase & {
                  message: Readonly<{
                      /** Parsed accounts */
                      accountKeys: readonly TransactionParsedAccountLegacy[];
                  }>;
              };
              version: TransactionVersion;
          }>;

// Json

type TransactionForFullTransactionJsonBase = Readonly<{
    message: Readonly<{
        /** An ordered list of addresses belonging to the accounts loaded by this transaction */
        accountKeys: readonly Address[];
        instructions: readonly TransactionInstruction[];
    }> &
        TransactionMessageBase;
}> &
    TransactionWithSignatures;

export type TransactionForFullJson<TMaxSupportedTransactionVersion extends TransactionVersion | void> =
    TMaxSupportedTransactionVersion extends void
        ? Readonly<{
              meta: (TransactionForFullMetaBase & TransactionForFullMetaInnerInstructionsUnparsed) | null;
              transaction: TransactionForFullTransactionJsonBase;
          }>
        : Readonly<{
              meta:
                  | (TransactionForFullMetaBase &
                        TransactionForFullMetaInnerInstructionsUnparsed &
                        TransactionForFullMetaLoadedAddresses)
                  | null;
              transaction: TransactionForFullTransactionAddressTableLookups & TransactionForFullTransactionJsonBase;
              version: TransactionVersion;
          }>;

type RewardBase = Readonly<{
    /** The number of reward {@link Lamports} credited or debited to the account */
    lamports: SignedLamports;
    /** The account balance in {@link Lamports} after the reward was applied */
    postBalance: Lamports;
    /** The address of the account that received the reward */
    pubkey: Address;
}>;

export type Reward =
    | (Readonly<{
          /** The type of reward */
          rewardType: 'Fee' | 'Rent';
      }> &
          RewardBase)
    // Commission is present only for voting and staking rewards
    | (Readonly<{
          /** The vote account commission when the reward was credited */
          commission: number;
          /** The type of reward */
          rewardType: 'Staking' | 'Voting';
      }> &
          RewardBase);

/** @deprecated */
export type TransactionStatus = { Err: TransactionError } | { Ok: null };
