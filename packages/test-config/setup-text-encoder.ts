import { protectProperties } from 'jest-util';
import { TextDecoder, TextEncoder } from 'util';

if (typeof globalThis.TextEncoder === 'undefined') {
    globalThis.TextEncoder = TextEncoder;
    protectProperties(globalThis['TextEncoder']);
}

if (typeof globalThis.TextDecoder === 'undefined') {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    globalThis.TextDecoder = TextDecoder;
    protectProperties(globalThis['TextDecoder']);
}
