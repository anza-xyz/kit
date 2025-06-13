import { buildPatchingBunBug20183 } from './bun-bug-20183';
import { getBaseConfig } from './getBaseConfig';
import packageConfigs from './package-configs';

await Promise.all([...packageConfigs, ...getBaseConfig('browser', ['iife'])].map(buildPatchingBunBug20183));
