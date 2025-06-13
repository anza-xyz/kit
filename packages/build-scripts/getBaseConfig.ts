import { env } from 'node:process';

import Bun from 'bun';

import { DevFlagPlugin } from './dev-flag';

type Platform =
    | Bun.Target
    // React Native
    | 'native';

export function getBaseConfig(platform: Platform, formats: Bun.BuildConfig['format'][]): Bun.BuildConfig[] {
    return [true, false]
        .flatMap<Bun.BuildConfig | null>(isDebugBuild =>
            formats.map(format =>
                format !== 'iife' && isDebugBuild
                    ? null // We don't build debug builds for packages; only for the iife bundle.
                    : ({
                          define: {
                              __BROWSER__: `${platform === 'browser'}`,
                              __NODEJS__: `${platform === 'node'}`,
                              __REACTNATIVE__: `${platform === 'native'}`,
                              __VERSION__: `"${env.npm_package_version}"`,
                              'process.env.NODE_ENV':
                                  format === 'iife'
                                      ? `"${isDebugBuild ? 'development' : 'production'}"`
                                      : 'process.env.NODE_ENV',
                          },
                          entrypoints: [`./src/index.ts`],
                          env: 'disable',
                          format,
                          minify: format === 'iife' && !isDebugBuild,
                          naming: (function () {
                              let kind;
                              if (format === 'iife') {
                                  kind = `${isDebugBuild ? 'development' : 'production.min'}`;
                              } else {
                                  kind = `${platform}`;
                              }
                              const extension = format === 'iife' ? 'js' : format === 'esm' ? 'mjs' : format;
                              return `[name].${kind}.${extension}`;
                          })(),
                          outdir: './dist',
                          packages: format === 'iife' ? 'bundle' : 'external',
                          plugins: [DevFlagPlugin],
                          sourcemap: format !== 'iife' || isDebugBuild ? 'linked' : 'none',
                          target: platform === 'native' ? 'browser' : platform,
                      } as Bun.BuildConfig),
            ),
        )
        .filter(Boolean) as Bun.BuildConfig[];
}
