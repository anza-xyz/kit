import {
    type AccountNotificationsApi,
    type Address,
    type ClientWithRpc,
    type ClientWithRpcSubscriptions,
    type GetAccountInfoApi,
    getBase64Encoder,
    type GetMultipleAccountsApi,
    type ReadonlyUint8Array,
} from '@solana/kit';

/** Config shared by every account fetch the program hooks perform. */
type FetchConfig = { abortSignal?: AbortSignal };

/** Runtime view of one entry in a program plugin's `accounts` map. */
export type ProgramAccountEntry = {
    decode: (bytes: ReadonlyUint8Array, offset?: number) => unknown;
    fetch: (address: Address, config?: FetchConfig) => Promise<unknown>;
    fetchAll: (addresses: Address[], config?: FetchConfig) => Promise<unknown>;
    fetchAllMaybe: (addresses: Address[], config?: FetchConfig) => Promise<unknown>;
    fetchMaybe: (address: Address, config?: FetchConfig) => Promise<unknown>;
};

/** Runtime view of one entry in a program plugin's `instructions` map. */
export type ProgramInstructionEntry = (input: never) => {
    sendTransaction: (config?: unknown) => Promise<unknown>;
};

/** Runtime view of a program plugin as installed on the client. */
export type ProgramNamespace = {
    accounts?: Record<string, ProgramAccountEntry>;
    instructions?: Record<string, ProgramInstructionEntry>;
    pdas?: Record<string, (seeds: never) => unknown>;
};

/** The client capabilities the program hooks read from. */
export type ProgramHooksClient = ClientWithRpc<GetAccountInfoApi & GetMultipleAccountsApi> &
    ClientWithRpcSubscriptions<AccountNotificationsApi>;

/** A base64 account payload as returned by `getAccountInfo` / `accountNotifications`. */
export type Base64AccountValue = Readonly<{ data: readonly [string, 'base64'] }> | null;

export function getNamespace(client: object, capability: string): ProgramNamespace {
    return (client as Record<string, ProgramNamespace>)[capability];
}

export function getAccountEntry(client: object, capability: string, key: string): ProgramAccountEntry {
    const entry = getNamespace(client, capability).accounts?.[key];
    if (!entry) {
        throw new Error(`Program plugin "${capability}" does not declare an account named "${key}".`);
    }
    return entry;
}

export function getInstructionEntry(client: object, capability: string, key: string): ProgramInstructionEntry {
    const entry = getNamespace(client, capability).instructions?.[key];
    if (!entry) {
        throw new Error(`Program plugin "${capability}" does not declare an instruction named "${key}".`);
    }
    return entry;
}

export function getPdaEntry(client: object, capability: string, key: string): (seeds: never) => unknown {
    const entry = getNamespace(client, capability).pdas?.[key];
    if (!entry) {
        throw new Error(`Program plugin "${capability}" does not declare a PDA named "${key}".`);
    }
    return entry;
}

/**
 * Decodes a base64 account payload with the program plugin's own codec, mapping a missing or
 * closed account to `null`. A missing account arrives as a `null` value from `getAccountInfo`; a
 * closed account arrives from `accountNotifications` with zero-length data, which no program codec
 * can decode.
 */
export function decodeAccountValue(entry: ProgramAccountEntry, value: Base64AccountValue): unknown {
    if (value == null) return null;
    const bytes = getBase64Encoder().encode(value.data[0]);
    if (bytes.length === 0) return null;
    return entry.decode(bytes);
}
