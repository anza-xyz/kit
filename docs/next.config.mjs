import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
    experimental: {
        webpackMemoryOptimizations: true,
    },
    reactStrictMode: true,
    serverExternalPackages: ['twoslash', 'typescript'],
};

export default withMDX(config);
