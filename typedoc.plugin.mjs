// @ts-check
import prettier from '@prettier/sync';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import * as td from 'typedoc-plugin-markdown';

// Fits on a 13" MBP screen (1280px width) given the current design
const METHOD_SIGNATURE_COLUMN_WIDTH = 72;

/** @type {import("prettier").Options | null | undefined} */
let prettierConfig;
function getPrettierConfig() {
    if (prettierConfig === undefined) {
        const PATH = join(import.meta.dirname, 'docs', 'content', '.prettierrc');
        if (existsSync(PATH)) {
            prettierConfig = prettier.resolveConfig(PATH);
        } else {
            prettierConfig = null;
            console.warn(
                `No Pretter config file exists at ${PATH}; Method signatures in generated API ` +
                    'documentation may not be formatted according to the same options as the ' +
                    'rest of the docs',
            );
        }
    }
    return prettierConfig;
}

class KitDocsMarkdownTheme extends td.MarkdownTheme {
    /** @param {td.MarkdownPageEvent<import('typedoc').Reflection>} page */
    getRenderContext(page) {
        return new KitDocsThemeRenderContext(this, page, this.application.options);
    }
}

class KitDocsThemeRenderContext extends td.MarkdownThemeContext {
    /** @param {ConstructorParameters<typeof td.MarkdownThemeContext>} args */
    constructor(...args) {
        super(...args);
        const oldSignatureTitle = this.partials.signatureTitle;
        this.partials = {
            ...this.partials,
            signatureTitle(model, options) {
                const titleMarkdown = oldSignatureTitle(model, options);
                const prettierConfig = getPrettierConfig();
                const prettyTitleMarkdown = prettier.format(titleMarkdown, {
                    ...prettierConfig,
                    printWidth: Math.min(
                        prettierConfig?.printWidth ?? METHOD_SIGNATURE_COLUMN_WIDTH,
                        METHOD_SIGNATURE_COLUMN_WIDTH,
                    ),
                    parser: 'markdown',
                });
                return prettyTitleMarkdown;
            },
        };
    }
}

/** @param {td.MarkdownApplication} app */
export function load(app) {
    // Use this theme name in typedoc.json or when using the CLI
    app.renderer.defineTheme('kit-docs-theme', KitDocsMarkdownTheme);

    // Set Markdown frontmatter for each page
    app.renderer.on(td.MarkdownPageEvent.BEGIN, page => {
        page.frontmatter = {
            title: page.model.name,
        };
    });

    // Rewrite all of the internal links
    // - root relative for compatibility with Next.js
    // - strip the .mdx extension
    app.renderer.on(td.MarkdownPageEvent.END, page => {
        if (!page.contents) return;
        page.contents = page.contents.replace(/\(((?:[^\/\)]+\/)*[^\/\)]+)\.mdx\)/gm, (_, path) => {
            const rootRelativeUrl = resolve('/api', dirname(page.url), path);
            return `(${rootRelativeUrl})`;
        });
    });
}
