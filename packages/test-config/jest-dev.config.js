import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const config = {
    projects: [
        path.resolve(__dirname, 'jest-lint.config.js'),
        path.resolve(__dirname, 'jest-prettier.config.js'),
        path.resolve(__dirname, 'jest-unit.config.browser.js'),
        path.resolve(__dirname, 'jest-unit.config.node.js'),
    ],
    watchPlugins: [
        'jest-watch-master',
        'jest-watch-select-projects',
        'jest-watch-typeahead/filename',
        'jest-watch-typeahead/testname',
    ],
    workerThreads: true,
};

export default config;
