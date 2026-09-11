import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { test } from 'node:test';
import { stripVTControlCharacters } from 'node:util';

// Run after compiling the workspace dependencies. Unlike `vite build`, this exercises
// development-only dependency optimization, including the linked @solana/react package.
test('the dev server serves the app and optimized React dependency', { timeout: 60_000 }, async t => {
    const ready = Promise.withResolvers();
    const exited = Promise.withResolvers();
    const closed = Promise.withResolvers();
    let logs = '';
    let passed = false;
    const server = spawn('pnpm', ['dev', '--force', '--host', '127.0.0.1', '--port', '0', '--strictPort'], {
        cwd: import.meta.dirname,
        // A separate process group lets cleanup terminate pnpm, its shell, and Vite.
        detached: true,
        env: { ...process.env, BROWSER: 'none', FORCE_COLOR: '0', REACT_EXAMPLE_APP_BASE_PATH: '/' },
        stdio: ['ignore', 'pipe', 'pipe'],
    });

    function captureOutput(chunk) {
        logs += stripVTControlCharacters(chunk.toString());
        const url = logs.match(/Local:\s+(http:\/\/127\.0\.0\.1:\d+\/)/)?.[1];
        if (url) ready.resolve(url);
    }
    server.stdout.on('data', captureOutput);
    server.stderr.on('data', captureOutput);
    server.once('error', exited.reject);
    server.once('close', (code, signal) => {
        closed.resolve();
        exited.reject(new Error(`Dev server exited unexpectedly (code: ${code}, signal: ${signal})`));
    });

    function stopServer(signal) {
        if (!server.pid) return;
        try {
            process.kill(-server.pid, signal);
        } catch (error) {
            if (error.code !== 'ESRCH') throw error;
        }
    }

    t.after(async () => {
        stopServer('SIGTERM');
        const forceStop = setTimeout(() => stopServer('SIGKILL'), 5_000);
        try {
            await closed.promise;
        } finally {
            clearTimeout(forceStop);
            if (!passed) t.diagnostic(logs);
        }
    });

    async function checkModules() {
        const baseUrl = await ready.promise;
        // The ready banner and index.html can both succeed before optimization fails.
        for (const path of ['src/main.tsx', 'node_modules/.vite/deps/@solana_react.js']) {
            const response = await fetch(new URL(path, baseUrl), { signal: t.signal });
            assert.equal(response.status, 200, `${path} must load successfully`);
            assert.match(response.headers.get('content-type') ?? '', /(?:java|ecma)script/i);
            const source = await response.text();
            assert.ok(source.trim().length > 0, `${path} must contain JavaScript`);
        }
        assert.equal(server.exitCode, null);
        assert.equal(server.signalCode, null);
    }

    await Promise.race([checkModules(), exited.promise]);
    passed = true;
});
