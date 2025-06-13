import { buildPatchingBunBug20183 } from './bun-bug-20183';
import packageConfigs from './package-configs';

await Promise.all(packageConfigs.map(buildPatchingBunBug20183));
