import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
    reactStrictMode: true,
    serverExternalPackages: ['twoslash', 'typescript'],
    rewrites: async () => {
        return [
            {
                source: '/api/:path*.mdx',
                destination: '/llms.mdx/api/:path*'
            },
            {
                source: '/docs/:path*.mdx',
                destination: '/llms.mdx/docs/:path*'
            }
        ]
    }
};

export default withMDX(config);
