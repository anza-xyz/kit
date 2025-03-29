import { rehypeCodeDefaultOptions } from 'fumadocs-core/mdx-plugins';
import { remarkInstall } from 'fumadocs-docgen';
import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import { transformerTwoslash } from 'fumadocs-twoslash';

export const docs = defineDocs({
    dir: 'content/docs',
});

export default defineConfig({
    mdxOptions: {
        rehypeCodeOptions: {
            themes: {
                dark: 'github-dark',
                light: 'github-light',
            },
            transformers: [...(rehypeCodeDefaultOptions.transformers ?? []), transformerTwoslash()],
        },
        remarkPlugins: [() => remarkInstall({ persist: { id: 'package-install' } })],
    },
});
