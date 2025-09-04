import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
    outputFileTracingRoot: import.meta.dirname,
    reactStrictMode: true,
    serverExternalPackages: ['twoslash', 'typescript'],
};

export default withMDX(config);
