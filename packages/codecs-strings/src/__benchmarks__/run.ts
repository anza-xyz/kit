#!/usr/bin/env -S pnpm dlx tsx -r ../build-scripts/register-node-globals.cjs

import { webcrypto as crypto } from 'node:crypto';

import { Bench } from 'tinybench';

import { getBase16Codec } from '../base16';
import { getBase58Codec } from '../base58';
import { getUtf8Codec } from '../utf8';

const bench = new Bench({
    throws: true,
});

const bytes32 = new Uint8Array(32);
const bytes16 = new Uint8Array(16);
let base58EncodedString: string;
let base16EncodedString: string;
function randomizeBytes() {
    crypto.getRandomValues(bytes32);
    crypto.getRandomValues(bytes16);
}
const base58Codec = getBase58Codec();
const base16Codec = getBase16Codec();
const utf8Codec = getUtf8Codec();
const fatalUtf8Codec = getUtf8Codec({ fatal: true });

// Mixed 1 to 4-byte characters, repeated to the target sizes.
const utf8Sample = 'Hello, 語 and 😀! ';
const utf8String32B = utf8Sample.repeat(2).slice(0, 26); // 32 bytes.
const utf8String1MB = utf8Sample.repeat(45_000); // About 1 MB.
const utf8Bytes32B = utf8Codec.encode(utf8String32B);
const utf8Bytes1MB = utf8Codec.encode(utf8String1MB);

bench
    .add(
        'Base58 decode',
        () => {
            base58Codec.decode(bytes32);
        },
        { beforeEach: randomizeBytes },
    )
    .add(
        'Base58 encode',
        () => {
            base58Codec.encode(base58EncodedString);
        },
        {
            beforeEach() {
                randomizeBytes();
                base58EncodedString = base58Codec.decode(bytes32);
            },
        },
    )
    .add(
        'Base16 encode',
        () => {
            base16Codec.encode(base16EncodedString);
        },
        {
            beforeEach() {
                randomizeBytes();
                base16EncodedString = base16Codec.decode(bytes16);
            },
        },
    )
    .add('UTF-8 encode (32 B)', () => {
        utf8Codec.encode(utf8String32B);
    })
    .add('UTF-8 encode, fatal (32 B)', () => {
        fatalUtf8Codec.encode(utf8String32B);
    })
    .add('UTF-8 decode (32 B)', () => {
        utf8Codec.decode(utf8Bytes32B);
    })
    .add('UTF-8 decode, fatal (32 B)', () => {
        fatalUtf8Codec.decode(utf8Bytes32B);
    })
    .add('UTF-8 encode (1 MB)', () => {
        utf8Codec.encode(utf8String1MB);
    })
    .add('UTF-8 encode, fatal (1 MB)', () => {
        fatalUtf8Codec.encode(utf8String1MB);
    })
    .add('UTF-8 decode (1 MB)', () => {
        utf8Codec.decode(utf8Bytes1MB);
    })
    .add('UTF-8 decode, fatal (1 MB)', () => {
        fatalUtf8Codec.decode(utf8Bytes1MB);
    });

void (async () => {
    await bench.run();

    console.table(bench.table());
})();
