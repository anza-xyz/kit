import { TestEnvironment } from 'jest-environment-jsdom';

export default class BrowserEnvironment extends TestEnvironment {
    async setup() {
        await super.setup();
        /**
         * Here we inject Node's binary array types as globals so that - among other things -
         * `instanceof` checks inside `SubtleCrypto.digest()` work with `Uint8Array#buffer`. Read
         * more here: https://github.com/jestjs/jest/issues/7780#issuecomment-615890410
         */
        this.global.ArrayBuffer = globalThis.ArrayBuffer;
        this.global.Uint8Array = globalThis.Uint8Array;
    }
}
