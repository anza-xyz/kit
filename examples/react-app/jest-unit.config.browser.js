import baseConfig from '../../node_modules/@solana/test-config/jest-unit.config.browser.js';

const config = {
    ...baseConfig,
    transform: {
        '^.+\\.(ts|js)x?$': [
            '@swc/jest',
            {
                jsc: {
                    parser: { syntax: 'typescript', tsx: true },
                    target: 'es2020',
                    transform: {
                        react: { runtime: 'automatic' },
                    },
                },
            },
        ],
    },
};

export default config;
