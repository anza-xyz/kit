import { getBaseConfig } from './getBaseConfig';

export default [
    ...getBaseConfig('node', ['cjs', 'esm']),
    ...getBaseConfig('browser', ['cjs', 'esm']),
    ...getBaseConfig('native', ['esm']),
];
