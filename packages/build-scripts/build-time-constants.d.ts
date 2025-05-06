// Build time constant roughly equivalent to `NODE_ENV !== 'production'`
// See build-scripts/dev-flag.ts
declare const __DEV__: boolean;

// Build targets; mutually exclusive (only one can be true)
// See build-scripts/getBaseConfig.ts
declare const __BROWSER__: boolean;
declare const __NODEJS__: boolean;
declare const __REACTNATIVE__: boolean;

// Build-time constant representing the version of the npm package
// See build-scripts/getBaseConfig.ts
declare const __VERSION__: string;
