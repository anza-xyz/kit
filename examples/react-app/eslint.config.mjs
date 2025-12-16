import solanaReactConfig from '@solana/eslint-config/eslint.config.react.mjs';
import reactRefreshPlugin from 'eslint-plugin-react-refresh';
import globals from 'globals';

export default [
    {
        ignores: ['**/dist', '**/*.css'],
    },
    ...solanaReactConfig,
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.es2020,
            },
        },
        plugins: {
            'react-refresh': reactRefreshPlugin,
        },
        rules: {
            '@typescript-eslint/no-misused-promises': 'off',
            '@typescript-eslint/no-unsafe-argument': 'off',
            '@typescript-eslint/no-unsafe-assignment': 'off',
            '@typescript-eslint/restrict-template-expressions': 'error',
            'react-refresh/only-export-components': [
                'warn',
                {
                    allowConstantExport: true,
                },
            ],
        },
    },
];
