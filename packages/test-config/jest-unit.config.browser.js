import path from 'path';
import { fileURLToPath } from 'url';

import commonConfig from './jest-unit.config.common.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const config = {
    ...commonConfig,
    displayName: {
        color: 'grey',
        name: 'Unit Test (Browser)',
    },
    globals: {
        ...commonConfig.globals,
        __BROWSER__: true,
        __NODEJS__: false,
        __REACTNATIVE__: false,
    },
    setupFilesAfterEnv: [
        ...(commonConfig.setupFilesAfterEnv ?? []),
        path.resolve(__dirname, 'setup-secure-context.ts'),
        path.resolve(__dirname, 'setup-text-encoder.ts'),
        path.resolve(__dirname, 'setup-web-buffer-global.ts'),
        path.resolve(__dirname, 'setup-whatwg-fetch.ts'),
    ],
    testEnvironment: path.resolve(__dirname, 'browser-environment.ts'),
    testEnvironmentOptions: {},
    testPathIgnorePatterns: [...(commonConfig.testPathIgnorePatterns ?? []), '-test.node.ts$'],
};

export default config;
