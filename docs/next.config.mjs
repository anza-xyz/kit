import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

const docsRouteRedirects = [
    ['concepts', 'advanced-guides'],
    ['concepts/codecs', 'advanced-guides/codecs'],
    ['concepts/errors', 'advanced-guides/errors'],
    ['concepts/instruction-plans', 'advanced-guides/instruction-plans'],
    ['concepts/keypairs', 'advanced-guides/keypairs'],
    ['concepts/offchain-messages', 'advanced-guides/offchain-messages'],
    ['concepts/rpc', 'guides/rpc'],
    ['concepts/rpc-subscriptions', 'guides/rpc-subscriptions'],
    ['concepts/signers', 'advanced-guides/signers'],
    ['concepts/transactions', 'advanced-guides/transactions'],
    ['getting-started/setup', 'advanced-guides/kit-without-a-client'],
    ['getting-started/signers', 'advanced-guides/kit-without-a-client'],
    ['getting-started/instructions', 'advanced-guides/kit-without-a-client'],
    ['getting-started/build-transaction', 'advanced-guides/kit-without-a-client'],
    ['getting-started/send-transaction', 'advanced-guides/kit-without-a-client'],
    ['getting-started/fetch-account', 'advanced-guides/kit-without-a-client'],
];

const createDocsRedirects = () =>
    docsRouteRedirects.flatMap(([sourcePath, destinationPath]) => [
        {
            source: `/docs/${sourcePath}`,
            destination: `/docs/${destinationPath}`,
            permanent: true,
        },
        {
            source: `/docs/${sourcePath}.mdx`,
            destination: `/docs/${destinationPath}.mdx`,
            permanent: true,
        },
    ]);

/** @type {import('next').NextConfig} */
const config = {
    redirects: async () => createDocsRedirects(),
    reactStrictMode: true,
    serverExternalPackages: ['twoslash', 'typescript'],
    rewrites: async () => {
        return [
            {
                source: '/api/:path*.mdx',
                destination: '/llms.mdx/api/:path*',
            },
            {
                source: '/docs/:path*.mdx',
                destination: '/llms.mdx/docs/:path*',
            },
            {
                source: '/recipes/:path*.mdx',
                destination: '/llms.mdx/recipes/:path*',
            },
        ];
    },
};

export default withMDX(config);
