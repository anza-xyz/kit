import type { Address } from '@solana/addresses';
import type {
    AccountInfoBase,
    AccountInfoWithBase58Bytes,
    AccountInfoWithBase58EncodedData,
    AccountInfoWithBase64EncodedData,
    AccountInfoWithBase64EncodedZStdCompressedData,
    AccountInfoWithJsonData,
    Commitment,
    GetProgramAccountsDatasizeFilter,
    GetProgramAccountsMemcmpFilter,
    SolanaRpcResponse,
} from '@solana/rpc-types';

type ProgramNotificationsApiNotificationBase<TData> = SolanaRpcResponse<
    Readonly<{
        account: AccountInfoBase & TData;
        pubkey: Address;
    }>
>;

type ProgramNotificationsApiCommonConfig = Readonly<{
    commitment?: Commitment;
    // The resultant account must meet ALL filter criteria to be included in the returned results
    filters?: readonly Readonly<GetProgramAccountsDatasizeFilter | GetProgramAccountsMemcmpFilter>[];
}>;

export type ProgramNotificationsApi = {
    /**
     * Subscribe to a program to receive notifications when the lamports or data for an account
     * owned by the given program changes
     */
    programNotifications(
        programId: Address,
        config: ProgramNotificationsApiCommonConfig &
            Readonly<{
                encoding: 'base64';
            }>,
    ): ProgramNotificationsApiNotificationBase<AccountInfoWithBase64EncodedData>;
    programNotifications(
        programId: Address,
        config: ProgramNotificationsApiCommonConfig &
            Readonly<{
                encoding: 'base64+zstd';
            }>,
    ): ProgramNotificationsApiNotificationBase<AccountInfoWithBase64EncodedZStdCompressedData>;
    programNotifications(
        programId: Address,
        config: ProgramNotificationsApiCommonConfig &
            Readonly<{
                encoding: 'jsonParsed';
            }>,
    ): ProgramNotificationsApiNotificationBase<AccountInfoWithJsonData>;
    programNotifications(
        programId: Address,
        config: ProgramNotificationsApiCommonConfig &
            Readonly<{
                encoding: 'base58';
            }>,
    ): ProgramNotificationsApiNotificationBase<AccountInfoWithBase58EncodedData>;
    programNotifications(
        programId: Address,
        config?: ProgramNotificationsApiCommonConfig,
    ): ProgramNotificationsApiNotificationBase<AccountInfoWithBase58Bytes>;
};
