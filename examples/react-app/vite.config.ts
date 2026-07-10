import react from '@vitejs/plugin-react-swc';
import { defineConfig, Plugin } from 'vite';

function replaceProcessEnv(mode: string): Plugin {
    const nodeEnvRegex = /process(\.env(\.NODE_ENV)|\["env"\]\.NODE_ENV)/g;
    return {
        name: 'replace-process-env',
        renderChunk(code) {
            return code.replace(nodeEnvRegex, JSON.stringify(mode));
        },
    };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
    base: process.env.REACT_EXAMPLE_APP_BASE_PATH,
    define: {
        'process.env': process.env,
    },
    optimizeDeps: {
        // `@solana/react` is a linked workspace package, so Vite excludes it from dependency
        // pre-bundling by default. When Vite then pre-bundles the npm dependency
        // `@solana/kit-plugin-wallet` (which imports `@solana/react`), esbuild inlines a *second*
        // copy of `@solana/react`, which causes mis-matched context.
        // Forcing `@solana/react` to be pre-bundled makes it a single shared copy
        // that both the app and the plugin reference.
        // This is only an issue in our example because of the linked workspace.
        include: ['@solana/react'],
    },
    plugins: [react(), replaceProcessEnv(mode)],
}));
