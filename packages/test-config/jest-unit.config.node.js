import path from 'node:path';
import { fileURLToPath } from 'url';

import commonConfig from './jest-unit.config.common.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const config = {
    ...commonConfig,
    displayName: {
        color: 'grey',
        name: 'Unit Test (Node)',
    },
    globals: {
        ...commonConfig.globals,
        __BROWSER__: false,
        __NODEJS__: true,
        __REACTNATIVE__: false,
    },
    setupFilesAfterEnv: [...(commonConfig.setupFilesAfterEnv ?? []), path.resolve(__dirname, 'setup-undici-fetch.ts')],
    testPathIgnorePatterns: [...(commonConfig.testPathIgnorePatterns ?? []), '-test.browser.tsx?$'],
};

export default config;
