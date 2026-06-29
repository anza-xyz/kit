import { Address } from '@solana/addresses';
import { StringifiedBigInt, UnixTimestamp } from '@solana/rpc-types';

import { RpcParsedType } from './rpc-parsed-type';

type JsonParsedStakeAccount = Readonly<{
    meta: Readonly<{
        authorized: Readonly<{
            staker: Address;
            withdrawer: Address;
        }>;
        lockup: Readonly<{
            custodian: Address;
            epoch: bigint;
            unixTimestamp: UnixTimestamp;
        }>;
        rentExemptReserve: StringifiedBigInt;
    }>;
    stake: Readonly<{
        creditsObserved: bigint;
        delegation: Readonly<{
            activationEpoch: StringifiedBigInt;
            deactivationEpoch: StringifiedBigInt;
            stake: StringifiedBigInt;
            voter: Address;
            /**
             * The rate at which the delegation activates or deactivates.
             *
             * @deprecated Removed from the parsed stake delegation in Agave 4.1.0. This field is
             * only present on accounts fetched from validators running earlier versions.
             */
            warmupCooldownRate?: number;
        }>;
    }> | null;
}>;

export type JsonParsedStakeProgramAccount =
    | RpcParsedType<'delegated', JsonParsedStakeAccount>
    | RpcParsedType<'initialized', JsonParsedStakeAccount>;
