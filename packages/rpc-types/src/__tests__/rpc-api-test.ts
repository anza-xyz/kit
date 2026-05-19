import { type SolanaRpcResponse, splitSolanaRpcResponse } from '../rpc-api';
import type { Slot } from '../typed-numbers';

describe('splitSolanaRpcResponse', () => {
    it('decomposes a SolanaRpcResponse envelope into its value and slot', () => {
        const envelope: SolanaRpcResponse<{ lamports: bigint }> = {
            context: { slot: 99n as Slot },
            value: { lamports: 5n },
        };
        expect(splitSolanaRpcResponse(envelope)).toStrictEqual({
            slot: 99n,
            value: { lamports: 5n },
        });
    });

    it('passes raw values through with `slot: undefined`', () => {
        const raw = { parent: 9n, root: 8n, slot: 10n };
        expect(splitSolanaRpcResponse(raw)).toStrictEqual({
            slot: undefined,
            value: raw,
        });
    });

    it('returns `{ value: undefined, slot: undefined }` for `undefined`', () => {
        expect(splitSolanaRpcResponse(undefined)).toStrictEqual({
            slot: undefined,
            value: undefined,
        });
    });

    it('treats objects missing `context` as raw values', () => {
        const malformed = { value: 42 } as unknown;
        expect(splitSolanaRpcResponse(malformed)).toStrictEqual({
            slot: undefined,
            value: malformed,
        });
    });

    it('treats objects missing `value` as raw values', () => {
        const malformed = { context: { slot: 1n } } as unknown;
        expect(splitSolanaRpcResponse(malformed)).toStrictEqual({
            slot: undefined,
            value: malformed,
        });
    });

    it('passes through primitive notifications unchanged', () => {
        expect(splitSolanaRpcResponse(42)).toStrictEqual({ slot: undefined, value: 42 });
        expect(splitSolanaRpcResponse('hello')).toStrictEqual({ slot: undefined, value: 'hello' });
        expect(splitSolanaRpcResponse(true)).toStrictEqual({ slot: undefined, value: true });
    });

    it('unwraps even when the envelope value is itself undefined or null', () => {
        const undefinedValueEnvelope = {
            context: { slot: 7n as Slot },
            value: undefined,
        } as SolanaRpcResponse<undefined>;
        expect(splitSolanaRpcResponse(undefinedValueEnvelope)).toStrictEqual({
            slot: 7n,
            value: undefined,
        });

        const nullValueEnvelope = {
            context: { slot: 8n as Slot },
            value: null,
        } as SolanaRpcResponse<null>;
        expect(splitSolanaRpcResponse(nullValueEnvelope)).toStrictEqual({
            slot: 8n,
            value: null,
        });
    });
});
