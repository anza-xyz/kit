import { buildPatchingBunBug20183 } from './bun-bug-20183';
import shimConfigs from './shim-configs';

await Promise.all(shimConfigs.map(buildPatchingBunBug20183));
