import type { Account, Address, MaybeAccount, ReadonlyUint8Array } from '@solana/kit';

import { createProgramHooks } from '../createProgramHooks';
import type {
    DecodedProgramAccount,
    FetchedProgramAccount,
    FetchedProgramAccounts,
    ProgramAccountKey,
    ProgramInstructionInput,
    ProgramInstructionKey,
} from '../programPlugin';

type Mint = { supply: bigint };
type TransferInput = { amount: bigint; destination: Address; source: Address };

/** Stands in for a Codama-generated plugin, matching the shape `renderers-js` emits. */
type TokenPlugin = {
    accounts: {
        mint: {
            decode: (bytes: ReadonlyUint8Array, offset?: number) => Mint;
            fetch: <TAddress extends string>(address: Address<TAddress>) => Promise<Account<Mint, TAddress>>;
            fetchAll: (addresses: Address[]) => Promise<Account<Mint>[]>;
            fetchAllMaybe: (addresses: Address[]) => Promise<MaybeAccount<Mint>[]>;
            fetchMaybe: <TAddress extends string>(address: Address<TAddress>) => Promise<MaybeAccount<Mint, TAddress>>;
        };
    };
    instructions: {
        transfer: (input: TransferInput) => {
            sendTransaction: (config?: { commitment?: string }) => Promise<string>;
        };
    };
    pdas: {
        mintAuthority: (seeds: { mint: Address }) => Promise<[Address, number]>;
    };
};

type AssociatedTokenPlugin = {
    pdas: {
        associatedToken: (seeds: { mint: Address; owner: Address }) => Promise<[Address, number]>;
    };
};

/** A client type carrying two program plugins, as `typeof client` would. */
type TwoPluginClient = { associatedToken: AssociatedTokenPlugin; token: TokenPlugin };

// [DESCRIBE] programPlugin type projections
{
    // Keys are projected off the plugin's own maps
    {
        null as unknown as ProgramAccountKey<TokenPlugin> satisfies 'mint';
        null as unknown as ProgramInstructionKey<TokenPlugin> satisfies 'transfer';
    }

    // Account types are recovered from the codec and its fetch helpers
    {
        null as unknown as DecodedProgramAccount<TokenPlugin, 'mint'> satisfies Mint;
        null as unknown as FetchedProgramAccount<TokenPlugin, 'mint'> satisfies Account<Mint, string>;
        null as unknown as FetchedProgramAccounts<TokenPlugin, 'mint'> satisfies Account<Mint>[];
    }

    // Instruction input is recovered from the builder
    {
        null as unknown as ProgramInstructionInput<TokenPlugin, 'transfer'> satisfies TransferInput;
    }
}

// [DESCRIBE] createProgramHooks
{
    // The curried form infers the capability from a multi-plugin client type
    {
        const hooks = createProgramHooks<TwoPluginClient>();
        hooks('token').useSendInstruction('transfer');
        hooks('associatedToken').usePda('associatedToken', null);
        // @ts-expect-error - 'transfer' belongs to the token plugin, not associatedToken
        hooks('associatedToken').useSendInstruction('transfer');
        // @ts-expect-error - 'tokne' is not a capability of the client type
        hooks('tokne');
    }

    // An explicit capability type argument works on a multi-plugin client type
    {
        const hooks = createProgramHooks<TwoPluginClient, 'token'>('token');
        hooks.useSendInstruction('transfer');
    }

    // The direct call is rejected on a multi-plugin client type, since the capability cannot be
    // inferred alongside an explicit namespace type argument and the hooks would otherwise type
    // against the union of every installed plugin
    {
        // @ts-expect-error - requires the curried form or a second type argument
        createProgramHooks<TwoPluginClient>('token');
    }

    // Keys the plugin does not declare are rejected
    {
        const hooks = createProgramHooks<{ token: TokenPlugin }>('token');
        // @ts-expect-error - 'nope' is not an account of the token program
        hooks.useAccount('nope', null);
        // @ts-expect-error - 'nope' is not an instruction of the token program
        hooks.useSendInstruction('nope');
    }

    // A capability the namespace type does not declare is rejected
    {
        // @ts-expect-error - 'tokne' is not a key of the namespace type
        createProgramHooks<{ token: TokenPlugin }>('tokne');
    }

    // Hook results carry the decoded account types through
    {
        const hooks = createProgramHooks<{ token: TokenPlugin }>('token');

        hooks.useAccount('mint', null).data satisfies Account<Mint, string> | undefined;
        hooks.useMaybeAccount('mint', null).data satisfies MaybeAccount<Mint, string> | undefined;
        hooks.useAllAccounts('mint', null).data satisfies Account<Mint>[] | undefined;
        hooks.useAllMaybeAccounts('mint', null).data satisfies MaybeAccount<Mint>[] | undefined;
        hooks.useTrackedAccount('mint', null).data?.value satisfies Mint | null | undefined;
        hooks.usePda('mintAuthority', null).data satisfies [Address, number] | undefined;
        hooks.useSendInstruction('transfer').data satisfies string | undefined;
    }

    // The instruction dispatcher takes the builder's own input
    {
        const hooks = createProgramHooks<{ token: TokenPlugin }>('token');
        const { dispatch } = hooks.useSendInstruction('transfer');

        dispatch({ amount: 1n, destination: '2' as Address, source: '1' as Address });
        // @ts-expect-error - `amount` must be a bigint
        dispatch({ amount: 1, destination: '2' as Address, source: '1' as Address });
    }
}
