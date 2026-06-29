import type { Address } from '@solana/addresses';

import type { RpcParsedType } from './rpc-parsed-type';

/**
 * The parsed contents of the (no longer parsed) stake config account.
 *
 * @deprecated The stake config program is no longer recognized by the RPC's JSON parser as of Agave 4.1.0; a
 * `jsonParsed` request for that account now falls back to annotated base64. This shape is only
 * returned by validators running earlier versions.
 */
type JsonParsedStakeConfigAccount = Readonly<{
    /** @deprecated */
    slashPenalty: number;
    /** @deprecated */
    warmupCooldownRate: number;
}>;

type JsonParsedValidatorInfoAccount = Readonly<{
    configData: unknown;
    keys: {
        pubkey: Address;
        signer: boolean;
    }[];
}>;

export type JsonParsedConfigProgramAccount =
    | RpcParsedType<'stakeConfig', JsonParsedStakeConfigAccount>
    | RpcParsedType<'validatorInfo', JsonParsedValidatorInfoAccount>;
