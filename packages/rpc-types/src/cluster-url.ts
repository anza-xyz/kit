export type MainnetUrl = string & { '~cluster': 'mainnet' };
export type DevnetUrl = string & { '~cluster': 'devnet' };
export type TestnetUrl = string & { '~cluster': 'testnet' };
export type ClusterUrl = DevnetUrl | MainnetUrl | TestnetUrl | string;

/** Given a URL casts it to a type that is only accepted where mainnet URLs are expected. */
export function mainnet(putativeString: string): MainnetUrl {
    return putativeString as MainnetUrl;
}
/** Given a URL casts it to a type that is only accepted where devnet URLs are expected. */
export function devnet(putativeString: string): DevnetUrl {
    return putativeString as DevnetUrl;
}
/** Given a URL casts it to a type that is only accepted where testnet URLs are expected. */
export function testnet(putativeString: string): TestnetUrl {
    return putativeString as TestnetUrl;
}
