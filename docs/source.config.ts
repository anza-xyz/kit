import { rehypeCodeDefaultOptions } from 'fumadocs-core/mdx-plugins';
import { remarkInstall } from 'fumadocs-docgen';
import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import { transformerTwoslash } from 'fumadocs-twoslash';

export const api = defineDocs({
    dir: 'content/api',
    docs: {
        postprocess: {
            includeProcessedMarkdown: true,
        },
    },
});

export const docs = defineDocs({
    dir: 'content/docs',
    docs: {
        postprocess: {
            includeProcessedMarkdown: true,
        },
    },
});

export const recipes = defineDocs({
    dir: 'content/recipes',
    docs: {
        postprocess: {
            includeProcessedMarkdown: true,
        },
    },
});

export const home = defineDocs({
    dir: 'content/home',
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
            transformers: [
                ...(rehypeCodeDefaultOptions.transformers ?? []),
                transformerTwoslash({
                    twoslashOptions: {
                        compilerOptions: {
                            // Enable JSX so the React (`.tsx`) examples in the guides type-check.
                            jsx: 4 /* react-jsx */,
                            // Resolve package `exports` subpaths (e.g. `@solana/react/swr`),
                            // matching the docs site's own tsconfig.
                            moduleResolution: 100 /* bundler */,
                        },
                        // Recognize the rich-renderer annotation tags (e.g. `// @log:` to show
                        // example output). Without this, twoslash treats them as unknown flags
                        // and throws.
                        customTags: ['annotate', 'error', 'log', 'warn'],
                    },
                }),
            ],
        },
        remarkPlugins: [() => remarkInstall({ persist: { id: 'package-install' } })],
    },
});
