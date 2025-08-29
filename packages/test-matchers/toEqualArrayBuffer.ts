expect.extend({
    toEqualArrayBuffer(received: ArrayBuffer, expected: ArrayBuffer) {
        if (!(received instanceof ArrayBuffer) || !(expected instanceof ArrayBuffer)) {
            return {
                message: () => 'Expected to compare two `ArrayBuffers`',
                pass: false,
            };
        }
        let pass = false;
        if (received.byteLength === expected.byteLength) {
            const receivedView = new Uint8Array(received);
            const expectedView = new Uint8Array(expected);
            pass = expectedView.every((b, ii) => b === receivedView[ii]);
        }
        return {
            message: () =>
                this.isNot
                    ? 'Expected `ArrayBuffers` to differ'
                    : `${this.utils.diff(expected, received, { expand: true })}`,
            pass,
        };
    },
});

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace jest {
        interface AsymmetricMatchers {
            toEqualArrayBuffer(expected: ArrayBuffer): void;
        }
        interface Matchers<R> {
            toEqualArrayBuffer(expected: ArrayBuffer): R;
        }
    }
}

export {};
