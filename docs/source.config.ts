import { rehypeCodeDefaultOptions } from 'fumadocs-core/mdx-plugins';
import { remarkInstall } from 'fumadocs-docgen';
import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import { transformerTwoslash } from 'fumadocs-twoslash';

export const api = defineDocs({
    dir: 'content/api',
});

export const docs = defineDocs({
    dir: 'content/docs',
});

export default defineConfig({
    mdxOptions: {
        rehypeCodeOptions: {
            langs: [
                // FIXME(#403): If a popup itself contains a code fence in any language other than
                // `ts`, the Shiki highlighter will throw an error that it hasn't loaded that
                // language. Until we figure this out, preemptively load the `js` language.
                'js',
            ],
            themes: {
                dark: 'github-dark',
                light: 'github-light',
            },
            transformers: [...(rehypeCodeDefaultOptions.transformers ?? []), transformerTwoslash()],
        },
        remarkPlugins: [() => remarkInstall({ persist: { id: 'package-install' } })],
    },
});
