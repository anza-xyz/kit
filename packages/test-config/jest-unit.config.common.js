import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const config = {
    resetMocks: true,
    restoreMocks: true,
    roots: ['<rootDir>/src/'],
    setupFilesAfterEnv: [
        path.resolve(__dirname, 'setup-dev-mode.ts'),
        path.resolve(__dirname, 'setup-define-version-constant.ts'),
        path.resolve(__dirname, 'setup-webcrypto.ts'),
    ],
    testPathIgnorePatterns: ['__setup__.ts'],
    transform: {
        '^.+\\.(ts|js)x?$': [
            '@swc/jest',
            {
                jsc: {
                    target: 'es2020',
                },
            },
        ],
    },
    transformIgnorePatterns: ['/node_modules/(?!.*\\@noble/ed25519/)', '\\.pnp\\.[^\\/]+$'],
};

export default config;
