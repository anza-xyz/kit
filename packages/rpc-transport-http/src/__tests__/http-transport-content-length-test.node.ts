import { createServer, IncomingMessage, Server, ServerResponse } from 'node:http';
import { AddressInfo } from 'node:net';

import { createHttpTransport } from '../http-transport';

// Integration test exercising the real `fetch` (undici on Node, wired up by setup-undici-fetch.ts)
// rather than a mocked spy. The bug being guarded against is that the transport used to send a
// manual `Content-Length` header equal to `body.length` (the JS string's UTF-16 code-unit count),
// which underreports the byte count for any payload containing non-ASCII characters. Servers then
// read only that many bytes from the socket and stall waiting for the rest of the request, hanging
// the client until a timeout fires.

describe('createHttpTransport (real fetch against a local server)', () => {
    // Short per-request abort timeout so the test fails fast and cleanly (with an AbortError) if
    // a regression makes the request hang. Comfortably long for a localhost roundtrip.
    const REQUEST_TIMEOUT_MS = 2_000;

    let server: Server;
    let receivedHeaders: IncomingMessage['headers'] | undefined;
    let receivedBody: string | undefined;
    let url: string;
    beforeEach(async () => {
        receivedHeaders = undefined;
        receivedBody = undefined;
        server = createServer((req: IncomingMessage, res: ServerResponse) => {
            receivedHeaders = req.headers;
            const chunks: Buffer[] = [];
            req.on('data', (chunk: Buffer) => chunks.push(chunk));
            req.on('end', () => {
                receivedBody = Buffer.concat(chunks).toString('utf8');
                res.writeHead(200, { 'content-type': 'application/json' });
                res.end(JSON.stringify({ id: 1, jsonrpc: '2.0', result: 'ok' }));
            });
        });
        await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
        const { address, port } = server.address() as AddressInfo;
        url = `http://${address}:${port}`;
    });
    afterEach(async () => {
        await new Promise<void>(resolve => server.close(() => resolve()));
    });
    it('completes a request with an ASCII payload', async () => {
        expect.assertions(1);
        const transport = createHttpTransport({ url });
        await expect(
            transport({
                payload: { id: 1, jsonrpc: '2.0', method: 'getSlot' },
                signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
            }),
        ).resolves.toBeDefined();
    });
    it('lets fetch compute the correct UTF-8 byte length on the wire', async () => {
        // Regression for `body.length.toString()`: with a multi-byte UTF-8 payload the old manual
        // header understated the body size. Servers stall reading the socket, and the request
        // hangs until our AbortSignal trips below — which is what makes this test fail fast on
        // the regression instead of waiting out Jest's default 5s test timeout.
        expect.assertions(2);
        const transport = createHttpTransport({ url });
        await transport({
            payload: {
                id: 1,
                jsonrpc: '2.0',
                method: 'getSlot',
                params: ['\u{1F44B}\u{1F3FD} \u{1F469}\u{1F3FB}‍❤️‍\u{1F469}\u{1F3FF}'],
            },
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
        expect(receivedBody).toBeDefined();
        const sentBodyByteLength = Buffer.byteLength(receivedBody as string, 'utf8');
        expect(receivedHeaders?.['content-length']).toBe(String(sentBodyByteLength));
    });
});
