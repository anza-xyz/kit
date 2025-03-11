import type { Address } from '@solana/addresses';
import stringify from '@solana/fast-stable-stringify';
import type { Signature } from '@solana/keys';
import type { GetAccountInfoApi, GetBlockApi, GetProgramAccountsApi, GetTransactionApi } from '@solana/rpc';
import type { Commitment, Slot } from '@solana/rpc-types';

export type BatchLoadPromiseCallback<T> = Readonly<{
    reject: (reason?: unknown) => void;
    resolve: (value: T) => void;
}>;

// Loader base types
export type LoadFn<TArgs, T> = (args: TArgs) => Promise<T>;
export type LoadManyFn<TArgs, T> = (args: TArgs[]) => Promise<(Error | T)[]>;
export type Loader<TArgs, T> = { load: LoadFn<TArgs, T>; loadMany: LoadManyFn<TArgs, T> };

export type AccountLoaderArgsBase = {
    /**
     * Fetch the details of the account as of the highest slot that has reached this level of
     * commitment.
     *
     * @defaultValue Whichever default is applied by the underlying {@link RpcApi} in use. For
     * example, when using an API created by a `createSolanaRpc*()` helper, the default commitment
     * is `"confirmed"` unless configured otherwise. Unmitigated by an API layer on the client, the
     * default commitment applied by the server is `"finalized"`.
     */
    commitment?: Commitment;
    dataSlice?: { length: number; offset: number };
    encoding?: 'base58' | 'base64' | 'base64+zstd' | 'jsonParsed';
    /**
     * Prevents accessing stale data by enforcing that the RPC node has processed transactions up to
     * this slot
     */
    minContextSlot?: Slot;
};
export type AccountLoaderArgs = AccountLoaderArgsBase & { address: Address };
export type AccountLoaderValue = ReturnType<GetAccountInfoApi['getAccountInfo']>['value'] | null;
export type AccountLoader = Loader<AccountLoaderArgs, AccountLoaderValue>;

export type BlockLoaderArgsBase = {
    commitment?: Omit<Commitment, 'processed'>;
    encoding?: 'base58' | 'base64' | 'json' | 'jsonParsed';
    maxSupportedTransactionVersion?: 'legacy' | 0;
    rewards?: boolean;
    transactionDetails?: 'accounts' | 'full' | 'none' | 'signatures';
};
export type BlockLoaderArgs = BlockLoaderArgsBase & { slot: Slot };
export type BlockLoaderValue = ReturnType<GetBlockApi['getBlock']> | null;
export type BlockLoader = Loader<BlockLoaderArgs, BlockLoaderValue>;

export type MultipleAccountsLoaderArgs = AccountLoaderArgsBase & { addresses: Address[] };
export type MultipleAccountsLoaderValue = AccountLoaderValue[];
export type MultipleAccountsLoader = Loader<MultipleAccountsLoaderArgs, MultipleAccountsLoaderValue>;

export type ProgramAccountsLoaderArgsBase = {
    /**
     * Fetch the details of the accounts as of the highest slot that has reached this level of
     * commitment.
     *
     * @defaultValue Whichever default is applied by the underlying {@link RpcApi} in use. For
     * example, when using an API created by a `createSolanaRpc*()` helper, the default commitment
     * is `"confirmed"` unless configured otherwise. Unmitigated by an API layer on the client, the
     * default commitment applied by the server is `"finalized"`.
     */
    commitment?: Commitment;
    dataSlice?: { length: number; offset: number };
    encoding?: 'base58' | 'base64' | 'base64+zstd' | 'jsonParsed';
    filters?: (
        | {
              dataSize: bigint;
          }
        | {
              memcmp: {
                  bytes: string;
                  encoding: 'base58' | 'base64';
                  offset: bigint;
              };
          }
    )[];
    /**
     * Prevents accessing stale data by enforcing that the RPC node has processed transactions up to
     * this slot
     */
    minContextSlot?: Slot;
};
export type ProgramAccountsLoaderArgs = ProgramAccountsLoaderArgsBase & { programAddress: Address };
export type ProgramAccountsLoaderValue = ReturnType<GetProgramAccountsApi['getProgramAccounts']>;
export type ProgramAccountsLoader = Loader<ProgramAccountsLoaderArgs, ProgramAccountsLoaderValue>;

export type TransactionLoaderArgsBase = {
    commitment?: Omit<Commitment, 'processed'>;
    encoding?: 'base58' | 'base64' | 'json' | 'jsonParsed';
};
export type TransactionLoaderArgs = TransactionLoaderArgsBase & { signature: Signature };
export type TransactionLoaderValue = ReturnType<GetTransactionApi['getTransaction']> | null;
export type TransactionLoader = Loader<TransactionLoaderArgs, TransactionLoaderValue>;

export type RpcGraphQLLoaders = {
    account: AccountLoader;
    block: BlockLoader;
    programAccounts: ProgramAccountsLoader;
    transaction: TransactionLoader;
};

export const cacheKeyFn = (obj: unknown) => stringify(obj) ?? '';
