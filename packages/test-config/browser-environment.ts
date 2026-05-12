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
        /**
         * Polyfill `AbortSignal.any` on jsdom's `AbortSignal` class if missing. jsdom 22 doesn't
         * implement it (added natively in jsdom 24, in Node 20.3, and shipped in all current
         * browsers). Cross-realm replacement of the whole class would break jsdom's internal
         * brand checks elsewhere, so this patches just the static method.
         */
        const JsdomAbortSignal = this.global.AbortSignal as typeof globalThis.AbortSignal & {
            any?: typeof globalThis.AbortSignal.any;
        };
        const JsdomAbortController = this.global.AbortController as typeof globalThis.AbortController;
        if (typeof JsdomAbortSignal.any !== 'function') {
            JsdomAbortSignal.any = function any(signals: readonly AbortSignal[]): AbortSignal {
                const controller = new JsdomAbortController();
                const alreadyAborted = signals.find(s => s.aborted);
                if (alreadyAborted) {
                    controller.abort(alreadyAborted.reason);
                    return controller.signal;
                }
                for (const inputSignal of signals) {
                    inputSignal.addEventListener(
                        'abort',
                        () => {
                            if (!controller.signal.aborted) controller.abort(inputSignal.reason);
                        },
                        { once: true, signal: controller.signal },
                    );
                }
                return controller.signal;
            };
        }
    }
}
