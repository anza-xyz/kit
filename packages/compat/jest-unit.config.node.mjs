import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import baseConfig from '../test-config/jest-unit.config.node.js';

const require = createRequire(import.meta.url);
const rootDir = path.dirname(fileURLToPath(import.meta.url));

/**
 * Runs the unit tests twice: once against `@solana/web3.js` v3 (the version installed under that
 * name) and once with `@solana/web3.js` resolving to the v1 release, so that the conversion
 * helpers are exercised against both major versions at runtime.
 */
export default {
    projects: [
        { ...baseConfig, rootDir },
        {
            ...baseConfig,
            displayName: {
                ...baseConfig.displayName,
                name: `${baseConfig.displayName.name} [web3.js v1]`,
            },
            moduleNameMapper: {
                ...baseConfig.moduleNameMapper,
                '^@solana/web3\\.js$': '@solana/web3.js-v1',
                // web3.js v1 depends on `rpc-websockets@^9.0.2`, which resolves to 9.3.x and
                // depends on the ESM-only `uuid@14`. Force `uuid` to resolve to the CJS build of
                // v8, because Jest can't load ESM from `node_modules`.
                '^uuid$': require.resolve('uuid'),
            },
            rootDir,
        },
    ],
};
