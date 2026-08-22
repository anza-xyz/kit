/**
 * Type-level projections over a Codama-generated program plugin.
 *
 * A generated plugin is a runtime map of the shape `{ accounts?, instructions?, pdas? }` where
 * each account entry is a codec augmented with `SelfFetchFunctions`, each instruction entry is a
 * builder returning an instruction augmented with `SelfPlanAndSendFunctions`, and each PDA entry
 * is a `find*Pda` function. Every hook signature produced by {@link createProgramHooks} is derived
 * from that map, so no Codama naming convention is re-implemented here.
 */

/**
 * The `accounts` map of a program plugin, or an empty map when it declares none — so that
 * {@link ProgramAccountKey} is `never` and every account hook rejects every key.
 */
export type ProgramAccounts<TPlugin> = TPlugin extends { accounts: infer TAccounts } ? TAccounts : Record<never, never>;

/**
 * The `instructions` map of a program plugin, or an empty map when it declares none — so that
 * {@link ProgramInstructionKey} is `never` and every instruction hook rejects every key.
 */
export type ProgramInstructions<TPlugin> = TPlugin extends { instructions: infer TInstructions }
    ? TInstructions
    : Record<never, never>;

/**
 * The `pdas` map of a program plugin, or an empty map when it declares none — so that
 * {@link ProgramPdaKey} is `never` and the PDA hook rejects every key.
 */
export type ProgramPdas<TPlugin> = TPlugin extends { pdas: infer TPdas } ? TPdas : Record<never, never>;

/** Names of the accounts a program plugin can decode and fetch. */
export type ProgramAccountKey<TPlugin> = string & keyof ProgramAccounts<TPlugin>;

/** Names of the instructions a program plugin can build. */
export type ProgramInstructionKey<TPlugin> = string & keyof ProgramInstructions<TPlugin>;

/** Names of the program derived addresses a program plugin can find. */
export type ProgramPdaKey<TPlugin> = string & keyof ProgramPdas<TPlugin>;

/** The account type produced by an account codec's `decode`. */
export type DecodedProgramAccount<
    TPlugin,
    TKey extends ProgramAccountKey<TPlugin>,
> = ProgramAccounts<TPlugin>[TKey] extends { decode: (...args: never[]) => infer TDecoded } ? TDecoded : never;

/** The `Account` envelope produced by an account entry's `fetch`. */
export type FetchedProgramAccount<
    TPlugin,
    TKey extends ProgramAccountKey<TPlugin>,
> = ProgramAccounts<TPlugin>[TKey] extends { fetch: (...args: never[]) => PromiseLike<infer TAccount> }
    ? TAccount
    : never;

/** The `Account` envelopes produced by an account entry's `fetchAll`. */
export type FetchedProgramAccounts<
    TPlugin,
    TKey extends ProgramAccountKey<TPlugin>,
> = ProgramAccounts<TPlugin>[TKey] extends { fetchAll: (...args: never[]) => PromiseLike<infer TAccounts> }
    ? TAccounts
    : never;

/** The `MaybeAccount` envelope produced by an account entry's `fetchMaybe`. */
export type FetchedMaybeProgramAccount<
    TPlugin,
    TKey extends ProgramAccountKey<TPlugin>,
> = ProgramAccounts<TPlugin>[TKey] extends { fetchMaybe: (...args: never[]) => PromiseLike<infer TAccount> }
    ? TAccount
    : never;

/** The `MaybeAccount` envelopes produced by an account entry's `fetchAllMaybe`. */
export type FetchedMaybeProgramAccounts<
    TPlugin,
    TKey extends ProgramAccountKey<TPlugin>,
> = ProgramAccounts<TPlugin>[TKey] extends { fetchAllMaybe: (...args: never[]) => PromiseLike<infer TAccounts> }
    ? TAccounts
    : never;

/** The input accepted by an instruction builder. */
export type ProgramInstructionInput<
    TPlugin,
    TKey extends ProgramInstructionKey<TPlugin>,
> = ProgramInstructions<TPlugin>[TKey] extends (input: infer TInput) => unknown ? TInput : never;

type BuiltInstruction<
    TPlugin,
    TKey extends ProgramInstructionKey<TPlugin>,
> = ProgramInstructions<TPlugin>[TKey] extends (...args: never[]) => infer TInstruction ? TInstruction : never;

/** The config accepted by a built instruction's `sendTransaction`. */
export type ProgramSendConfig<TPlugin, TKey extends ProgramInstructionKey<TPlugin>> =
    BuiltInstruction<TPlugin, TKey> extends { sendTransaction: (config?: infer TConfig) => unknown } ? TConfig : never;

/** The result of a built instruction's `sendTransaction`. */
export type ProgramSendResult<TPlugin, TKey extends ProgramInstructionKey<TPlugin>> =
    BuiltInstruction<TPlugin, TKey> extends { sendTransaction: (...args: never[]) => PromiseLike<infer TResult> }
        ? TResult
        : never;

/** The seeds accepted by a PDA finder. */
export type ProgramPdaSeeds<TPlugin, TKey extends ProgramPdaKey<TPlugin>> = ProgramPdas<TPlugin>[TKey] extends (
    seeds: infer TSeeds,
    ...rest: never[]
) => unknown
    ? TSeeds
    : never;

/** The address produced by a PDA finder. */
export type ProgramPdaResult<TPlugin, TKey extends ProgramPdaKey<TPlugin>> = ProgramPdas<TPlugin>[TKey] extends (
    ...args: never[]
) => infer TResult
    ? Awaited<TResult>
    : never;
