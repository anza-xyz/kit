const config = {
    displayName: {
        color: 'cyanBright',
        name: 'ESLint',
    },
    runner: 'eslint',
    testMatch: ['<rootDir>src/**/*.ts'],
    testPathIgnorePatterns: ['README.md'],
};

export default config;
