const config = {
    displayName: {
        color: 'magentaBright',
        name: 'Prettier',
    },
    moduleFileExtensions: ['js', 'ts', 'json', 'md'],
    runner: 'prettier',
    testMatch: ['<rootDir>/src/**', '<rootDir>*'],
    testPathIgnorePatterns: ['CHANGELOG.md'],
};

export default config;
